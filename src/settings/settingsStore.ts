import { create } from 'zustand';
import {
  persist,
  createJSONStorage,
  type StateStorage,
} from 'zustand/middleware';

export interface SettingsState {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
  endpoint: string;
  sessionOnly: boolean;
}

export interface SettingsActions {
  saveSettings: (settings: SettingsState) => void;
  clearCredentials: () => void;
}

export type SettingsStore = SettingsState & SettingsActions;

export const initialSettings: SettingsState = {
  region: 'us-east-1',
  accessKeyId: '',
  secretAccessKey: '',
  sessionToken: '',
  endpoint: '',
  sessionOnly: false,
};

const STORAGE_KEY = 's3vector-settings';

function createDynamicStorage(getSessionOnly: () => boolean): StateStorage {
  return {
    getItem: (name) => {
      const sessionValue = sessionStorage.getItem(name);
      if (sessionValue) return sessionValue;
      const localValue = localStorage.getItem(name);
      if (localValue) return localValue;
      return null;
    },
    setItem: (name, value) =>
      (getSessionOnly() ? sessionStorage : localStorage).setItem(name, value),
    removeItem: (name) => {
      sessionStorage.removeItem(name);
      localStorage.removeItem(name);
    },
  };
}

export function createSettingsStore() {
  return create<SettingsStore>()(
    persist(
      (set) => ({
        ...initialSettings,
        saveSettings: (settings) => set(() => ({ ...settings })),
        clearCredentials: () =>
          set((state) => ({
            ...state,
            accessKeyId: '',
            secretAccessKey: '',
            sessionToken: '',
          })),
      }),
      {
        name: STORAGE_KEY,
        storage: createJSONStorage(() => {
          let sessionOnly = false;
          const dynamic = createDynamicStorage(() => sessionOnly);
          return {
            getItem: (name: string) => {
              const raw = dynamic.getItem(name);
              if (typeof raw === 'string') {
                try {
                  const parsed = JSON.parse(raw);
                  sessionOnly = parsed?.state?.sessionOnly ?? false;
                } catch {
                  // ignore malformed storage
                }
                return raw;
              }
              return null;
            },
            setItem: (name: string, value: string) => {
              try {
                const parsed = JSON.parse(value);
                sessionOnly = parsed?.state?.sessionOnly ?? false;
              } catch {
                // ignore malformed value
              }
              dynamic.setItem(name, value);
            },
            removeItem: (name: string) => dynamic.removeItem(name),
          };
        }),
      }
    )
  );
}

export const useSettingsStore = createSettingsStore();
