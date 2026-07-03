// 利用者の自宅ログイン用・合成メールのドメイン（バックエンドと一致させること）
export const USER_EMAIL_DOMAIN = 'users.fukushi.local';

export function loginIdToEmail(loginId: string): string {
  return `${loginId.trim()}@${USER_EMAIL_DOMAIN}`;
}
