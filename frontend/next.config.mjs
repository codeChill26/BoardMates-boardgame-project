/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  env: {
    BACKEND_URL: process.env.BACKEND_URL,
  },
};

export default nextConfig;
