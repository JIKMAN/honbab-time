import Link from 'next/link';

export default function LegalPage() {
  return (
    <div className="flex-1 flex flex-col px-6 pt-8 pb-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="text-[#5C4A32] text-xl">←</Link>
        <h1 className="text-xl font-bold text-[#2C2C2A]">이용약관 & 개인정보처리방침</h1>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#F0E8D8] space-y-6 text-sm text-[#5C5C5A] leading-relaxed">
        <section>
          <h2 className="font-bold text-[#2C2C2A] mb-2">이용약관</h2>
          <p className="mb-2">혼밥타임(이하 &ldquo;서비스&rdquo;)은 혼자 식사하는 사람들이 가상으로 함께하는 공간을 제공합니다.</p>
          <ul className="list-disc pl-4 space-y-1">
            <li>본 서비스는 <strong>만 14세 이상</strong>만 이용할 수 있습니다.</li>
            <li>채팅은 익명으로 운영되며, 타인에게 불쾌감을 주는 발언은 금지됩니다.</li>
            <li>욕설, 도배, 스팸 메시지는 자동으로 차단됩니다.</li>
            <li>신고가 누적된 메시지는 자동으로 숨김 처리됩니다.</li>
            <li>서비스는 예고 없이 변경되거나 종료될 수 있습니다.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-[#2C2C2A] mb-2">개인정보처리방침</h2>
          <p className="mb-2">혼밥타임은 최소한의 정보만 수집합니다.</p>
          <ul className="list-disc pl-4 space-y-1">
            <li><strong>수집 항목:</strong> 채팅 메시지, 세션 식별자(익명), 신고 기록</li>
            <li><strong>보관 기간:</strong> 채팅 로그는 신고·분쟁 대응용으로 <strong>30일</strong> 보관 후 자동 삭제</li>
            <li><strong>제3자 제공:</strong> 수사기관 요청 등 법적 의무 외에는 제공하지 않습니다.</li>
            <li>유튜브 썸네일은 YouTube CDN에서 직접 제공됩니다 (자체 캐싱 없음).</li>
          </ul>
        </section>

        <p className="text-xs text-[#B8B0A0] pt-2">최종 업데이트: 2025년 5월 · Powered by YouTube</p>
      </div>
    </div>
  );
}
