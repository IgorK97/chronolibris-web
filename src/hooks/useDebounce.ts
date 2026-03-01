import { useState, useEffect } from "react";

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Очищаем таймер, если значение изменилось до истечения delay
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}
