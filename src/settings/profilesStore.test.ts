import { describe, it, expect, beforeEach } from 'vitest';
import {
  profileFieldsToSettings,
  migrateLegacySettings,
  useProfilesStore,
  type ConnectionProfile,
} from './profilesStore';
import { useSettingsStore } from './settingsStore';

const BASE: Omit<ConnectionProfile, 'id' | 'createdAt' | 'updatedAt'> = {
  name: 'AWS ap-southeast-1',
  region: 'ap-southeast-1',
  accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
  secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
  sessionToken: '',
  endpoint: '',
  relay: true,
  sessionOnly: false,
};

describe('profilesStore', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    useSettingsStore.setState(useSettingsStore.getInitialState());
    useProfilesStore.setState({
      profiles: [],
      activeProfileId: null,
    });
  });

  it('adds a profile and auto-activates the first one', () => {
    const store = useProfilesStore.getState();
    const p = store.addProfile({ ...BASE });
    const state = useProfilesStore.getState();
    expect(state.profiles).toHaveLength(1);
    expect(state.activeProfileId).toBe(p.id);
    expect(p.name).toBe('AWS ap-southeast-1');
  });

  it('does not switch active when adding a second profile', () => {
    const first = useProfilesStore.getState().addProfile({ ...BASE });
    useProfilesStore.getState().addProfile({ ...BASE, name: '内网环境' });
    const state = useProfilesStore.getState();
    expect(state.profiles).toHaveLength(2);
    expect(state.activeProfileId).toBe(first.id);
  });

  it('updates only the targeted profile', () => {
    const a = useProfilesStore.getState().addProfile({ ...BASE });
    const b = useProfilesStore.getState().addProfile({
      ...BASE,
      name: '内网环境',
      endpoint: 'http://10.212.24.223:12001',
    });
    useProfilesStore.getState().updateProfile(b.id, { name: '内网 V2' });
    const state = useProfilesStore.getState();
    expect(state.profiles.find((p) => p.id === b.id)?.name).toBe('内网 V2');
    expect(state.profiles.find((p) => p.id === a.id)?.name).toBe(
      'AWS ap-southeast-1'
    );
  });

  it('removeProfile clears activeProfileId when removing the active one', () => {
    const p = useProfilesStore.getState().addProfile({ ...BASE });
    useProfilesStore.getState().removeProfile(p.id);
    const state = useProfilesStore.getState();
    expect(state.profiles).toHaveLength(0);
    expect(state.activeProfileId).toBeNull();
  });

  it('applyProfile copies fields into the live settings store', () => {
    useSettingsStore.setState(useSettingsStore.getInitialState());
    const p = useProfilesStore.getState().addProfile({
      ...BASE,
      name: '内网环境',
      endpoint: 'http://10.212.24.223:12001',
      relay: true,
    });
    // Dirty the live settings first.
    useSettingsStore.getState().saveSettings({
      ...useSettingsStore.getInitialState(),
      accessKeyId: 'stale',
    });
    const ok = useProfilesStore.getState().applyProfile(p.id);
    expect(ok).toBe(true);
    const s = useSettingsStore.getState();
    expect(s.accessKeyId).toBe(BASE.accessKeyId);
    expect(s.endpoint).toBe('http://10.212.24.223:12001');
    expect(s.region).toBe('ap-southeast-1');
    expect(useProfilesStore.getState().activeProfileId).toBe(p.id);
  });

  it('applyProfile returns false for unknown id', () => {
    expect(useProfilesStore.getState().applyProfile('nope')).toBe(false);
  });

  it('syncActiveFromSettings mirrors live settings into the active profile', () => {
    const p = useProfilesStore.getState().addProfile({ ...BASE });
    useSettingsStore.getState().saveSettings({
      ...useSettingsStore.getInitialState(),
      accessKeyId: 'AKIAIOSFODNN7UPDATED',
      endpoint: 'https://s3vectors.ap-southeast-1.api.aws',
      region: 'ap-southeast-1',
    });
    useProfilesStore.getState().syncActiveFromSettings();
    const updated = useProfilesStore
      .getState()
      .profiles.find((x) => x.id === p.id);
    expect(updated?.accessKeyId).toBe('AKIAIOSFODNN7UPDATED');
    expect(updated?.endpoint).toBe('https://s3vectors.ap-southeast-1.api.aws');
  });

  it('syncActiveFromSettings is a no-op without an active profile', () => {
    useProfilesStore.setState({ profiles: [], activeProfileId: null });
    expect(() =>
      useProfilesStore.getState().syncActiveFromSettings()
    ).not.toThrow();
  });

  it('migrateLegacySettings imports legacy credentials as 默认配置', () => {
    useSettingsStore.setState({
      ...useSettingsStore.getInitialState(),
      accessKeyId: 'AKIALEGACYSOURCE123',
      secretAccessKey: 'legacysecret',
      region: 'us-east-1',
    });
    const result = migrateLegacySettings([], null);
    expect(result.profiles).toHaveLength(1);
    expect(result.profiles[0].name).toBe('默认配置');
    expect(result.profiles[0].accessKeyId).toBe('AKIALEGACYSOURCE123');
    expect(result.activeProfileId).toBe(result.profiles[0].id);
  });

  it('migrateLegacySettings does nothing when profiles already exist', () => {
    const existing = [
      {
        ...BASE,
        id: 'x',
        createdAt: 1,
        updatedAt: 1,
      } as ConnectionProfile,
    ];
    const result = migrateLegacySettings(existing, 'x');
    expect(result.profiles).toBe(existing);
    expect(result.activeProfileId).toBe('x');
  });

  it('migrateLegacySettings ignores empty legacy credentials', () => {
    useSettingsStore.setState(useSettingsStore.getInitialState());
    const result = migrateLegacySettings([], null);
    expect(result.profiles).toHaveLength(0);
    expect(result.activeProfileId).toBeNull();
  });

  it('profileFieldsToSettings maps all connection fields', () => {
    const p: ConnectionProfile = {
      ...BASE,
      id: '1',
      createdAt: 0,
      updatedAt: 0,
      sessionOnly: true,
      relay: false,
    };
    const s = profileFieldsToSettings(p);
    expect(s).toEqual({
      region: 'ap-southeast-1',
      accessKeyId: BASE.accessKeyId,
      secretAccessKey: BASE.secretAccessKey,
      sessionToken: '',
      endpoint: '',
      sessionOnly: true,
      relay: false,
    });
  });

  it('persists profiles to localStorage', () => {
    useProfilesStore.getState().addProfile({ ...BASE });
    const raw = localStorage.getItem('s3vector-connection-profiles');
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw as string);
    expect(parsed.state.profiles).toHaveLength(1);
  });
});
