import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VectorService, unwrapVectorData } from './vectors';
import { S3VectorsClientFactory } from './S3VectorsClientFactory';

const mockSend = vi.fn();

function commandMock(name: string) {
  return vi.fn().mockImplementation((input) => ({
    input,
    name,
  }));
}

vi.mock('@aws-sdk/client-s3vectors', () => {
  return {
    S3VectorsClient: vi.fn().mockImplementation(() => ({
      send: mockSend,
    })),
    PutVectorsCommand: commandMock('PutVectorsCommand'),
    GetVectorsCommand: commandMock('GetVectorsCommand'),
    ListVectorsCommand: commandMock('ListVectorsCommand'),
    DeleteVectorsCommand: commandMock('DeleteVectorsCommand'),
    QueryVectorsCommand: commandMock('QueryVectorsCommand'),
  };
});

import {
  S3VectorsClient,
  PutVectorsCommand,
  GetVectorsCommand,
  ListVectorsCommand,
  DeleteVectorsCommand,
  QueryVectorsCommand,
} from '@aws-sdk/client-s3vectors';

describe('VectorService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function createService() {
    const factory = new S3VectorsClientFactory({
      region: 'us-east-1',
      accessKeyId: 'A',
      secretAccessKey: 'B',
    });
    return { factory, service: new VectorService(factory) };
  }

  describe('putVectors', () => {
    it('sends PutVectorsCommand with wrapped float32 data and metadata', async () => {
      const { service } = createService();
      mockSend.mockResolvedValueOnce({});

      const result = await service.putVectors('my-bucket', 'my-index', [
        {
          key: 'vec-1',
          data: [1, 2, 3],
          metadata: { color: 'red' },
        },
        { key: 'vec-2', data: [4, 5, 6] },
      ]);

      expect(PutVectorsCommand).toHaveBeenCalledWith({
        vectorBucketName: 'my-bucket',
        indexName: 'my-index',
        vectors: [
          {
            key: 'vec-1',
            data: { float32: [1, 2, 3] },
            metadata: { color: 'red' },
          },
          { key: 'vec-2', data: { float32: [4, 5, 6] } },
        ],
      });
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'PutVectorsCommand' })
      );
      expect(result).toEqual({});
    });

    it('rejects with SDK errors', async () => {
      const { service } = createService();
      const error = new Error('Validation failed');
      error.name = 'ValidationException';
      (error as { code?: string }).code = 'ValidationException';
      mockSend.mockRejectedValueOnce(error);

      await expect(
        service.putVectors('my-bucket', 'my-index', [
          { key: 'vec-1', data: [1] },
        ])
      ).rejects.toBe(error);
    });
  });

  describe('getVectors', () => {
    it('sends GetVectorsCommand with keys and option flags', async () => {
      const { service } = createService();
      mockSend.mockResolvedValueOnce({
        vectors: [{ key: 'vec-1', data: { float32: [1, 2, 3] } }],
      });

      const result = await service.getVectors('b', 'i', ['vec-1'], {
        returnData: true,
        returnMetadata: true,
      });

      expect(GetVectorsCommand).toHaveBeenCalledWith({
        vectorBucketName: 'b',
        indexName: 'i',
        keys: ['vec-1'],
        returnData: true,
        returnMetadata: true,
      });
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'GetVectorsCommand' })
      );
      expect(result.vectors).toHaveLength(1);
    });

    it('rejects with SDK errors', async () => {
      const { service } = createService();
      const error = new Error('Not found');
      error.name = 'NotFoundException';
      (error as { code?: string }).code = 'NotFoundException';
      mockSend.mockRejectedValueOnce(error);

      await expect(service.getVectors('b', 'i', ['missing'])).rejects.toBe(
        error
      );
    });
  });

  describe('listVectors', () => {
    it('sends ListVectorsCommand with pagination and return flags', async () => {
      const { service } = createService();
      mockSend.mockResolvedValueOnce({
        vectors: [{ key: 'vec-1' }],
        nextToken: 'next',
      });

      const result = await service.listVectors('b', 'i', {
        maxResults: 50,
        nextToken: 'token',
        returnData: true,
        returnMetadata: false,
        segmentCount: 4,
        segmentIndex: 1,
      });

      expect(ListVectorsCommand).toHaveBeenCalledWith({
        vectorBucketName: 'b',
        indexName: 'i',
        maxResults: 50,
        nextToken: 'token',
        returnData: true,
        returnMetadata: false,
        segmentCount: 4,
        segmentIndex: 1,
      });
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'ListVectorsCommand' })
      );
      expect(result.vectors).toHaveLength(1);
      expect(result.nextToken).toBe('next');
    });

    it('rejects with SDK errors', async () => {
      const { service } = createService();
      const error = new Error('Access denied');
      error.name = 'AccessDeniedException';
      (error as { code?: string }).code = 'AccessDeniedException';
      mockSend.mockRejectedValueOnce(error);

      await expect(service.listVectors('b', 'i')).rejects.toBe(error);
    });
  });

  describe('deleteVectors', () => {
    it('sends DeleteVectorsCommand with keys', async () => {
      const { service } = createService();
      mockSend.mockResolvedValueOnce({});

      const result = await service.deleteVectors('b', 'i', ['vec-1', 'vec-2']);

      expect(DeleteVectorsCommand).toHaveBeenCalledWith({
        vectorBucketName: 'b',
        indexName: 'i',
        keys: ['vec-1', 'vec-2'],
      });
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'DeleteVectorsCommand' })
      );
      expect(result).toEqual({});
    });

    it('rejects with SDK errors', async () => {
      const { service } = createService();
      const error = new Error('Conflict');
      error.name = 'ConflictException';
      (error as { code?: string }).code = 'ConflictException';
      mockSend.mockRejectedValueOnce(error);

      await expect(service.deleteVectors('b', 'i', ['vec-1'])).rejects.toBe(
        error
      );
    });
  });

  describe('queryVectors', () => {
    it('sends QueryVectorsCommand with wrapped query vector and filter', async () => {
      const { service } = createService();
      mockSend.mockResolvedValueOnce({
        vectors: [{ key: 'vec-1', distance: 0.5 }],
        distanceMetric: 'cosine',
      });

      const result = await service.queryVectors('b', 'i', {
        queryVector: [0.1, 0.2, 0.3],
        topK: 10,
        filter: { color: 'red' },
        returnDistance: true,
        returnMetadata: true,
      });

      expect(QueryVectorsCommand).toHaveBeenCalledWith({
        vectorBucketName: 'b',
        indexName: 'i',
        queryVector: { float32: [0.1, 0.2, 0.3] },
        topK: 10,
        filter: { color: 'red' },
        returnDistance: true,
        returnMetadata: true,
      });
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'QueryVectorsCommand' })
      );
      expect(result.vectors).toHaveLength(1);
      expect(result.distanceMetric).toBe('cosine');
    });

    it('rejects with SDK errors', async () => {
      const { service } = createService();
      const error = new Error('Access denied');
      error.name = 'AccessDeniedException';
      (error as { code?: string }).code = 'AccessDeniedException';
      mockSend.mockRejectedValueOnce(error);

      await expect(
        service.queryVectors('b', 'i', { queryVector: [1], topK: 1 })
      ).rejects.toBe(error);
    });
  });

  it('uses the same underlying client from the factory', () => {
    const { factory, service } = createService();
    const client1 = factory.getClient();
    const client2 = (
      service as unknown as { factory: S3VectorsClientFactory }
    ).factory.getClient();
    expect(client1).toBe(client2);
    expect(S3VectorsClient).toHaveBeenCalledTimes(1);
  });

  describe('unwrapVectorData', () => {
    it('returns float32 array from VectorData union', () => {
      expect(unwrapVectorData({ float32: [1, 2, 3] })).toEqual([1, 2, 3]);
    });

    it('returns undefined for unknown union members or missing data', () => {
      expect(unwrapVectorData(undefined)).toBeUndefined();
      expect(unwrapVectorData({} as never)).toBeUndefined();
    });
  });
});
