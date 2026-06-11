import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  // D:\package-lock.json tufayli Turbopack noto'g'ri root tanlamasligi uchun
  turbopack: {
    root: __dirname
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb'
    }
  }
};

export default withNextIntl(nextConfig);
