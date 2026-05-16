'use client';

import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export default function PresenceCounter() {
  const [count, setCount] = useState(1);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      // Supabase 미연결 시 가짜 카운터
      const interval = setInterval(() => {
        setCount((prev) => Math.max(5, Math.min(200, prev + Math.floor(Math.random() * 5) - 2)));
      }, 8000);
      setCount(23);
      return () => clearInterval(interval);
    }

    const sessionId = Math.random().toString(36).slice(2);
    const channel = supabase.channel('presence-room', {
      config: { presence: { key: sessionId } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setCount(Object.keys(state).length);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <p className="text-sm text-[#8B8B88]">
      지금 <span className="font-semibold text-[#5C4A32]">{count}명</span>이 같이 먹는 중
    </p>
  );
}
