import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BucketService } from './buckets';
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
    CreateVectorBucketCommand: commandMock('CreateVectorBucketCommand'),
    DeleteVectorBucketCommand: commandMock('DeleteVectorBucketCommand'),
    DeleteVectorBucketPolicyCommand: commandMock(
      'DeleteVectorBucketPolicyCommand'
    ),
    GetVectorBucketCommand: commandMock('GetVectorBucketCommand'),
    GetVectorBucketPolicyCommand: commandMock('GetVectorBucketPolicyCommand'),
    ListVectorBucketsCommand: commandMock('ListVectorBucketsCommand'),
    PutVectorBucketPolicyCommand: commandMock('PutVectorBucketPolicyCommand'),
  };
});

import {
  S3VectorsClient,
  CreateVectorBucketCommand,
  DeleteVectorBucketCommand,
  DeleteVectorBucketPolicyCommand,
  GetVectorBucketCommand,
  GetVectorBucketPolicyCommand,
  ListVectorBucketsCommand,
  PutVectorBucketPolicyCommand,
} from '@aws-sdk/client-s3vectors';

describe('BucketService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function createService() {
    const factory = new S3VectorsClientFactory({
      region: 'us-east-1',
      accessKeyId: 'A',
      secretAccessKey: 'B',
    });
    return { factory, service: new BucketService(factory) };
  }

  describe('createVectorBucket', () => {
    it('sends CreateVectorBucketCommand with the bucket name', async () => {
      const { service } = createService();
      mockSend.mockResolvedValueOnce({
        vectorBucketArn: 'arn:aws:s3vectors:::vector-bucket/my-bucket',
      });

      const result = await service.createVectorBucket('my-bucket');

      expect(CreateVectorBucketCommand).toHaveBeenCalledWith({
        vectorBucketName: 'my-bucket',
      });
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'CreateVectorBucketCommand' })
      );
      expect(result.vectorBucketArn).toBe(
        'arn:aws:s3vectors:::vector-bucket/my-bucket'
      );
    });

    it('passes optional encryption and tags', async () => {
      const { service } = createService();
      mockSend.mockResolvedValueOnce({ vectorBucketArn: 'arn' });

      await service.createVectorBucket('my-bucket', {
        encryptionConfiguration: { sseType: 'AES256' },
        tags: { env: 'test' },
      });

      expect(CreateVectorBucketCommand).toHaveBeenCalledWith({
        vectorBucketName: 'my-bucket',
        encryptionConfiguration: { sseType: 'AES256' },
        tags: { env: 'test' },
      });
    });

    it('rejects with SDK errors', async () => {
      const { service } = createService();
      const error = new Error('Bucket already exists');
      error.name = 'ConflictException';
      (error as { code?: string }).code = 'ConflictException';
      mockSend.mockRejectedValueOnce(error);

      await expect(service.createVectorBucket('my-bucket')).rejects.toBe(error);
    });
  });

  describe('deleteVectorBucket', () => {
    it('sends DeleteVectorBucketCommand with the bucket name', async () => {
      const { service } = createService();
      mockSend.mockResolvedValueOnce({});

      const result = await service.deleteVectorBucket('my-bucket');

      expect(DeleteVectorBucketCommand).toHaveBeenCalledWith({
        vectorBucketName: 'my-bucket',
      });
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'DeleteVectorBucketCommand' })
      );
      expect(result).toEqual({});
    });

    it('rejects with SDK errors', async () => {
      const { service } = createService();
      const error = new Error('Not found');
      error.name = 'NotFoundException';
      (error as { code?: string }).code = 'NotFoundException';
      mockSend.mockRejectedValueOnce(error);

      await expect(service.deleteVectorBucket('my-bucket')).rejects.toBe(error);
    });
  });

  describe('getVectorBucket', () => {
    it('sends GetVectorBucketCommand and returns bucket details', async () => {
      const { service } = createService();
      const creationTime = new Date('2024-01-15T00:00:00Z');
      mockSend.mockResolvedValueOnce({
        vectorBucket: {
          vectorBucketName: 'my-bucket',
          vectorBucketArn: 'arn-2',
          creationTime,
        },
      });

      const result = await service.getVectorBucket('my-bucket');

      expect(GetVectorBucketCommand).toHaveBeenCalledWith({
        vectorBucketName: 'my-bucket',
      });
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'GetVectorBucketCommand' })
      );
      expect(result.vectorBucket?.vectorBucketName).toBe('my-bucket');
      expect(result.vectorBucket?.creationTime).toEqual(creationTime);
    });

    it('rejects with SDK errors', async () => {
      const { service } = createService();
      const error = new Error('Access denied');
      error.name = 'AccessDeniedException';
      (error as { code?: string }).code = 'AccessDeniedException';
      mockSend.mockRejectedValueOnce(error);

      await expect(service.getVectorBucket('my-bucket')).rejects.toBe(error);
    });
  });

  describe('listVectorBuckets', () => {
    it('sends ListVectorBucketsCommand and returns bucket summaries', async () => {
      const { service } = createService();
      mockSend.mockResolvedValueOnce({
        vectorBuckets: [
          {
            vectorBucketName: 'bucket-1',
            vectorBucketArn: 'arn-1',
            creationTime: new Date(),
          },
        ],
      });

      const result = await service.listVectorBuckets();

      expect(ListVectorBucketsCommand).toHaveBeenCalledWith({});
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'ListVectorBucketsCommand' })
      );
      expect(result.vectorBuckets ?? []).toHaveLength(1);
      expect((result.vectorBuckets ?? [])[0].vectorBucketName).toBe('bucket-1');
    });

    it('passes prefix, maxResults and nextToken when provided', async () => {
      const { service } = createService();
      mockSend.mockResolvedValueOnce({ vectorBuckets: [] });

      await service.listVectorBuckets({
        prefix: 'prod',
        maxResults: 10,
        nextToken: 'token-1',
      });

      expect(ListVectorBucketsCommand).toHaveBeenCalledWith({
        prefix: 'prod',
        maxResults: 10,
        nextToken: 'token-1',
      });
    });

    it('rejects with SDK errors', async () => {
      const { service } = createService();
      const error = new Error('Networking error');
      error.name = 'NetworkingError';
      (error as { code?: string }).code = 'NetworkingError';
      mockSend.mockRejectedValueOnce(error);

      await expect(service.listVectorBuckets()).rejects.toBe(error);
    });
  });

  describe('putVectorBucketPolicy', () => {
    it('sends PutVectorBucketPolicyCommand with the bucket name and policy', async () => {
      const { service } = createService();
      mockSend.mockResolvedValueOnce({});
      const policy = JSON.stringify({ Version: '2012-10-17' });

      const result = await service.putVectorBucketPolicy('my-bucket', policy);

      expect(PutVectorBucketPolicyCommand).toHaveBeenCalledWith({
        vectorBucketName: 'my-bucket',
        policy,
      });
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'PutVectorBucketPolicyCommand' })
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
        service.putVectorBucketPolicy('my-bucket', '{}')
      ).rejects.toBe(error);
    });
  });

  describe('getVectorBucketPolicy', () => {
    it('sends GetVectorBucketPolicyCommand and returns the policy', async () => {
      const { service } = createService();
      const policy = JSON.stringify({ Version: '2012-10-17' });
      mockSend.mockResolvedValueOnce({ policy });

      const result = await service.getVectorBucketPolicy('my-bucket');

      expect(GetVectorBucketPolicyCommand).toHaveBeenCalledWith({
        vectorBucketName: 'my-bucket',
      });
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'GetVectorBucketPolicyCommand' })
      );
      expect(result.policy).toBe(policy);
    });

    it('rejects with SDK errors', async () => {
      const { service } = createService();
      const error = new Error('NoSuchBucket');
      error.name = 'NoSuchBucket';
      (error as { code?: string }).code = 'NoSuchBucket';
      mockSend.mockRejectedValueOnce(error);

      await expect(service.getVectorBucketPolicy('my-bucket')).rejects.toBe(
        error
      );
    });
  });

  describe('deleteVectorBucketPolicy', () => {
    it('sends DeleteVectorBucketPolicyCommand with the bucket name', async () => {
      const { service } = createService();
      mockSend.mockResolvedValueOnce({});

      const result = await service.deleteVectorBucketPolicy('my-bucket');

      expect(DeleteVectorBucketPolicyCommand).toHaveBeenCalledWith({
        vectorBucketName: 'my-bucket',
      });
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'DeleteVectorBucketPolicyCommand' })
      );
      expect(result).toEqual({});
    });

    it('rejects with SDK errors', async () => {
      const { service } = createService();
      const error = new Error('Access denied');
      error.name = 'AccessDeniedException';
      (error as { code?: string }).code = 'AccessDeniedException';
      mockSend.mockRejectedValueOnce(error);

      await expect(service.deleteVectorBucketPolicy('my-bucket')).rejects.toBe(
        error
      );
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
});
