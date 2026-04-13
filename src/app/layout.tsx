import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import Providers from "@/components/Providers";
import "./globals.css";

const BASE_URL = 'https://ai.semo3.com';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: '세모 AI — 세상의 모든 AI',
    template: '%s | 세모 AI',
  },
  description: '당신이 원하는 것에 딱 맞는 AI 서비스를 찾아드립니다. 이미지 생성, 영상, 음악, 코딩, 글쓰기 등 다양한 AI 도구를 한곳에.',
  keywords: ['AI 서비스', 'AI 추천', '인공지능', '이미지 생성 AI', '영상 AI', '코딩 AI', 'ChatGPT', 'Midjourney', 'AI 도구'],
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: BASE_URL,
    siteName: '세모 AI',
    title: '세모 AI — 세상의 모든 AI',
    description: '당신이 원하는 것에 딱 맞는 AI 서비스를 찾아드립니다.',
  },
  twitter: {
    card: 'summary_large_image',
    title: '세모 AI — 세상의 모든 AI',
    description: '당신이 원하는 것에 딱 맞는 AI 서비스를 찾아드립니다.',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
