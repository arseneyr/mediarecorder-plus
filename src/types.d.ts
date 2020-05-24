/// <reference types="emscripten" />

declare module "encoders/*" {
  export interface IWasmEncoder
    extends EmscriptenModule,
      EmscriptenModuleFactory<IWasmEncoder> {
    _mrp_init(
      streaming: boolean,
      sample_rate: number,
      sample_count: number,
      channel_count: number,
      vbr_quality: number,
      cbr_rate: number
    ): number;
    _mrp_encode(cfg: number, num_samples: number): number;
    _mrp_flush(cfg: number): number;
    _mrp_free(cfg: number): void;
    wasm: ArrayBuffer;
    onReady: (module: IWasmEncoder) => void;
  }
  const factory: IWasmEncoder;
  export default factory;
}

declare module "*.wasm" {
  const module: string;
  export default module;
}

declare module "*/dist/worklet.js" {
  const dataUrl: string;
  export default dataUrl;
}
