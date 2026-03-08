// File: src/utils/imageUtils.ts

/**
 * Конвертирует File в base64 строку
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Конвертирует base64 строку в File
 */
export const base64ToFile = (base64: string, fileName: string): File => {
  const arr = base64.split(',');
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new File([u8arr], fileName, { type: mime });
};

/**
 * Проверяет размер файла (максимум в байтах)
 */
export const validateFileSize = (
  file: File,
  maxSizeMB: number = 5
): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};

/**
 * Проверяет тип файла (разрешенные изображения)
 */
export const validateFileType = (
  file: File,
  allowedTypes: string[] = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
  ]
): boolean => {
  return allowedTypes.includes(file.type);
};
