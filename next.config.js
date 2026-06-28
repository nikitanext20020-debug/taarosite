/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'magiachisel.ru' },
    ],
  },
  env: {
    CHANNEL_USERNAME: process.env.CHANNEL_USERNAME,
  },
};

module.exports = nextConfig;
