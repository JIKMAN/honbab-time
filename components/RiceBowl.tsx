'use client';

// components/RiceBowl.tsx
// 혼밥타임 메인 비주얼 - 김 모락모락 나는 고봉밥
// skin prop으로 /public/bowls/{skin}.png 이미지 교체 가능

import React from 'react';
import Image from 'next/image';

interface RiceBowlProps {
  size?: 'sm' | 'md' | 'lg';
  skin?: string;      // 'default' → /bowls/default.png, 'gold' → /bowls/gold.png …
  className?: string;
}

const SIZE_MAP = {
  sm:  { wrapper: 'w-12 h-10', imgSize: 40,  smoke: false },
  md:  { wrapper: 'w-32 h-28', imgSize: 110, smoke: true  },
  lg:  { wrapper: 'w-80 h-96', imgSize: 300, smoke: true  },
};

export default function RiceBowl({ size = 'lg', skin = 'default', className = '' }: RiceBowlProps) {
  const config = SIZE_MAP[size];

  return (
    <div className={`relative flex items-end justify-center overflow-visible ${config.wrapper} ${className}`}>
      {/* 김 레이어 (md, lg만) */}
      {config.smoke && (
        <div className="smoke-layer">
          <div className="smoke-blob smoke-blob-1" />
          <div className="smoke-blob smoke-blob-2" />
          <div className="smoke-blob smoke-blob-3" />
          <div className="smoke-blob smoke-blob-4" />
        </div>
      )}

      {/* 고봉밥 스킨 이미지 */}
      <Image
        src={`/bowls/${skin}.png`}
        alt="고봉밥"
        width={config.imgSize}
        height={Math.round(config.imgSize * 0.82)}
        style={{ objectFit: 'contain', objectPosition: 'bottom' }}
        priority={size === 'lg'}
      />

      <style jsx>{`
        .smoke-layer {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          bottom: 35%;
          width: 75%;
          height: 100%;
          pointer-events: none;
          z-index: 1;
        }

        .smoke-blob {
          position: absolute;
          left: 50%;
          background: rgba(255, 255, 255, 1);
          border-radius: 50%;
          filter: blur(6px);
          box-shadow: 0 0 20px rgba(255, 255, 255, 0.8);
          will-change: transform, opacity, bottom;
          backface-visibility: hidden;
        }

        .smoke-blob-1 { width: 60px; height: 60px; margin-left: -30px; animation: smokeRise 4s ease-out infinite; }
        .smoke-blob-2 { width: 50px; height: 50px; margin-left: -25px; animation: smokeRise 4s ease-out infinite 1s; }
        .smoke-blob-3 { width: 55px; height: 55px; margin-left: -27px; animation: smokeRise 4s ease-out infinite 2s; }
        .smoke-blob-4 { width: 45px; height: 45px; margin-left: -22px; animation: smokeRise 4s ease-out infinite 3s; }

        @keyframes smokeRise {
          0%   { bottom: 0;    opacity: 0; transform: translateX(0)    scale(0.4); }
          15%  {               opacity: 1; }
          100% { bottom: 100%; opacity: 0; transform: translateX(-10px) scale(2);  }
        }

        @media (prefers-reduced-motion: reduce) {
          .smoke-blob { animation: none; opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
