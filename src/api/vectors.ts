import {
  DeleteVectorsCommand,
  GetVectorsCommand,
  ListVectorsCommand,
  PutVectorsCommand,
  QueryVectorsCommand,
  type DeleteVectorsCommandOutput,
  type GetVectorsCommandInput,
  type GetVectorsCommandOutput,
  type ListVectorsCommandInput,
  type ListVectorsCommandOutput,
  type PutVectorsCommandOutput,
  type QueryVectorsCommandInput,
  type QueryVectorsCommandOutput,
  type VectorData,
} from '@aws-sdk/client-s3vectors';
import type { DocumentType } from '@smithy/types';
import type { S3VectorsClientFactory } from './S3VectorsClientFactory';

export interface VectorInput {
  key: string;
  data: number[];
  metadata?: Record<string, unknown>;
}

export interface QueryVectorsOptions {
  queryVector: number[];
  topK: number;
  filter?: Record<string, unknown>;
  returnDistance?: boolean;
  returnMetadata?: boolean;
  nextToken?: string;
}

export function unwrapVectorData(
  data: VectorData | undefined
): number[] | undefined {
  if (data && 'float32' in data && Array.isArray(data.float32)) {
    return data.float32;
  }
  return undefined;
}

export class VectorService {
  constructor(private factory: S3VectorsClientFactory) {}

  async putVectors(
    vectorBucketName: string,
    indexName: string,
    vectors: VectorInput[]
  ): Promise<PutVectorsCommandOutput> {
    const command = new PutVectorsCommand({
      vectorBucketName,
      indexName,
      vectors: vectors.map((v) => ({
        key: v.key,
        data: { float32: v.data },
        ...(v.metadata !== undefined
          ? { metadata: v.metadata as DocumentType }
          : {}),
      })),
    });
    return this.factory.getClient().send(command);
  }

  async getVectors(
    vectorBucketName: string,
    indexName: string,
    keys: string[],
    options?: {
      returnData?: boolean;
      returnMetadata?: boolean;
    }
  ): Promise<GetVectorsCommandOutput> {
    const input: GetVectorsCommandInput = {
      vectorBucketName,
      indexName,
      keys,
      ...options,
    };
    return this.factory.getClient().send(new GetVectorsCommand(input));
  }

  async listVectors(
    vectorBucketName: string,
    indexName: string,
    options?: {
      maxResults?: number;
      nextToken?: string;
      returnData?: boolean;
      returnMetadata?: boolean;
      segmentCount?: number;
      segmentIndex?: number;
    }
  ): Promise<ListVectorsCommandOutput> {
    const input: ListVectorsCommandInput = {
      vectorBucketName,
      indexName,
      ...options,
    };
    return this.factory.getClient().send(new ListVectorsCommand(input));
  }

  async deleteVectors(
    vectorBucketName: string,
    indexName: string,
    keys: string[]
  ): Promise<DeleteVectorsCommandOutput> {
    const command = new DeleteVectorsCommand({
      vectorBucketName,
      indexName,
      keys,
    });
    return this.factory.getClient().send(command);
  }

  async queryVectors(
    vectorBucketName: string,
    indexName: string,
    options: QueryVectorsOptions
  ): Promise<QueryVectorsCommandOutput> {
    const input: QueryVectorsCommandInput = {
      vectorBucketName,
      indexName,
      topK: options.topK,
      queryVector: { float32: options.queryVector },
      ...(options.filter !== undefined
        ? {
            filter: options.filter as QueryVectorsCommandInput['filter'],
          }
        : {}),
      ...(options.returnDistance !== undefined
        ? { returnDistance: options.returnDistance }
        : {}),
      ...(options.returnMetadata !== undefined
        ? { returnMetadata: options.returnMetadata }
        : {}),
      ...(options.nextToken !== undefined
        ? { nextToken: options.nextToken }
        : {}),
    };
    return this.factory.getClient().send(new QueryVectorsCommand(input));
  }
}
