import wasm from "../encoders/dist/lame.wasm";
import workletString from "../dist/worklet.js";
import { MediaRecorder, setDefaults } from "./mediarecorder";

const workletUrl = URL.createObjectURL(
  new Blob([workletString], { type: "application/javascript" })
);

setDefaults(wasm, workletUrl);

export { MediaRecorder };
