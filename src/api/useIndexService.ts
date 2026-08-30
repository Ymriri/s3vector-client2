import { useMemo } from 'react';
import { useSettingsStore } from '../settings/settingsStore';
import { S3VectorsClientFactory } from './S3VectorsClientFactory';
import { IndexService } from './indexes';

export function useIndexService(): IndexService {
  const settings = useSettingsStore();
  return useMemo(
    () =>
      new IndexService(
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
