'use client';

import { useState, useEffect } from 'react';

export default function PresenceCounter() {
  const [count, setCount] = useState(23);

  useEffect(() => {
    const interval = setInterval(() => {
      setCount((prev) => {
        const delta = Math.floor(Math.random() * 5) - 2;
        return Math.max(5, Math.min(200, prev + delta));
      });
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <p className="text-sm text-[#8B8B88]">
      지금 <span className="font-semibold text-[#5C4A32]">{count}명</span>이 같이 먹는 중
    </p>
  );
}
