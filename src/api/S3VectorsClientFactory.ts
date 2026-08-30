import {
  S3VectorsClient,
  ListVectorBucketsCommand,
  GetVectorBucketCommand,
  type ListVectorBucketsCommandOutput,
  type GetVectorBucketCommandOutput,
} from '@aws-sdk/client-s3vectors';

export interface ClientSettings {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
  endpoint?: string;
}

export class S3VectorsClientFactory {
  private client: S3VectorsClient | null = null;

  constructor(private settings: ClientSettings) {}

  updateSettings(settings: ClientSettings): void {
    this.settings = settings;
    this.client = null;
  }

  getClient(): S3VectorsClient {
    if (!this.client) {
      const config: ConstructorParameters<typeof S3VectorsClient>[0] = {
        region: this.settings.region,
        credentials: {
          accessKeyId: this.settings.accessKeyId,
          secretAccessKey: this.settings.secretAccessKey,
          ...(this.settings.sessionToken
            ? { sessionToken: this.settings.sessionToken }
            : {}),
        },
        ...(this.settings.endpoint ? { endpoint: this.settings.endpoint } : {}),
      };
      this.client = new S3VectorsClient(config);
    }
    return this.client;
  }

  async listVectorBuckets(): Promise<ListVectorBucketsCommandOutput> {
    const command = new ListVectorBucketsCommand({});
    return this.getClient().send(command);
  }

  async getVectorBucket(
    vectorBucketName: string
  ): Promise<GetVectorBucketCommandOutput> {
    const command = new GetVectorBucketCommand({ vectorBucketName });
    return this.getClient().send(command);
  }
}
