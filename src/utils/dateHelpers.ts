import { differenceInDays, differenceInMonths, differenceInWeeks, parseISO, isValid, format } from 'date-fns';

/**
 * Calculate baby's age as a readable string
 */
export function calculateBabyAge(dateOfBirth: string, lang: 'en' | 'ar' = 'en'): string {
  try {
    const dob = parseISO(dateOfBirth);
    if (!isValid(dob)) return lang === 'ar' ? 'عمر غير معروف' : 'Unknown age';
    
    const now = new Date();
    const days = differenceInDays(now, dob);
    const weeks = differenceInWeeks(now, dob);
    const months = differenceInMonths(now, dob);

    if (lang === 'ar') {
      if (days < 7) return `${days} ${days === 1 ? 'يوم' : 'أيام'}`;
      if (weeks < 5) return `${weeks} ${weeks === 1 ? 'أسبوع' : 'أسابيع'}`;
      if (months < 12) return `${months} ${months === 1 ? 'شهر' : 'أشهر'}`;
      const years = Math.floor(months / 12);
      const rem = months % 12;
      return rem > 0 ? `${years} ${years === 1 ? 'سنة' : 'سنوات'} و ${rem} ${rem === 1 ? 'شهر' : 'أشهر'}` : `${years} ${years === 1 ? 'سنة' : 'سنوات'}`;
    }

    if (days < 7) return `${days} day${days !== 1 ? 's' : ''}`;
    if (weeks < 5) return `${weeks} week${weeks !== 1 ? 's' : ''}`;
    if (months < 12) return `${months} month${months !== 1 ? 's' : ''}`;
    const years = Math.floor(months / 12);
    const rem = months % 12;
    return rem > 0 ? `${years}y ${rem}m` : `${years} year${years !== 1 ? 's' : ''}`;
  } catch {
    return lang === 'ar' ? 'عمر غير معروف' : 'Unknown age';
  }
}

/**
 * Get baby age in months (numeric)
 */
export function getBabyAgeInMonths(dateOfBirth: string): number {
  try {
    const dob = parseISO(dateOfBirth);
    if (!isValid(dob)) return 0;
    return differenceInMonths(new Date(), dob);
  } catch {
    return 0;
  }
}

/**
 * Format time relative to now
 */
export function timeAgo(isoString: string, lang: 'en' | 'ar' = 'en'): string {
  try {
    const date = parseISO(isoString);
    if (!isValid(date)) return '';
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 60000); // minutes

    if (lang === 'ar') {
      if (diff < 1) return 'الآن';
      if (diff < 60) return `منذ ${diff} دقيقة`;
      const hours = Math.floor(diff / 60);
      if (hours < 24) return `منذ ${hours} ساعة`;
      const days = Math.floor(hours / 24);
      return `منذ ${days} يوم`;
    }

    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    const hours = Math.floor(diff / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  } catch {
    return '';
  }
}

/**
 * Format duration in minutes to readable string
 */
export function formatDuration(minutes: number, lang: 'en' | 'ar' = 'en'): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (lang === 'ar') {
    if (h === 0) return `${m} دقيقة`;
    if (m === 0) return `${h} ساعة`;
    return `${h}س ${m}د`;
  }
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Format date for display
 */
export function formatDate(isoString: string, lang: 'en' | 'ar' = 'en'): string {
  try {
    const date = parseISO(isoString);
    if (!isValid(date)) return '';
    if (lang === 'ar') {
      return format(date, 'd/M/yyyy');
    }
    return format(date, 'MMM d, yyyy');
  } catch {
    return '';
  }
}

/**
 * Format time for display (HH:mm)
 */
export function formatTime(isoOrTime: string): string {
  try {
    if (isoOrTime.includes('T') || isoOrTime.includes('-')) {
      const date = parseISO(isoOrTime);
      if (isValid(date)) return format(date, 'HH:mm');
    }
    return isoOrTime.slice(0, 5);
  } catch {
    return isoOrTime.slice(0, 5);
  }
}

/**
 * Get greeting based on time of day
 */
export function getGreeting(lang: 'en' | 'ar' = 'en'): string {
  const hour = new Date().getHours();
  if (lang === 'ar') {
    if (hour < 12) return 'صباح الخير';
    if (hour < 17) return 'مساء الخير';
    return 'مساء الخير';
  }
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Calculate sleep duration in minutes
 */
export function calcSleepDuration(startTime: string, endTime: string): number {
  try {
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    return Math.round((end - start) / 60000);
  } catch {
    return 0;
  }
}

/**
 * Check if a date string is today
 */
export function isToday(dateStr: string): boolean {
  try {
    const date = parseISO(dateStr);
    const today = new Date();
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  } catch {
    return false;
  }
}

/**
 * Get today's date as YYYY-MM-DD
 */
export function todayISO(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

/**
 * Get current datetime as ISO string
 */
export function nowISO(): string {
  return new Date().toISOString();
}
