import { useMemo } from 'react';
import { useSettingsStore } from '../settings/settingsStore';
import { S3VectorsClientFactory } from './S3VectorsClientFactory';
import { VectorService } from './vectors';

export function useVectorService(): VectorService {
  const settings = useSettingsStore();
  return useMemo(
    () =>
      new VectorService(
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
