import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['pdfjs-dist', '@napi-rs/canvas', 'heic-convert', 'bmp-js'],
  // PDF.js loads its worker and native polyfills dynamically. Deployment tracing
  // cannot discover them from the main module's imports alone.
  outputFileTracingIncludes: {
    '/api/admin/fixtures/import': [
      './node_modules/pdfjs-dist/package.json',
      './node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs',
      './node_modules/@napi-rs/canvas*/**/*',
    ],
  },
};

export default nextConfig;
