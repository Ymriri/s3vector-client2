import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  initialSettings,
  useSettingsStore,
  type SettingsState,
} from './settingsStore';

/** One saved connection, Attu-style: a named, reusable snapshot of Settings. */
export interface ConnectionProfile {
  id: string;
  name: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
  endpoint: string;
  relay?: boolean;
  sessionOnly?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface ProfilesState {
  profiles: ConnectionProfile[];
  activeProfileId: string | null;
  addProfile: (
    profile: Omit<ConnectionProfile, 'id' | 'createdAt' | 'updatedAt'> & {
      id?: string;
    }
  ) => ConnectionProfile;
  updateProfile: (
    id: string,
    patch: Partial<Omit<ConnectionProfile, 'id' | 'createdAt'>>
  ) => void;
  removeProfile: (id: string) => void;
  setActiveProfile: (id: string | null) => void;
  /** Copies the given profile's connection fields into the live settings store. */
  applyProfile: (id: string) => boolean;
  /** Syncs current live settings into the active profile (if any). */
  syncActiveFromSettings: () => void;
}

export function profileFieldsToSettings(
  profile: ConnectionProfile
): SettingsState {
  return {
    region: profile.region,
    accessKeyId: profile.accessKeyId,
    secretAccessKey: profile.secretAccessKey,
    sessionToken: profile.sessionToken,
    endpoint: profile.endpoint,
    sessionOnly: profile.sessionOnly ?? false,
    relay: profile.relay ?? true,
  };
}

function makeId(): string {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID();
  }
  return `p-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * One-time migration: if legacy settings hold credentials but no profile was
 * ever saved, import them as the "默认配置" profile and mark it active.
 */
export function migrateLegacySettings(
  profiles: ConnectionProfile[],
  activeProfileId: string | null
): { profiles: ConnectionProfile[]; activeProfileId: string | null } {
  if (profiles.length > 0) {
    return { profiles, activeProfileId };
  }
  const legacy = useSettingsStore.getState();
  const hasLegacyCreds =
    legacy.accessKeyId.trim() !== '' || legacy.endpoint.trim() !== '';
  if (!hasLegacyCreds) {
    return { profiles, activeProfileId };
  }
  const now = Date.now();
  const imported: ConnectionProfile = {
    id: makeId(),
    name: '默认配置',
    region: legacy.region,
    accessKeyId: legacy.accessKeyId,
    secretAccessKey: legacy.secretAccessKey,
    sessionToken: legacy.sessionToken,
    endpoint: legacy.endpoint,
    relay: legacy.relay ?? true,
    sessionOnly: legacy.sessionOnly,
    createdAt: now,
    updatedAt: now,
  };
  return { profiles: [imported], activeProfileId: imported.id };
}

const STORAGE_KEY = 's3vector-connection-profiles';

export function createProfilesStore() {
  return create<ProfilesState>()(
    persist(
      (set, get) => ({
        profiles: [],
        activeProfileId: null,

        addProfile: (input) => {
          const now = Date.now();
          const profile: ConnectionProfile = {
            id: input.id ?? makeId(),
            name: input.name,
            region: input.region,
            accessKeyId: input.accessKeyId,
            secretAccessKey: input.secretAccessKey,
            sessionToken: input.sessionToken ?? '',
            endpoint: input.endpoint,
            relay: input.relay ?? true,
            sessionOnly: input.sessionOnly ?? false,
            createdAt: now,
            updatedAt: now,
          };
          set((state) => {
            const isFirst = state.profiles.length === 0;
            return {
              profiles: [...state.profiles, profile],
              activeProfileId: isFirst ? profile.id : state.activeProfileId,
            };
          });
          return profile;
        },

        updateProfile: (id, patch) => {
          set((state) => ({
            profiles: state.profiles.map((p) =>
              p.id === id ? { ...p, ...patch, updatedAt: Date.now() } : p
            ),
          }));
        },

        removeProfile: (id) => {
          set((state) => {
            const profiles = state.profiles.filter((p) => p.id !== id);
            const activeProfileId =
              state.activeProfileId === id ? null : state.activeProfileId;
            return { profiles, activeProfileId };
          });
        },

        setActiveProfile: (id) => set({ activeProfileId: id }),

        applyProfile: (id) => {
          const profile = get().profiles.find((p) => p.id === id);
          if (!profile) return false;
          useSettingsStore
            .getState()
            .saveSettings(profileFieldsToSettings(profile));
          set({ activeProfileId: id });
          return true;
        },

        syncActiveFromSettings: () => {
          const { activeProfileId } = get();
          if (!activeProfileId) return;
          const s = useSettingsStore.getState();
          get().updateProfile(activeProfileId, {
            name:
              s.accessKeyId || s.endpoint
                ? (get().profiles.find((p) => p.id === activeProfileId)?.name ??
                  '未命名')
                : '未命名',
            region: s.region,
            accessKeyId: s.accessKeyId,
            secretAccessKey: s.secretAccessKey,
            sessionToken: s.sessionToken,
            endpoint: s.endpoint,
            relay: s.relay ?? true,
            sessionOnly: s.sessionOnly,
          });
        },
      }),
      {
        name: STORAGE_KEY,
        storage: createJSONStorage(() => localStorage),
        merge: (persisted, current) => {
          const merged = {
            ...current,
            ...(persisted as object),
          } as ProfilesState;
          const migrated = migrateLegacySettings(
            merged.profiles ?? [],
            merged.activeProfileId ?? null
          );
          return { ...merged, ...migrated };
        },
      }
    )
  );
}

export const useProfilesStore = createProfilesStore();

export { initialSettings };
