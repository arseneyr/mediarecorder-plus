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
  wasmModule: WebAssembly.Module;
  channelCount: number;
}

export type MrpMessage = "ready";

class MrpWorkletProcessor extends AudioWorkletProcessor {
  private readonly channelCount: number;
  private readonly encoder: Encoder;

  constructor(options: IAudioWorkletProcessorOptions<IProcessorOptions>) {
    super();
    this.channelCount = options.processorOptions.channelCount;
    this.encoder = new Encoder(options.processorOptions.wasmModule);
    this.encoder.init().then(() => this.port.postMessage("ready"));
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][]) {
    return true;
  }
}

registerProcessor("mrp-processor", MrpWorkletProcessor);
