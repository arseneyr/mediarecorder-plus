import { Encoder } from "./encoder";

declare global {
  export class AudioWorkletProcessor {
    constructor();
    port: MessagePort;
    process(inputs: Float32Array[][], outputs: Float32Array[][]): boolean;
  }

  // export const AudioWorkletProcessor: IAudioWorkletProcessorConstructor<undefined>;
  export const registerProcessor: (...args: any) => void;
}

interface IAudioWorkletProcessorOptions<T> {
  numberOfInputs: number;
  numberOfOutputs: number;
  outputChannelCount?: number;
  processorOptions: T;
}

export interface IProcessorOptions {
  wasmBuffer: ArrayBuffer;
  channelCount: number;
}

export type MrpMessage = "ready";

class MrpWorkletProcessor extends AudioWorkletProcessor {
  private readonly channelCount: number;
  private readonly encoder: Encoder;
  private done = false;

  constructor(options: IAudioWorkletProcessorOptions<IProcessorOptions>) {
    super();
    this.port.onmessage = this.onMessage;
    this.channelCount = options.processorOptions.channelCount;
    this.encoder = new Encoder(options.processorOptions.wasmBuffer);
    this.encoder.init().then(() => this.port.postMessage("ready"));
  }

  private onMessage = (ev: MessageEvent) => {
    if (this.done) {
      return;
    }
    if (ev.data === "stop") {
      this.done = true;
      const out = this.encoder.flush();
      this.port.postMessage(out.buffer, [out.buffer]);
    }
  };

  process(inputs: Float32Array[][], outputs: Float32Array[][]) {
    if (this.done) {
      return false;
    }
    this.encoder.encode(inputs[0]);
    return true;
  }
}

registerProcessor("mrp-processor", MrpWorkletProcessor);
