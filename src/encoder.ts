import Module, { IWasmEncoder } from "encoders/lame";

declare global {
  export const sampleRate: number | undefined;
}

export class Encoder {
  private readonly modulePromise: Promise<IWasmEncoder>;
  private module?: IWasmEncoder;

  private readonly sampleRate: number;
  private ref?: number;

  constructor(wasmModule: WebAssembly.Module, audioContext?: AudioContext) {
    this.modulePromise = Module({ wasm: wasmModule } as any);
    this.sampleRate = sampleRate ?? audioContext?.sampleRate ?? 48000;
  }

  public async init() {
    this.module = await this.modulePromise;
    this.ref = this.module._mrp_init(true, this.sampleRate, 128, 2, 5, 0);
    if (!this.ref) {
      throw new Error("Encoder initialization failed!");
    }
  }

  public encode(pcm: Float32Array[][]) {}
}
