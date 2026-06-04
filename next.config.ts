import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse und tesseract.js direkt in Node.js ausführen, nicht durch Next.js bundeln
  serverExternalPackages: ['pdf-parse', 'tesseract.js', 'pdfjs-dist', 'canvas'],
};

export default nextConfig;
