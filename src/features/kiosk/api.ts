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

export async function kioskAuthenticate(
  deviceToken: string,
  userId: string,
  pin: string,
): Promise<{ operationToken: string; user: { id: string; name: string } }> {
  return (
    await apiClient.post('/kiosk/authenticate', { deviceToken, userId, pin })
  ).data;
}

const STORAGE_KEY = 'kioskDeviceToken';
export const kioskToken = {
  get: () => localStorage.getItem(STORAGE_KEY) ?? '',
  set: (t: string) => localStorage.setItem(STORAGE_KEY, t),
  clear: () => localStorage.removeItem(STORAGE_KEY),
};
