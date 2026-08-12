import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname: "*.blob.vercel-storage.com",
      },
    ],
  },
  // Next serves everything under public/ with `Cache-Control: max-age=0`
  // because it cannot know when a file changed. That is the right default and
  // the wrong one for the background video, which is the single largest asset
  // on the site and only ever changes when scripts/fetch-assets.mjs re-encodes
  // it. Without this every visit re-downloads it.
  async headers() {
    return [
      {
        source: "/:dir(video)/:file*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
