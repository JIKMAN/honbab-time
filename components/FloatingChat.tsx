'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import ChatBubble from './ChatBubble';
import ChatInput from './ChatInput';
import { generateNickname } from '@/lib/nickname';
import { filterBadWords, isSpam } from '@/lib/filter';

interface Message {
  id: string;
  nickname: string;
  content: string;
  reportCount: number;
  isHidden: boolean;
  left: number; // 버블 수평 시작 위치 (%)
}

const SEED_MESSAGES = [
  { nickname: '🍜라면너구리#4821', content: '야근 또 야근' },
  { nickname: '🍱도시락왕#2210', content: '오늘 김치찌개' },
  { nickname: '🍙삼각김밥#7733', content: '다들 뭐드세요?' },
  { nickname: '🍗치킨러#1122', content: '치킨 혼자 시켰어요 ㅎ' },
  { nickname: '🥗비빔밥#5566', content: '자취 3년차인데 아직도 혼밥 어색함' },
  { nickname: '🍜냉면러#3344', content: '짱자...' },
  { nickname: '🍛카레왕#8899', content: '같이 먹으니 맛있다' },
];

let seedIndex = 0;

function randomLeft() {
  // 4% ~ 62% — 버블 너비(최대 ~200px) 감안해 우측 끝 잘림 방지
  return 4 + Math.random() * 58;
}

export default function FloatingChat({ compact = false }: { compact?: boolean }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [myNickname] = useState(() => generateNickname());
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  const addMessage = useCallback((nickname: string, content: string) => {
    const filtered = filterBadWords(content);
    const id = `${Date.now()}-${Math.random()}`;
    const msg: Message = {
      id,
      nickname,
      content: filtered,
      reportCount: 0,
      isHidden: false,
      left: randomLeft(),
    };

    setMessages((prev) => [...prev.slice(-9), msg]);

    // 애니메이션(7s) 끝나면 DOM에서 제거
    setTimeout(() => {
      setMessages((prev) => prev.filter((m) => m.id !== id));
    }, 7500);
  }, []);

  useEffect(() => {
    function scheduleSeed() {
      const delay = 3000 + Math.random() * 4000;
      timerRef.current = setTimeout(() => {
        const seed = SEED_MESSAGES[seedIndex % SEED_MESSAGES.length];
        seedIndex++;
        addMessage(seed.nickname, seed.content);
        scheduleSeed();
      }, delay);
    }
    scheduleSeed();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [addMessage]);

  function handleSend(text: string) {
    if (isSpam(text)) return;
    addMessage(myNickname, text);
  }

  function handleReport(id: string) {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const newCount = m.reportCount + 1;
        return { ...m, reportCount: newCount, isHidden: newCount >= 3 };
      })
    );
  }

  const areaHeight = compact ? 'h-[12vh]' : 'h-[22vh]';

  return (
    <div className="w-full">
      {/* 버블 영역 — 각 버블이 랜덤 위치에서 위로 떠오름 */}
      <div className={`relative overflow-hidden ${areaHeight} w-full`}>
        {messages.map((msg) =>
          msg.isHidden ? null : (
            <div
              key={msg.id}
              className="absolute pointer-events-auto"
              style={{ left: `${msg.left}%`, bottom: '6px' }}
            >
              <ChatBubble
                nickname={msg.nickname}
                content={msg.content}
                isHidden={msg.isHidden}
                onReport={() => handleReport(msg.id)}
              />
            </div>
          )
        )}
      </div>

      {/* 입력창 */}
      <div className="px-4 pb-4">
        <ChatInput onSend={handleSend} />
      </div>
    </div>
  );
}
