/**
 * worryAlerts.ts
 * --------------------------------------------------------------------------
 * The ONLY place where something a child said to their space buddy leaves
 * the phone - and only when it is worrying (someone hurting them, unsafe
 * touching, wanting to hurt themselves, danger, a stranger online, a bad
 * secret... see the "safety" list in buddy.json).
 *
 * It goes ONLY to the app's own Friends server, which shows it ONLY to:
 *   - the child's grown-up (parent page + Grown-up corner, and an email
 *     that says "please log in" - without the child's words), and
 *   - the teacher of the child's school group(s) (school page + email).
 * Never to anyone else, and never to an AI company.
 *
 * Only that ONE message is sent (with its kind, e.g. "Someone is hurting
 * them") - not the rest of the chat. Without Friends turned on, nothing is
 * sent: the buddy shows the child a "Show this to a grown-up" card instead.
 */
import type { Worry } from '../models/BuddyBrain';
import { apiRequest } from './api';

export interface WorryResult {
  ok: boolean;
  /** Schools that were told too (their names). */
  schools: string[];
}

export async function sendWorry(token: string | null, worry: Worry): Promise<WorryResult> {
  if (!token) {
    return { ok: false, schools: [] };
  }
  try {
    const answer = await apiRequest<{ told: { parent: boolean; schools: string[] } }>('POST', '/api/buddy/alert', {
      token,
      body: { category: worry.category, text: worry.text.slice(0, 300) },
    });
    return { ok: true, schools: answer.told?.schools ?? [] };
  } catch {
    return { ok: false, schools: [] };
  }
}

/** "your grown-up" or "your grown-up and your teacher" (null = Friends is off). */
export function alertWho(token: string | null, inSchoolGroup: boolean): string | null {
  if (!token) {
    return null;
  }
  return inSchoolGroup ? 'your grown-up and your teacher' : 'your grown-up';
}
