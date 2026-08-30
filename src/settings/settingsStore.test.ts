import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createSettingsStore, initialSettings } from './settingsStore';

describe('settingsStore', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('has empty defaults', () => {
    const store = createSettingsStore();
    const state = store.getState();
    expect(state.region).toBe(initialSettings.region);
    expect(state.accessKeyId).toBe('');
    expect(state.secretAccessKey).toBe('');
    expect(state.sessionToken).toBe('');
    expect(state.endpoint).toBe('');
    expect(state.sessionOnly).toBe(false);
  });

  it('saves settings to localStorage by default', () => {
    const store = createSettingsStore();
    store.getState().saveSettings({
      region: 'us-west-2',
      accessKeyId: 'AKIA',
      secretAccessKey: 'secret',
      sessionToken: 'token',
      endpoint: 'http://localhost:9000',
      sessionOnly: false,
    });

    const state = store.getState();
    expect(state.region).toBe('us-west-2');
    expect(state.accessKeyId).toBe('AKIA');
    expect(state.secretAccessKey).toBe('secret');
    expect(state.sessionToken).toBe('token');
    expect(state.endpoint).toBe('http://localhost:9000');

    const raw = localStorage.getItem('s3vector-settings');
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.state.region).toBe('us-west-2');
    expect(parsed.state.accessKeyId).toBe('AKIA');
  });

  it('saves settings to sessionStorage when session-only is enabled', () => {
    const store = createSettingsStore();
    store.getState().saveSettings({
      region: 'eu-central-1',
      accessKeyId: 'AKIA2',
      secretAccessKey: 'secret2',
      sessionToken: '',
      endpoint: '',
      sessionOnly: true,
    });

    expect(sessionStorage.getItem('s3vector-settings')).not.toBeNull();
    expect(localStorage.getItem('s3vector-settings')).toBeNull();

    const raw = sessionStorage.getItem('s3vector-settings');
    const parsed = JSON.parse(raw!);
    expect(parsed.state.accessKeyId).toBe('AKIA2');
  });

  it('clears credentials but keeps non-credential fields', () => {
    const store = createSettingsStore();
    store.getState().saveSettings({
      region: 'ap-south-1',
      accessKeyId: 'AKIA',
      secretAccessKey: 'secret',
      sessionToken: 'token',
      endpoint: 'http://localhost',
      sessionOnly: false,
    });

    store.getState().clearCredentials();

    const state = store.getState();
    expect(state.accessKeyId).toBe('');
    expect(state.secretAccessKey).toBe('');
    expect(state.sessionToken).toBe('');
    expect(state.region).toBe('ap-south-1');
    expect(state.endpoint).toBe('http://localhost');

    const raw = localStorage.getItem('s3vector-settings');
    const parsed = JSON.parse(raw!);
    expect(parsed.state.accessKeyId).toBe('');
    expect(parsed.state.secretAccessKey).toBe('');
    expect(parsed.state.sessionToken).toBe('');
    expect(parsed.state.region).toBe('ap-south-1');
  });

  it('rehydrates from localStorage on init', () => {
    const persisted = {
      state: {
        region: 'ca-central-1',
        accessKeyId: 'REHYD',
        secretAccessKey: 're-secret',
        sessionToken: '',
        endpoint: '',
        sessionOnly: false,
      },
      version: 0,
    };
    localStorage.setItem('s3vector-settings', JSON.stringify(persisted));

    const store = createSettingsStore();
    const state = store.getState();
    expect(state.region).toBe('ca-central-1');
    expect(state.accessKeyId).toBe('REHYD');
  });

  it('rehydrates from sessionStorage when stored session-only', () => {
    const persisted = {
      state: {
        region: 'sa-east-1',
        accessKeyId: 'SESS',
        secretAccessKey: 'sess-secret',
        sessionToken: '',
        endpoint: '',
        sessionOnly: true,
      },
      version: 0,
    };
    sessionStorage.setItem('s3vector-settings', JSON.stringify(persisted));

    const store = createSettingsStore();
    const state = store.getState();
    expect(state.region).toBe('sa-east-1');
    expect(state.accessKeyId).toBe('SESS');
  });
});
