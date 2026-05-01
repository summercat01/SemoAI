/**
 * 서버사이드 에러 로거
 * - 항상 console.error (PM2 로그)
 * - DISCORD_ERROR_WEBHOOK_URL 설정 시 Discord 채널로 실시간 알림
 */

const WEBHOOK_URL = process.env.DISCORD_ERROR_WEBHOOK_URL;
const APP_ENV = process.env.NODE_ENV ?? 'development';
const APP_URL = process.env.NEXTAUTH_URL ?? 'https://ai.semo3.com';

function truncate(s: string, max = 1000) {
  return s.length > max ? s.slice(0, max) + '…' : s;
}

export async function reportError(
  error: unknown,
  context?: string,
  extra?: Record<string, unknown>,
) {
  const err = error instanceof Error ? error : new Error(String(error));
  const timestamp = new Date().toISOString();
  const label = context ? `[${context}]` : '';

  // 1. Always log to stdout (PM2 captures this)
  console.error(`${timestamp} ${label}`, err.message, extra ?? '');
  if (err.stack) console.error(err.stack);

  // 2. Discord webhook (optional)
  if (!WEBHOOK_URL) return;

  try {
    const fields: { name: string; value: string; inline?: boolean }[] = [
      { name: '메시지', value: truncate(err.message) },
    ];
    if (context) fields.push({ name: '컨텍스트', value: context, inline: true });
    if (APP_ENV) fields.push({ name: '환경', value: APP_ENV, inline: true });
    if (extra) {
      fields.push({ name: '추가 정보', value: truncate(JSON.stringify(extra, null, 2)) });
    }
    if (err.stack) {
      fields.push({ name: '스택 트레이스', value: `\`\`\`\n${truncate(err.stack, 800)}\n\`\`\`` });
    }

    await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'SemoAI 에러 봇',
        avatar_url: `${APP_URL}/favicon.ico`,
        embeds: [{
          title: '🚨 서버 에러 발생',
          color: 0xe74c3c,
          fields,
          footer: { text: `${APP_URL} · ${timestamp}` },
        }],
      }),
    });
  } catch (webhookErr) {
    console.error('[errorLogger] Discord 웹훅 전송 실패:', webhookErr);
  }
}
