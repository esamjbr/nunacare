import type { AppSettings } from '../types';

export function isNightTime(): boolean {
  const h = new Date().getHours();
  return h >= 19 || h < 6;
}

export function syncNightMode(settings: AppSettings): void {
  const effective = settings.nightMode || (settings.nightModeAuto && isNightTime());
  document.documentElement.classList.toggle('night', effective);
}
