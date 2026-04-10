/** @type {import("jest").Config} **/
process.env.NODE_ENV = "test";

module.exports = {
  testEnvironment: "node",
  extensionsToTreatAsEsm: [".ts", ".tsx", ".mts"],
  transform: {
    "^.+\\.m?tsx?$": [
      "ts-jest",
      {
        useESM: true,
      },
    ],
  },
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  modulePathIgnorePatterns: ["<rootDir>/dist/"],
};
