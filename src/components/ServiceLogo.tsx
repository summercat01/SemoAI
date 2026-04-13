'use client';

import { useState } from 'react';
import { getDomain } from '@/lib/constants';

interface ServiceLogoProps {
  url: string;
  name: string;
  size?: number;
}

export default function ServiceLogo({ url, name, size = 48 }: ServiceLogoProps) {
  const domain = getDomain(url);
  const [src, setSrc] = useState(0);
  const sources = domain ? [
    `https://logo.clearbit.com/${domain}?size=512`,
    `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
  ] : [];

  if (!domain || src >= sources.length) {
    return (
      <div style={{
        width: size, height: size, borderRadius: size * 0.25,
        background: 'linear-gradient(135deg, #7c6af7, #4fc3f7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.42, fontWeight: 800, color: '#fff', flexShrink: 0,
      }}>{name[0]}</div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={sources[src]}
      alt={name}
      onError={() => setSrc(s => s + 1)}
      style={{ width: size, height: size, borderRadius: size * 0.2, objectFit: 'contain', background: '#fff', padding: size * 0.08, flexShrink: 0 }}
    />
  );
}
