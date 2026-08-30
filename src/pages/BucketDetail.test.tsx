import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import BucketDetail, { BucketDetailView } from './BucketDetail';
import { BucketService } from '../api/buckets';
import { IndexService } from '../api/indexes';
import { useSettingsStore } from '../settings/settingsStore';

const mockSend = vi.fn();

vi.mock('@aws-sdk/client-s3vectors', () => ({
  S3VectorsClient: vi.fn().mockImplementation(() => ({
    send: mockSend,
  })),
  GetVectorBucketCommand: vi.fn().mockImplementation((input) => ({
    input,
    name: 'GetVectorBucketCommand',
  })),
  GetVectorBucketPolicyCommand: vi.fn().mockImplementation((input) => ({
    input,
    name: 'GetVectorBucketPolicyCommand',
  })),
  PutVectorBucketPolicyCommand: vi.fn().mockImplementation((input) => ({
    input,
    name: 'PutVectorBucketPolicyCommand',
  })),
  DeleteVectorBucketPolicyCommand: vi.fn().mockImplementation((input) => ({
    input,
    name: 'DeleteVectorBucketPolicyCommand',
  })),
}));

function createMockBucketService(): BucketService {
  return {
    getVectorBucket: vi.fn(),
    getVectorBucketPolicy: vi.fn(),
    putVectorBucketPolicy: vi.fn(),
    deleteVectorBucketPolicy: vi.fn(),
  } as unknown as BucketService;
}

const existingPolicy = JSON.stringify({ Version: '2012-10-17' });

function mockOverview(
  service: BucketService,
  overrides?: { reject?: unknown }
) {
  const fn = service.getVectorBucket as ReturnType<typeof vi.fn>;
  if (overrides?.reject) {
    fn.mockRejectedValue(overrides.reject);
  } else {
    fn.mockResolvedValue({
      vectorBucket: {
        vectorBucketName: 'my-bucket',
        vectorBucketArn: 'arn:aws:s3vectors:::vector-bucket/my-bucket',
        creationTime: new Date('2024-06-01T12:00:00Z'),
      },
    });
  }
}

function mockPolicy(
  service: BucketService,
  policy: string | undefined,
  reject?: unknown
) {
  const fn = service.getVectorBucketPolicy as ReturnType<typeof vi.fn>;
  if (reject) {
    fn.mockRejectedValue(reject);
  } else {
    fn.mockResolvedValue({ policy });
  }
}

function renderView(service: BucketService, bucketName = 'my-bucket') {
  return render(
    <MemoryRouter>
      <BucketDetailView bucketService={service} bucketName={bucketName} />
    </MemoryRouter>
  );
}

function createMockIndexService(): IndexService {
  return {
    listIndexes: vi.fn(),
    createIndex: vi.fn(),
    deleteIndex: vi.fn(),
    getIndex: vi.fn(),
  } as unknown as IndexService;
}

function renderIndexes(
  bucketService: BucketService,
  indexService: IndexService
) {
  return render(
    <MemoryRouter>
      <BucketDetailView
        bucketService={bucketService}
        bucketName="my-bucket"
        indexService={indexService}
      />
    </MemoryRouter>
  );
}

function renderWithRouter(ui: React.ReactElement) {
  function LocationProbe() {
    const location = useLocation();
    return <div data-testid="location-probe">{location.pathname}</div>;
  }
  return render(
    <MemoryRouter>
      <>
        {ui}
        <LocationProbe />
      </>
    </MemoryRouter>
  );
}

async function openPolicyTab(user: ReturnType<typeof userEvent.setup>) {
  // BucketDetailView renders the loading placeholder until the mocked service
  // promise resolves; wait for the tabs to mount before switching.
  await screen.findByRole('tab', { name: /indexes/i });
  await user.click(screen.getByRole('tab', { name: /policy/i }));
}

describe('BucketDetail page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    useSettingsStore.setState(useSettingsStore.getInitialState());
  });

  it('renders the overview from GetVectorBucket', async () => {
    const service = createMockBucketService();
    mockOverview(service);
    mockPolicy(service, existingPolicy);

    renderView(service);

    expect(
      screen.getByRole('heading', { name: /my-bucket/i })
    ).toBeInTheDocument();
    expect(screen.getByText('Vector Buckets')).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByText('arn:aws:s3vectors:::vector-bucket/my-bucket')
      ).toBeInTheDocument();
    });
    expect(
      screen.getByText(
        `Created ${new Date('2024-06-01T12:00:00Z').toLocaleString()}`
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(/no indexes in this bucket yet/i)
    ).toBeInTheDocument();
  });

  it('shows a loading state while fetching the bucket', async () => {
    const service = createMockBucketService();
    (service.getVectorBucket as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise(() => undefined)
    );
    mockPolicy(service, undefined);

    renderView(service);

    expect(screen.getByTestId('bucket-detail-loading')).toBeInTheDocument();
    expect(
      screen.queryByRole('tab', { name: /indexes/i })
    ).not.toBeInTheDocument();
  });

  it('shows an error banner when GetVectorBucket fails', async () => {
    const service = createMockBucketService();
    const error = new Error('Access denied');
    error.name = 'AccessDeniedException';
    mockOverview(service, { reject: error });
    mockPolicy(service, undefined);

    renderView(service);

    await waitFor(() => {
      expect(screen.getByText(/accessdeniedexception/i)).toBeInTheDocument();
    });
    const indexesTab = await waitFor(() =>
      screen.getByRole('tab', { name: /indexes/i })
    );
    expect(indexesTab.closest('.ant-tabs-tab')).toHaveClass(
      'ant-tabs-tab-disabled'
    );
  });

  it('renders the current policy in the viewer', async () => {
    const service = createMockBucketService();
    mockOverview(service);
    mockPolicy(service, existingPolicy);

    renderView(service);
    const user = userEvent.setup();
    await openPolicyTab(user);

    const viewer = await screen.findByTestId('policy-viewer');
    expect(viewer).toHaveTextContent('"Version": "2012-10-17"');
    expect(screen.getByDisplayValue(/2012-10-17/)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /delete policy/i })
    ).toBeEnabled();
  });

  it('shows the empty policy state and disables delete', async () => {
    const service = createMockBucketService();
    mockOverview(service);
    mockPolicy(service, undefined);

    renderView(service);
    const user = userEvent.setup();
    await openPolicyTab(user);

    await waitFor(() => {
      expect(
        screen.getByText(/no policy attached to this bucket/i)
      ).toBeInTheDocument();
    });
    expect(
      screen.getByRole('button', { name: /delete policy/i })
    ).toBeDisabled();
  });

  it('saves a new policy and reloads it', async () => {
    const service = createMockBucketService();
    mockOverview(service);
    (service.getVectorBucketPolicy as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ policy: undefined })
      .mockResolvedValueOnce({ policy: '{"Version":"2012-10-17"}' });
    (
      service.putVectorBucketPolicy as ReturnType<typeof vi.fn>
    ).mockResolvedValue({});

    renderView(service);
    const user = userEvent.setup();
    await openPolicyTab(user);

    await waitFor(() => {
      expect(
        screen.getByText(/no policy attached to this bucket/i)
      ).toBeInTheDocument();
    });

    const editor = screen.getByTestId('policy-editor');
    fireEvent.change(editor, { target: { value: '{"Version":"2012-10-17"}' } });
    await user.click(screen.getByRole('button', { name: /save policy/i }));

    await waitFor(() => {
      expect(service.putVectorBucketPolicy).toHaveBeenCalledWith(
        'my-bucket',
        '{"Version":"2012-10-17"}'
      );
    });
    await waitFor(() => {
      expect(screen.getByTestId('policy-viewer')).toHaveTextContent(
        '"Version": "2012-10-17"'
      );
    });
  });

  it('rejects invalid JSON without calling the API', async () => {
    const service = createMockBucketService();
    mockOverview(service);
    mockPolicy(service, undefined);

    renderView(service);
    const user = userEvent.setup();
    await openPolicyTab(user);

    await user.type(await screen.findByTestId('policy-editor'), 'not-json');
    await user.click(screen.getByRole('button', { name: /save policy/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalidjson/i)).toBeInTheDocument();
    });
    expect(service.putVectorBucketPolicy).not.toHaveBeenCalled();
  });

  it('asks to overwrite when a policy already exists', async () => {
    const service = createMockBucketService();
    mockOverview(service);
    mockPolicy(service, existingPolicy);
    (
      service.putVectorBucketPolicy as ReturnType<typeof vi.fn>
    ).mockResolvedValue({});

    renderView(service);
    const user = userEvent.setup();
    await openPolicyTab(user);

    const editor = await screen.findByTestId('policy-editor');
    await user.clear(editor);
    fireEvent.change(editor, { target: { value: '{"Version":"2023-01-01"}' } });
    await user.click(screen.getByRole('button', { name: /save policy/i }));

    const dialog = await screen.findByRole('dialog', { name: /overwrite/i });
    expect(within(dialog).getByText(/my-bucket/i)).toBeInTheDocument();
    expect(service.putVectorBucketPolicy).not.toHaveBeenCalled();

    await user.click(
      within(dialog).getByRole('button', { name: /overwrite policy/i })
    );

    await waitFor(() => {
      expect(service.putVectorBucketPolicy).toHaveBeenCalledWith(
        'my-bucket',
        '{"Version":"2023-01-01"}'
      );
    });
  });

  it('shows save errors from the API in the editor', async () => {
    const service = createMockBucketService();
    mockOverview(service);
    mockPolicy(service, undefined);
    const error = new Error('Validation failed');
    error.name = 'ValidationException';
    (
      service.putVectorBucketPolicy as ReturnType<typeof vi.fn>
    ).mockRejectedValue(error);

    renderView(service);
    const user = userEvent.setup();
    await openPolicyTab(user);

    fireEvent.change(await screen.findByTestId('policy-editor'), {
      target: { value: '{"a":1}' },
    });
    await user.click(screen.getByRole('button', { name: /save policy/i }));

    await waitFor(() => {
      expect(screen.getByText(/validationexception/i)).toBeInTheDocument();
    });
  });

  it('deletes the policy after confirming', async () => {
    const service = createMockBucketService();
    mockOverview(service);
    (service.getVectorBucketPolicy as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ policy: existingPolicy })
      .mockResolvedValueOnce({ policy: undefined });
    (
      service.deleteVectorBucketPolicy as ReturnType<typeof vi.fn>
    ).mockResolvedValue({});

    renderView(service);
    const user = userEvent.setup();
    await openPolicyTab(user);
    await screen.findByTestId('policy-viewer');

    await user.click(screen.getByRole('button', { name: /delete policy/i }));

    const dialog = await screen.findByRole('dialog', {
      name: /delete policy/i,
    });
    expect(
      within(dialog).getByText(/remove the access-control policy/i)
    ).toBeInTheDocument();

    await user.click(
      within(dialog).getByRole('button', { name: /^delete policy$/i })
    );

    await waitFor(() => {
      expect(service.deleteVectorBucketPolicy).toHaveBeenCalledWith(
        'my-bucket'
      );
    });
    await waitFor(() => {
      expect(
        screen.getByText(/no policy attached to this bucket/i)
      ).toBeInTheDocument();
    });
  });

  it('shows an error in the dialog when deleting the policy fails', async () => {
    const service = createMockBucketService();
    mockOverview(service);
    mockPolicy(service, existingPolicy);
    const error = new Error('Access denied');
    error.name = 'AccessDeniedException';
    (
      service.deleteVectorBucketPolicy as ReturnType<typeof vi.fn>
    ).mockRejectedValue(error);

    renderView(service);
    const user = userEvent.setup();
    await openPolicyTab(user);
    await screen.findByTestId('policy-viewer');

    await user.click(screen.getByRole('button', { name: /delete policy/i }));

    const dialog = await screen.findByRole('dialog', {
      name: /delete policy/i,
    });
    await user.click(
      within(dialog).getByRole('button', { name: /^delete policy$/i })
    );

    await waitFor(() => {
      expect(
        within(dialog).getByText(/accessdeniedexception/i)
      ).toBeInTheDocument();
    });
  });

  it('shows a policy load error inside the policy tab', async () => {
    const service = createMockBucketService();
    mockOverview(service);
    const error = new Error('Not found');
    error.name = 'NotFoundException';
    mockPolicy(service, undefined, error);

    renderView(service);
    const user = userEvent.setup();
    await openPolicyTab(user);

    await waitFor(() => {
      expect(screen.getAllByText(/notfoundexception/i).length).toBeGreaterThan(
        0
      );
    });
    expect(screen.queryByTestId('policy-viewer')).not.toBeInTheDocument();
  });

  it('formats the draft JSON', async () => {
    const service = createMockBucketService();
    mockOverview(service);
    mockPolicy(service, undefined);

    renderView(service);
    const user = userEvent.setup();
    await openPolicyTab(user);

    const editor = await screen.findByTestId('policy-editor');
    fireEvent.change(editor, { target: { value: '{"Version":"2012-10-17"}' } });
    await user.click(screen.getByRole('button', { name: /format json/i }));

    expect(editor).toHaveValue('{\n  "Version": "2012-10-17"\n}');
  });

  it('renders via the route with the bucket name param', async () => {
    useSettingsStore.getState().saveSettings({
      region: 'us-east-1',
      accessKeyId: 'AKIA',
      secretAccessKey: 'secret',
      sessionToken: '',
      endpoint: '',
      sessionOnly: false,
    });
    mockSend.mockImplementation((command: { name: string }) => {
      if (command.name === 'GetVectorBucketCommand') {
        return Promise.resolve({
          vectorBucket: {
            vectorBucketName: 'route-bucket',
            vectorBucketArn: 'arn-route',
            creationTime: new Date('2024-06-01T12:00:00Z'),
          },
        });
      }
      return Promise.resolve({});
    });

    render(
      <MemoryRouter initialEntries={['/buckets/route-bucket']}>
        <Routes>
          <Route path="/buckets/:bucketName" element={<BucketDetail />} />
        </Routes>
      </MemoryRouter>
    );

    expect(
      await screen.findByRole('heading', { name: /route-bucket/i })
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('arn-route')).toBeInTheDocument();
    });
  });

  describe('indexes', () => {
    function setup(indexes: unknown[] = []) {
      const bucketService = createMockBucketService();
      mockOverview(bucketService);
      mockPolicy(bucketService, undefined);
      const indexService = createMockIndexService();
      (indexService.listIndexes as ReturnType<typeof vi.fn>).mockResolvedValue({
        indexes,
      });
      renderIndexes(bucketService, indexService);
      return { indexService };
    }

    it('shows index loading state', async () => {
      const bucketService = createMockBucketService();
      mockOverview(bucketService);
      mockPolicy(bucketService, undefined);
      const indexService = createMockIndexService();
      (indexService.listIndexes as ReturnType<typeof vi.fn>).mockImplementation(
        () => new Promise(() => undefined)
      );
      renderIndexes(bucketService, indexService);
      await screen.findByRole('tab', { name: /indexes/i });
      expect(screen.getByTestId('indexes-loading')).toBeInTheDocument();
    });

    it('shows empty state', async () => {
      setup();
      expect(
        await screen.findByText(/no indexes in this bucket yet/i)
      ).toBeInTheDocument();
    });

    it('renders index rows', async () => {
      setup([
        { indexName: 'products', dimension: 128, distanceMetric: 'euclidean' },
      ]);
      expect(
        await screen.findByRole('link', { name: 'products' })
      ).toBeInTheDocument();
      expect(screen.getByText('Dimension')).toBeInTheDocument();
      expect(screen.getByText('Distance metric')).toBeInTheDocument();
    });

    it('creates an index and refreshes the list', async () => {
      const bucketService = createMockBucketService();
      mockOverview(bucketService);
      mockPolicy(bucketService, undefined);
      const indexService = createMockIndexService();
      const list = indexService.listIndexes as ReturnType<typeof vi.fn>;
      list
        .mockResolvedValueOnce({ indexes: [] })
        .mockResolvedValueOnce({ indexes: [{ indexName: 'new-index' }] });
      renderIndexes(bucketService, indexService);
      (indexService.createIndex as ReturnType<typeof vi.fn>).mockResolvedValue(
        {}
      );
      const user = userEvent.setup();
      await screen.findByText(/no indexes in this bucket yet/i);
      await user.click(
        screen.getAllByRole('button', { name: /create index/i })[0]
      );
      const dialog = await screen.findByRole('dialog', {
        name: /create index/i,
      });
      fireEvent.change(within(dialog).getByPlaceholderText('Index name'), {
        target: { value: 'new-index' },
      });
      fireEvent.change(within(dialog).getByRole('spinbutton'), {
        target: { value: '128' },
      });
      fireEvent.change(within(dialog).getByPlaceholderText(/non-filterable/i), {
        target: { value: 'category, brand' },
      });
      await user.click(
        within(dialog).getByRole('button', { name: /^create$/i })
      );
      await waitFor(() =>
        expect(indexService.createIndex).toHaveBeenCalledWith({
          bucketName: 'my-bucket',
          indexName: 'new-index',
          dimension: 128,
          distanceMetric: 'cosine',
          metadataConfiguration: {
            nonFilterableMetadataKeys: ['category', 'brand'],
          },
        })
      );
      await waitFor(() => expect(list).toHaveBeenCalledTimes(2));
    });

    it('shows validation errors for invalid name and dimension', async () => {
      const { indexService } = setup();
      const user = userEvent.setup();
      await screen.findByText(/no indexes in this bucket yet/i);
      await user.click(
        screen.getAllByRole('button', { name: /create index/i })[0]
      );
      const dialog = await screen.findByRole('dialog', {
        name: /create index/i,
      });
      fireEvent.change(within(dialog).getByRole('spinbutton'), {
        target: { value: '0' },
      });
      await user.click(
        within(dialog).getByRole('button', { name: /^create$/i })
      );
      expect(
        await within(dialog).findByText(/validationerror/i)
      ).toBeInTheDocument();
      expect(indexService.createIndex).not.toHaveBeenCalled();
    });

    it('shows create API errors', async () => {
      const { indexService } = setup();
      const error = Object.assign(new Error('already exists'), {
        name: 'ConflictException',
      });
      (indexService.createIndex as ReturnType<typeof vi.fn>).mockRejectedValue(
        error
      );
      const user = userEvent.setup();
      await screen.findByText(/no indexes in this bucket yet/i);
      await user.click(
        screen.getAllByRole('button', { name: /create index/i })[0]
      );
      const dialog = await screen.findByRole('dialog', {
        name: /create index/i,
      });
      fireEvent.change(within(dialog).getByPlaceholderText('Index name'), {
        target: { value: 'existing' },
      });
      await user.click(
        within(dialog).getByRole('button', { name: /^create$/i })
      );
      expect(
        await within(dialog).findByText(/conflictexception/i)
      ).toBeInTheDocument();
    });

    it('confirms deletion and shows delete errors', async () => {
      const { indexService } = setup([{ indexName: 'old-index' }]);
      (indexService.deleteIndex as ReturnType<typeof vi.fn>).mockResolvedValue(
        {}
      );
      const user = userEvent.setup();
      await user.click(await screen.findByRole('button', { name: /delete/i }));
      const dialog = await screen.findByRole('dialog', {
        name: /delete index/i,
      });
      await user.click(within(dialog).getByRole('button', { name: /^ok$/i }));
      await waitFor(() =>
        expect(indexService.deleteIndex).toHaveBeenCalledWith(
          'my-bucket',
          'old-index'
        )
      );
    });

    it('shows an error when deletion fails', async () => {
      const { indexService } = setup([{ indexName: 'old-index' }]);
      (indexService.deleteIndex as ReturnType<typeof vi.fn>).mockRejectedValue(
        Object.assign(new Error('denied'), { name: 'AccessDeniedException' })
      );
      const user = userEvent.setup();
      await user.click(await screen.findByRole('button', { name: /delete/i }));
      const dialog = await screen.findByRole('dialog', {
        name: /delete index/i,
      });
      await user.click(within(dialog).getByRole('button', { name: /^ok$/i }));
      expect(
        await screen.findByText(/accessdeniedexception/i)
      ).toBeInTheDocument();
    });

    it('navigates to the index detail page when the index name is clicked', async () => {
      const bucketService = createMockBucketService();
      mockOverview(bucketService);
      mockPolicy(bucketService, undefined);
      const indexService = createMockIndexService();
      (indexService.listIndexes as ReturnType<typeof vi.fn>).mockResolvedValue({
        indexes: [
          { indexName: 'details', indexArn: 'arn:index', dimension: 64 },
        ],
      });

      renderWithRouter(
        <BucketDetailView
          bucketService={bucketService}
          bucketName="my-bucket"
          indexService={indexService}
        />
      );

      const user = userEvent.setup();
      await user.click(await screen.findByRole('link', { name: 'details' }));
      expect(screen.getByTestId('location-probe')).toHaveTextContent(
        '/buckets/my-bucket/indexes/details'
      );
      expect(indexService.getIndex).not.toHaveBeenCalled();
    });
  });
});
