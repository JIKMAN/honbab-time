'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import RiceBowl from '@/components/RiceBowl';
import VideoCard from '@/components/VideoCard';

import entertainmentVideos from '@/data/videos/entertainment.json';
import vlogVideos          from '@/data/videos/vlog.json';
import gamingVideos        from '@/data/videos/gaming.json';
import musicVideos         from '@/data/videos/music.json';
import documentaryVideos   from '@/data/videos/documentary.json';
import travelVideos        from '@/data/videos/travel.json';

import type { Video } from '@/lib/supabase';

const ALL_CATEGORIES = [
  { key: 'all',           label: '전체',          emoji: '🍽️' },
  { key: 'entertainment', label: '예능',          emoji: '🎭' },
  { key: 'vlog',          label: '브이로그·먹방', emoji: '📱' },
  { key: 'gaming',        label: '게임',          emoji: '🎮' },
  { key: 'music',         label: '음악·ASMR',     emoji: '🎵' },
  { key: 'documentary',   label: '다큐',          emoji: '🎬' },
  { key: 'travel',        label: '여행',          emoji: '✈️' },
];

const CATEGORY_VIDEOS: Record<string, Video[]> = {
  entertainment: entertainmentVideos as Video[],
  vlog:          vlogVideos          as Video[],
  gaming:        gamingVideos        as Video[],
  music:         musicVideos         as Video[],
  documentary:   documentaryVideos   as Video[],
  travel:        travelVideos        as Video[],
};

const allVideos = Object.values(CATEGORY_VIDEOS).flat();

export default function WatchPage() {
  const [category, setCategory] = useState('all');
  const listRef = useRef<HTMLDivElement>(null);

  function changeCategory(key: string) {
    setCategory(key);
    listRef.current?.scrollTo({ top: 0 });
  }

  const filtered = category === 'all'
    ? allVideos
    : CATEGORY_VIDEOS[category] ?? [];

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-6 pb-2 shrink-0">
        <Link href="/" className="text-[#5C4A32] text-xl font-light">←</Link>
        <RiceBowl size="sm" />
        <div className="w-6" />
      </div>

      <h2 className="text-center text-2xl font-bold text-[#2C2C2A] px-4 pb-3 shrink-0">
        오늘 뭐 볼까?
      </h2>

      {/* Category Filter */}
      <div className="px-4 flex gap-2 overflow-x-auto pb-3 shrink-0 scrollbar-hide">
        {ALL_CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => changeCategory(cat.key)}
            className={`shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              category === cat.key
                ? 'bg-[#2C2C2A] text-white'
                : 'bg-white text-[#8B8B88] border border-[#E8E0D0] hover:border-[#5C4A32]'
            }`}
          >
            <span>{cat.emoji}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Video List */}
      <div ref={listRef} className="flex-1 overflow-y-auto px-4 pb-4">
        {filtered.length === 0 ? (
          <p className="text-center text-[#8B8B88] py-12">아직 식탁이 조용해요</p>
        ) : (
          <div className="flex flex-col gap-4 pt-1">
            {filtered.map((video) => (
              <VideoCard key={video.youtube_id} video={video} />
            ))}
          </div>
        )}
        <p className="text-center text-xs text-[#B8B0A0] mt-4 pb-2">Powered by YouTube</p>
      </div>
    </div>
  );
}
