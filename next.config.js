/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "sjc.microlink.io",
      },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
}

module.exports = nextConfig
