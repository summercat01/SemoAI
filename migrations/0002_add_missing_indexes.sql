-- Migration: Add missing indexes for query optimization
-- Created: 2026-04-21

-- conversations: user lookup (already exists but ensure)
CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id, updated_at DESC);

-- ai_services: soft delete filter (used in admin queries)
CREATE INDEX IF NOT EXISTS idx_ai_services_deleted ON ai_services(deleted_at) WHERE deleted_at IS NOT NULL;

-- ai_services: featured filter (used in featured API and search fallback)
CREATE INDEX IF NOT EXISTS idx_ai_services_featured ON ai_services(is_featured) WHERE is_featured = true AND is_active = true;

-- ai_services: slug lookup (service detail page)
CREATE INDEX IF NOT EXISTS idx_ai_services_slug ON ai_services(slug) WHERE is_active = true;

-- ai_services: composite for common search filters
CREATE INDEX IF NOT EXISTS idx_ai_services_active_category ON ai_services(is_active, category_id);

-- tags: name lookup (upsertTags uses ON CONFLICT (name))
-- Already covered by UNIQUE constraint, but slug lookup:
CREATE INDEX IF NOT EXISTS idx_tags_slug ON tags(slug);

-- rate_limits: cleanup of expired entries (future maintenance)
CREATE INDEX IF NOT EXISTS idx_rate_limits_day_reset ON rate_limits(day_reset);
