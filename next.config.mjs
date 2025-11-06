/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'teiunfcrodktaevlilhm.supabase.co',
        pathname: '/storage/**'
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
        pathname: '/**'
      }
    ]
  }
};

export default nextConfig;
