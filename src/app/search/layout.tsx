import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI 서비스 탐색',
  description: '카테고리별로 AI 서비스를 탐색하세요. 이미지 생성, 영상, 음악, 코딩, 글쓰기 등 다양한 AI 도구를 찾아보세요.',
  openGraph: {
    title: 'AI 서비스 탐색 | 세모 AI',
    description: '카테고리별로 AI 서비스를 탐색하세요.',
  },
};

export default function BrowseLayout({ children }: { children: React.ReactNode }) {
  return children;
}
