import { describe, it, expect, vi, beforeEach } from 'vitest';
import { S3VectorsClientFactory } from './S3VectorsClientFactory';

const mockSend = vi.fn();

vi.mock('@aws-sdk/client-s3vectors', () => {
  return {
    S3VectorsClient: vi.fn().mockImplementation(() => ({
      send: mockSend,
    })),
    ListVectorBucketsCommand: vi.fn().mockImplementation((input) => ({
      input,
      name: 'ListVectorBucketsCommand',
    })),
    GetVectorBucketCommand: vi.fn().mockImplementation((input) => ({
      input,
      name: 'GetVectorBucketCommand',
    })),
  };
});

import {
  S3VectorsClient,
  ListVectorBucketsCommand,
  GetVectorBucketCommand,
} from '@aws-sdk/client-s3vectors';

describe('S3VectorsClientFactory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates client with region and credentials', () => {
    const factory = new S3VectorsClientFactory({
      region: 'us-west-2',
      accessKeyId: 'AKIA',
      secretAccessKey: 'secret',
    });
    factory.getClient();

    expect(S3VectorsClient).toHaveBeenCalledWith({
      region: 'us-west-2',
      credentials: {
        accessKeyId: 'AKIA',
        secretAccessKey: 'secret',
      },
    });
  });

  it('passes session token when provided', () => {
    const factory = new S3VectorsClientFactory({
      region: 'eu-central-1',
      accessKeyId: 'AKIA2',
      secretAccessKey: 'secret2',
      sessionToken: 'token',
    });
    factory.getClient();

    expect(S3VectorsClient).toHaveBeenCalledWith({
      region: 'eu-central-1',
      credentials: {
        accessKeyId: 'AKIA2',
        secretAccessKey: 'secret2',
        sessionToken: 'token',
      },
    });
  });

  it('passes endpoint override when provided', () => {
    const factory = new S3VectorsClientFactory({
      region: 'us-east-1',
      accessKeyId: 'AKIA3',
      secretAccessKey: 'secret3',
      endpoint: 'http://localhost:9000',
    });
    factory.getClient();

    expect(S3VectorsClient).toHaveBeenCalledWith({
      region: 'us-east-1',
      credentials: {
        accessKeyId: 'AKIA3',
        secretAccessKey: 'secret3',
      },
      endpoint: 'http://localhost:9000',
    });
  });

  it('reuses the same client instance', () => {
    const factory = new S3VectorsClientFactory({
      region: 'us-east-1',
      accessKeyId: 'A',
      secretAccessKey: 'B',
    });

    const client1 = factory.getClient();
    const client2 = factory.getClient();

    expect(client1).toBe(client2);
    expect(S3VectorsClient).toHaveBeenCalledTimes(1);
  });

  it('creates a new client when settings change', () => {
    const factory = new S3VectorsClientFactory({
      region: 'us-east-1',
      accessKeyId: 'A',
      secretAccessKey: 'B',
    });
    factory.getClient();

    factory.updateSettings({
      region: 'us-west-2',
      accessKeyId: 'C',
      secretAccessKey: 'D',
    });
    factory.getClient();

    expect(S3VectorsClient).toHaveBeenCalledTimes(2);
  });

  describe('listVectorBuckets', () => {
    it('sends ListVectorBucketsCommand and returns bucket summaries', async () => {
      const factory = new S3VectorsClientFactory({
        region: 'us-east-1',
        accessKeyId: 'A',
        secretAccessKey: 'B',
      });

      mockSend.mockResolvedValueOnce({
        vectorBuckets: [
          {
            vectorBucketName: 'bucket-1',
            vectorBucketArn: 'arn-1',
            creationTime: new Date(),
          },
        ],
      });

      const result = await factory.listVectorBuckets();

      expect(ListVectorBucketsCommand).toHaveBeenCalledWith({});
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'ListVectorBucketsCommand' })
      );
      expect(result.vectorBuckets ?? []).toHaveLength(1);
      expect((result.vectorBuckets ?? [])[0].vectorBucketName).toBe('bucket-1');
    });
  });

  describe('getVectorBucket', () => {
    it('sends GetVectorBucketCommand with the bucket name', async () => {
      const factory = new S3VectorsClientFactory({
        region: 'us-east-1',
        accessKeyId: 'A',
        secretAccessKey: 'B',
      });

      mockSend.mockResolvedValueOnce({
        vectorBucket: {
          vectorBucketName: 'my-bucket',
          vectorBucketArn: 'arn-2',
          creationTime: new Date(),
        },
      });

      const result = await factory.getVectorBucket('my-bucket');

      expect(GetVectorBucketCommand).toHaveBeenCalledWith({
        vectorBucketName: 'my-bucket',
      });
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'GetVectorBucketCommand' })
      );
      expect(result.vectorBucket?.vectorBucketName).toBe('my-bucket');
    });
  });
});
