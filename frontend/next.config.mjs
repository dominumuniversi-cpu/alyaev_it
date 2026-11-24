/** @type {import('next').NextConfig} */
const BACKEND = process.env.BACKEND_URL || 'http://backend:8000';

// На стенде сайт живёт по префиксу /alyaev/ за общим nginx (путь, а не порт — правило DIMAS).
// На домене alyaev.it — задать BASE_PATH='' (корень).
const BASE_PATH = process.env.BASE_PATH ?? '/alyaev';

const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  poweredByHeader: false,
  images: { unoptimized: true },
  basePath: BASE_PATH || undefined,
  assetPrefix: BASE_PATH || undefined,
  trailingSlash: false,
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${BACKEND}/api/:path*` }];
  },
};

export default nextConfig;
