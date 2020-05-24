import { compileModule, parseDataUrl } from "./compile";
import { Deferred } from "./utils";

type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };
type XOR<T, U> = T | U extends object
  ? (Without<T, U> & U) | (Without<U, T> & T)
  : T | U;

type CbrValues =
  | 8
  | 16
  | 24
  | 32
  | 40
  | 48
  | 64
  | 80
  | 96
  | 112
  | 128
  | 160
  | 192
  | 224
  | 256
  | 320;

type IMediaRecorderPlusOptions = Omit<
  MediaRecorderOptions,
  "audioBitsPerSecond" | "mimeType"
> & {
  mimeType: "audio/mpeg";
  audioContext?: AudioContext;
  workletUrl?: string;
  wasm?: string | WebAssembly.Module;
} & XOR<{ audioBitsPerSecond?: CbrValues }, { vbrQuality?: number }>;

let defaultWasm: string | null = null;
let defaultWorkletUrl: string | null = null;
function setDefaults(
  wasm: typeof defaultWasm,
  workletUrl: typeof defaultWorkletUrl
) {
  defaultWasm = wasm;
  defaultWorkletUrl = workletUrl;
}

class MediaRecorderPlus extends EventTarget implements MediaRecorder {
  private readonly audioContext: AudioContext;
  private readonly isReady = new Deferred<void>();
  private readonly sourceNode: MediaStreamAudioSourceNode;
  private recordNode?: AudioWorkletNode;
  private readonly cbr?: CbrValues;
  private readonly vbr?: number;

  private readonly self: MediaRecorderPlus;

  public readonly stream: MediaStream;
  public readonly mimeType: string;
  public readonly videoBitsPerSecond = 0;
  public readonly audioBitsPerSecond = 0;

  public state: RecordingState = "inactive";
  public ondataavailable = null;
  public onerror = null;
  public onpause = null;
  public onresume = null;
  public onstart = null;
  public onstop = null;
  public onwarning = null;

  constructor(stream: MediaStream, options: IMediaRecorderPlusOptions) {
    super();
    this.self = this;
    const { audioContext, mimeType, ...rest } = options;
    const wasm = options.wasm ?? defaultWasm;
    const workletUrl = options.workletUrl ?? defaultWorkletUrl;

    if ("audioBitsPerSecond" in rest && rest.audioBitsPerSecond !== undefined) {
      this.cbr = rest.audioBitsPerSecond;
      switch (this.cbr) {
        case 8:
        case 16:
        case 24:
        case 32:
        case 40:
        case 48:
        case 64:
        case 80:
        case 96:
        case 112:
        case 128:
        case 160:
        case 192:
        case 224:
        case 256:
        case 320:
          break;
        default:
          throw new Error("Invalid constant bitrate!");
      }
    } else if ("vbrQuality" in rest && rest.vbrQuality !== undefined) {
      this.vbr = rest.vbrQuality;
      if (this.vbr < 0 || this.vbr > 9.999) {
        throw new Error("Invalid variable bitrate!");
      }
    }

    if (!wasm) {
      throw new Error("No WASM URL specified");
    }
    if (!workletUrl) {
      throw new Error("No worklet URL specified");
    }

    this.stream = stream;
    this.mimeType = mimeType!;
    this.audioContext = audioContext ?? new AudioContext();
    this.sourceNode = this.audioContext.createMediaStreamSource(this.stream);

    this.initialize(wasm, workletUrl);

    return new Proxy(this, {
      set(target, p, value) {
        switch (p) {
          case "ondataavailable":
          case "onerror":
          case "onpause":
          case "onresume":
          case "onstart":
          case "onstop":
          case "onwarning":
            if (target[p]) {
              target.removeEventListener(p.slice(2), target[p]);
            }
            if (value) {
              target.addEventListener(p.slice(2), value);
            }
            target[p] = value;
            return true;
        }
        return false;
      },
    });
  }

  private onMessage = (ev: MessageEvent) => {
    if (ev.data === "ready") {
      this.isReady.resolve();
    } else {
      this.dispatchEvent(
        new BlobEvent("dataavailable", { data: new Blob([ev.data]) })
      );
    }
  };

  private async initialize(
    wasm: string | WebAssembly.Module | Promise<WebAssembly.Module>,
    workletUrl: string
  ) {
    const wasmBuffer =
      wasm instanceof WebAssembly.Module
        ? wasm
        : wasm instanceof Promise
        ? await wasm
        : parseDataUrl(wasm);

    await this.audioContext!.audioWorklet.addModule(workletUrl);
    this.recordNode = new AudioWorkletNode(
      this.audioContext!,
      "mrp-processor",
      {
        numberOfOutputs: 0,
        processorOptions: { wasmBuffer },
      }
    );

    this.recordNode.port.onmessage = this.onMessage;
  }

  public async start() {
    if (this.state === "inactive") {
      await this.isReady.promise;
      this.sourceNode.connect(this.recordNode!);
      this.self.state = "recording";
      this.self.dispatchEvent(new Event("start"));
    }
  }

  public pause() {
    if (this.state === "recording") {
      this.recordNode!.port.postMessage("pause");
      this.self.state = "paused";
      this.self.dispatchEvent(new Event("pause"));
    }
  }

  public resume() {
    if (this.state === "paused") {
      this.recordNode!.port.postMessage("resume");
      this.self.state = "recording";
      this.self.dispatchEvent(new Event("resume"));
    }
  }

  public stop() {
    if (this.state === "recording" || this.state === "paused") {
      this.recordNode!.port.postMessage("stop");
      this.self.state = "inactive";
      this.self.dispatchEvent(new Event("stop"));
    }
  }

  public requestData() {
    throw new Error("Unimplemented!");
  }
}

const MRProxy = new Proxy(MediaRecorder, {
  construct(target, [stream, options]) {
    if (options.mimeType === "audio/mpeg") {
      return new MediaRecorderPlus(stream, options);
    } else {
      return new target(stream, options);
    }
  },
}) as Omit<typeof MediaRecorder, "new"> & {
  new (
    stream: MediaStream,
    options?: XOR<MediaRecorderOptions, IMediaRecorderPlusOptions>
  ): MediaRecorder;
};

export { MRProxy as MediaRecorder, setDefaults };
