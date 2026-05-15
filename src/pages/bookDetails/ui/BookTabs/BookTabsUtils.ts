export interface ItemAuthor {
  id: number;
  name: string;
  avatarUrl?: string;
}

export interface Comment {
  id: number;
  author: ItemAuthor;
  text: string;
  createdAt: string;
  likes: number;
  dislikes: number;
  userVote?: 'like' | 'dislike' | null;
  replies?: Comment[];
}

export interface Review {
  id: number;
  author: ItemAuthor;
  text: string;
  rating: number;
  createdAt: string;
  likes: number;
  dislikes: number;
  userVote?: boolean;
}

export function getInitials(name: string): string {
  if (!name || name == '[Недоступно]') return 'X';
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export function getAvatarColor(name: string): string {
  const colors = [
    '#ef4444',
    '#f97316',
    '#eab308',
    '#22c55e',
    '#06b6d4',
    '#6366f1',
    '#ec4899',
    '#8b5cf6',
  ];
  let hash = 0;
  if (!name) name = 'N';
  for (let i = 0; i < name.length; i++)
    hash = name.charCodeAt(i) + ((hash << 5) + hash);
  return colors[Math.abs(hash) % colors.length];
}
