import { compileModule } from "./compile";
import { Deferred } from "./utils";

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

type IMediaRecorderPlusOptions = MediaRecorderOptions & {
  audioContext?: AudioContext;
  workletUrl: string;
  wasmUrl: string;
} & ({ cbr: CbrValues } | { vbr: number } | {});

class MediaRecorderPlus extends EventTarget implements MediaRecorder {
  private readonly audioContext: AudioContext;
  private readonly isReady = new Deferred<void>();
  private readonly sourceNode: MediaStreamAudioSourceNode;
  private recordNode?: AudioWorkletNode;
  private readonly cbr?: CbrValues;
  private readonly vbr?: number;

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
    const { audioContext, workletUrl, wasmUrl, mimeType, ...rest } = options;

    if ("cbr" in rest) {
      this.cbr = rest.cbr;
    } else if ("vbr" in rest) {
      this.vbr = rest.vbr;
    }

    this.stream = stream;
    this.mimeType = mimeType!;
    this.audioContext = audioContext ?? new AudioContext();
    this.sourceNode = this.audioContext.createMediaStreamSource(this.stream);

    this.initialize(wasmUrl, workletUrl);

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
        Object.assign(new Event("dataavailable"), { data: ev.data })
      );
    }
  };

  private async initialize(wasmUrl: string, workletUrl: string) {
    const wasmModule = await compileModule(wasmUrl, true);
    await this.audioContext!.audioWorklet.addModule(workletUrl);
    this.recordNode = new AudioWorkletNode(
      this.audioContext!,
      "mrp-processor",
      {
        numberOfOutputs: 0,
        processorOptions: { wasmModule },
      }
    );

    this.recordNode.port.onmessage = this.onMessage;
  }

  public async start() {
    if (this.state === "inactive") {
      await this.isReady;
      this.sourceNode.connect(this.recordNode!);
      this.state = "recording";
      this.dispatchEvent(new Event("start"));
    }
  }

  public pause() {
    if (this.state === "recording") {
      this.recordNode!.port.postMessage("pause");
      this.state = "paused";
      this.dispatchEvent(new Event("pause"));
    }
  }

  public resume() {
    if (this.state === "paused") {
      this.recordNode!.port.postMessage("resume");
      this.state = "recording";
      this.dispatchEvent(new Event("resume"));
    }
  }

  public stop() {
    if (this.state === "recording" || this.state === "paused") {
      this.recordNode!.port.postMessage("stop");
      this.state = "inactive";
      this.dispatchEvent(new Event("stop"));
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
});

export { MRProxy as MediaRecorder };
