import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useUsersFacilityOptions } from '../features/users/api';
import type { FacilityOption } from '../features/staff/api';

interface FacilityContextValue {
  facilities: FacilityOption[];
  /** 選択中の店舗ID配列（部分選択可）。 */
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
  /** 全店舗が選択されているか */
  isAll: boolean;
  /** 表示対象が複数店舗か（店舗名列の表示などに使う） */
  isMulti: boolean;
  /** 単一店舗のときそのID、そうでなければ null（店舗別設定ページ用） */
  singleFacilityId: string | null;
  /** API に渡す値：'all' か "id1,id2" のカンマ区切り */
  facilityParam: string;
  // ---- 後方互換（既存コンポーネントはこれを API に渡している） ----
  facilityId: string;
  setFacilityId: (id: string) => void;
}

const FacilityContext = createContext<FacilityContextValue | undefined>(undefined);

const STORAGE_KEY = 'selectedFacilityIds';
const LEGACY_KEY = 'selectedFacilityId';
/** 全店舗を表すセンチネル値。 */
export const ALL_FACILITIES = 'all';

function loadInitial(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return arr.filter((x) => typeof x === 'string');
    }
  } catch {
    /* noop */
  }
  // 旧・単一選択からの移行
  const legacy = localStorage.getItem(LEGACY_KEY);
  if (legacy && legacy !== ALL_FACILITIES) return [legacy];
  return []; // 空 = 全店舗（facilities 読込後に確定）
}

export function FacilityProvider({ children }: { children: ReactNode }) {
  const { data } = useUsersFacilityOptions();
  const facilities = useMemo(() => data ?? [], [data]);
  const [selectedIds, setSel] = useState<string[]>(loadInitial);

  const setSelectedIds = (ids: string[]) => {
    setSel(ids);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  };

  // facilities 読込後、選択を検証。無効・空なら全店舗を既定に。
  useEffect(() => {
    if (facilities.length === 0) return;
    const valid = selectedIds.filter((id) => facilities.some((f) => f.id === id));
    if (valid.length === 0) {
      setSelectedIds(facilities.map((f) => f.id));
    } else if (valid.length !== selectedIds.length) {
      setSelectedIds(valid);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facilities]);

  const allIds = facilities.map((f) => f.id);
  const isAll = facilities.length > 0 && selectedIds.length === facilities.length;
  const resolvedCount = isAll ? facilities.length : selectedIds.length;
  const isMulti = resolvedCount > 1;
  const singleFacilityId =
    !isAll && selectedIds.length === 1 ? selectedIds[0] : null;
  const facilityParam =
    isAll || selectedIds.length === 0 ? ALL_FACILITIES : selectedIds.join(',');

  const setFacilityId = (id: string) => {
    if (!id || id === ALL_FACILITIES) setSelectedIds(allIds);
    else setSelectedIds([id]);
  };

  return (
    <FacilityContext.Provider
      value={{
        facilities,
        selectedIds,
        setSelectedIds,
        isAll,
        isMulti,
        singleFacilityId,
        facilityParam,
        facilityId: facilityParam,
        setFacilityId,
      }}
    >
      {children}
    </FacilityContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useFacility() {
  const ctx = useContext(FacilityContext);
  if (!ctx) throw new Error('useFacility は FacilityProvider の内側で使ってください');
  return ctx;
}
