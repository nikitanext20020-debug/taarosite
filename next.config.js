/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'magiachisel.ru' },
    ],
  },
};

module.exports = nextConfig;
