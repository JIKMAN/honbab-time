'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import ChatBubble from './ChatBubble';
import ChatInput from './ChatInput';
import { generateNickname } from '@/lib/nickname';
import { filterBadWords, isSpam } from '@/lib/filter';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface Message {
  id: string;
  dbId?: string;
  nickname: string;
  content: string;
  reportCount: number;
  isHidden: boolean;
  left: number;
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
  return 4 + Math.random() * 58;
}

export default function FloatingChat({ compact = false }: { compact?: boolean }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [myNickname] = useState(() => generateNickname());
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  const showMessage = useCallback((id: string, nickname: string, content: string, dbId?: string) => {
    const msg: Message = {
      id,
      dbId,
      nickname,
      content,
      reportCount: 0,
      isHidden: false,
      left: randomLeft(),
    };
    setMessages((prev) => [...prev.slice(-9), msg]);
    setTimeout(() => {
      setMessages((prev) => prev.filter((m) => m.id !== id));
    }, 7500);
  }, []);

  // 시드 메시지 — Supabase 미연결 시에도 동작
  useEffect(() => {
    function scheduleSeed() {
      const delay = 3000 + Math.random() * 4000;
      timerRef.current = setTimeout(() => {
        const seed = SEED_MESSAGES[seedIndex % SEED_MESSAGES.length];
        seedIndex++;
        showMessage(`seed-${Date.now()}-${Math.random()}`, seed.nickname, seed.content);
        scheduleSeed();
      }, delay);
    }
    scheduleSeed();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [showMessage]);

  // Supabase Broadcast — 다른 유저 메시지 실시간 수신
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const channel = supabase
      .channel('floating-chat')
      .on('broadcast', { event: 'new_message' }, (payload) => {
        const { id, nickname, content } = payload.payload as { id: string; nickname: string; content: string };
        if (nickname === myNickname) return;
        showMessage(id, nickname, content);
      })
      .subscribe();

    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [myNickname, showMessage]);

  async function handleSend(text: string) {
    if (isSpam(text)) return;
    const filtered = filterBadWords(text);
    showMessage(`local-${Date.now()}`, myNickname, filtered);

    if (isSupabaseConfigured && channelRef.current) {
      await channelRef.current.send({
        type: 'broadcast',
        event: 'new_message',
        payload: { id: `remote-${Date.now()}-${Math.random()}`, nickname: myNickname, content: filtered },
      });
      supabase.from('chat_messages').insert({ nickname: myNickname, content: filtered });
    }
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
      <div className="px-4 pb-4">
        <ChatInput onSend={handleSend} />
      </div>
    </div>
  );
}
