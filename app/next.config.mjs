/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Root routing now lives in app/page.tsx: it sends authenticated visitors to
  // /home and everyone else to /login (a static config redirect can't read the
  // localStorage-backed identity).
};

export default nextConfig;
