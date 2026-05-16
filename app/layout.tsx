import type { Metadata } from 'next';
import './globals.css';
import FloatingChat from '@/components/FloatingChat';

export const metadata: Metadata = {
  title: '혼밥타임',
  description: '혼자 먹지만, 혼자 먹지 않는 느낌. 가상 식탁에서 모르는 사람들과 같이 먹어요.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
          rel="stylesheet"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body className="h-[100dvh] overflow-hidden bg-[#FFF8E7]">
        {/* 세로 화면 꽉 채우기 — 스크롤 없음 */}
        <div className="mx-auto max-w-md h-full flex flex-col">
          <main className="flex-1 min-h-0 flex flex-col overflow-hidden">
            {children}
          </main>
          {/* 채팅 영역 — 항상 하단 고정 */}
          <div className="shrink-0 w-full bg-gradient-to-t from-[#FFF8E7] via-[#FFF8E7]/90 to-transparent pt-4">
            <FloatingChat />
          </div>
        </div>
      </body>
    </html>
  );
}
