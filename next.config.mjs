/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Allow emulator to connect to dev server
  allowedDevOrigins: ['10.0.2.2', 'localhost', '127.0.0.1'],
};

export default nextConfig;
