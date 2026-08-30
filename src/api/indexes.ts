import {
  CreateIndexCommand,
  DeleteIndexCommand,
  GetIndexCommand,
  ListIndexesCommand,
  type CreateIndexCommandOutput,
  type DeleteIndexCommandOutput,
  type GetIndexCommandOutput,
  type ListIndexesCommandInput,
  type ListIndexesCommandOutput,
  type DistanceMetric,
  type MetadataConfiguration,
} from '@aws-sdk/client-s3vectors';
import type { S3VectorsClientFactory } from './S3VectorsClientFactory';

export interface CreateIndexOptions {
  bucketName: string;
  indexName: string;
  dimension: number;
  distanceMetric: DistanceMetric;
  metadataConfiguration?: MetadataConfiguration;
}

export class IndexService {
  constructor(private factory: S3VectorsClientFactory) {}

  async createIndex(
    options: CreateIndexOptions
  ): Promise<CreateIndexCommandOutput> {
    const command = new CreateIndexCommand({
      vectorBucketName: options.bucketName,
      indexName: options.indexName,
      dataType: 'float32',
      dimension: options.dimension,
      distanceMetric: options.distanceMetric,
      metadataConfiguration: options.metadataConfiguration,
    });
    return this.factory.getClient().send(command);
  }

  async deleteIndex(
    bucketName: string,
    indexName: string
  ): Promise<DeleteIndexCommandOutput> {
    return this.factory
      .getClient()
      .send(
        new DeleteIndexCommand({ vectorBucketName: bucketName, indexName })
      );
  }

  async getIndex(
    bucketName: string,
    indexName: string
  ): Promise<GetIndexCommandOutput> {
    return this.factory
      .getClient()
      .send(new GetIndexCommand({ vectorBucketName: bucketName, indexName }));
  }

  async listIndexes(
    input: ListIndexesCommandInput = {}
  ): Promise<ListIndexesCommandOutput> {
    return this.factory.getClient().send(new ListIndexesCommand(input));
  }
}
