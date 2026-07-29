import { apiClient } from '../../lib/apiClient';

export interface KioskUser {
  id: string;
  loginId: string;
  name: string;
}

export async function fetchKioskUsers(
  deviceToken: string,
): Promise<{ users: KioskUser[] }> {
  return (await apiClient.post('/kiosk/users', { deviceToken })).data;
}

export interface TodayStatus {
  clockedIn: boolean;
  clockedOut: boolean;
}

export async function kioskAuthenticate(
  deviceToken: string,
  userId: string,
  pin: string,
): Promise<{
  operationToken: string;
  user: { id: string; name: string };
  attendance: TodayStatus;
}> {
  return (
    await apiClient.post('/kiosk/authenticate', { deviceToken, userId, pin })
  ).data;
}

export interface ClockResult {
  user: { id: string; name: string };
  type: 'in' | 'out';
  time: string;
  isLate?: boolean;
  isEarlyLeave?: boolean;
  alreadyDone?: boolean;
}

export async function kioskClock(
  operationToken: string,
  type: 'in' | 'out',
): Promise<ClockResult> {
  return (await apiClient.post('/kiosk/clock', { operationToken, type })).data;
}

export type ReasonKind = 'absence' | 'late' | 'early';

export interface KioskVisitBreak {
  plannedOut: string | null;
  plannedIn: string | null;
}

/** 次回の通所予定（退所打刻時に表示） */
export interface KioskNextVisit {
  date: string; // YYYY-MM-DD
  planIn: string | null;
  planOut: string | null;
  breaks: KioskVisitBreak[];
  practicePlace: string | null;
  mealReserved: boolean;
}

export interface KioskBoard {
  today: {
    planIn: string | null;
    planOut: string | null;
    status: 'pending' | 'approved' | 'rejected' | null;
    breaks: KioskVisitBreak[];
    meal: { status: string } | null;
  };
  nextVisit: KioskNextVisit | null;
  alerts: {
    rejected: { date: string }[];
    reasonNeeded: { date: string; kind: ReasonKind }[];
  };
  /** 当月の体重が未入力なら true（打刻画面で入力を促す） */
  needsHealthInput?: boolean;
}

export async function kioskBoard(operationToken: string): Promise<KioskBoard> {
  return (await apiClient.post('/kiosk/board', { operationToken })).data;
}

export async function kioskHealth(
  operationToken: string,
  weightKg: number,
): Promise<{ ok: boolean }> {
  return (await apiClient.post('/kiosk/health', { operationToken, weightKg }))
    .data;
}

export async function kioskMeal(
  operationToken: string,
  eaten: boolean,
): Promise<{ status: 'reserved' | 'eaten' }> {
  return (await apiClient.post('/kiosk/meal', { operationToken, eaten })).data;
}

export async function kioskSubmitReason(
  operationToken: string,
  date: string,
  kind: ReasonKind,
  reason: string,
): Promise<{ ok: boolean }> {
  return (
    await apiClient.post('/kiosk/reason', { operationToken, date, kind, reason })
  ).data;
}

const STORAGE_KEY = 'kioskDeviceToken';
export const kioskToken = {
  get: () => localStorage.getItem(STORAGE_KEY) ?? '',
  set: (t: string) => localStorage.setItem(STORAGE_KEY, t),
  clear: () => localStorage.removeItem(STORAGE_KEY),
};
