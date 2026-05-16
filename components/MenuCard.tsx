'use client';

import { useState } from 'react';
import type { Menu } from '@/lib/supabase';

interface MenuCardProps {
  menu: Menu;
  onRecommend?: (id: number) => void;
}

export default function MenuCard({ menu, onRecommend }: MenuCardProps) {
  const [count, setCount] = useState(menu.recommend_count);
  const [recommended, setRecommended] = useState(false);

  function handleRecommend() {
    if (recommended) return;
    setRecommended(true);
    setCount((c) => c + 1);
    onRecommend?.(menu.id);
  }

  const naverUrl = `https://map.naver.com/v5/search/${encodeURIComponent(menu.name)}`;
  const kakaoUrl = `https://map.kakao.com/?q=${encodeURIComponent(menu.name)}`;

  return (
    <div className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm border border-[#F0E8D8]">
      <div className="w-14 h-14 rounded-xl bg-[#FFF8E7] flex items-center justify-center text-3xl shrink-0">
        {menu.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-[#2C2C2A] text-base">{menu.name}</h3>
        <p className="text-sm text-[#8B8B88] mt-0.5 truncate">{menu.description}</p>
        <div className="mt-1.5 flex items-center gap-3">
          <button
            onClick={handleRecommend}
            className={`flex items-center gap-1 text-xs font-medium transition-colors ${
              recommended ? 'text-orange-500' : 'text-[#B8B0A0] hover:text-[#5C4A32]'
            }`}
          >
            👍 <span>{count.toLocaleString()}명 추천</span>
          </button>
          <span className="text-[#E8E0D0]">|</span>
          <a
            href={naverUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#B8B0A0] hover:text-[#03C75A] transition-colors font-medium"
          >
            🗺️ 네이버지도
          </a>
          <a
            href={kakaoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#B8B0A0] hover:text-[#FAE100] transition-colors font-medium"
          >
            🗺️ 카카오맵
          </a>
        </div>
      </div>
    </div>
  );
}
