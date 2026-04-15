import { format } from 'date-fns';

/** Formats seconds to MM:SS display, e.g. 1500 -> "25:00" */
export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** Formats an ISO timestamp to HH:mm, e.g. "14:32" */
export function formatTime(iso: string): string {
  return format(new Date(iso), 'HH:mm');
}

/** Formats an ISO timestamp to a human readable date, e.g. "Apr 15, 2026" */
export function formatDate(iso: string): string {
  return format(new Date(iso), 'MMM d, yyyy');
}
