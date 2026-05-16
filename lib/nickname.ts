const foodEmojis = ['🍜', '🍲', '🍱', '🍣', '🍙', '🥘', '🍛', '🥗', '🍝', '🍢', '🥟', '🍤', '🌮', '🥪', '🍔', '🌯', '🥚', '🍗'];

const adjectives = ['배고픈', '든든한', '고독한', '행복한', '바쁜', '여유로운', '쓸쓸한', '따뜻한', '차가운', '졸린'];

const nouns = ['라면너구리', '도시락왕', '삼각김밥', '볶음밥', '김치전사', '비빔밥', '순대국', '떡볶이', '냉면러', '치킨러', '피자왕', '우동장인', '초밥러', '카레왕', '돈카츠맨'];

export function generateNickname(): string {
  const emoji = foodEmojis[Math.floor(Math.random() * foodEmojis.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 9000) + 1000;
  return `${emoji}${noun}#${number}`;
}

export function getDisplayName(nickname: string): string {
  return nickname.replace(/#\d+$/, '');
}
