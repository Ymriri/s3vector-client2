import { describe, expect, it, vi } from 'vitest';
import { IndexService } from './indexes';

vi.mock('@aws-sdk/client-s3vectors', async () => {
  class C {
    input: unknown;
    constructor(input: unknown) {
      this.input = input;
    }
  }
  return {
    CreateIndexCommand: C,
    DeleteIndexCommand: C,
    GetIndexCommand: C,
    ListIndexesCommand: C,
  };
});

describe('IndexService', () => {
  function setup() {
    const send = vi.fn();
    const service = new IndexService({ getClient: () => ({ send }) } as never);
    return { service, send };
  }
  it('creates with typed defaults', async () => {
    const { service, send } = setup();
    send.mockResolvedValue({});
    await service.createIndex({
      bucketName: 'b',
      indexName: 'i',
      dimension: 3,
      distanceMetric: 'cosine',
    });
    expect(send.mock.calls[0][0].input).toMatchObject({
      vectorBucketName: 'b',
      dataType: 'float32',
      dimension: 3,
    });
  });
  it('wraps delete/get/list and propagates errors', async () => {
    const { service, send } = setup();
    send.mockResolvedValue({ indexes: [] });
    await service.deleteIndex('b', 'i');
    await service.getIndex('b', 'i');
    await service.listIndexes({
      vectorBucketName: 'b',
      maxResults: 2,
      nextToken: 'n',
    });
    expect(send).toHaveBeenCalledTimes(3);
    send.mockRejectedValueOnce(new Error('boom'));
    await expect(service.getIndex('b', 'i')).rejects.toThrow('boom');
  });
});
