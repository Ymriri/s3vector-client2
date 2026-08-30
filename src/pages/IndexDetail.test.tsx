import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import IndexDetail, { IndexDetailView } from './IndexDetail';
import { VectorService } from '../api/vectors';
import { IndexService } from '../api/indexes';
import { useSettingsStore } from '../settings/settingsStore';

const mockSend = vi.fn();

vi.mock('@aws-sdk/client-s3vectors', () => ({
  S3VectorsClient: vi.fn().mockImplementation(() => ({
    send: mockSend,
  })),
  GetIndexCommand: vi.fn().mockImplementation((input) => ({
    input,
    name: 'GetIndexCommand',
  })),
  ListVectorsCommand: vi.fn().mockImplementation((input) => ({
    input,
    name: 'ListVectorsCommand',
  })),
  GetVectorsCommand: vi.fn().mockImplementation((input) => ({
    input,
    name: 'GetVectorsCommand',
  })),
  DeleteVectorsCommand: vi.fn().mockImplementation((input) => ({
    input,
    name: 'DeleteVectorsCommand',
  })),
  PutVectorsCommand: vi.fn().mockImplementation((input) => ({
    input,
    name: 'PutVectorsCommand',
  })),
}));

function createMockIndexService(): IndexService {
  return {
    listIndexes: vi.fn(),
    createIndex: vi.fn(),
    deleteIndex: vi.fn(),
    getIndex: vi.fn().mockResolvedValue({
      index: {
        indexName: 'my-index',
        vectorBucketName: 'my-bucket',
        indexArn: 'arn:index',
        dimension: 3,
        distanceMetric: 'cosine',
        creationTime: new Date('2024-06-01T12:00:00Z'),
      },
    }),
  } as unknown as IndexService;
}

function createMockVectorService(): VectorService {
  return {
    putVectors: vi.fn().mockResolvedValue({}),
    getVectors: vi.fn().mockResolvedValue({ vectors: [] }),
    listVectors: vi.fn().mockResolvedValue({ vectors: [] }),
    deleteVectors: vi.fn().mockResolvedValue({}),
    queryVectors: vi
      .fn()
      .mockResolvedValue({ vectors: [], distanceMetric: 'cosine' }),
  } as unknown as VectorService;
}

function renderView(
  indexService: IndexService,
  vectorService: VectorService,
  bucketName = 'my-bucket',
  indexName = 'my-index'
) {
  return render(
    <MemoryRouter>
      <IndexDetailView
        bucketName={bucketName}
        indexName={indexName}
        indexService={indexService}
        vectorService={vectorService}
      />
    </MemoryRouter>
  );
}

describe('IndexDetail page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    useSettingsStore.setState(useSettingsStore.getInitialState());
  });

  it('renders loading state then index details', async () => {
    const indexService = createMockIndexService();
    const vectorService = createMockVectorService();
    (vectorService.listVectors as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise(() => undefined)
    );

    renderView(indexService, vectorService);

    await waitFor(() => {
      expect(screen.getByTestId('vectors-loading')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /vectors/i })).toBeInTheDocument();
    });
    expect(
      screen.getByRole('heading', { name: /my-index/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/dimension 3/i)).toBeInTheDocument();
    expect(screen.getByText(/cosine/i)).toBeInTheDocument();
  });

  it('shows empty state when no vectors', async () => {
    const indexService = createMockIndexService();
    const vectorService = createMockVectorService();

    renderView(indexService, vectorService);

    await waitFor(() => {
      expect(screen.getByText(/no vectors in this index/i)).toBeInTheDocument();
    });
  });

  it('renders vector rows with metadata and data preview', async () => {
    const indexService = createMockIndexService();
    const vectorService = createMockVectorService();
    (vectorService.listVectors as ReturnType<typeof vi.fn>).mockResolvedValue({
      vectors: [
        {
          key: 'vec-1',
          data: { float32: [0.1, 0.2, 0.3] },
          metadata: { color: 'red' },
        },
        { key: 'vec-2', data: { float32: [0.4, 0.5, 0.6] } },
      ],
    });

    renderView(indexService, vectorService);

    await waitFor(() => {
      expect(screen.getByText('vec-1')).toBeInTheDocument();
    });
    expect(screen.getByText('vec-2')).toBeInTheDocument();
    expect(screen.getByText(/"color": "red"/i)).toBeInTheDocument();
    expect(screen.getByText(/0.1, 0.2, 0.3/i)).toBeInTheDocument();
  });

  it('paginates via nextToken', async () => {
    const indexService = createMockIndexService();
    const vectorService = createMockVectorService();
    const list = vectorService.listVectors as ReturnType<typeof vi.fn>;
    list
      .mockResolvedValueOnce({
        vectors: [{ key: 'page-1' }],
        nextToken: 'token-1',
      })
      .mockResolvedValueOnce({ vectors: [{ key: 'page-2' }] });

    renderView(indexService, vectorService);
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByText('page-1')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /next/i }));

    await waitFor(() => {
      expect(list).toHaveBeenLastCalledWith(
        'my-bucket',
        'my-index',
        expect.objectContaining({ nextToken: 'token-1' })
      );
    });
    await waitFor(() => {
      expect(screen.getByText('page-2')).toBeInTheDocument();
    });
  });

  it('deletes a single vector after confirming', async () => {
    const indexService = createMockIndexService();
    const vectorService = createMockVectorService();
    (vectorService.listVectors as ReturnType<typeof vi.fn>).mockResolvedValue({
      vectors: [{ key: 'vec-1' }],
    });

    renderView(indexService, vectorService);
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByText('vec-1')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /delete$/i }));

    const dialog = await screen.findByRole('dialog', {
      name: /delete vector/i,
    });
    expect(within(dialog).getByText(/vec-1/i)).toBeInTheDocument();

    await user.click(
      within(dialog).getByRole('button', { name: /^delete vector$/i })
    );

    await waitFor(() => {
      expect(vectorService.deleteVectors).toHaveBeenCalledWith(
        'my-bucket',
        'my-index',
        ['vec-1']
      );
    });
  });

  it('deletes selected vectors after batch confirm', async () => {
    const indexService = createMockIndexService();
    const vectorService = createMockVectorService();
    (vectorService.listVectors as ReturnType<typeof vi.fn>).mockResolvedValue({
      vectors: [{ key: 'vec-1' }, { key: 'vec-2' }],
    });

    renderView(indexService, vectorService);
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByText('vec-1')).toBeInTheDocument();
    });

    const rows = screen.getAllByRole('row');
    const checkbox = within(rows[1]).getByRole('checkbox');
    await user.click(checkbox);

    const batchButton = screen.getByRole('button', {
      name: /delete selected/i,
    });
    expect(batchButton).toBeEnabled();
    await user.click(batchButton);

    const dialog = await screen.findByRole('dialog', {
      name: /delete selected/i,
    });
    await user.click(
      within(dialog).getByRole('button', { name: /^delete selected$/i })
    );

    await waitFor(() => {
      expect(vectorService.deleteVectors).toHaveBeenCalledWith(
        'my-bucket',
        'my-index',
        ['vec-1']
      );
    });
  });

  it('opens a drawer with vector details from GetVectors', async () => {
    const indexService = createMockIndexService();
    const vectorService = createMockVectorService();
    (vectorService.listVectors as ReturnType<typeof vi.fn>).mockResolvedValue({
      vectors: [{ key: 'vec-1', data: { float32: [0.1, 0.2, 0.3] } }],
    });
    (vectorService.getVectors as ReturnType<typeof vi.fn>).mockResolvedValue({
      vectors: [
        {
          key: 'vec-1',
          data: { float32: [0.1, 0.2, 0.3] },
          metadata: { color: 'red' },
        },
      ],
    });

    renderView(indexService, vectorService);
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByText('vec-1')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /view/i }));

    await waitFor(() => {
      expect(vectorService.getVectors).toHaveBeenCalledWith(
        'my-bucket',
        'my-index',
        ['vec-1'],
        { returnData: true, returnMetadata: true }
      );
    });
    const drawer = screen.getByRole('dialog');
    expect(within(drawer).getByText(/0.1, 0.2, 0.3/i)).toBeInTheDocument();
    expect(within(drawer).getByText(/"color": "red"/i)).toBeInTheDocument();
  });

  it('puts vectors via the Add vectors modal and refreshes the list', async () => {
    const indexService = createMockIndexService();
    const vectorService = createMockVectorService();
    const list = vectorService.listVectors as ReturnType<typeof vi.fn>;
    list.mockResolvedValueOnce({ vectors: [] }).mockResolvedValueOnce({
      vectors: [
        {
          key: 'new-vec',
          data: { float32: [1, 2, 3] },
          metadata: { color: 'blue' },
        },
      ],
    });

    renderView(indexService, vectorService);
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByText(/no vectors in this index/i)).toBeInTheDocument();
    });

    await user.click(
      screen.getAllByRole('button', { name: /add vectors/i })[0]
    );

    const dialog = await screen.findByRole('dialog', { name: /add vectors/i });
    const editor = within(dialog).getByPlaceholderText(
      /json array of vector objects/i
    );
    fireEvent.change(editor, {
      target: {
        value: '[{"key":"new-vec","data":[1,2,3],"metadata":{"color":"blue"}}]',
      },
    });
    await user.click(
      within(dialog).getByRole('button', { name: /^put vectors$/i })
    );

    await waitFor(() => {
      expect(vectorService.putVectors).toHaveBeenCalledWith(
        'my-bucket',
        'my-index',
        [{ key: 'new-vec', data: [1, 2, 3], metadata: { color: 'blue' } }]
      );
    });
    await waitFor(() => {
      expect(screen.getByText('new-vec')).toBeInTheDocument();
    });
  });

  it('rejects invalid JSON in the Add vectors modal', async () => {
    const indexService = createMockIndexService();
    const vectorService = createMockVectorService();

    renderView(indexService, vectorService);
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByText(/no vectors in this index/i)).toBeInTheDocument();
    });

    await user.click(
      screen.getAllByRole('button', { name: /add vectors/i })[0]
    );

    const dialog = await screen.findByRole('dialog', { name: /add vectors/i });
    const editor = within(dialog).getByPlaceholderText(
      /json array of vector objects/i
    );
    fireEvent.change(editor, { target: { value: 'not-json' } });
    await user.click(
      within(dialog).getByRole('button', { name: /^put vectors$/i })
    );

    await waitFor(() => {
      expect(within(dialog).getByText(/invalid json/i)).toBeInTheDocument();
    });
    expect(vectorService.putVectors).not.toHaveBeenCalled();
  });

  it('rejects a batch larger than 500 vectors', async () => {
    const indexService = createMockIndexService();
    const vectorService = createMockVectorService();

    renderView(indexService, vectorService);
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByText(/no vectors in this index/i)).toBeInTheDocument();
    });

    await user.click(
      screen.getAllByRole('button', { name: /add vectors/i })[0]
    );

    const dialog = await screen.findByRole('dialog', { name: /add vectors/i });
    const editor = within(dialog).getByPlaceholderText(
      /json array of vector objects/i
    );
    const batch = Array.from({ length: 501 }, (_, i) => ({
      key: `vec-${i}`,
      data: [1, 2, 3],
    }));
    fireEvent.change(editor, {
      target: { value: JSON.stringify(batch) },
    });
    await user.click(
      within(dialog).getByRole('button', { name: /^put vectors$/i })
    );

    await waitFor(() => {
      expect(
        within(dialog).getByText(/cannot put more than 500/i)
      ).toBeInTheDocument();
    });
    expect(vectorService.putVectors).not.toHaveBeenCalled();
  });

  it('shows API errors in the Add vectors modal', async () => {
    const indexService = createMockIndexService();
    const vectorService = createMockVectorService();
    const error = new Error('Validation failed');
    error.name = 'ValidationException';
    (error as { code?: string }).code = 'ValidationException';
    (vectorService.putVectors as ReturnType<typeof vi.fn>).mockRejectedValue(
      error
    );

    renderView(indexService, vectorService);
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByText(/no vectors in this index/i)).toBeInTheDocument();
    });

    await user.click(
      screen.getAllByRole('button', { name: /add vectors/i })[0]
    );

    const dialog = await screen.findByRole('dialog', { name: /add vectors/i });
    const editor = within(dialog).getByPlaceholderText(
      /json array of vector objects/i
    );
    fireEvent.change(editor, {
      target: { value: '[{"key":"x","data":[1,2,3]}]' },
    });
    await user.click(
      within(dialog).getByRole('button', { name: /^put vectors$/i })
    );

    await waitFor(() => {
      expect(
        within(dialog).getByText(/validationexception/i)
      ).toBeInTheDocument();
    });
  });

  it('shows the Query tab with the QueryForm', async () => {
    const indexService = createMockIndexService();
    const vectorService = createMockVectorService();

    renderView(indexService, vectorService);
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /vectors/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('tab', { name: /query/i }));

    expect(
      screen.getByPlaceholderText(/query vector json array/i)
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/topK/i)).toHaveValue('10');
  });

  it('renders via the route with bucket and index params', async () => {
    useSettingsStore.getState().saveSettings({
      region: 'us-east-1',
      accessKeyId: 'AKIA',
      secretAccessKey: 'secret',
      sessionToken: '',
      endpoint: '',
      sessionOnly: false,
    });
    mockSend.mockImplementation((command: { name: string }) => {
      if (command.name === 'GetIndexCommand') {
        return Promise.resolve({
          index: {
            indexName: 'route-index',
            vectorBucketName: 'route-bucket',
            dimension: 3,
            distanceMetric: 'euclidean',
            creationTime: new Date('2024-06-01T12:00:00Z'),
          },
        });
      }
      if (command.name === 'ListVectorsCommand') {
        return Promise.resolve({ vectors: [] });
      }
      return Promise.resolve({});
    });

    render(
      <MemoryRouter
        initialEntries={['/buckets/route-bucket/indexes/route-index']}
      >
        <Routes>
          <Route
            path="/buckets/:bucketName/indexes/:indexName"
            element={<IndexDetail />}
          />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /route-index/i })
      ).toBeInTheDocument();
    });
    expect(screen.getByText(/euclidean/i)).toBeInTheDocument();
  });
});
