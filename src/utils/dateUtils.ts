/**
 * IM LOCATION - Local Date & Timezone Utilities
 * Prevents off-by-one errors and timezone shifting by working strictly in local calendar time
 */

export const formatLocalDate = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const getTodayLocalDate = (): string => {
  return formatLocalDate(new Date());
};

export const getTomorrowLocalDate = (): string => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return formatLocalDate(d);
};

export const parseLocalDate = (ymd: string): Date => {
  if (!ymd || !ymd.includes('-')) return new Date();
  const [y, m, d] = ymd.split('-').map(Number);
  // Always use noon (12:00:00) to ensure immunity against DST shifts and timezone variations
  return new Date(y, m - 1, d, 12, 0, 0);
};

export const addDaysToDate = (ymd: string, days: number): string => {
  const dateObj = parseLocalDate(ymd);
  dateObj.setDate(dateObj.getDate() + days);
  return formatLocalDate(dateObj);
};

export const formatDateDisplay = (ymd: string, locale: string = 'fr'): string => {
  if (!ymd) return '';
  const dateObj = parseLocalDate(ymd);
  return dateObj.toLocaleDateString(locale === 'ar' ? 'ar-DZ' : (locale === 'fr' ? 'fr-DZ' : 'en-US'), {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

export const formatDateFull = (ymd: string, locale: string = 'fr'): string => {
  if (!ymd) return '';
  const dateObj = parseLocalDate(ymd);
  return dateObj.toLocaleDateString(locale === 'ar' ? 'ar-DZ' : (locale === 'fr' ? 'fr-DZ' : 'en-US'), {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};
