import { describe, it, expect, vi, beforeEach } from 'vitest';
import { S3VectorsClientFactory } from './S3VectorsClientFactory';

const mockSend = vi.fn();
const mockMiddlewareAdd = vi.fn();

vi.mock('@aws-sdk/client-s3vectors', () => {
  return {
    S3VectorsClient: vi.fn().mockImplementation(() => ({
      send: mockSend,
      middlewareStack: { add: mockMiddlewareAdd },
    })),
  };
});

import { S3VectorsClient } from '@aws-sdk/client-s3vectors';
import {
  relayTargetMiddleware,
  SAME_ORIGIN_RELAY_PATH,
} from './S3VectorsClientFactory';

const MOCKED_CLIENT = vi.mocked(S3VectorsClient);

function lastConstructorCall() {
  return MOCKED_CLIENT.mock.calls[MOCKED_CLIENT.mock.calls.length - 1][0];
}

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

    expect(lastConstructorCall()).toEqual({
      region: 'us-west-2',
      credentials: {
        accessKeyId: 'AKIA',
        secretAccessKey: 'secret',
      },
    });
    expect(mockMiddlewareAdd).not.toHaveBeenCalled();
  });

  it('passes session token when provided', () => {
    const factory = new S3VectorsClientFactory({
      region: 'eu-central-1',
      accessKeyId: 'AKIA2',
      secretAccessKey: 'secret2',
      sessionToken: 'token',
    });
    factory.getClient();

    expect(lastConstructorCall()).toEqual({
      region: 'eu-central-1',
      credentials: {
        accessKeyId: 'AKIA2',
        secretAccessKey: 'secret2',
        sessionToken: 'token',
      },
    });
  });

  it('relays browser requests for a custom endpoint through same origin', async () => {
    const factory = new S3VectorsClientFactory({
      region: 'us-east-1',
      accessKeyId: 'AKIA3',
      secretAccessKey: 'secret3',
      endpoint: 'http://10.212.24.223:12001',
    });
    factory.getClient();

    expect(lastConstructorCall()).toEqual({
      region: 'us-east-1',
      credentials: {
        accessKeyId: 'AKIA3',
        secretAccessKey: 'secret3',
      },
      endpoint: `${window.location.origin}${SAME_ORIGIN_RELAY_PATH}`,
    });
    expect(mockMiddlewareAdd).toHaveBeenCalledTimes(1);
    const [handler, options] = mockMiddlewareAdd.mock.calls[0];
    expect(options).toMatchObject({ step: 'build', name: 's3vRelayTarget' });
    // The middleware stamps the real endpoint as the relay target header.
    const inner = (
      handler as unknown as (
        next: (args: unknown) => Promise<unknown>
      ) => (args: unknown) => Promise<unknown>
    )((args: unknown) => Promise.resolve(args));
    const headers: Record<string, unknown> = {};
    const args = { request: { headers } };
    const result = (await inner(args)) as typeof args;
    expect(headers['x-s3v-target']).toBe('http://10.212.24.223:12001');
    expect(result.request.headers).toBe(headers);
  });

  it('does not relay when explicitly disabled', () => {
    const factory = new S3VectorsClientFactory({
      region: 'us-east-1',
      accessKeyId: 'AKIA3',
      secretAccessKey: 'secret3',
      endpoint: 'http://localhost:9000',
      relay: false,
    });
    factory.getClient();

    expect(lastConstructorCall()).toMatchObject({
      endpoint: 'http://localhost:9000',
    });
    expect(mockMiddlewareAdd).not.toHaveBeenCalled();
  });

  it('does not relay official AWS endpoints', () => {
    const factory = new S3VectorsClientFactory({
      region: 'us-east-1',
      accessKeyId: 'AKIA5',
      secretAccessKey: 'secret5',
      endpoint: 'https://s3vectors.us-east-1.api.aws',
    });
    factory.getClient();

    expect(lastConstructorCall()).toMatchObject({
      endpoint: 'https://s3vectors.us-east-1.api.aws',
    });
    expect(mockMiddlewareAdd).not.toHaveBeenCalled();
  });

  it('does not double-relay an already-relayed endpoint', () => {
    const factory = new S3VectorsClientFactory({
      region: 'us-east-1',
      accessKeyId: 'AKIA4',
      secretAccessKey: 'secret4',
      endpoint: `${window.location.origin}${SAME_ORIGIN_RELAY_PATH}`,
    });
    factory.getClient();

    expect(lastConstructorCall()).toMatchObject({
      endpoint: `${window.location.origin}${SAME_ORIGIN_RELAY_PATH}`,
    });
    expect(mockMiddlewareAdd).not.toHaveBeenCalled();
  });

  it('relayTargetMiddleware leaves requests without headers untouched', async () => {
    const inner = relayTargetMiddleware('http://t')(() =>
      Promise.resolve('ok')
    );
    await expect(inner({ request: {} })).resolves.toBe('ok');
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
    expect(MOCKED_CLIENT).toHaveBeenCalledTimes(1);
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

    expect(MOCKED_CLIENT).toHaveBeenCalledTimes(2);
  });
});
