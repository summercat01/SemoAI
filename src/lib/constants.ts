export const BASE_URL = 'https://ai.semo3.com';

// Rate limiting
export const RATE_LIMIT_PER_MINUTE = 10;
export const RATE_LIMIT_PER_DAY = 100;
export const RATE_LIMIT_DAY_RETRY_SECONDS = 3600;

// Search / Recommendation
export const SEARCH_PAGE_SIZE = 12;
export const SEARCH_TOPK_STEP1 = 30;
export const SEARCH_TOPK_STEP2 = 50;
export const SEARCH_FINAL_PICKS = 9;
export const CLAUDE_MAX_TOKENS = 1500;

// Admin
export const ADMIN_PAGE_SIZE = 50;

// Conversations
export const CONV_LIST_LIMIT = 50;
export const CONV_TITLE_MAX_LENGTH = 200;

export const PRICING_BADGE: Record<string, { label: string; color: string }> = {
  free:          { label: '무료',     color: '#22c55e' },
  freemium:      { label: '무료+',    color: '#60a5fa' },
  paid:          { label: '유료',     color: '#f97316' },
  'open-source': { label: '오픈소스', color: '#a78bfa' },
};

export function getDomain(url: string): string {
  try { return new URL(url).hostname.replace('www.', ''); } catch { return ''; }
}
