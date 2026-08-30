import { useEffect, useState } from 'react';
import { Breadcrumb, Card, Space, Spin, Typography } from 'antd';
import { Link } from 'react-router-dom';
import type { BucketService } from '../api/buckets';
import { useBucketService } from '../api/useBucketService';
import type { IndexService } from '../api/indexes';
import { useIndexService } from '../api/useIndexService';
import type { VectorService } from '../api/vectors';
import { useVectorService } from '../api/useVectorService';
import { QueryForm } from '../components/QueryForm';
import { ErrorBanner, type AwsErrorLike } from '../components/ErrorBanner';
import { errorFromCaught } from '../lib/error';

export interface QueryConsoleViewProps {
  bucketService: BucketService;
  indexService: IndexService;
  vectorService: VectorService;
}

interface BucketOption {
  value: string;
  label: string;
}

interface IndexOption {
  value: string;
  label: string;
}

export function QueryConsoleView({
  bucketService,
  indexService,
  vectorService,
}: QueryConsoleViewProps) {
  const [buckets, setBuckets] = useState<BucketOption[]>([]);
  const [bucketError, setBucketError] = useState<AwsErrorLike | null>(null);
  const [selectedBucket, setSelectedBucket] = useState<string | null>(null);

  const [indexes, setIndexes] = useState<IndexOption[]>([]);
  const [indexLoading, setIndexLoading] = useState(false);
  const [indexError, setIndexError] = useState<AwsErrorLike | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setBucketError(null);
      try {
        const response = await bucketService.listVectorBuckets();
        if (cancelled) return;
        setBuckets(
          (response.vectorBuckets ?? [])
            .map((b) => b.vectorBucketName)
            .filter((name): name is string => !!name)
            .map((name) => ({ value: name, label: name }))
        );
      } catch (err) {
        if (cancelled) return;
        setBucketError(errorFromCaught(err));
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [bucketService]);

  useEffect(() => {
    if (!selectedBucket) {
      setIndexes([]);
      setSelectedIndex(null);
      return;
    }
    let cancelled = false;
    async function load() {
      setIndexLoading(true);
      setIndexError(null);
      try {
        const response = await indexService.listIndexes({
          vectorBucketName: selectedBucket ?? undefined,
        });
        if (cancelled) return;
        setIndexes(
          (response.indexes ?? [])
            .map((i) => i.indexName)
            .filter((name): name is string => !!name)
            .map((name) => ({ value: name, label: name }))
        );
      } catch (err) {
        if (cancelled) return;
        setIndexError(errorFromCaught(err));
      } finally {
        if (!cancelled) setIndexLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [selectedBucket, indexService]);

  const selectedBucketName = selectedBucket ?? undefined;
  const selectedIndexName = selectedIndex ?? undefined;

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Breadcrumb
        items={[
          { title: <Link to="/">Dashboard</Link> },
          { title: 'Query Console' },
        ]}
      />
      <Typography.Title level={3} style={{ margin: 0 }}>
        Query Console
      </Typography.Title>

      <ErrorBanner error={bucketError} onDismiss={() => setBucketError(null)} />

      <Card title="Query">
        <Space wrap style={{ marginBottom: 16 }}>
          <label htmlFor="bucket-select">
            Bucket
            <select
              id="bucket-select"
              value={selectedBucket ?? ''}
              onChange={(e) => {
                setSelectedBucket(e.target.value || null);
                setSelectedIndex(null);
              }}
              style={{
                width: 200,
                display: 'block',
                height: 36,
                backgroundColor: '#151e2e',
                color: '#f0f4f8',
                border: '1px solid #1e293b',
                borderRadius: 8,
                padding: '9px 12px',
              }}
            >
              <option value="">Select bucket</option>
              {buckets.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.label}
                </option>
              ))}
            </select>
          </label>
          <label htmlFor="index-select">
            Index
            <select
              id="index-select"
              value={selectedIndex ?? ''}
              onChange={(e) => setSelectedIndex(e.target.value || null)}
              disabled={!selectedBucket}
              style={{
                width: 200,
                display: 'block',
                height: 36,
                backgroundColor: '#151e2e',
                color: '#f0f4f8',
                border: '1px solid #1e293b',
                borderRadius: 8,
                padding: '9px 12px',
              }}
            >
              <option value="">Select index</option>
              {indexes.map((i) => (
                <option key={i.value} value={i.value}>
                  {i.label}
                </option>
              ))}
            </select>
          </label>
        </Space>

        {indexLoading ? (
          <Spin data-testid="indexes-loading" />
        ) : (
          <ErrorBanner
            error={indexError}
            onDismiss={() => setIndexError(null)}
          />
        )}

        {selectedBucketName && selectedIndexName ? (
          <QueryForm
            bucketName={selectedBucketName}
            indexName={selectedIndexName}
            vectorService={vectorService}
          />
        ) : (
          <Typography.Text type="secondary">
            Select a bucket and index to build a query.
          </Typography.Text>
        )}
      </Card>
    </Space>
  );
}

function QueryConsole() {
  const bucketService = useBucketService();
  const indexService = useIndexService();
  const vectorService = useVectorService();
  return (
    <QueryConsoleView
      bucketService={bucketService}
      indexService={indexService}
      vectorService={vectorService}
    />
  );
}

export default QueryConsole;
