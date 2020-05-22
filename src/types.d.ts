/// <reference types="emscripten" />

declare module "encoders/*" {
  export interface IWasmEncoder extends EmscriptenModule {
    _mrp_init(
      streaming: boolean,
      sample_rate: number,
      sample_count: number,
      channel_count: number,
      vbr_quality: number,
      cbr_rate: number
    ): number;
  }
  const factory: EmscriptenModuleFactory<IWasmEncoder>;
  export default factory;
}

declare module "*.wasm" {
  const dataUrl: string;
  export default dataUrl;
}
