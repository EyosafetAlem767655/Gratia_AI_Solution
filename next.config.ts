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
  // Force sharp's Linux binaries into the traced function bundle.
  //
  // sharp ships its native code as per-platform optional packages. This project
  // is developed on Windows, so `@img/sharp-linux-x64` and its companion
  // `@img/sharp-libvips-linux-x64` are never present locally for @vercel/nft to
  // discover. On Vercel npm installs them, but the tracer had already decided
  // they were not needed: the function shipped with the linux-x64 stub and
  // without libvips, and every Telegram update died with
  //
  //   ERR_DLOPEN_FAILED: libvips-cpp.so.8.18.3: cannot open shared object file
  //
  // Globbing them in explicitly is the documented escape hatch for exactly this
  // ("cases in which Next.js might fail to include required files"). The
  // patterns simply match nothing on a Windows machine, so local builds are
  // unaffected.
  outputFileTracingIncludes: {
    "/api/telegram/webhook": [
      "./node_modules/@img/sharp-linux-x64/**/*",
      "./node_modules/@img/sharp-libvips-linux-x64/**/*",
    ],
    "/api/ai/process-project": [
      "./node_modules/@img/sharp-linux-x64/**/*",
      "./node_modules/@img/sharp-libvips-linux-x64/**/*",
    ],
  },

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
