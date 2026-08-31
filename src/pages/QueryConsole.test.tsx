import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import QueryConsole, { QueryConsoleView } from './QueryConsole';
import { BucketService } from '../api/buckets';
import { IndexService } from '../api/indexes';
import { VectorService } from '../api/vectors';
import { useSettingsStore } from '../settings/settingsStore';

const mockSend = vi.fn();

vi.mock('@aws-sdk/client-s3vectors', () => ({
  S3VectorsClient: vi.fn().mockImplementation(() => ({
    send: mockSend,
  })),
  ListVectorBucketsCommand: vi.fn().mockImplementation((input) => ({
    input,
    name: 'ListVectorBucketsCommand',
  })),
  ListIndexesCommand: vi.fn().mockImplementation((input) => ({
    input,
    name: 'ListIndexesCommand',
  })),
  GetIndexCommand: vi.fn().mockImplementation((input) => ({
    input,
    name: 'GetIndexCommand',
  })),
  ListVectorsCommand: vi.fn().mockImplementation((input) => ({
    input,
    name: 'ListVectorsCommand',
  })),
  QueryVectorsCommand: vi.fn().mockImplementation((input) => ({
    input,
    name: 'QueryVectorsCommand',
  })),
}));

function createMockBucketService(): BucketService {
  return {
    listVectorBuckets: vi.fn().mockResolvedValue({ vectorBuckets: [] }),
    createVectorBucket: vi.fn(),
    deleteVectorBucket: vi.fn(),
    getVectorBucket: vi.fn(),
    putVectorBucketPolicy: vi.fn(),
    getVectorBucketPolicy: vi.fn(),
    deleteVectorBucketPolicy: vi.fn(),
  } as unknown as BucketService;
}

function createMockIndexService(): IndexService {
  return {
    listIndexes: vi.fn().mockResolvedValue({ indexes: [] }),
    createIndex: vi.fn(),
    deleteIndex: vi.fn(),
    getIndex: vi.fn().mockResolvedValue({
      index: {
        indexName: 'idx-1',
        indexArn: 'arn:aws:s3vectors:us-east-1:123456789:index/idx-1',
        dimension: 3,
        distanceMetric: 'cosine',
        dataType: 'float32',
        creationTime: new Date('2025-01-01T00:00:00Z'),
      },
    }),
  } as unknown as IndexService;
}

function createMockVectorService(): VectorService {
  return {
    putVectors: vi.fn(),
    getVectors: vi.fn(),
    listVectors: vi.fn().mockResolvedValue({ vectors: [] }),
    deleteVectors: vi.fn(),
    queryVectors: vi
      .fn()
      .mockResolvedValue({ vectors: [], distanceMetric: 'cosine' }),
  } as unknown as VectorService;
}

function renderView(
  bucketService: BucketService,
  indexService: IndexService,
  vectorService: VectorService
) {
  return render(
    <MemoryRouter>
      <QueryConsoleView
        bucketService={bucketService}
        indexService={indexService}
        vectorService={vectorService}
      />
    </MemoryRouter>
  );
}

function seedBucketsAndIndexes(
  bucketService: BucketService,
  indexService: IndexService
) {
  (
    bucketService.listVectorBuckets as ReturnType<typeof vi.fn>
  ).mockResolvedValue({
    vectorBuckets: [
      { vectorBucketName: 'bucket-a', creationTime: new Date() },
      { vectorBucketName: 'bucket-b', creationTime: new Date() },
    ],
  });
  (indexService.listIndexes as ReturnType<typeof vi.fn>).mockResolvedValue({
    indexes: [{ indexName: 'idx-1' }, { indexName: 'idx-2' }],
  });
  (indexService.getIndex as ReturnType<typeof vi.fn>).mockResolvedValue({
    index: {
      indexName: 'idx-1',
      indexArn: 'arn:aws:s3vectors:us-east-1:123456789:index/idx-1',
      dimension: 3,
      distanceMetric: 'cosine',
      dataType: 'float32',
      creationTime: new Date('2025-01-01T00:00:00Z'),
    },
  });
}

async function openAntSelectAndPick(
  user: ReturnType<typeof userEvent.setup>,
  selectIndex: number,
  optionText: string
) {
  const selects = document.querySelectorAll(
    '.ant-select:not(.ant-select-disabled) .ant-select-selector'
  );
  const selector = selects[selectIndex] as HTMLElement;
  await user.click(selector);
  // Click the option ROOT (not its text node): rc-select renders hidden
  // measurement copies of the label text, and clicking those does nothing.
  await waitFor(() => {
    const options = Array.from(
      document.querySelectorAll('.ant-select-item-option')
    );
    expect(options.some((o) => o.textContent === optionText)).toBe(true);
  });
  const target = Array.from(
    document.querySelectorAll('.ant-select-item-option')
  ).find((o) => o.textContent === optionText) as HTMLElement;
  await user.click(target);
}

describe('QueryConsole page', () => {
  // Integration-heavy: sequential AntD Select/Modal interactions each settle
  // through real-motion waitFor loops. Under machine load 20s is not enough.
  vi.setConfig({ testTimeout: 60_000 });

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    useSettingsStore.setState(useSettingsStore.getInitialState());
  });

  it('renders the query form and bucket/index selectors', async () => {
    const bucketService = createMockBucketService();
    const indexService = createMockIndexService();
    const vectorService = createMockVectorService();
    seedBucketsAndIndexes(bucketService, indexService);

    renderView(bucketService, indexService, vectorService);
    const user = userEvent.setup();

    expect(
      screen.getByRole('heading', { name: /query console/i })
    ).toBeInTheDocument();

    await openAntSelectAndPick(user, 0, 'bucket-a');

    await waitFor(() => {
      expect(indexService.listIndexes).toHaveBeenCalledWith({
        vectorBucketName: 'bucket-a',
      });
    });

    await openAntSelectAndPick(user, 1, 'idx-1');

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText(/query vector json array/i)
      ).toBeInTheDocument();
    });
  });

  it('shows index info card after selecting an index', async () => {
    const bucketService = createMockBucketService();
    const indexService = createMockIndexService();
    const vectorService = createMockVectorService();
    seedBucketsAndIndexes(bucketService, indexService);

    renderView(bucketService, indexService, vectorService);
    const user = userEvent.setup();

    await openAntSelectAndPick(user, 0, 'bucket-a');
    await waitFor(() => {
      expect(indexService.listIndexes).toHaveBeenCalled();
    });
    await openAntSelectAndPick(user, 1, 'idx-1');

    await waitFor(() => {
      expect(indexService.getIndex).toHaveBeenCalledWith('bucket-a', 'idx-1');
    });

    expect(screen.getByText('Index Info')).toBeInTheDocument();
    // "idx-1" appears both in the breadcrumb selector and the info card.
    expect(screen.getAllByText('idx-1').length).toBeGreaterThan(0);
    expect(screen.getByText('cosine')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(
      screen.getByText(/arn:aws:s3vectors:us-east-1:123456789:index\/idx-1/)
    ).toBeInTheDocument();
  });

  it('auto-generates a random vector matching dimension on index selection', async () => {
    const bucketService = createMockBucketService();
    const indexService = createMockIndexService();
    const vectorService = createMockVectorService();
    seedBucketsAndIndexes(bucketService, indexService);

    renderView(bucketService, indexService, vectorService);
    const user = userEvent.setup();

    await openAntSelectAndPick(user, 0, 'bucket-a');
    await waitFor(() => {
      expect(indexService.listIndexes).toHaveBeenCalled();
    });
    await openAntSelectAndPick(user, 1, 'idx-1');

    await waitFor(() => {
      const textarea = screen.getByPlaceholderText(
        /query vector json array/i
      ) as HTMLTextAreaElement;
      const parsed = JSON.parse(textarea.value);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(3);
      expect(parsed.every((n: number) => typeof n === 'number')).toBe(true);
    });
  });

  it('generate-random button fills vector of correct dimension', async () => {
    const bucketService = createMockBucketService();
    const indexService = createMockIndexService();
    const vectorService = createMockVectorService();
    seedBucketsAndIndexes(bucketService, indexService);

    renderView(bucketService, indexService, vectorService);
    const user = userEvent.setup();

    await openAntSelectAndPick(user, 0, 'bucket-a');
    await waitFor(() => {
      expect(indexService.listIndexes).toHaveBeenCalled();
    });
    await openAntSelectAndPick(user, 1, 'idx-1');

    await waitFor(() => {
      expect(screen.getByText('Index Info')).toBeInTheDocument();
    });

    const genBtn = screen.getByText('Generate random');
    await user.click(genBtn);

    const textarea = screen.getByPlaceholderText(
      /query vector json array/i
    ) as HTMLTextAreaElement;
    const parsed = JSON.parse(textarea.value);
    expect(parsed.length).toBe(3);
  });

  it('pick-existing-vector flow fills textarea with selected vector data', async () => {
    const bucketService = createMockBucketService();
    const indexService = createMockIndexService();
    const vectorService = createMockVectorService();
    seedBucketsAndIndexes(bucketService, indexService);
    (vectorService.listVectors as ReturnType<typeof vi.fn>).mockResolvedValue({
      vectors: [
        {
          key: 'vec-1',
          data: { float32: [0.1, 0.2, 0.3] },
          metadata: { color: 'red' },
        },
        {
          key: 'vec-2',
          data: { float32: [0.4, 0.5, 0.6] },
        },
      ],
    });

    renderView(bucketService, indexService, vectorService);
    const user = userEvent.setup();

    await openAntSelectAndPick(user, 0, 'bucket-a');
    await waitFor(() => {
      expect(indexService.listIndexes).toHaveBeenCalled();
    });
    await openAntSelectAndPick(user, 1, 'idx-1');

    await waitFor(() => {
      expect(screen.getByText('Index Info')).toBeInTheDocument();
    });

    const pickBtn = screen.getByText('Pick existing vector');
    await user.click(pickBtn);

    await waitFor(() => {
      expect(vectorService.listVectors).toHaveBeenCalledWith(
        'bucket-a',
        'idx-1',
        {
          maxResults: 10,
          returnData: true,
          returnMetadata: true,
        }
      );
    });

    await waitFor(() => {
      const selectors = document.querySelectorAll(
        '.ant-select:not(.ant-select-disabled) .ant-select-selector'
      );
      expect(selectors.length).toBeGreaterThanOrEqual(3);
    });

    await openAntSelectAndPick(user, 2, 'vec-1');

    await waitFor(() => {
      const textarea = screen.getByPlaceholderText(
        /query vector json array/i
      ) as HTMLTextAreaElement;
      expect(textarea.value).toBe('[0.1,0.2,0.3]');
    });
  });

  it('runs a successful query and renders result rows', async () => {
    const bucketService = createMockBucketService();
    const indexService = createMockIndexService();
    const vectorService = createMockVectorService();
    seedBucketsAndIndexes(bucketService, indexService);
    (vectorService.queryVectors as ReturnType<typeof vi.fn>).mockResolvedValue({
      vectors: [
        { key: 'vec-1', distance: 0.123, metadata: { color: 'red' } },
        { key: 'vec-2', distance: 0.456 },
      ],
      distanceMetric: 'cosine',
    });

    renderView(bucketService, indexService, vectorService);
    const user = userEvent.setup();

    await openAntSelectAndPick(user, 0, 'bucket-a');
    await waitFor(() => {
      expect(indexService.listIndexes).toHaveBeenCalled();
    });
    await openAntSelectAndPick(user, 1, 'idx-1');

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText(/query vector json array/i)
      ).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText(/query vector json array/i), {
      target: { value: '[0.1, 0.2, 0.3]' },
    });
    await user.click(screen.getByRole('button', { name: /run query/i }));

    await waitFor(() => {
      expect(vectorService.queryVectors).toHaveBeenCalledWith(
        'bucket-a',
        'idx-1',
        {
          queryVector: [0.1, 0.2, 0.3],
          topK: 10,
        }
      );
    });

    expect(screen.getByText('vec-1')).toBeInTheDocument();
    expect(screen.getByText('vec-2')).toBeInTheDocument();
    expect(screen.getByText('0.12')).toBeInTheDocument();
    expect(screen.getByText('0.46')).toBeInTheDocument();
  });

  it('shows API error state', async () => {
    const bucketService = createMockBucketService();
    const indexService = createMockIndexService();
    const vectorService = createMockVectorService();
    seedBucketsAndIndexes(bucketService, indexService);
    const error = new Error('Access denied');
    error.name = 'AccessDeniedException';
    (error as { code?: string }).code = 'AccessDeniedException';
    (vectorService.queryVectors as ReturnType<typeof vi.fn>).mockRejectedValue(
      error
    );

    renderView(bucketService, indexService, vectorService);
    const user = userEvent.setup();

    await openAntSelectAndPick(user, 0, 'bucket-a');
    await waitFor(() => {
      expect(indexService.listIndexes).toHaveBeenCalled();
    });
    await openAntSelectAndPick(user, 1, 'idx-1');

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText(/query vector json array/i)
      ).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText(/query vector json array/i), {
      target: { value: '[1, 2, 3]' },
    });
    await user.click(screen.getByRole('button', { name: /run query/i }));

    await waitFor(() => {
      expect(screen.getByText(/accessdeniedexception/i)).toBeInTheDocument();
    });
  });

  it('shows validation error for invalid queryVector JSON', async () => {
    const bucketService = createMockBucketService();
    const indexService = createMockIndexService();
    const vectorService = createMockVectorService();
    seedBucketsAndIndexes(bucketService, indexService);

    renderView(bucketService, indexService, vectorService);
    const user = userEvent.setup();

    await openAntSelectAndPick(user, 0, 'bucket-a');
    await waitFor(() => {
      expect(indexService.listIndexes).toHaveBeenCalled();
    });
    await openAntSelectAndPick(user, 1, 'idx-1');

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText(/query vector json array/i)
      ).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText(/query vector json array/i), {
      target: { value: 'not-json' },
    });
    await user.click(screen.getByRole('button', { name: /run query/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid json/i)).toBeInTheDocument();
    });
    expect(vectorService.queryVectors).not.toHaveBeenCalled();
  });

  it('passes topK through to the API', async () => {
    const bucketService = createMockBucketService();
    const indexService = createMockIndexService();
    const vectorService = createMockVectorService();
    seedBucketsAndIndexes(bucketService, indexService);
    (vectorService.queryVectors as ReturnType<typeof vi.fn>).mockResolvedValue({
      vectors: [],
      distanceMetric: 'euclidean',
    });

    renderView(bucketService, indexService, vectorService);
    const user = userEvent.setup();

    await openAntSelectAndPick(user, 0, 'bucket-a');
    await waitFor(() => {
      expect(indexService.listIndexes).toHaveBeenCalled();
    });
    await openAntSelectAndPick(user, 1, 'idx-1');

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText(/query vector json array/i)
      ).toBeInTheDocument();
    });

    const topKInput = screen.getByRole('spinbutton');
    fireEvent.change(topKInput, { target: { value: '25' } });
    fireEvent.change(screen.getByPlaceholderText(/query vector json array/i), {
      target: { value: '[0.1, 0.2]' },
    });
    await user.click(screen.getByRole('button', { name: /run query/i }));

    await waitFor(() => {
      expect(vectorService.queryVectors).toHaveBeenCalledWith(
        'bucket-a',
        'idx-1',
        expect.objectContaining({ topK: 25, queryVector: [0.1, 0.2] })
      );
    });
  });

  it('builds services from settings in default export', async () => {
    useSettingsStore.getState().saveSettings({
      region: 'us-east-1',
      accessKeyId: 'AKIA',
      secretAccessKey: 'secret',
      sessionToken: '',
      endpoint: '',
      sessionOnly: false,
    });
    mockSend.mockResolvedValue({ vectorBuckets: [] });

    render(
      <MemoryRouter>
        <QueryConsole />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getAllByText('Query Console').length
      ).toBeGreaterThanOrEqual(1);
    });
  });
});
