import Module, { IWasmEncoder } from "encoders/lame";
import { Deferred } from "./utils";

declare global {
  export const sampleRate: number | undefined;
}

export class Encoder {
  private readonly isReady = new Deferred<void>();
  private module!: IWasmEncoder;

  private readonly sampleRate: number;
  private ref!: number;

  constructor(wasm: ArrayBuffer, audioContext?: AudioContext) {
    debugger;
    Module({
      wasm,
      onReady: this.onReady,
    });
    this.sampleRate = sampleRate ?? audioContext?.sampleRate ?? 48000;
  }

  private onReady = (module: IWasmEncoder) => {
    this.module = module;
    this.isReady.resolve();
  };

  private get pcm_l() {
    const ptr = this.module.HEAP32[this.ref >> 2];
    return this.module.HEAPF32.subarray(ptr >> 2, (ptr >> 2) + 128);
  }
  private get pcm_r() {
    const ptr = this.module.HEAP32[(this.ref + 4) >> 2];
    return this.module.HEAPF32.subarray(ptr >> 2, (ptr >> 2) + 128);
  }
  private get_out_buf(size: number) {
    const ptr = this.module.HEAP32[(this.ref + 8) >> 2];
    return this.module.HEAPU8.subarray(ptr, ptr + size);
  }

  public async init() {
    await this.isReady.promise;
    this.ref = this.module._mrp_init(true, this.sampleRate, 128, 2, 5, 0);
    if (!this.ref) {
      throw new Error("Encoder initialization failed!");
    }
  }

  public encode(pcm: Float32Array[]) {
    this.pcm_l.set(pcm[0]);
    this.pcm_r.set(pcm[1]);
    const bytes_written = this.module._mrp_encode(this.ref, 128);
    if (bytes_written < 0) {
      throw new Error(`Error while encoding ${bytes_written}`);
    }
  }

  public flush() {
    const mp3_buf_size = this.module._mrp_flush(this.ref);
    if (mp3_buf_size < 0) {
      throw new Error(`Error while encoding ${mp3_buf_size}`);
    }

    const ret = new Uint8Array(mp3_buf_size);
    ret.set(this.get_out_buf(mp3_buf_size));

    return ret;
  }
}
