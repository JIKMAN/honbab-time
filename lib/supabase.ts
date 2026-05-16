import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const isSupabaseConfigured = !!supabaseUrl && !!supabaseAnonKey;

export type ChatMessage = {
  id: string;
  nickname: string;
  content: string;
  created_at: string;
  report_count: number;
  is_hidden: boolean;
};

export type Menu = {
  id: number;
  name: string;
  emoji: string;
  description: string;
  categories: string[];
  recommend_count: number;
};

export type Video = {
  id: number;
  youtube_id: string;
  title: string;
  channel_name: string;
  recommend_reason: string;
  categories: string[];
};
