import { clsx, type ClassValue } from 'clsx'; //библиотека объединения классов
import { twMerge } from 'tailwind-merge'; //Утилита из tailwind,
//объединяет классы Tailwind и разрешает конфликты

//Функция, которая превращает аргументы в строку с классами
//и удаляет дубликаты и конфликты
//Используются компоненты (например, badge), поэтому данная функция может быть
//необходима
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
