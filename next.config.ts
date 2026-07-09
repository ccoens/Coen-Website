import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    // Serve modern formats; explicit dimensions in the content model keep CLS < 0.1.
    formats: ["image/avif", "image/webp"],
    // Placeholder assets are local, script-free SVGs. Allow them through the
    // optimizer under a strict CSP so no embedded script could ever execute.
    // When real raster photos replace them, this stays safely locked down.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  experimental: {
    // Keep the client bundle lean — only ship what the interactive systems need.
    optimizePackageImports: ["framer-motion"],
  },
};

export default nextConfig;
