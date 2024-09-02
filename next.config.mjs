import withPWA from 'next-pwa';

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverMinification: false,
  },
  reactStrictMode: true,
  swcMinify: true,
  compiler: {
    //    removeConsole: process.env.NODE_ENV !== 'development'
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        port: '',
        pathname: '/**',
      }
    ]
  }
};

 export default withPWA(
  { 
    dest: "public",
    //  disable: process.env.NODE_ENV === "development",
    register: false,
    skipWaiting: true
  }
)(nextConfig)
//export default nextConfig;
