import type { Video } from '@/lib/supabase';

interface VideoCardProps {
  video: Video;
}

export default function VideoCard({ video }: VideoCardProps) {
  const thumbnailUrl = `https://img.youtube.com/vi/${video.youtube_id}/hqdefault.jpg`;
  const watchUrl = `https://youtube.com/watch?v=${video.youtube_id}`;

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-[#F0E8D8]">
      <div className="relative w-full aspect-video bg-[#F5F0E8]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumbnailUrl}
          alt={video.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-[#2C2C2A] text-sm leading-snug line-clamp-2">{video.title}</h3>
        <p className="text-xs text-[#8B8B88] mt-1">{video.channel_name}</p>
        <p className="text-xs text-[#5C4A32] mt-2 leading-relaxed">&ldquo;{video.recommend_reason}&rdquo;</p>
        <a
          href={watchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 block text-center text-xs font-medium text-white bg-red-500 hover:bg-red-600 transition-colors rounded-full py-2 px-4"
        >
          YouTube에서 보기 ▶
        </a>
      </div>
    </div>
  );
}
