const BAD_WORDS = [
  '시발', '씨발', '씹', '개새끼', '병신', '지랄', '미친놈', '미친년', '닥쳐', '꺼져',
  'ㅅㅂ', 'ㅂㅅ', 'ㅈㄹ', 'ㅁㅊ', 'ㄲㅈ',
];

export function filterBadWords(text: string): string {
  let filtered = text;
  for (const word of BAD_WORDS) {
    const regex = new RegExp(word, 'gi');
    filtered = filtered.replace(regex, '*'.repeat(word.length));
  }
  return filtered;
}

export function hasBadWords(text: string): boolean {
  return BAD_WORDS.some((word) =>
    text.toLowerCase().includes(word.toLowerCase())
  );
}

export function isSpam(text: string): boolean {
  if (text.length > 200) return true;
  const repeatedChar = /(.)\1{9,}/;
  if (repeatedChar.test(text)) return true;
  return false;
}
