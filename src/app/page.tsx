'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Send } from 'lucide-react';

interface AiService {
  id: number;
  name: string;
  tagline: string;
  pricing_type: string;
  category_name: string;
}

const PRICING_COLOR: Record<string, string> = {
  free: 'bg-green-500/20 text-green-600 border-green-500/30',
  freemium: 'bg-blue-500/20 text-blue-600 border-blue-500/30',
  paid: 'bg-orange-500/20 text-orange-600 border-orange-500/30',
  'open-source': 'bg-purple-500/20 text-purple-600 border-purple-500/30',
};

const PRICING_LABEL: Record<string, string> = {
  free: '무료',
  freemium: '무료+',
  paid: '유료',
  'open-source': '오픈소스',
};

export default function Home() {
  const [services, setServices] = useState<AiService[]>([]);
  const [input, setInput] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/services/featured')
      .then(r => r.json())
      .then(data => setServices(data.services || []));
  }, []);

  useEffect(() => {
    if (services.length === 0) return;
    const timer = setInterval(() => {
      setCurrentIndex(i => (i + 1) % services.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [services.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    window.location.href = `/search?q=${encodeURIComponent(input.trim())}`;
  };

  const visibleCount = 4;
  const visibleServices = services.length > 0
    ? Array.from({ length: visibleCount }, (_, i) => services[(currentIndex + i) % services.length])
    : [];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b px-6 py-4 flex items-center justify-between shrink-0">
        <span className="text-xl font-bold tracking-tight">세모 AI</span>
        <nav className="flex items-center gap-6 text-sm text-muted-foreground">
          <a href="#" className="hover:text-foreground transition-colors">탐색</a>
          <a href="#" className="hover:text-foreground transition-colors">카테고리</a>
          <a href="#" className="hover:text-foreground transition-colors">마이페이지</a>
        </nav>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-between py-16 px-4">
        {/* Hero */}
        <div className="text-center space-y-3 mb-12">
          <h1 className="text-3xl font-semibold tracking-tight">
            당신이 원하는 AI는 무엇인가요?
          </h1>
          <p className="text-muted-foreground text-lg">
            원하는 작업을 말해주세요. 딱 맞는 AI를 찾아드릴게요.
          </p>
        </div>

        {/* Carousel */}
        <div className="w-full max-w-5xl mb-12" ref={carouselRef}>
          <div className="flex gap-4">
            {visibleServices.length > 0 ? visibleServices.map((service, i) => (
              <div
                key={`${service.id}-${i}`}
                className="flex-1 min-w-0 rounded-xl border bg-card p-5 flex flex-col gap-2 hover:border-primary/50 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-base leading-tight">{service.name}</h3>
                  <Badge variant="outline" className={`text-xs shrink-0 ${PRICING_COLOR[service.pricing_type] || ''}`}>
                    {PRICING_LABEL[service.pricing_type] || service.pricing_type}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed flex-1">
                  {service.tagline}
                </p>
                <span className="text-xs text-muted-foreground/60">
                  {service.category_name}
                </span>
              </div>
            )) : (
              Array.from({ length: visibleCount }).map((_, i) => (
                <div key={i} className="flex-1 h-36 rounded-xl border bg-muted animate-pulse" />
              ))
            )}
          </div>

          {/* Dots */}
          {services.length > 0 && (
            <div className="flex justify-center gap-1.5 mt-4">
              {services.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === currentIndex ? 'bg-primary w-4' : 'bg-muted-foreground/30 w-1.5'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="w-full max-w-2xl">
          <div className="relative">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="예: 코딩 없이 게임을 만들고 싶어요"
              className="h-14 pr-12 text-base rounded-xl"
              autoFocus
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-muted transition-colors disabled:opacity-40"
              disabled={!input.trim()}
            >
              <Send className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
          <p className="text-xs text-center text-muted-foreground mt-3">
            예시: &quot;웹툰을 만들고 싶어요&quot; · &quot;내 목소리를 AI로 만들고 싶어요&quot; · &quot;사진 배경을 지우고 싶어요&quot;
          </p>
        </form>
      </main>
    </div>
  );
}
