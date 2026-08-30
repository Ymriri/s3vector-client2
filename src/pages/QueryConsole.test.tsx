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
    getIndex: vi.fn(),
  } as unknown as IndexService;
}

function createMockVectorService(): VectorService {
  return {
    putVectors: vi.fn(),
    getVectors: vi.fn(),
    listVectors: vi.fn(),
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
}

async function selectBucketAndIndex(
  user: ReturnType<typeof userEvent.setup>,
  bucketService: BucketService,
  indexService: IndexService
) {
  await waitFor(() => {
    expect(bucketService.listVectorBuckets).toHaveBeenCalled();
  });

  await user.selectOptions(screen.getByLabelText(/bucket/i), 'bucket-a');

  await waitFor(() => {
    expect(indexService.listIndexes).toHaveBeenCalledWith({
      vectorBucketName: 'bucket-a',
    });
  });

  await user.selectOptions(screen.getByLabelText(/index/i), 'idx-1');
}

describe('QueryConsole page', () => {
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
    expect(screen.getByLabelText(/bucket/i)).toBeInTheDocument();

    await selectBucketAndIndex(user, bucketService, indexService);

    expect(
      screen.getByPlaceholderText(/query vector json array/i)
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/filter json/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/topK/i)).toHaveValue('10');
  });

  it('runs a successful query and renders rows with distance', async () => {
    const bucketService = createMockBucketService();
    const indexService = createMockIndexService();
    const vectorService = createMockVectorService();
    seedBucketsAndIndexes(bucketService, indexService);
    (vectorService.queryVectors as ReturnType<typeof vi.fn>).mockResolvedValue({
      vectors: [
        { key: 'vec-1', distance: 0.1, metadata: { color: 'red' } },
        { key: 'vec-2', distance: 0.2 },
      ],
      distanceMetric: 'cosine',
    });

    renderView(bucketService, indexService, vectorService);
    const user = userEvent.setup();
    await selectBucketAndIndex(user, bucketService, indexService);

    fireEvent.change(screen.getByPlaceholderText(/query vector json array/i), {
      target: { value: '[0.1, 0.2, 0.3]' },
    });
    fireEvent.change(screen.getByPlaceholderText(/filter json/i), {
      target: { value: '{"color":"red"}' },
    });
    await user.click(screen.getByRole('switch', { name: /return metadata/i }));
    await user.click(screen.getByRole('button', { name: /run query/i }));

    await waitFor(() => {
      expect(vectorService.queryVectors).toHaveBeenCalledWith(
        'bucket-a',
        'idx-1',
        {
          queryVector: [0.1, 0.2, 0.3],
          topK: 10,
          filter: { color: 'red' },
          returnMetadata: true,
        }
      );
    });

    expect(screen.getByText('vec-1')).toBeInTheDocument();
    expect(screen.getByText('vec-2')).toBeInTheDocument();
    expect(screen.getByText('0.1')).toBeInTheDocument();
    expect(screen.getByText('0.2')).toBeInTheDocument();
    expect(screen.getByText(/"color": "red"/i)).toBeInTheDocument();
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
    await selectBucketAndIndex(user, bucketService, indexService);

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
    await selectBucketAndIndex(user, bucketService, indexService);

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
    await selectBucketAndIndex(user, bucketService, indexService);

    fireEvent.change(screen.getByLabelText(/topK/i), {
      target: { value: '25' },
    });
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
      expect(screen.getByLabelText(/bucket/i)).toBeInTheDocument();
    });
  });
});
