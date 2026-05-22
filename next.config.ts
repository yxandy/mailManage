import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel CLI 注入的 Next 16 adapter 当前会在 modifyConfig 阶段报错，先在 Vercel 构建中显式关闭。
  adapterPath: process.env.VERCEL ? "" : undefined,
};

export default nextConfig;
