/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'teiunfcrodktaevlilhm.supabase.co',
        pathname: '/storage/**'
      }
    ]
  }
};

export default nextConfig;
