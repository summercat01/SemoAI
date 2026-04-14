export interface RecommendationResult {
  id: number;
  name: string;
  slug: string;
  tagline: string;
  pricing_type: string;
  website_url: string;
  skill_level: string;
  target_user: string;
  key_features: string;
  category_name: string;
  category_slug: string;
  is_featured: boolean;
  reason: string;
}

export interface ConvTurn {
  role: 'user' | 'ai';
  content: string;
}

export interface UserMsg       { type: 'user';         content: string; }
export interface AiQuestionMsg { type: 'ai_question';  content: string; }
export type ChatMsg = UserMsg | AiQuestionMsg;

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
}

export interface ConvData {
  chatMessages: ChatMsg[];
  recommendations: RecommendationResult[];
  total: number;
  summary: string;
  categories: string[];
}
