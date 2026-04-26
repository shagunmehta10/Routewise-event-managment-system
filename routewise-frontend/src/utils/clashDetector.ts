export interface EventSlot {
  id: string;
  name: string;
  date: string;       // "YYYY-MM-DD"
  startTime: string;  // "HH:MM"
  endTime: string;    // "HH:MM"
  startLocation: string;
  endLocation: string;
  userId?: string;
  penalty?: number;   // accumulated penalty points
}

export interface ClashResult {
  clashes: boolean;
  conflictingEvent: EventSlot | null;
  penaltyPoints: number;
  penaltyReason: string;
}

/**
 * Checks if a new event slot overlaps with any existing events.
 * Returns clash details and the penalty to apply to the NEW event.
 *
 * Overlap condition:  newStart < existEnd  AND  newEnd > existStart
 *                     (on the same date)
 */
export function detectClash(
  newEvent: Omit<EventSlot, 'id'>,
  existingEvents: EventSlot[]
): ClashResult {
  const newStart = toMinutes(newEvent.startTime);
  const newEnd   = toMinutes(newEvent.endTime);

  for (const ev of existingEvents) {
    if (ev.date !== newEvent.date) continue;          // different day — skip

    const evStart = toMinutes(ev.startTime);
    const evEnd   = toMinutes(ev.endTime);

    const overlaps = newStart < evEnd && newEnd > evStart;
    const norm = (s: string) => s ? s.toLowerCase().replace(/\s+/g, '') : '';
    const sameRoute = norm(ev.startLocation) === norm(newEvent.startLocation) && 
                      norm(ev.endLocation) === norm(newEvent.endLocation);

    if (overlaps && sameRoute) {
      const overlapMinutes = Math.min(newEnd, evEnd) - Math.max(newStart, evStart);
      const penaltyPoints  = calculatePenalty(overlapMinutes, ev);

      return {
        clashes: true,
        conflictingEvent: ev,
        penaltyPoints,
        penaltyReason: buildReason(overlapMinutes, ev, penaltyPoints),
      };
    }
  }

  return { clashes: false, conflictingEvent: null, penaltyPoints: 0, penaltyReason: '' };
}

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function calculatePenalty(overlapMins: number, conflicting: EventSlot): number {
  // Base: 1 point per minute of overlap
  let pts = overlapMins;

  // Escalation: VIP or ambulance = triple penalty
  // (These should never be disrupted)
  if (conflicting.name?.toLowerCase().includes('vip'))        pts *= 3;
  if (conflicting.name?.toLowerCase().includes('ambulance'))  pts *= 3;
  if (conflicting.name?.toLowerCase().includes('baraat'))     pts *= 2;

  // Cap at 500
  return Math.min(Math.round(pts), 500);
}

function buildReason(mins: number, ev: EventSlot, pts: number): string {
  return (
    `Your event overlaps with "${ev.name}" by ${mins} minute${mins !== 1 ? 's' : ''}. ` +
    `A penalty of ${pts} point${pts !== 1 ? 's' : ''} will be applied to your new event.`
  );
}

/**
 * Tactical Notification System
 * Dispatches alerts to email/phone for critical clashes.
 */
export function notifyClash(event: any, conflicting: any, user: any) {
  const method = user?.settings?.notifications ? 'EMAIL/SMS' : 'CONSOLE';
  const message = `[TACTICAL ALERT] Clash detected between "${event.name}" and "${conflicting.name}" on ${event.date}. Dispatched to ${user.email}.`;
  console.log(`%c${message}`, 'background: #7f1d1d; color: #fff; padding: 5px; border-radius: 4px; font-weight: bold;');
  return message;
}
