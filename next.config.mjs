/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Prevent bundling issues with pdf-parse and optional dependencies
      config.resolve.alias.canvas = false;
    }
    return config;
  },
};

export default nextConfig;
