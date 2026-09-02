import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Settings from './Settings';
import { useSettingsStore } from '../settings/settingsStore';
import { useProfilesStore } from '../settings/profilesStore';

const mockSend = vi.fn();

vi.mock('@aws-sdk/client-s3vectors', () => ({
  S3VectorsClient: vi.fn().mockImplementation(() => ({
    send: mockSend,
  })),
  ListVectorBucketsCommand: vi.fn().mockImplementation((input) => ({
    input,
    name: 'ListVectorBucketsCommand',
  })),
}));

describe('Settings page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    useSettingsStore.setState(useSettingsStore.getInitialState());
    useProfilesStore.setState({ profiles: [], activeProfileId: null });
  });

  it('renders all form fields', () => {
    render(<Settings />);

    expect(screen.getByLabelText(/access key id/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/secret access key/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/session token/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/region/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/endpoint/i)).toBeInTheDocument();
    expect(
      screen.getByRole('checkbox', { name: /session-only/i })
    ).toBeInTheDocument();
    // exact-name match avoids the SaveOutlined icon inside 另存为 Profile buttons
    expect(screen.getByRole('button', { name: /^save$/i })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /test connection/i })
    ).toBeInTheDocument();
  });

  it('loads current settings into the form', () => {
    useSettingsStore.getState().saveSettings({
      region: 'us-west-2',
      accessKeyId: 'AKIA',
      secretAccessKey: 'secret',
      sessionToken: 'token',
      endpoint: 'http://localhost:9000',
      sessionOnly: false,
    });

    render(<Settings />);

    expect(screen.getByLabelText(/access key id/i)).toHaveValue('AKIA');
    expect(screen.getByLabelText(/secret access key/i)).toHaveValue('secret');
    expect(screen.getByLabelText(/session token/i)).toHaveValue('token');
    expect(screen.getByLabelText(/region/i)).toHaveValue('us-west-2');
    expect(screen.getByLabelText(/endpoint/i)).toHaveValue(
      'http://localhost:9000'
    );
  });

  it('saves settings when the form is submitted', async () => {
    render(<Settings />);
    const user = userEvent.setup();

    await user.clear(screen.getByLabelText(/access key id/i));
    await user.type(screen.getByLabelText(/access key id/i), 'NEWAKIA');
    await user.clear(screen.getByLabelText(/secret access key/i));
    await user.type(screen.getByLabelText(/secret access key/i), 'NEWSECRET');
    await user.clear(screen.getByLabelText(/region/i));
    await user.type(screen.getByLabelText(/region/i), 'eu-west-1');

    await user.click(screen.getByRole('button', { name: /^save$/i }));

    await waitFor(() => {
      const state = useSettingsStore.getState();
      expect(state.accessKeyId).toBe('NEWAKIA');
      expect(state.secretAccessKey).toBe('NEWSECRET');
      expect(state.region).toBe('eu-west-1');
    });
  });

  it('shows success message with bucket count on connection test', async () => {
    mockSend.mockResolvedValueOnce({
      vectorBuckets: [
        {
          vectorBucketName: 'b1',
          vectorBucketArn: 'arn-1',
          creationTime: new Date(),
        },
        {
          vectorBucketName: 'b2',
          vectorBucketArn: 'arn-2',
          creationTime: new Date(),
        },
      ],
    });

    useSettingsStore.getState().saveSettings({
      region: 'us-east-1',
      accessKeyId: 'AKIA',
      secretAccessKey: 'secret',
      sessionToken: '',
      endpoint: '',
      sessionOnly: false,
    });

    render(<Settings />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /test connection/i }));

    await waitFor(() => {
      expect(screen.getByText(/connection ok/i)).toBeInTheDocument();
      expect(screen.getByText(/2 buckets/i)).toBeInTheDocument();
    });
  });

  it('shows friendly AWS error on connection test failure', async () => {
    const error = new Error('Access denied');
    error.name = 'AccessDeniedException';
    (error as { code?: string }).code = 'AccessDeniedException';
    mockSend.mockRejectedValueOnce(error);

    useSettingsStore.getState().saveSettings({
      region: 'us-east-1',
      accessKeyId: 'AKIA',
      secretAccessKey: 'secret',
      sessionToken: '',
      endpoint: '',
      sessionOnly: false,
    });

    render(<Settings />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /test connection/i }));

    await waitFor(() => {
      expect(screen.getByText(/accessdeniedexception/i)).toBeInTheDocument();
    });
  });
});

describe('Settings page — connection profiles', () => {
  const PROFILE_INPUT = {
    accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
    secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
    sessionToken: '',
    region: 'ap-southeast-1',
    endpoint: '',
    sessionOnly: false,
    relay: true,
  };

  beforeEach(() => {
    localStorage.clear();
    useSettingsStore.setState(useSettingsStore.getInitialState());
    useProfilesStore.setState({ profiles: [], activeProfileId: null });
  });

  it('saves the current form as a named profile and activates it', async () => {
    const user = userEvent.setup();
    render(<Settings />);
    await user.type(
      screen.getByLabelText(/access key id/i),
      PROFILE_INPUT.accessKeyId
    );
    await user.type(
      screen.getByLabelText(/secret access key/i),
      PROFILE_INPUT.secretAccessKey
    );
    await user.clear(screen.getByLabelText(/region/i));
    await user.type(screen.getByLabelText(/region/i), PROFILE_INPUT.region);

    await user.click(
      screen.getByRole('button', { name: /另存当前表单为 profile/i })
    );
    await user.type(screen.getByPlaceholderText(/配置名称/i), 'AWS 主力环境');
    await user.click(screen.getByRole('button', { name: '保 存' }));

    const state = useProfilesStore.getState();
    expect(state.profiles).toHaveLength(1);
    expect(state.profiles[0].name).toBe('AWS 主力环境');
    expect(state.profiles[0].region).toBe('ap-southeast-1');
    expect(state.activeProfileId).toBe(state.profiles[0].id);
    expect(await screen.findByText(/已保存连接配置/)).toBeInTheDocument();
  });

  it('switches the live settings when applying a profile', async () => {
    const store = useProfilesStore.getState();
    store.addProfile({
      name: '内网环境',
      region: 'cn-north-1',
      accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
      secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
      sessionToken: '',
      endpoint: 'http://10.212.24.223:12001',
      relay: true,
      sessionOnly: false,
    });
    useProfilesStore.setState({ activeProfileId: null });
    useSettingsStore.getState().saveSettings({
      ...useSettingsStore.getInitialState(),
      accessKeyId: 'stale-key',
      region: 'us-east-1',
    });

    const user = userEvent.setup();
    render(<Settings />);
    await user.click(screen.getByRole('button', { name: '使 用' }));

    await waitFor(() => {
      const s = useSettingsStore.getState();
      expect(s.endpoint).toBe('http://10.212.24.223:12001');
      expect(s.region).toBe('cn-north-1');
      expect(s.accessKeyId).toBe('AKIAIOSFODNN7EXAMPLE');
    });
    expect(useProfilesStore.getState().activeProfileId).toBeTruthy();
    expect(await screen.findByText(/已切换到连接配置/)).toBeInTheDocument();
  });

  it('mirrors form saves into the active profile', async () => {
    const store = useProfilesStore.getState();
    const p = store.addProfile({
      name: '要同步的',
      region: 'us-east-1',
      accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
      secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
      sessionToken: '',
      endpoint: '',
      relay: true,
      sessionOnly: false,
    });
    useProfilesStore.setState({ activeProfileId: p.id });
    // Seed valid credentials so required-field validation lets the submit through.
    useSettingsStore.getState().saveSettings({
      ...useSettingsStore.getInitialState(),
      accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
      secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
      region: 'us-east-1',
    });

    const user = userEvent.setup();
    render(<Settings />);
    await user.clear(screen.getByLabelText(/region/i));
    await user.type(screen.getByLabelText(/region/i), 'eu-west-1');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      const updated = useProfilesStore
        .getState()
        .profiles.find((x) => x.id === p.id);
      expect(updated?.region).toBe('eu-west-1');
    });
  });

  it('deletes a profile after confirm and clears active state', async () => {
    const store = useProfilesStore.getState();
    const p = store.addProfile({
      name: '可删的',
      region: 'us-east-1',
      accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
      secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
      sessionToken: '',
      endpoint: '',
      relay: true,
      sessionOnly: false,
    });
    useProfilesStore.setState({ activeProfileId: p.id });

    const user = userEvent.setup();
    render(<Settings />);
    await user.click(screen.getByRole('button', { name: 'delete-可删的' }));
    await user.click(await screen.findByRole('button', { name: /删\s*除/ }));

    await waitFor(() => {
      expect(useProfilesStore.getState().profiles).toHaveLength(0);
      expect(useProfilesStore.getState().activeProfileId).toBeNull();
    });
  });
});
