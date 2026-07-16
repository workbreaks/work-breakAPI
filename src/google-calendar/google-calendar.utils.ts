
import { GCDto } from '../break/googleCalendar.dto';

export const PROMO_TEXT = 'Powered by work-break.com';

/**
 * Appends the promo footer to the description if not already present.
 */
export function formatDescription(description?: string): string {
  if (!description) return PROMO_TEXT;
  if (description.includes(PROMO_TEXT)) return description;
  return `${description}\n\n${PROMO_TEXT}`;
}

/**
 * Cleans the description by stripping HTML, decoding entities, and removing the promo footer.
 */
export function cleanDescription(description?: string): string {
  if (!description) return '';

  // 1. Convert basic HTML to plain text
  let clean = description
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<[^>]*>?/gm, '');

  // 2. Decode common HTML entities
  clean = clean
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // 3. Remove the promo footer and surrounding whitespace/newlines
  const escapedPromo = PROMO_TEXT.replace(/\./g, '\\.');
  const promoRegex = new RegExp(`\\s*\\n*\\s*${escapedPromo}`, 'g');
  clean = clean.replace(promoRegex, '');

  return clean.trim();
}

/**
 * Maps a Google Calendar event to a BreakDto.
 */
export function mapGoogleEventToBreakDto(
  evt: any
): GCDto {
  const startStr = evt.start?.dateTime || evt.start?.date || '';
  const endStr = evt.end?.dateTime || evt.end?.date || '';

  let calculatedDuration = 0;
  if (startStr && endStr) {
    const start = new Date(startStr);
    const end = new Date(endStr);
    calculatedDuration = Math.round((end.getTime() - start.getTime()) / 60000);
  }

  const description = evt.description || '';
  let type = 'event';
  let reason = description;

  if (description.includes('tasks.google.com')) {
    type = 'task';
    reason = ''; // Clear the system warning from the reason field
  }

  return {
    type,
    title: evt.summary || 'Google Calendar Event',
    reason,
    duration: calculatedDuration,
    startTime: startStr,
    endTime: endStr
  } as GCDto;
}

export const getUtcStringForZone = (dateStr: string, hour: number, minute: number, second: number, ms: number, tz: string): string => {
      // 1. Parse the pieces of the date string (YYYY-MM-DD)
      const [year, month, day] = dateStr.split('-').map(Number);
      
      // 2. Create a formatter to extract structural components matching the target timezone
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        year: 'numeric', month: 'numeric', day: 'numeric',
        hour: 'numeric', minute: 'numeric', second: 'numeric',
        hour12: false
      });

      // 3. Construct a base UTC date setup
      const utcDate = new Date(Date.UTC(year, month - 1, day, hour, minute, second, ms));
      
      // 4. Calculate the real offset in minutes safely
      const parts = formatter.formatToParts(utcDate);
      const partValues: Record<string, number> = {};
      parts.forEach(p => { if (p.type !== 'literal') partValues[p.type] = Number(p.value); });

      const localizedDate = Date.UTC(
        partValues.year, partValues.month - 1, partValues.day,
        partValues.hour === 24 ? 0 : partValues.hour, // Handle edge cases in midnight representation
        partValues.minute, partValues.second, ms
      );

      const offsetMinutes = Math.round((localizedDate - utcDate.getTime()) / 60000);
      
      // 5. Apply the inverted offset to position the UTC timestamp correctly
      const finalUtcTimestamp = utcDate.getTime() - (offsetMinutes * 60000);
      return new Date(finalUtcTimestamp).toISOString();
    };
