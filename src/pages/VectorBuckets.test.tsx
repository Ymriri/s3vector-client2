import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import VectorBuckets, { VectorBucketsView } from './VectorBuckets';
import { BucketService } from '../api/buckets';
import { useSettingsStore } from '../settings/settingsStore';

const mockSend = vi.fn();

vi.mock('@aws-sdk/client-s3vectors', () => ({
  S3VectorsClient: vi.fn().mockImplementation(() => ({
    send: mockSend,
  })),
  CreateVectorBucketCommand: vi.fn().mockImplementation((input) => ({
    input,
    name: 'CreateVectorBucketCommand',
  })),
  DeleteVectorBucketCommand: vi.fn().mockImplementation((input) => ({
    input,
    name: 'DeleteVectorBucketCommand',
  })),
  GetVectorBucketCommand: vi.fn().mockImplementation((input) => ({
    input,
    name: 'GetVectorBucketCommand',
  })),
  ListVectorBucketsCommand: vi.fn().mockImplementation((input) => ({
    input,
    name: 'ListVectorBucketsCommand',
  })),
}));

function createMockBucketService(): BucketService {
  return {
    listVectorBuckets: vi.fn(),
    createVectorBucket: vi.fn(),
    deleteVectorBucket: vi.fn(),
    getVectorBucket: vi.fn(),
    putVectorBucketPolicy: vi.fn(),
    getVectorBucketPolicy: vi.fn(),
    deleteVectorBucketPolicy: vi.fn(),
  } as unknown as BucketService;
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

describe('VectorBuckets page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    useSettingsStore.setState(useSettingsStore.getInitialState());
  });

  it('renders loading state then empty state', async () => {
    const service = createMockBucketService();
    (service.listVectorBuckets as ReturnType<typeof vi.fn>).mockResolvedValue({
      vectorBuckets: [],
    });

    renderWithRouter(<VectorBucketsView bucketService={service} />);

    expect(screen.getByText('Vector Buckets')).toBeInTheDocument();
    expect(screen.getByTestId('create-bucket-button')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/no buckets yet/i)).toBeInTheDocument();
    });
  });

  it('renders bucket data in the table', async () => {
    const service = createMockBucketService();
    (service.listVectorBuckets as ReturnType<typeof vi.fn>).mockResolvedValue({
      vectorBuckets: [
        {
          vectorBucketName: 'alpha-bucket',
          vectorBucketArn: 'arn:aws:s3vectors:::vector-bucket/alpha-bucket',
          creationTime: new Date('2024-06-01T12:00:00Z'),
        },
        {
          vectorBucketName: 'beta-bucket',
          vectorBucketArn: 'arn:aws:s3vectors:::vector-bucket/beta-bucket',
          creationTime: new Date('2024-06-02T12:00:00Z'),
        },
      ],
    });

    renderWithRouter(<VectorBucketsView bucketService={service} />);

    await waitFor(() => {
      expect(screen.getByText('alpha-bucket')).toBeInTheDocument();
    });
    expect(screen.getByText('beta-bucket')).toBeInTheDocument();
    expect(
      screen.getByText('arn:aws:s3vectors:::vector-bucket/alpha-bucket')
    ).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(3); // header + 2 rows
  });

  it('filters buckets by name prefix via search', async () => {
    const service = createMockBucketService();
    (service.listVectorBuckets as ReturnType<typeof vi.fn>).mockResolvedValue({
      vectorBuckets: [
        {
          vectorBucketName: 'prod-bucket',
          vectorBucketArn: 'arn-1',
          creationTime: new Date(),
        },
        {
          vectorBucketName: 'dev-bucket',
          vectorBucketArn: 'arn-2',
          creationTime: new Date(),
        },
      ],
    });

    renderWithRouter(<VectorBucketsView bucketService={service} />);
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByText('prod-bucket')).toBeInTheDocument();
    });

    await user.type(screen.getByPlaceholderText(/search buckets/i), 'prod');

    await waitFor(() => {
      expect(screen.queryByText('dev-bucket')).not.toBeInTheDocument();
    });
    expect(screen.getByText('prod-bucket')).toBeInTheDocument();
  });

  it('shows clear filters link when search yields no results', async () => {
    const service = createMockBucketService();
    (service.listVectorBuckets as ReturnType<typeof vi.fn>).mockResolvedValue({
      vectorBuckets: [
        {
          vectorBucketName: 'bucket-1',
          vectorBucketArn: 'arn-1',
          creationTime: new Date(),
        },
      ],
    });

    renderWithRouter(<VectorBucketsView bucketService={service} />);
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByText('bucket-1')).toBeInTheDocument();
    });

    await user.type(screen.getByPlaceholderText(/search buckets/i), 'zzz');

    await waitFor(() => {
      expect(
        screen.getByText(/no buckets match your search/i)
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /clear filters/i }));

    await waitFor(() => {
      expect(screen.getByText('bucket-1')).toBeInTheDocument();
    });
  });

  it('displays error banner when listing buckets fails', async () => {
    const service = createMockBucketService();
    const error = new Error('Access denied');
    error.name = 'AccessDeniedException';
    (error as { code?: string }).code = 'AccessDeniedException';
    (service.listVectorBuckets as ReturnType<typeof vi.fn>).mockRejectedValue(
      error
    );

    renderWithRouter(<VectorBucketsView bucketService={service} />);

    await waitFor(() => {
      expect(screen.getByText(/accessdeniedexception/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/access denied/i)).toBeInTheDocument();
  });

  it('creates a bucket through the modal and refreshes the list', async () => {
    const service = createMockBucketService();
    (service.listVectorBuckets as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ vectorBuckets: [] })
      .mockResolvedValueOnce({
        vectorBuckets: [
          {
            vectorBucketName: 'new-bucket',
            vectorBucketArn: 'arn-new',
            creationTime: new Date(),
          },
        ],
      });
    (service.createVectorBucket as ReturnType<typeof vi.fn>).mockResolvedValue({
      vectorBucketArn: 'arn-new',
    });

    renderWithRouter(<VectorBucketsView bucketService={service} />);
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByText(/no buckets yet/i)).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('create-bucket-button'));
    const modal = screen.getByRole('dialog');

    await user.type(
      within(modal).getByPlaceholderText(/my-vector-bucket/i),
      'new-bucket'
    );
    await user.click(
      within(modal).getByRole('button', { name: /^create bucket$/i })
    );

    await waitFor(() => {
      expect(service.createVectorBucket).toHaveBeenCalledWith('new-bucket');
    });
    await waitFor(() => {
      expect(screen.getByText('new-bucket')).toBeInTheDocument();
    });
  });

  it('shows error in create modal when creation fails', async () => {
    const service = createMockBucketService();
    (service.listVectorBuckets as ReturnType<typeof vi.fn>).mockResolvedValue({
      vectorBuckets: [],
    });
    const error = new Error('Bucket already exists');
    error.name = 'ConflictException';
    (error as { code?: string }).code = 'ConflictException';
    (service.createVectorBucket as ReturnType<typeof vi.fn>).mockRejectedValue(
      error
    );

    renderWithRouter(<VectorBucketsView bucketService={service} />);
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByText(/no buckets yet/i)).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('create-bucket-button'));
    const modal = screen.getByRole('dialog');

    await user.type(
      within(modal).getByPlaceholderText(/my-vector-bucket/i),
      'dup-bucket'
    );
    await user.click(
      within(modal).getByRole('button', { name: /^create bucket$/i })
    );

    await waitFor(() => {
      expect(screen.getByText(/conflictexception/i)).toBeInTheDocument();
    });
  });

  it('deletes a bucket after confirming the danger dialog', async () => {
    const service = createMockBucketService();
    (service.listVectorBuckets as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        vectorBuckets: [
          {
            vectorBucketName: 'remove-me',
            vectorBucketArn: 'arn-rm',
            creationTime: new Date(),
          },
        ],
      })
      .mockResolvedValueOnce({ vectorBuckets: [] });
    (service.deleteVectorBucket as ReturnType<typeof vi.fn>).mockResolvedValue(
      {}
    );

    renderWithRouter(<VectorBucketsView bucketService={service} />);
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByText('remove-me')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /delete$/i }));

    const modal = screen.getByRole('dialog');
    expect(within(modal).getByText(/remove-me/)).toBeInTheDocument();
    expect(
      within(modal).getByText(/all indexes and vectors inside it will be lost/i)
    ).toBeInTheDocument();

    await user.click(
      within(modal).getByRole('button', { name: /^delete bucket$/i })
    );

    await waitFor(() => {
      expect(service.deleteVectorBucket).toHaveBeenCalledWith('remove-me');
    });
    await waitFor(() => {
      expect(screen.getByText(/no buckets yet/i)).toBeInTheDocument();
    });
  });

  it('shows error in delete modal when deletion fails', async () => {
    const service = createMockBucketService();
    (service.listVectorBuckets as ReturnType<typeof vi.fn>).mockResolvedValue({
      vectorBuckets: [
        {
          vectorBucketName: 'protected-bucket',
          vectorBucketArn: 'arn-p',
          creationTime: new Date(),
        },
      ],
    });
    const error = new Error('Not empty');
    error.name = 'ConflictException';
    (error as { code?: string }).code = 'ConflictException';
    (service.deleteVectorBucket as ReturnType<typeof vi.fn>).mockRejectedValue(
      error
    );

    renderWithRouter(<VectorBucketsView bucketService={service} />);
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByText('protected-bucket')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /delete$/i }));

    const modal = screen.getByRole('dialog');
    await user.click(
      within(modal).getByRole('button', { name: /^delete bucket$/i })
    );

    await waitFor(() => {
      expect(screen.getByText(/conflictexception/i)).toBeInTheDocument();
    });
  });

  it('navigates to bucket detail when view is clicked', async () => {
    const service = createMockBucketService();
    (service.listVectorBuckets as ReturnType<typeof vi.fn>).mockResolvedValue({
      vectorBuckets: [
        {
          vectorBucketName: 'detail-bucket',
          vectorBucketArn: 'arn-d',
          creationTime: new Date(),
        },
      ],
    });

    renderWithRouter(<VectorBucketsView bucketService={service} />);
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByText('detail-bucket')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /view/i }));

    await waitFor(() => {
      expect(screen.getByTestId('location-probe')).toHaveTextContent(
        '/buckets/detail-bucket'
      );
    });
  });

  it('reloads the list when refresh is clicked', async () => {
    const service = createMockBucketService();
    (service.listVectorBuckets as ReturnType<typeof vi.fn>).mockResolvedValue({
      vectorBuckets: [],
    });

    renderWithRouter(<VectorBucketsView bucketService={service} />);
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByText(/no buckets yet/i)).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('refresh-buckets-button'));

    await waitFor(() => {
      expect(service.listVectorBuckets).toHaveBeenCalledTimes(2);
    });
  });

  it('default component builds a bucket service from settings', async () => {
    useSettingsStore.getState().saveSettings({
      region: 'us-east-1',
      accessKeyId: 'AKIA',
      secretAccessKey: 'secret',
      sessionToken: '',
      endpoint: '',
      sessionOnly: false,
    });

    mockSend.mockResolvedValueOnce({ vectorBuckets: [] });

    renderWithRouter(<VectorBuckets />);

    await waitFor(() => {
      expect(screen.getByText(/no buckets yet/i)).toBeInTheDocument();
    });
  });
});
