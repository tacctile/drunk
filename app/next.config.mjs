/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The Cities tab is the first screen; / never renders anything itself.
  // app/page.tsx carries the same redirect as a fallback for hosts that
  // ignore config redirects.
  async redirects() {
    return [{ source: "/", destination: "/cities", permanent: false }];
  },
};

export default nextConfig;
