-- Enable pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Services table
CREATE TABLE IF NOT EXISTS ai_services (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) NOT NULL UNIQUE,
  tagline VARCHAR(500),
  description TEXT,
  category_id INTEGER REFERENCES categories(id),
  website_url VARCHAR(500),
  logo_url VARCHAR(500),
  pricing_type VARCHAR(50) CHECK (pricing_type IN ('free', 'freemium', 'paid', 'open-source')),
  pricing_detail VARCHAR(200),
  skill_level VARCHAR(50) CHECK (skill_level IN ('beginner', 'intermediate', 'advanced', 'any')),
  platforms TEXT[], -- ['web', 'desktop', 'mobile', 'api']
  -- AI-generated descriptions
  target_user TEXT,
  key_features TEXT,
  limitations TEXT,
  -- Vector embedding for semantic search
  embedding vector(1536),
  -- Metadata
  is_active BOOLEAN DEFAULT TRUE,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tags table
CREATE TABLE IF NOT EXISTS tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  category VARCHAR(50) -- 'use-case', 'platform', 'skill', 'output-type' etc.
);

-- AI Service Tags (many-to-many)
CREATE TABLE IF NOT EXISTS ai_service_tags (
  ai_service_id INTEGER REFERENCES ai_services(id) ON DELETE CASCADE,
  tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (ai_service_id, tag_id)
);

-- Indexes for fast filtering
CREATE INDEX IF NOT EXISTS idx_ai_services_category ON ai_services(category_id);
CREATE INDEX IF NOT EXISTS idx_ai_services_pricing ON ai_services(pricing_type);
CREATE INDEX IF NOT EXISTS idx_ai_services_skill ON ai_services(skill_level);
CREATE INDEX IF NOT EXISTS idx_ai_services_active ON ai_services(is_active);
CREATE INDEX IF NOT EXISTS idx_ai_service_tags_service ON ai_service_tags(ai_service_id);
CREATE INDEX IF NOT EXISTS idx_ai_service_tags_tag ON ai_service_tags(tag_id);

-- Seed categories
INSERT INTO categories (name, slug, description, icon) VALUES
  ('이미지 생성', 'image-generation', '텍스트나 이미지로 새로운 이미지를 생성', '🎨'),
  ('코딩/개발', 'coding', '코드 작성, 디버깅, 앱 개발 보조', '💻'),
  ('영상 제작', 'video', '영상 생성, 편집, 자막 등', '🎬'),
  ('글쓰기', 'writing', '블로그, 카피라이팅, 번역 등', '✍️'),
  ('음악/오디오', 'music', '음악 생성, 음성 합성, 팟캐스트', '🎵'),
  ('게임 개발', 'game-dev', '게임 기획, 개발, 아트 생성', '🎮'),
  ('비즈니스', 'business', '마케팅, 분석, 자동화', '📊'),
  ('교육', 'education', '학습, 튜터링, 요약', '📚'),
  ('챗봇/대화', 'chatbot', '대화형 AI, 고객 지원', '💬'),
  ('디자인', 'design', 'UI/UX, 그래픽 디자인', '🖌️')
ON CONFLICT (slug) DO NOTHING;

-- Seed tags
INSERT INTO tags (name, slug, category) VALUES
  ('노코드', 'no-code', 'skill'),
  ('초보자', 'beginner', 'skill'),
  ('개발자', 'developer', 'skill'),
  ('웹', 'web', 'platform'),
  ('모바일', 'mobile', 'platform'),
  ('API', 'api', 'platform'),
  ('무료', 'free', 'pricing'),
  ('한국어지원', 'korean', 'language'),
  ('실시간', 'realtime', 'feature'),
  ('오픈소스', 'open-source', 'license'),
  ('로컬실행', 'local', 'platform'),
  ('사진편집', 'photo-editing', 'use-case'),
  ('캐릭터생성', 'character', 'use-case'),
  ('배경생성', 'background', 'use-case'),
  ('2D게임', '2d-game', 'use-case'),
  ('3D게임', '3d-game', 'use-case'),
  ('RPG', 'rpg', 'use-case'),
  ('로그라이크', 'roguelike', 'use-case'),
  ('웹툰', 'webtoon', 'use-case'),
  ('만화', 'comic', 'use-case'),
  ('스토리생성', 'story', 'use-case'),
  ('번역', 'translation', 'use-case'),
  ('요약', 'summarization', 'use-case'),
  ('코드생성', 'code-generation', 'use-case'),
  ('음성합성', 'tts', 'use-case')
ON CONFLICT (slug) DO NOTHING;
