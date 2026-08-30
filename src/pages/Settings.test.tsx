import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Settings from './Settings';
import { useSettingsStore } from '../settings/settingsStore';

const mockListVectorBuckets = vi.fn();
const mockGetClient = vi.fn();

vi.mock('../api/S3VectorsClientFactory', () => ({
  S3VectorsClientFactory: vi.fn().mockImplementation(() => ({
    getClient: mockGetClient,
    listVectorBuckets: mockListVectorBuckets,
  })),
}));

describe('Settings page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    useSettingsStore.setState(useSettingsStore.getInitialState());
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
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
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

    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      const state = useSettingsStore.getState();
      expect(state.accessKeyId).toBe('NEWAKIA');
      expect(state.secretAccessKey).toBe('NEWSECRET');
      expect(state.region).toBe('eu-west-1');
    });
  });

  it('shows success message with bucket count on connection test', async () => {
    mockListVectorBuckets.mockResolvedValueOnce({
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
    mockListVectorBuckets.mockRejectedValueOnce(error);

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
