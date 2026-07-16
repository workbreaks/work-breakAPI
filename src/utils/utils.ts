/**
 * Returns the UTC offset string (e.g. "+05:00") for a given IANA timezone name.
 */
function getUtcOffsetStr(timezone: string, date: Date): string {
  try {
    const parts = new Intl.DateTimeFormat('en', {
      timeZone: timezone,
      timeZoneName: 'shortOffset',
    }).formatToParts(date);
    const tzName = parts.find(p => p.type === 'timeZoneName')?.value ?? 'GMT+0';
    // tzName examples: "GMT+5", "GMT+5:30", "GMT-3", "GMT+0"
    const match = tzName.match(/GMT([+-])(\d+)(?::(\d+))?/);
    if (!match) return '+00:00';
    const sign = match[1];
    const h = match[2].padStart(2, '0');
    const m = (match[3] ?? '00').padStart(2, '0');
    return `${sign}${h}:${m}`;
  } catch {
    return '+00:00';
  }
}

/**
 * Helper to convert HH:mm or HH:mm:ss to an ISO datetime string anchored to defaultDate.
 * If timezone is provided, the UTC offset is embedded in the result (e.g. "2026-06-06T12:43:00+05:00").
 * If already a valid ISO string, returns parsed date.
 */
export function formatTimeToIsoDate(
  timeStr?: string,
  defaultDate: Date = new Date(),
  timezone?: string,
): string | Date {
  if (!timeStr) return defaultDate;

  // If already ISO/full date
  if (timeStr.includes('-') || timeStr.includes('T')) {
    const parsed = new Date(timeStr);
    if (!isNaN(parsed.getTime())) return parsed;
  }

  // Match HH:mm or HH:mm:ss
  const timeMatch = timeStr.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (timeMatch) {
    const hours = timeMatch[1].padStart(2, '0');
    const minutes = timeMatch[2].padStart(2, '0');
    const seconds = timeMatch[3] ? timeMatch[3].padStart(2, '0') : '00';

    const date = new Date(defaultDate);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    const offset = timezone ? getUtcOffsetStr(timezone, date) : '';
    // e.g. "2026-06-06T12:43:00+05:00" or "2026-06-06T12:43:00" (floating)
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offset}`;
  }

  // Fallback
  const fallback = new Date(timeStr);
  return isNaN(fallback.getTime()) ? defaultDate : fallback;
}

export const formatDateToDayBoundary = (dateString: string, type: "start" | "end" = "start"): string => {
  if (!dateString) return "";

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const time = type === "end" ? "23:59:59" : "00:00:00";

  return `${year}-${month}-${day}T${time}Z`;
};