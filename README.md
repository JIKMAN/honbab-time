# 혼밥타임 🍚

> "혼자 먹지만, 혼자 먹지 않는 느낌" — 가상 식탁에서 모르는 사람들과 익명으로 같이 먹는 웹 서비스

## 기능

- **메인 화면** — 고봉밥 SVG(김 애니메이션) + 실시간 동시접속자 수
- **뭐먹지?** — 카테고리별 메뉴 추천, 랜덤 추천, 👍 추천 카운트
- **뭐보지?** — 혼밥용 유튜브 영상 큐레이션 (외부 링크)
- **실시간 채팅** — 익명 닉네임, 떠다니는 채팅 버블, 욕설 필터, rate limit, 신고 기능
- **모바일 우선** 반응형 디자인

## 로컬 실행 방법

### 1. 패키지 설치

```bash
npm install
```

### 2. 환경변수 설정

`.env.local.example`을 복사해 `.env.local`을 만들고 Supabase 값을 입력합니다.

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

> **Supabase 없이도 실행 가능합니다.** 채팅은 로컬 상태(시드 메시지)로 시뮬레이션되고, 메뉴/영상은 `data/` 폴더의 JSON에서 읽습니다.

### 3. Supabase 스키마 적용 (선택)

Supabase 대시보드 → SQL Editor에서 `supabase/schema.sql`을 실행하세요.  
시드 데이터(메뉴 30개, 영상 15개)가 자동으로 삽입됩니다.

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

## 프로젝트 구조

```
honbab-time/
├── app/
│   ├── page.tsx          # 메인 (고봉밥 + 탭)
│   ├── eat/page.tsx      # 뭐먹지?
│   ├── watch/page.tsx    # 뭐보지?
│   ├── legal/page.tsx    # 이용약관/개인정보처리방침
│   └── layout.tsx        # 채팅 레이어 항상 포함
├── components/
│   ├── RiceBowl.tsx      # 고봉밥 SVG (김 애니메이션)
│   ├── FloatingChat.tsx  # 떠다니는 채팅 시스템
│   ├── ChatBubble.tsx    # 개별 메시지 버블
│   ├── ChatInput.tsx     # 입력창
│   ├── MenuCard.tsx      # 메뉴 추천 카드
│   ├── VideoCard.tsx     # 유튜브 영상 카드
│   └── PresenceCounter.tsx # "N명이 같이 먹는 중"
├── lib/
│   ├── supabase.ts       # Supabase 클라이언트 + 타입
│   ├── nickname.ts       # 자동 닉네임 생성기
│   └── filter.ts         # 욕설/도배 필터
├── data/
│   ├── menus.json        # 시드 메뉴 데이터 (30개)
│   └── videos.json       # 시드 영상 데이터 (20개)
└── supabase/
    └── schema.sql        # DB 스키마 + RLS + 시드 데이터
```

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프론트엔드 | Next.js 14 (App Router) + TypeScript + Tailwind CSS |
| 백엔드/DB | Supabase (PostgreSQL + Realtime) |
| 배포 | Vercel |
| 폰트 | Pretendard |

## 배포 (Vercel)

```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel
```

Vercel 환경변수 설정:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 법적 고지

- 이용 가능 연령: 만 14세 이상
- 채팅 로그: 30일 보관 후 자동 삭제
- YouTube 썸네일: YouTube CDN 직접 참조 (자체 캐싱 없음)
- Powered by YouTube
