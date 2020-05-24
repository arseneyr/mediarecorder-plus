import typescript from "@rollup/plugin-typescript";
import url from "@rollup/plugin-url";
import { string } from "rollup-plugin-string";

const workletConfig = {
  input: "src/worklet.ts",
  output: {
    dir: "dist",
    format: "es",
  },

  plugins: [typescript({ declaration: true, declarationDir: "dist" })],
};

const mainConfig = {
  input: "src/index.ts",
  output: {
    dir: "dist",
    format: "es",
  },

  plugins: [
    typescript(),
    url({ limit: 204800, include: "**/*.wasm" }),
    string({ include: "**/worklet.js" }),
  ],
};

export default [workletConfig, mainConfig];
