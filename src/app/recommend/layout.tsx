import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI 추천받기',
  description: '원하는 것을 말하면 딱 맞는 AI 서비스를 추천해드립니다. 대화형 AI 검색으로 최적의 AI 도구를 찾아보세요.',
  openGraph: {
    title: 'AI 추천받기 | 세모 AI',
    description: '원하는 것을 말하면 딱 맞는 AI 서비스를 추천해드립니다.',
  },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
