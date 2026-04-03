import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Permite thumbnail-uri din orice domeniu HTTPS (feed-urile RSS vin de la surse variate).
    // Înlocuiește cu o listă explicită de hostname-uri în producție pentru securitate sporită.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
