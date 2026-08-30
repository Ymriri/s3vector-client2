import {
  CreateVectorBucketCommand,
  DeleteVectorBucketCommand,
  DeleteVectorBucketPolicyCommand,
  GetVectorBucketCommand,
  GetVectorBucketPolicyCommand,
  ListVectorBucketsCommand,
  PutVectorBucketPolicyCommand,
  type CreateVectorBucketCommandInput,
  type CreateVectorBucketCommandOutput,
  type DeleteVectorBucketCommandOutput,
  type DeleteVectorBucketPolicyCommandOutput,
  type GetVectorBucketCommandOutput,
  type GetVectorBucketPolicyCommandOutput,
  type ListVectorBucketsCommandInput,
  type ListVectorBucketsCommandOutput,
  type PutVectorBucketPolicyCommandOutput,
} from '@aws-sdk/client-s3vectors';
import type { S3VectorsClientFactory } from './S3VectorsClientFactory';

export class BucketService {
  constructor(private factory: S3VectorsClientFactory) {}

  async createVectorBucket(
    vectorBucketName: string,
    input?: Omit<CreateVectorBucketCommandInput, 'vectorBucketName'>
  ): Promise<CreateVectorBucketCommandOutput> {
    const command = new CreateVectorBucketCommand({
      vectorBucketName,
      ...input,
    });
    return this.factory.getClient().send(command);
  }

  async deleteVectorBucket(
    vectorBucketName: string
  ): Promise<DeleteVectorBucketCommandOutput> {
    const command = new DeleteVectorBucketCommand({ vectorBucketName });
    return this.factory.getClient().send(command);
  }

  async getVectorBucket(
    vectorBucketName: string
  ): Promise<GetVectorBucketCommandOutput> {
    const command = new GetVectorBucketCommand({ vectorBucketName });
    return this.factory.getClient().send(command);
  }

  async listVectorBuckets(
    input?: ListVectorBucketsCommandInput
  ): Promise<ListVectorBucketsCommandOutput> {
    const command = new ListVectorBucketsCommand(input ?? {});
    return this.factory.getClient().send(command);
  }

  async putVectorBucketPolicy(
    vectorBucketName: string,
    policy: string
  ): Promise<PutVectorBucketPolicyCommandOutput> {
    const command = new PutVectorBucketPolicyCommand({
      vectorBucketName,
      policy,
    });
    return this.factory.getClient().send(command);
  }

  async getVectorBucketPolicy(
    vectorBucketName: string
  ): Promise<GetVectorBucketPolicyCommandOutput> {
    const command = new GetVectorBucketPolicyCommand({ vectorBucketName });
    return this.factory.getClient().send(command);
  }

  async deleteVectorBucketPolicy(
    vectorBucketName: string
  ): Promise<DeleteVectorBucketPolicyCommandOutput> {
    const command = new DeleteVectorBucketPolicyCommand({ vectorBucketName });
    return this.factory.getClient().send(command);
  }
}
