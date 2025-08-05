/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // experimental: {
  //   appDir: true,
  // },
  images: {
    domains: ['res.cloudinary.com'],
  },
  // env: {
  //   CUSTOM_KEY: 'my-value',
  // },
};

export default nextConfig;
  