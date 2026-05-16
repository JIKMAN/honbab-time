'use client';

import { useState } from 'react';

interface ChatBubbleProps {
  nickname: string;
  content: string;
  onReport?: () => void;
  isHidden?: boolean;
  style?: React.CSSProperties;
}

export default function ChatBubble({ nickname, content, onReport, isHidden, style }: ChatBubbleProps) {
  const [reported, setReported] = useState(false);

  if (isHidden) return null;

  const displayNickname = nickname.split('#')[0];

  return (
    <div
      className="chat-bubble-float flex items-center gap-1 group"
      style={style}
    >
      <div className="flex items-baseline gap-1 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm border border-white/60 max-w-[240px]">
        <span className="text-xs font-semibold text-[#5C4A32] shrink-0 whitespace-nowrap">{displayNickname}</span>
        <span className="text-xs text-[#2C2C2A] truncate">{content}</span>
      </div>
      <button
        onClick={() => { setReported(true); onReport?.(); }}
        className={`shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] ${reported ? 'text-red-400' : 'text-gray-300 hover:text-red-400'}`}
        title="신고"
      >
        🚩
      </button>
    </div>
  );
}
