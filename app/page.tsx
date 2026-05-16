import Link from 'next/link';
import RiceBowl from '@/components/RiceBowl';
import PresenceCounter from '@/components/PresenceCounter';

export default function Home() {
  return (
    <div className="flex-1 min-h-0 flex flex-col items-center px-6 pt-6 gap-4">
      {/* Header */}
      <div className="text-center shrink-0">
        <h1 className="text-2xl font-bold text-[#2C2C2A] tracking-tight">혼밥타임</h1>
        <PresenceCounter />
      </div>

      {/* Rice Bowl — bowl 하단이 컨테이너 하단에 붙도록 items-end, 위쪽으로만 overflow */}
      <div className="flex-1 min-h-0 w-full flex items-end justify-center overflow-visible -mb-8">
        <RiceBowl size="lg" />
      </div>

      {/* Tab Buttons */}
      <div className="w-full grid grid-cols-2 gap-3 shrink-0 pb-4">
        <Link
          href="/eat"
          className="flex flex-col items-center justify-center gap-2 bg-white rounded-2xl p-5 shadow-sm border border-[#F0E8D8] hover:border-[#5C4A32] hover:shadow-md transition-all active:scale-95"
        >
          <span className="text-3xl">🍳</span>
          <span className="font-semibold text-[#2C2C2A] text-base">뭐먹지?</span>
        </Link>
        <Link
          href="/watch"
          className="flex flex-col items-center justify-center gap-2 bg-white rounded-2xl p-5 shadow-sm border border-[#F0E8D8] hover:border-[#5C4A32] hover:shadow-md transition-all active:scale-95"
        >
          <span className="text-3xl">📺</span>
          <span className="font-semibold text-[#2C2C2A] text-base">뭐보지?</span>
        </Link>
      </div>
    </div>
  );
}
