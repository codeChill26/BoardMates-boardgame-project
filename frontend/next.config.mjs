/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  env: {
    LOCAL_URL: process.env.LOCAL_URL,
    DEPLOY_URL: process.env.DEPLOY_URL
  },
};

export default nextConfig;
