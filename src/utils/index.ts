export const favColor = '#D32F2F';
export const unfavColor = '#666';
export const fillFavColor = '#D32F2F';
export const fillUnfavColor = 'none';

export const pluralize = (
  count: number,
  one: string,
  few: string,
  many: string
) => {
  const n = Math.abs(count);
  const lastDigit = n % 10;
  const lastTwo = n % 100;

  if (lastDigit === 1 && lastTwo !== 11) return one;
  if (lastDigit >= 2 && lastDigit <= 4 && (lastTwo < 10 || lastTwo >= 20))
    return few;
  return many;
};

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      //префикс "data:image/jpeg;base64,"
      resolve(result.includes(',') ? result.split(',')[1] : result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export const getImageUrl = (path: string | null | undefined) => {
  if (!path) return '/placeholder.png';
  if (path.startsWith('http')) return path;

  const baseUrl = import.meta.env.VITE_STORAGE_URL || '/storage';
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  return `${baseUrl}${cleanPath}`;
};

export function formatDate(iso: string): string {
  console.log('DATE: ', iso);
  if (iso === undefined) {
    console.log('UNDEFINED');
    return '';
  }

  return new Date(iso).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export const storageUrl = (path: string | null | undefined): string | null => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const base = import.meta.env.VITE_STORAGE_URL ?? '';
  return `${base}/${path.replace(/^\//, '')}`;
};
