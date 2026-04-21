const REQUIRED_ENV = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'KAKAO_CLIENT_ID',
  'KAKAO_CLIENT_SECRET',
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY',
] as const;

export function validateEnv() {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.warn(
      `⚠️ Missing environment variables:\n  ${missing.join('\n  ')}`
    );
  }
}
