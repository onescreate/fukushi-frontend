import { apiClient } from './apiClient';

export interface PostalResult {
  postalCode: string;
  prefecture: string;
  city: string;
  town: string;
}

/** 郵便番号（ハイフン可）から住所を引く。 */
export async function lookupPostal(code: string): Promise<PostalResult> {
  const z = code.replace(/[^0-9]/g, '');
  return (await apiClient.get<PostalResult>(`/postal/${z}`)).data;
}
