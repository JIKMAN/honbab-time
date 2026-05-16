-- ==========================================
-- 혼밥타임 Supabase Schema
-- ==========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- MENUS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS menus (
  id           SERIAL PRIMARY KEY,
  name         TEXT NOT NULL,
  emoji        TEXT NOT NULL,
  description  TEXT NOT NULL,
  categories   TEXT[] NOT NULL DEFAULT '{}',
  recommend_count INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_menus_categories ON menus USING GIN (categories);

-- ==========================================
-- VIDEOS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS videos (
  id               SERIAL PRIMARY KEY,
  youtube_id       TEXT NOT NULL UNIQUE,
  title            TEXT NOT NULL,
  channel_name     TEXT NOT NULL,
  recommend_reason TEXT NOT NULL,
  categories       TEXT[] NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_videos_categories ON videos USING GIN (categories);

-- ==========================================
-- CHAT MESSAGES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nickname     TEXT NOT NULL,
  content      TEXT NOT NULL CHECK (char_length(content) <= 200),
  report_count INTEGER NOT NULL DEFAULT 0,
  is_hidden    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages (created_at DESC);

-- Auto-delete messages older than 30 days (run via pg_cron or supabase edge function)
-- DELETE FROM chat_messages WHERE created_at < NOW() - INTERVAL '30 days';

-- ==========================================
-- MENU RECOMMENDATIONS TABLE
-- (tracks per-session recommendations to prevent double-clicking)
-- ==========================================
CREATE TABLE IF NOT EXISTS menu_recommendations (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  menu_id    INTEGER NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(menu_id, session_id)
);

-- ==========================================
-- PRESENCE (online user count simulation)
-- ==========================================
CREATE TABLE IF NOT EXISTS presence (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT NOT NULL UNIQUE,
  last_seen  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_presence_last_seen ON presence (last_seen);

-- ==========================================
-- ROW LEVEL SECURITY
-- ==========================================
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE presence ENABLE ROW LEVEL SECURITY;

-- Chat: anyone can read non-hidden messages
DROP POLICY IF EXISTS "Read visible messages" ON chat_messages;
CREATE POLICY "Read visible messages" ON chat_messages
  FOR SELECT USING (is_hidden = FALSE);

-- Chat: anyone can insert (anon users)
DROP POLICY IF EXISTS "Insert messages" ON chat_messages;
CREATE POLICY "Insert messages" ON chat_messages
  FOR INSERT WITH CHECK (char_length(content) > 0 AND char_length(content) <= 200);

-- Chat: update only report_count and is_hidden
DROP POLICY IF EXISTS "Report messages" ON chat_messages;
CREATE POLICY "Report messages" ON chat_messages
  FOR UPDATE USING (TRUE)
  WITH CHECK (TRUE);

-- Menus: public read
DROP POLICY IF EXISTS "Read menus" ON menus;
CREATE POLICY "Read menus" ON menus FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Read videos" ON videos;
CREATE POLICY "Read videos" ON videos FOR SELECT USING (TRUE);

ALTER TABLE menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- Menu recommendations: insert/read own session
DROP POLICY IF EXISTS "Insert recommendation" ON menu_recommendations;
CREATE POLICY "Insert recommendation" ON menu_recommendations
  FOR INSERT WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Read recommendation" ON menu_recommendations;
CREATE POLICY "Read recommendation" ON menu_recommendations
  FOR SELECT USING (TRUE);

-- Presence: full access
DROP POLICY IF EXISTS "Presence access" ON presence;
CREATE POLICY "Presence access" ON presence
  FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- ==========================================
-- REALTIME
-- ==========================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'chat_messages'
  ) THEN ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages; END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'presence'
  ) THEN ALTER PUBLICATION supabase_realtime ADD TABLE presence; END IF;
END $$;

-- ==========================================
-- SEED DATA — MENUS
-- ==========================================
INSERT INTO menus (name, emoji, description, categories, recommend_count) VALUES
  ('김치찌개', '🍲', '혼자도 부담없는 한식', ARRAY['home_cook','office'], 142),
  ('짜장면', '🍜', '중국집 1인분 OK', ARRAY['office','delivery'], 98),
  ('삼각김밥', '🍙', '편의점의 정석', ARRAY['convenience'], 211),
  ('라면', '🍜', '자취생의 영원한 친구', ARRAY['home_cook','convenience'], 334),
  ('비빔밥', '🥗', '건강하게 한 끼', ARRAY['home_cook','office'], 87),
  ('치킨', '🍗', '혼치킨도 행복', ARRAY['delivery'], 276),
  ('편의점 도시락', '🍱', '가성비 최강', ARRAY['convenience'], 189),
  ('카레라이스', '🍛', '만들어두면 며칠은 OK', ARRAY['home_cook'], 73),
  ('볶음밥', '🍳', '냉장고 파먹기', ARRAY['home_cook'], 156),
  ('돈부리', '🥩', '일식 1인분 전문점', ARRAY['office'], 64),
  ('순대국밥', '🍜', '든든한 국밥 한 그릇', ARRAY['office','delivery'], 112),
  ('샌드위치', '🥪', '간편하고 든든하게', ARRAY['convenience','office'], 95),
  ('피자', '🍕', '혼피자 2~3조각 딱', ARRAY['delivery'], 134),
  ('떡볶이', '🌶️', '분식의 왕', ARRAY['office','delivery','convenience'], 203),
  ('계란후라이 덮밥', '🍳', '5분 완성 최강 레시피', ARRAY['home_cook'], 178),
  ('짬뽕', '🦐', '칼칼하게 속 풀기', ARRAY['office','delivery'], 89),
  ('냉동만두', '🥟', '에어프라이어로 간편하게', ARRAY['home_cook','convenience'], 145),
  ('참치캔 비빔밥', '🐟', '자취방 최고의 조합', ARRAY['home_cook'], 122),
  ('김밥', '🍣', '한 줄만 사도 든든', ARRAY['office','convenience'], 167),
  ('우동', '🍜', '따뜻한 국물 한 사발', ARRAY['office','convenience'], 78),
  ('햄버거', '🍔', '혼밥하기 좋은 패스트푸드', ARRAY['office','delivery'], 143),
  ('스팸계란밥', '🥚', '냉장고 필수 재료로', ARRAY['home_cook'], 198),
  ('샐러드', '🥗', '건강하게 가볍게', ARRAY['convenience','office'], 56),
  ('국수', '🍝', '여름엔 냉국수 겨울엔 온국수', ARRAY['home_cook'], 91),
  ('초밥', '🍱', '편의점 초밥도 충분해', ARRAY['convenience','office'], 109),
  ('수제버거', '🍔', '혼자 여유롭게', ARRAY['office','delivery'], 72),
  ('컵라면', '🍜', '언제나 믿음직한', ARRAY['convenience'], 247),
  ('오므라이스', '🍳', '집에서 카페 느낌', ARRAY['home_cook'], 83),
  ('부대찌개', '🌭', '배달 반솥', ARRAY['delivery'], 67),
  ('제육볶음', '🥩', '밥 두 공기 각오', ARRAY['home_cook','office','delivery'], 175)
ON CONFLICT DO NOTHING;

-- ==========================================
-- SEED DATA — VIDEOS
-- ==========================================
INSERT INTO videos (youtube_id, title, channel_name, recommend_reason, categories) VALUES
  ('jfKfPfyJRdk', 'lofi hip hop radio - beats to relax/study to', 'Lofi Girl', '잡생각 없애주는 배경음악의 정석', ARRAY['quiet_vlog']),
  ('5qap5aO4i9A', 'lofi hip hop radio - beats to sleep/chill to', 'Lofi Girl', '밥 먹으며 멍 때리기 최적', ARRAY['quiet_vlog']),
  ('DWcJFNfaw9c', 'Planet Earth II - Official Trailer', 'BBC Earth', '자연다큐 보며 먹으면 힐링 그 자체', ARRAY['documentary']),
  ('hHW1oY26kxQ', 'ASMR Cooking Korean Food', 'Tasty', '요리 소리 들으며 밥 먹으면 두 배 맛있음', ARRAY['quiet_vlog']),
  ('tgbNymZ7vqY', 'Peaceful Piano & Soft Rain', 'Yellow Brick Cinema', '비 오는 날 따뜻한 국물과 함께', ARRAY['quiet_vlog']),
  ('ktvTqknDobU', 'The Biggest Misconceptions About Nutrition', 'Kurzgesagt', '밥 먹으며 지식 충전', ARRAY['documentary']),
  ('RgKAFK5djSk', 'See You Again', 'Wiz Khalifa', '감성 충전 필요할 때', ARRAY['quiet_vlog']),
  ('09R8_2nJtjg', 'Maroon 5 - Sugar', 'Maroon 5', '밥 먹으며 기분 업 시키기', ARRAY['talk']),
  ('60ItHLz5WEA', 'Alan Walker - Faded', 'Alan Walker', '기분 전환이 필요할 때', ARRAY['talk']),
  ('2Vv-BfVoq4g', 'Ed Sheeran - Perfect', 'Ed Sheeran', '혼밥도 낭만 있게', ARRAY['quiet_vlog']),
  ('YQHsXMglC9A', 'Adele - Hello', 'Adele', '감성 폭발 식사 타임', ARRAY['quiet_vlog']),
  ('lp-EO5I60KA', 'The Ocean Secret | BBC Documentary', 'BBC Earth', '깊은 바다 보며 밥 먹으면 스케일 업', ARRAY['documentary']),
  ('bM7SZ5SBzyY', '한국사 팟캐스트 - 조선시대 밥상 이야기', '역사채널e', '밥 먹으며 옛날 밥상 이야기 듣기', ARRAY['podcast','documentary']),
  ('3At-bKq7I9s', '나 혼자 산다 명장면 모음', 'MBC', '혼자 사는 거 나만 아니잖아', ARRAY['talk']),
  ('Pbug3PgchsI', '커피 한 잔과 함께하는 재즈 | Jazz Cafe Ambience', 'Cafe Music BGM', '카페 분위기 내며 혼밥하기', ARRAY['quiet_vlog','podcast'])
ON CONFLICT DO NOTHING;
