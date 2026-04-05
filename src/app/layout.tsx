import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import BottomBar from "./components/BottomBar";
import Footer from "./components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Teamder",
  description: "Teamder - แพลตฟอร์มค้นหาเพื่อนร่วมทีมและจับคู่คนทำงานด้วยระบบ AI อัจฉริยะ ช่วยให้คุณสร้างทีม จัดการโปรเจกต์ และประเมินผลการทำงานได้อย่างมีประสิทธิภาพ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[var(--background)]  min-h-screen  flex flex-col relative suppressHydrationWarning`}
      >
        <BottomBar/>
        <div className="w-full h-full relative pb-38 pt-12">
          {children}
        </div>
        <Footer/>
      </body>
    </html>
  );
}
