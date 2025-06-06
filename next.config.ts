import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Indicate that these packages should not be bundled by webpack
  serverExternalPackages: ['sharp', 'onnxruntime-node'],

  // Override the default webpack configuration
  webpack: (config) => {
    // See https://webpack.js.org/configuration/resolve/#resolvealias
    config.resolve.alias = {
      ...config.resolve.alias,
      "sharp$": false,
      "onnxruntime-node$": false,
    }
    return config;
  },
};

export default nextConfig;
