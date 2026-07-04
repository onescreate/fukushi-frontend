import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useUsersFacilityOptions } from '../features/users/api';
import type { FacilityOption } from '../features/staff/api';

interface FacilityContextValue {
  /** 現在ヘッダーで選択中の店舗ID（全ページ共通） */
  facilityId: string;
  setFacilityId: (id: string) => void;
  facilities: FacilityOption[];
}

const FacilityContext = createContext<FacilityContextValue | undefined>(undefined);

const STORAGE_KEY = 'selectedFacilityId';

export function FacilityProvider({ children }: { children: ReactNode }) {
  const { data: facilities } = useUsersFacilityOptions();
  const [facilityId, setId] = useState<string>(
    () => localStorage.getItem(STORAGE_KEY) ?? '',
  );

  const setFacilityId = (id: string) => {
    setId(id);
    localStorage.setItem(STORAGE_KEY, id);
  };

  // 未選択、または選択中IDがアクセス可能店舗に無い場合は先頭を選ぶ
  useEffect(() => {
    if (facilities && facilities.length > 0) {
      if (!facilityId || !facilities.some((f) => f.id === facilityId)) {
        setFacilityId(facilities[0].id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facilities]);

  return (
    <FacilityContext.Provider
      value={{ facilityId, setFacilityId, facilities: facilities ?? [] }}
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
