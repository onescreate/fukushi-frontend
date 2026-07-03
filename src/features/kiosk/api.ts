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

export interface KioskBoard {
  today: {
    planIn: string | null;
    planOut: string | null;
    status: 'pending' | 'approved' | 'rejected' | null;
    breaks: { plannedOut: string | null; plannedIn: string | null }[];
    meal: { status: string } | null;
  };
  alerts: {
    rejected: { date: string }[];
    reasonNeeded: { date: string; kind: ReasonKind }[];
  };
}

export async function kioskBoard(operationToken: string): Promise<KioskBoard> {
  return (await apiClient.post('/kiosk/board', { operationToken })).data;
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
