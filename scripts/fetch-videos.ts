/**
 * 혼밥타임 YouTube 영상 자동 수집 스크립트
 *
 * 사용법:
 *   npx tsx scripts/fetch-videos.ts                                         # 전체 카테고리 갱신
 *   npx tsx scripts/fetch-videos.ts --dry-run                               # 결과 확인만 (파일 저장 안 함)
 *   npx tsx scripts/fetch-videos.ts --category=gaming                       # 특정 카테고리만
 *   npx tsx scripts/fetch-videos.ts --category=vlog --keyword="혼밥 브이로그" # 키워드 직접 지정
 *   npx tsx scripts/fetch-videos.ts --category=music --keyword="재즈 카페" --keyword="로파이" --dry-run
 *
 * --keyword 옵션:
 *   - 여러 번 반복해서 복수 키워드 지정 가능
 *   - 지정 시 CATEGORY_MAP의 기본 keywords 대신 사용됨
 *   - --category 없이 --keyword만 단독 사용 불가 (카테고리 필수)
 *
 * 환경변수:
 *   YOUTUBE_API_KEY=... (필수)  ← .env.local에 추가
 */

import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';

config({ path: path.resolve(process.cwd(), '.env.local') });

// ── 설정 ──────────────────────────────────────────────────────────────────────

const API_KEYS = [
  process.env.YOUTUBE_API_KEY,
  process.env.YOUTUBE_API_KEY_2,
  process.env.YOUTUBE_API_KEY_3,
  process.env.YOUTUBE_API_KEY_4,
].filter(Boolean) as string[];

if (!API_KEYS.length) {
  console.error('❌ YOUTUBE_API_KEY 환경변수가 없습니다. .env.local을 확인하세요.');
  process.exit(1);
}

let keyIndex = 0;
function currentKey() { return API_KEYS[keyIndex]; }
function rotateKey()  {
  keyIndex = (keyIndex + 1) % API_KEYS.length;
  console.log(`\n  🔄 API 키 전환 → 키 #${keyIndex + 1}`);
}

const API_BASE = 'https://www.googleapis.com/youtube/v3';

const MIN_DURATION_SEC       = 10 * 60;  // 10분
const MAX_DURATION_SEC       = 120 * 60; // 120분
const VIDEO_TTL_DAYS         = 7;        // 수집 후 보관 기간
const MIN_VIEW_COUNT         = 50_000;
const MAX_RESULTS            = 50;       // API 검색당 최대
const FETCH_PER_KEYWORD      = 20;       // 키워드당 독립 선발 수
const CUSTOM_KW_MAX_INJECT   = 10;       // --keyword 사용 시 pool 진입 허용 최대 개수
const STORE_MAX_PER_CATEGORY = 100;      // 카테고리당 최대 보관 수
const PUBLISHED_WITHIN_DAYS  = 7;        // 최근 N일 이내 영상만
const MAX_VIDEOS_PER_CHANNEL = 3;        // 동일 채널 최대 보관 수
const RECENCY_WEIGHT         = 2;        // 최신성 가중치 강도 (높을수록 신규 영상 우대)

// ── 카테고리 → YouTube categoryId 매핑 ───────────────────────────────────────
//
//  YouTube 카테고리 ID (한국 기준):
//    10 = Music
//    19 = Travel & Events
//    20 = Gaming
//    22 = People & Blogs  (브이로그, 먹방 혼재)
//    24 = Entertainment   (예능, 버라이어티)
//    25 = News & Politics
//    27 = Education
//
//  ※ 먹방 전용 카테고리 없음 → 22번(People & Blogs)에 포함
//    수동 큐레이션으로 관리하거나, vlog와 동일 카테고리에서 가져옴

interface CategoryConfig {
  categoryId: string;
  label: string;
  keywords: string[];
  minDurationMin?: number;      // 기본: MIN_DURATION_SEC/60
  maxDurationMin?: number;      // 기본: MAX_DURATION_SEC/60
  minViewCount?: number;        // 기본: MIN_VIEW_COUNT
  publishedWithinDays?: number; // 기본: PUBLISHED_WITHIN_DAYS
  requireKorean?: boolean;      // 기본: true
}

const CATEGORY_MAP: Record<string, CategoryConfig> = {
  entertainment: {
    categoryId: '24',
    label: '예능',
    keywords: ['예능', '스케치 코미디', '토크쇼', '예능 클립', '웃긴 영상'],
    minDurationMin: 5,
    minViewCount: 20_000,
    publishedWithinDays: 30,
  },
  vlog: {
    categoryId: '22',
    label: '브이로그·먹방',
    keywords: ['브이로그', '먹방', '자취 일상', '혼밥', '직장인 브이로그'],
    minViewCount: 10_000,
    publishedWithinDays: 30,
  },
  gaming: {
    categoryId: '20',
    label: '게임',
    keywords: ['게임', '게임 플레이', '게임 하이라이트', '게임 리뷰', '게임 스토리', '리그 오브 레전드', '스타크래프트'],
    // 기본값 유지 (10~40분, 5만, 7일) — 게임은 기준에 잘 맞음
  },
  music: {
    categoryId: '10',
    label: '음악·ASMR',
    keywords: ['플레이리스트', '뮤직비디오', 'BGM', 'ASMR'],
    minViewCount: 10_000,
    publishedWithinDays: 30,
    requireKorean: false,   // ASMR/BGM은 영어 제목 많음
  },
  documentary: {
    categoryId: '27',
    label: '다큐',
    keywords: ['지식 다큐', '미스터리 사건', '역사', '과학 이야기'],
    minViewCount: 10_000,
    publishedWithinDays: 30,
  },
  travel: {
    categoryId: '19',
    label: '여행',
    keywords: ['여행', '여행 브이로그', '해외여행', '국내여행'],
    minViewCount: 10_000,
    publishedWithinDays: 30,
  },
};

// ── 타입 ──────────────────────────────────────────────────────────────────────

interface VideoEntry {
  id: number;
  youtube_id: string;
  title: string;
  channel_name: string;
  recommend_reason: string;
  categories: string[];
  fetched_at?: string;   // 수집 시각 (ISO 8601)
  view_count?: number;   // 조회수 — 점수 계산에 사용, 저장됨
  duration_sec?: number; // 런타임 전용, 저장 제외
}

interface SearchItem {
  id: { videoId: string };
}

interface VideoDetail {
  id: string;
  snippet: { title: string; channelTitle: string };
  contentDetails: { duration: string };
  statistics: { viewCount: string };
}

// ── 유틸 ──────────────────────────────────────────────────────────────────────

function calcScore(v: VideoEntry): number {
  const daysOld = v.fetched_at
    ? (Date.now() - new Date(v.fetched_at).getTime()) / 86_400_000
    : VIDEO_TTL_DAYS;
  const recencyFactor = Math.max(0, 1 - daysOld / VIDEO_TTL_DAYS);
  return (v.view_count ?? 0) * (1 + recencyFactor * RECENCY_WEIGHT);
}

function parseDurationSec(iso: string): number {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return (parseInt(m[1] ?? '0') * 3600) + (parseInt(m[2] ?? '0') * 60) + parseInt(m[3] ?? '0');
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function publishedAfterISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

function recommendReason(category: string): string {
  const pool: Record<string, string[]> = {
    entertainment: ['밥 먹다 웃음 터지는 예능', '혼밥 외로움 잊게 해주는 예능', '밥 한 공기 순삭하는 케미'],
    vlog:          ['같이 혼밥하는 느낌 물씬', '공감 100% 일상 브이로그', '나만 혼자 사는 게 아니라는 위로'],
    gaming:        ['밥 먹으며 보기 딱 좋은 게임 영상', '한 경기 보는 동안 밥 한 그릇 뚝딱', '가볍게 즐기기 좋은 게임 콘텐츠'],
    mukbang:       ['같이 먹는 느낌으로 혼밥 외로움 제로', '밥 먹으면서 보면 두 배 맛있음'],
    music:         ['잡생각 없애주는 배경음악', '밥 먹을 때 분위기 업', '조용히 밥 먹기 최적'],
    documentary:   ['밥 먹으며 지식 충전', '스케일 큰 영상으로 기분 업', '혼밥하며 교양 쌓기'],
    travel:        ['밥 먹으면서 간접 여행', '언젠가 나도 훌쩍 떠나고 싶은 마음', '여행 영상 보며 설레는 혼밥 타임'],
  };
  const reasons = pool[category] ?? ['혼밥할 때 딱 좋은 영상'];
  return reasons[Math.floor(Math.random() * reasons.length)];
}

async function apiFetch<T>(urlWithoutKey: string): Promise<T> {
  for (let attempt = 0; attempt < API_KEYS.length; attempt++) {
    const url = urlWithoutKey + `&key=${currentKey()}`;
    const res = await fetch(url);

    if (res.ok) return res.json() as Promise<T>;

    const body = await res.text();
    
    // 1. 쿼터 초과 (403)
    const isQuotaError = res.status === 403 && body.includes('quotaExceeded');
    // 2. 키 만료 또는 유효하지 않음 (400)
    const isInvalidKey = res.status === 400 && (body.includes('API_KEY_INVALID') || body.includes('expired'));

    // 둘 중 하나라도 해당하고, 아직 시도할 다음 키가 남아있다면?
    if ((isQuotaError || isInvalidKey) && attempt < API_KEYS.length - 1) {
      console.warn(`⚠️ 키 #${keyIndex + 1} 문제 발생 (${res.status}). 다음 키로 전환합니다...`);
      rotateKey();
      continue; // 루프의 다음 회차로 가서 새 키로 fetch 시도
    }

    // 모든 키를 다 썼거나, 키 문제가 아닌 다른 에러(예: 404 등)인 경우에만 멈춤
    throw new Error(`YouTube API 최종 오류 ${res.status}: ${body}`);
  }
  throw new Error('등록된 모든 API 키를 시도했으나 실패했습니다.');
}

// ── 핵심 로직 ─────────────────────────────────────────────────────────────────

/**
 * @param categoryId - YouTube 카테고리 ID
 * @param keyword - 자동화된 검색 키워드 (CATEGORY_MAP의 label 사용)
 */
async function searchByCategory(categoryId: string, keyword: string, cfg: CategoryConfig): Promise<string[]> {
  const publishedAfter = publishedAfterISO(cfg.publishedWithinDays ?? PUBLISHED_WITHIN_DAYS);

  const base: Record<string, string> = {
    part:              'id',
    type:              'video',
    q:                 keyword, // ✨ 여기서 변수로 자동 할당됨
    videoCategoryId:   categoryId,
    regionCode:        'KR',
    relevanceLanguage: 'ko',
    videoEmbeddable:   'true',
    videoDefinition:   'high',
    publishedAfter,
    order:             'viewCount',
    maxResults:        String(MAX_RESULTS),
  };

  // 키 로테이션 꼬임 방지를 위해 순차 호출 (await 분리)
  const resM = await apiFetch<{ items?: SearchItem[] }>(
    `${API_BASE}/search?${new URLSearchParams({ ...base, videoDuration: 'medium' })}`
  );

  const resL = await apiFetch<{ items?: SearchItem[] }>(
    `${API_BASE}/search?${new URLSearchParams({ ...base, videoDuration: 'long'   })}`
  );

  const ids = [
    ...(resM.items ?? []).map((i) => i.id.videoId),
    ...(resL.items ?? []).map((i) => i.id.videoId),
  ].filter(Boolean);

  return [...new Set(ids)];
}

async function getVideoDetails(ids: string[]): Promise<VideoDetail[]> {
  if (!ids.length) return [];
  // Videos API는 한 번에 50개까지 → 청크 처리
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += 50) chunks.push(ids.slice(i, i + 50));

  const results: VideoDetail[] = [];
  for (const chunk of chunks) {
    const params = new URLSearchParams({
      part: 'snippet,contentDetails,statistics',
      id:   chunk.join(','),
    });
    const data = await apiFetch<{ items?: VideoDetail[] }>(`${API_BASE}/videos?${params}`);
    results.push(...(data.items ?? []));
  }
  return results;
}

function filterAndScore(details: VideoDetail[], category: string, cfg: CategoryConfig): VideoEntry[] {
  const now     = new Date().toISOString();
  const minSec  = (cfg.minDurationMin  ?? MIN_DURATION_SEC / 60) * 60;
  const maxSec  = (cfg.maxDurationMin  ?? MAX_DURATION_SEC / 60) * 60;
  const minViews     = cfg.minViewCount ?? MIN_VIEW_COUNT;
  const requireKorean = cfg.requireKorean ?? true;

  const results: VideoEntry[] = [];
  for (const v of details) {
    const sec   = parseDurationSec(v.contentDetails.duration);
    const views = parseInt(v.statistics.viewCount ?? '0');
    if (requireKorean && !/[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(v.snippet.title)) continue;
    if (sec < minSec || sec > maxSec) continue;
    if (views < minViews) continue;
    results.push({
      id: 0,
      youtube_id:       v.id,
      title:            v.snippet.title,
      channel_name:     v.snippet.channelTitle,
      recommend_reason: recommendReason(category),
      categories:       [category],
      fetched_at:       now,
      view_count:       views,
      duration_sec:     sec,
    });
  }
  return results.sort((a, b) => (b.view_count ?? 0) - (a.view_count ?? 0));
}

async function fetchCategory(category: string, cfg = CATEGORY_MAP[category]): Promise<VideoEntry[]> {
  const { categoryId, label, keywords } = cfg;
  const pickedIds  = new Set<string>();
  const picked: VideoEntry[] = [];

  for (const keyword of keywords) {
    process.stdout.write(`  🔍 "${keyword}" 검색 중...`);
    try {
      const ids     = await searchByCategory(categoryId, keyword, cfg);
      const details = await getVideoDetails(ids);
      const candidates = filterAndScore(details, category, cfg);

      let added = 0;
      for (const v of candidates) {
        if (pickedIds.has(v.youtube_id)) continue;
        pickedIds.add(v.youtube_id);
        picked.push(v);
        if (++added >= FETCH_PER_KEYWORD) break;
      }
      console.log(` → ${added}개 선발 (누계 ${picked.length}개)`);
    } catch (e: unknown) {
      // 쿼터 초과 등 에러 — 이 키워드는 건너뛰고 지금까지 모은 것 보존
      console.log(` → ⚠️ 스킵 (${e instanceof Error ? e.message.slice(0, 60) : e})`);
      console.log(`  ⚠️ [${label}] 키워드 "${keyword}" 실패 — 지금까지 ${picked.length}개로 저장 진행`);
      break; // 남은 키워드도 같은 키로 실패할 가능성 높으므로 중단
    }
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`  ✅ [${label}] 총 ${picked.length}개 확정`);
  return picked;
}

// ── 메인 ──────────────────────────────────────────────────────────────────────

async function main() {
  const args       = process.argv.slice(2);
  const isDryRun   = args.includes('--dry-run');
  const onlyCat    = args.find((a) => a.startsWith('--category='))?.split('=')[1];
  const customKws  = args
    .filter((a) => a.startsWith('--keyword='))
    .map((a) => a.split('=').slice(1).join('=')); // '=' 포함 키워드도 처리

  // --keyword 단독 사용 방지
  if (customKws.length > 0 && !onlyCat) {
    console.error('❌ --keyword 옵션은 --category 와 함께 사용해야 합니다.');
    console.error('   예시: npx tsx scripts/fetch-videos.ts --category=vlog --keyword="혼밥 브이로그"');
    process.exit(1);
  }

  // 지정한 카테고리가 CATEGORY_MAP에 없으면 오류
  if (onlyCat && !CATEGORY_MAP[onlyCat]) {
    console.error(`❌ 알 수 없는 카테고리: "${onlyCat}"`);
    console.error(`   사용 가능: ${Object.keys(CATEGORY_MAP).join(', ')}`);
    process.exit(1);
  }

  const categories = onlyCat ? [onlyCat] : Object.keys(CATEGORY_MAP);

  // 쿼터: 키워드당 search 2회(200) + videos 1회(~2) ≈ 202
  const kwCount        = customKws.length > 0 ? customKws.length
    : categories.reduce((sum, c) => sum + (CATEGORY_MAP[c]?.keywords.length ?? 1), 0);
  const estimatedUnits = kwCount * 202;
  console.log(`\n🍚 혼밥타임 YouTube 영상 수집`);
  console.log(`   카테고리: ${categories.join(', ')}`);
  if (customKws.length > 0) console.log(`   키워드 (직접 지정): ${customKws.map((k) => `"${k}"`).join(', ')}`);
  console.log(`   조건: ${MIN_DURATION_SEC / 60}~${MAX_DURATION_SEC / 60}분 | 조회수 ${MIN_VIEW_COUNT.toLocaleString()}+ | 최근 ${PUBLISHED_WITHIN_DAYS}일`);
  console.log(`   API 키: ${API_KEYS.length}개 등록 (쿼터 초과 시 자동 전환)`);
  console.log(`   예상 쿼터: ~${estimatedUnits} 유닛 / 키당 10,000`);
  console.log(`   모드: ${isDryRun ? 'dry-run' : '저장'}\n`);

  let totalAdded = 0;

  for (const category of categories) {
    const { label } = CATEGORY_MAP[category];
    console.log(`\n📂 [${category}] ${label}`);
    try {
      // customKws가 있으면 해당 키워드만 검색 (기본 키워드는 건드리지 않음)
      const cfg = customKws.length > 0
        ? { ...CATEGORY_MAP[category], keywords: customKws }
        : CATEGORY_MAP[category];
      const newVideos = await fetchCategory(category, cfg);

      // 카테고리별 파일 읽기
      const filePath = path.resolve(process.cwd(), `data/videos/${category}.json`);
      const raw = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : '[]';
      const existing: VideoEntry[] = raw.trim() === '[]' || raw.trim() === '' ? [] : JSON.parse(raw);

      // --keyword 사용 시 진입 개수 상한 적용 (조회수 기준 상위 N개만 허용)
      const injected = customKws.length > 0
        ? [...newVideos].sort((a, b) => (b.view_count ?? 0) - (a.view_count ?? 0)).slice(0, CUSTOM_KW_MAX_INJECT)
        : newVideos;

      // 새 영상 + 기존 영상 합산 → 중복 제거 → 점수 정렬 → 100개 보관
      const all = [...injected, ...existing];
      const seen = new Set<string>();
      const deduped = all.filter(v => {
        if (seen.has(v.youtube_id)) return false;
        seen.add(v.youtube_id);
        return true;
      });
      // TTL 필터: VIDEO_TTL_DAYS일 이내 수집된 영상만 유지
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - VIDEO_TTL_DAYS);
      const withinTTL = deduped.filter(
        (v) => !v.fetched_at || new Date(v.fetched_at) >= cutoff
      );

      // 조회수 × 최신성 가중치 점수 내림차순 정렬
      withinTTL.sort((a, b) => calcScore(b) - calcScore(a));

      // 채널당 최대 MAX_VIDEOS_PER_CHANNEL개 제한 (점수 높은 순 유지)
      const channelCount = new Map<string, number>();
      const channelLimited = withinTTL.filter(v => {
        const count = channelCount.get(v.channel_name) ?? 0;
        if (count >= MAX_VIDEOS_PER_CHANNEL) return false;
        channelCount.set(v.channel_name, count + 1);
        return true;
      });

      const final = channelLimited
        .slice(0, STORE_MAX_PER_CATEGORY)
        .map((v, i) => {
          const { duration_sec: _d, ...rest } = v; // duration_sec만 제외, view_count는 저장
          return { ...rest, id: i + 1 };
        });

      const expired = deduped.length - withinTTL.length;
      const channelDropped = withinTTL.length - channelLimited.length;
      console.log(`   📊 새로 추가 ${newVideos.length}개 | TTL 만료 ${expired}개 제거 | 채널 초과 ${channelDropped}개 제거 | 보관 ${final.length}개 / ${STORE_MAX_PER_CATEGORY}개`);
      totalAdded += newVideos.length;

      if (!isDryRun) {
        fs.writeFileSync(filePath, JSON.stringify(final, null, 2));
        console.log(`   💾 data/videos/${category}.json 저장 완료`);
      }
    } catch (e: unknown) {
      // fetchCategory 자체가 던지는 경우 (네트워크 오류 등) — 기존 파일 유지
      console.error(`   ❌ 오류: ${e instanceof Error ? e.message : e}`);
      console.error(`   ⚠️ 기존 data/videos/${category}.json 유지`);
    }
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`\n📊 총 새로 추가 ${totalAdded}개`);
  if (isDryRun) console.log('[dry-run] 저장하지 않았습니다.');
}

main().catch((e) => {
  console.error('❌', e.message);
  process.exit(1);
});
