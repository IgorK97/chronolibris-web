export const favColor = '#D32F2F';
export const unfavColor = '#666';
export const fillFavColor = '#D32F2F';
export const fillUnfavColor = 'none';

export const getImageUrl = (path: string | null | undefined) => {
  if (!path) return '/placeholder.png';
  if (path.startsWith('http')) return path;

  const baseUrl = import.meta.env.VITE_STORAGE_URL || '/storage';
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  return `${baseUrl}${cleanPath}`;
};
