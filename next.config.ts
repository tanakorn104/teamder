import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // ชื่อ host ที่ขึ้นใน Error ของคุณ
        port: '',
        pathname: '/**', // อนุญาตทุก path ภายใต้ hostname นี้
      },
      // ถ้ามีรูปจากแหล่งอื่นอีก เช่น api ของคุณเอง ก็เพิ่ม object ต่อท้ายได้เลย
    ],
  },
};

export default nextConfig;
