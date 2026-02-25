import { useState, useEffect } from 'react';

/**
 * Hook que debouncea un valor.
 * Útil para evitar llamadas excesivas a APIs mientras el usuario escribe.
 *
 * @param value - El valor a debouncear
 * @param delay - Tiempo de espera en milisegundos (default: 300ms)
 * @returns El valor debounceado
 *
 * @example
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearch = useDebounce(searchTerm, 300);
 *
 * // debouncedSearch solo se actualiza 300ms después del último cambio
 * useEffect(() => {
 *   fetchResults(debouncedSearch);
 * }, [debouncedSearch]);
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
