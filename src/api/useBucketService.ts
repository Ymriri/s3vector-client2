import { useMemo } from 'react';
import { useSettingsStore } from '../settings/settingsStore';
import { S3VectorsClientFactory } from './S3VectorsClientFactory';
import { BucketService } from './buckets';

export function useBucketService(): BucketService {
  const settings = useSettingsStore();
  return useMemo(
    () =>
      new BucketService(
        new S3VectorsClientFactory({
          region: settings.region,
          accessKeyId: settings.accessKeyId,
          secretAccessKey: settings.secretAccessKey,
          sessionToken: settings.sessionToken || undefined,
          endpoint: settings.endpoint || undefined,
        })
      ),
    [settings]
  );
}
