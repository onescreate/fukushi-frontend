import { AxiosError } from 'axios';

/** APIエラーから、表示用のメッセージを取り出す。 */
export function getApiErrorMessage(
  error: unknown,
  fallback = 'エラーが発生しました',
): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as { message?: string | string[] } | undefined;
    const msg = data?.message;
    if (Array.isArray(msg)) return msg.join(' / ');
    if (typeof msg === 'string') return msg;
  }
  return fallback;
}
