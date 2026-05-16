'use client';

import { useState, useRef } from 'react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState('');
  const lastSentAt = useRef<number>(0);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;

    const now = Date.now();
    if (now - lastSentAt.current < 1000) return;
    lastSentAt.current = now;

    onSend(trimmed);
    setValue('');
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 bg-white rounded-full px-4 py-2.5 shadow-sm border border-[#E8E0D0]"
    >
      <span className="text-[#8B8B88] text-sm">💬</span>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="한 입 거들기..."
        maxLength={100}
        disabled={disabled}
        className="flex-1 text-sm bg-transparent outline-none text-[#2C2C2A] placeholder-[#B8B0A0]"
      />
      <button
        type="submit"
        disabled={!value.trim() || disabled}
        className="shrink-0 text-[#5C4A32] disabled:opacity-30 hover:opacity-70 transition-opacity"
      >
        😊
      </button>
    </form>
  );
}
