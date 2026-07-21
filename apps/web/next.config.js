const path = require("path")

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@life-id/ui", "@life-id/types"],
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname, "../../")
}

module.exports = nextConfig
