import typescript from "@rollup/plugin-typescript";

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

  plugins: [typescript({ declaration: true, declarationDir: "dist" })],
};

export default [workletConfig, mainConfig];
