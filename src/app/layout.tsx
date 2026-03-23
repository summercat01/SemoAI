import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "세모 AI — 세상의 모든 AI",
  description: "당신이 원하는 것에 딱 맞는 AI를 찾아드립니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
