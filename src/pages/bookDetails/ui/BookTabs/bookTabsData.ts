// ─── Shared types ─────────────────────────────────────────────────────────────

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
  rating: number; // 1–5
  createdAt: string;
  likes: number;
  dislikes: number;
  userVote?: 'like' | 'dislike' | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export function getAvatarColor(name: string): string {
  const colors = [
    '#ef4444', '#f97316', '#eab308', '#22c55e',
    '#06b6d4', '#6366f1', '#ec4899', '#8b5cf6',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

// ─── Mock data ────────────────────────────────────────────────────────────────

export const MOCK_COMMENTS: Comment[] = [
  {
    id: 1,
    author: { id: 101, name: 'Анна Смирнова' },
    text: 'Кто-нибудь может объяснить смысл финальной сцены? Мне показалось, что это метафора, но я не уверена.',
    createdAt: '2025-11-14T18:30:00Z',
    likes: 24, dislikes: 2, userVote: null,
    replies: [
      {
        id: 11,
        author: { id: 102, name: 'Иван Петров' },
        text: 'Я тоже так думаю! Автор намекал на это ещё в третьей главе, когда герой смотрит на закат.',
        createdAt: '2025-11-15T09:12:00Z',
        likes: 8, dislikes: 0, userVote: null,
        replies: [
          {
            id: 111,
            author: { id: 103, name: 'Мария Козлова' },
            text: 'Да, я перечитала первую главу после финала — всё было прямо перед глазами!',
            createdAt: '2025-11-15T11:45:00Z',
            likes: 3, dislikes: 0, userVote: null,
            replies: [],
          },
        ],
      },
      {
        id: 12,
        author: { id: 104, name: 'Дмитрий Волков' },
        text: 'Мне кажется, всё проще — это просто красивый образ без глубокого смысла.',
        createdAt: '2025-11-16T14:20:00Z',
        likes: 1, dislikes: 4, userVote: null,
        replies: [],
      },
    ],
  },
  {
    id: 2,
    author: { id: 105, name: 'Елена Новикова' },
    text: 'В какой главе упоминается письмо от отца? Хочу найти цитату, никак не могу вспомнить.',
    createdAt: '2025-11-10T20:05:00Z',
    likes: 15, dislikes: 1, userVote: null,
    replies: [],
  },
  {
    id: 3,
    author: { id: 106, name: 'Алексей Фёдоров' },
    text: 'Интересно, есть ли продолжение? В конце явно остались незакрытые линии.',
    createdAt: '2025-11-08T15:33:00Z',
    likes: 9, dislikes: 3, userVote: null,
    replies: [
      {
        id: 31,
        author: { id: 107, name: 'Светлана Орлова' },
        text: 'Автор говорил в интервью, что планирует вторую часть, но дата не объявлена.',
        createdAt: '2025-11-09T08:50:00Z',
        likes: 5, dislikes: 0, userVote: null,
        replies: [],
      },
    ],
  },
];

export const MOCK_REVIEWS: Review[] = [
  {
    id: 1,
    author: { id: 201, name: 'Ольга Белова' },
    text: 'Одна из лучших книг, что я читала за последний год. Автор умело выстраивает напряжение, персонажи живые и многогранные. Особенно впечатлила внутренняя эволюция главного героя — от замкнутого циника к человеку, способному на настоящую близость. Финал оставил двоякое ощущение, но именно это и делает книгу запоминающейся. Буду рекомендовать всем знакомым.',
    rating: 5,
    createdAt: '2025-11-20T10:00:00Z',
    likes: 41, dislikes: 3, userVote: null,
  },
  {
    id: 2,
    author: { id: 202, name: 'Кирилл Захаров' },
    text: 'Книга неплохая, но середина заметно провисает. Первые сто страниц — отличный темп, потом автор будто устал и начал тянуть резину. Диалоги местами звучат неестественно. Тем не менее концовка вытягивает впечатление.',
    rating: 3,
    createdAt: '2025-11-18T14:30:00Z',
    likes: 18, dislikes: 5, userVote: null,
  },
  {
    id: 3,
    author: { id: 203, name: 'Татьяна Морозова' },
    text: 'Прекрасный язык, богатые образы. Читается как поэзия в прозе. Немного сложновато для лёгкого чтения, но если вы любите вдумчивую литературу — это именно то, что нужно. Перечитаю обязательно.',
    rating: 4,
    createdAt: '2025-11-12T19:15:00Z',
    likes: 29, dislikes: 1, userVote: null,
  },
];
