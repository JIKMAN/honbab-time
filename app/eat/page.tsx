'use client';

import { useState } from 'react';
import Link from 'next/link';
import RiceBowl from '@/components/RiceBowl';
import MenuCard from '@/components/MenuCard';
import menusData from '@/data/menus.json';
import type { Menu } from '@/lib/supabase';

const ALL_CATEGORIES = [
  { key: 'all', label: '전체' },
  { key: 'spicy', label: '🌶️ 매운 거 땡김' },
  { key: 'soup', label: '🍜 국물 땡김' },
  { key: 'healthy', label: '🥗 죄책감 덜한' },
  { key: 'budget', label: '💸 1만원 이하' },
  { key: 'quick', label: '⚡ 빨리 먹기' },
  { key: 'sweet', label: '🍰 단 거 땡김' },
  { key: 'flex', label: '💎 월급날 플렉스' },
  { key: 'drink', label: '🍺 혼술용' },
  { key: 'late_night', label: '🌙 야식' },
  { key: 'convenience', label: '🏪 편의점' },
];

const menus = menusData as Menu[];

export default function EatPage() {
  const [selected, setSelected] = useState('all');
  const [randomMenu, setRandomMenu] = useState<Menu | null>(null);

  function selectCategory(key: string) {
    setRandomMenu(null);
    setSelected(key);
  }

  const filtered = selected === 'all'
    ? menus
    : menus.filter((m) => m.categories.includes(selected));

  function handleRandom() {
    let pick = menus[Math.floor(Math.random() * menus.length)];
    if (randomMenu && menus.length > 1) {
      while (pick.id === randomMenu.id) {
        pick = menus[Math.floor(Math.random() * menus.length)];
      }
    }
    setRandomMenu(pick);
  }

  const naverUrl = randomMenu
    ? `https://map.naver.com/v5/search/${encodeURIComponent(randomMenu.name)}`
    : '';
  const kakaoUrl = randomMenu
    ? `https://map.kakao.com/?q=${encodeURIComponent(randomMenu.name)}`
    : '';

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-6 pb-4">
        <Link href="/" className="text-[#5C4A32] text-xl font-light">←</Link>
        <RiceBowl size="sm" />
        <button className="text-[#8B8B88] text-xl">···</button>
      </div>

      <h2 className="text-center text-2xl font-bold text-[#2C2C2A] px-4 pb-3">오늘 뭐 먹지?</h2>

      {/* Random Pick */}
      <div className="px-4 mb-3">
        {randomMenu ? (
          <div className="bounce-in bg-[#5C4A32] text-white rounded-2xl px-4 py-3">
            {/* 타이틀 + 닫기 */}
            <div className="flex items-center justify-center relative mb-2">
              <p className="text-xs opacity-60">🎲 오늘의 추천</p>
              <button
                onClick={() => setRandomMenu(null)}
                className="absolute right-0 text-white/50 hover:text-white text-lg leading-none transition-colors"
                aria-label="닫기"
              >
                ✕
              </button>
            </div>
            {/* 메뉴 정보 */}
            <div className="flex items-center gap-3">
              <span className="text-2xl shrink-0">{randomMenu.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm leading-tight">{randomMenu.name}</p>
                <p className="text-xs opacity-70 truncate">{randomMenu.description}</p>
              </div>
            </div>
            {/* 액션 버튼 */}
            <div className="mt-2.5 flex gap-1.5">
              <button
                onClick={handleRandom}
                className="flex-1 bg-white/15 hover:bg-white/25 rounded-lg py-1.5 text-xs font-semibold transition-colors text-center"
              >
                🔀 다른 추천
              </button>
              <a
                href={naverUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-white/15 hover:bg-white/25 rounded-lg py-1.5 text-xs font-semibold transition-colors text-center"
              >
                🗺️ 네이버지도
              </a>
              <a
                href={kakaoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-white/15 hover:bg-white/25 rounded-lg py-1.5 text-xs font-semibold transition-colors text-center"
              >
                🗺️ 카카오맵
              </a>
            </div>
          </div>
        ) : (
          <button
            onClick={handleRandom}
            className="w-full bg-white rounded-2xl p-4 text-center border border-[#F0E8D8] hover:border-[#5C4A32] transition-colors shadow-sm"
          >
            <p className="text-xs text-[#8B8B88] mb-1">결정장애일 땐</p>
            <p className="font-semibold text-[#2C2C2A]">🎲 랜덤 추천 받기</p>
          </button>
        )}
      </div>

      {/* Category Filter */}
      <div className="px-4 pb-3">
        <div className="flex flex-wrap gap-2">
          {ALL_CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => selectCategory(cat.key)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                selected === cat.key
                  ? 'bg-[#2C2C2A] text-white'
                  : 'bg-white text-[#8B8B88] border border-[#E8E0D0] hover:border-[#5C4A32]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Menu List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="flex flex-col gap-3 pt-1">
          {filtered.length === 0 ? (
            <p className="text-center text-[#8B8B88] py-8">조건에 맞는 메뉴가 없어요 😅</p>
          ) : (
            filtered.map((menu) => (
              <MenuCard key={menu.id} menu={menu} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
