import { useCallback, useEffect, useState } from 'react';
import {
  Breadcrumb,
  Card,
  Col,
  Descriptions,
  Row,
  Select,
  Skeleton,
  Space,
  Tag,
  Typography,
  message,
} from 'antd';
import { CopyOutlined } from '@ant-design/icons';
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

interface IndexInfo {
  indexName: string;
  dimension: number;
  distanceMetric: string;
  indexArn: string;
  creationTime: Date;
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

  const [indexInfo, setIndexInfo] = useState<IndexInfo | null>(null);
  const [indexInfoLoading, setIndexInfoLoading] = useState(false);
  const [indexInfoError, setIndexInfoError] = useState<AwsErrorLike | null>(
    null
  );

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
      setIndexInfo(null);
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

  const fetchIndexInfo = useCallback(
    async (bucketName: string, indexName: string) => {
      setIndexInfoLoading(true);
      setIndexInfoError(null);
      setIndexInfo(null);
      try {
        const response = await indexService.getIndex(bucketName, indexName);
        const idx = response.index;
        if (idx) {
          setIndexInfo({
            indexName: idx.indexName ?? indexName,
            dimension: idx.dimension ?? 0,
            distanceMetric: idx.distanceMetric ?? 'unknown',
            indexArn: idx.indexArn ?? '',
            creationTime: new Date(idx.creationTime ?? Date.now()),
          });
        }
      } catch (err) {
        setIndexInfoError(errorFromCaught(err));
      } finally {
        setIndexInfoLoading(false);
      }
    },
    [indexService]
  );

  useEffect(() => {
    if (selectedBucket && selectedIndex) {
      void fetchIndexInfo(selectedBucket, selectedIndex);
    } else {
      setIndexInfo(null);
    }
  }, [selectedBucket, selectedIndex, fetchIndexInfo]);

  const handleCopyArn = async (arn: string) => {
    try {
      await navigator.clipboard.writeText(arn);
      void message.success('ARN copied');
    } catch {
      void message.error('Failed to copy');
    }
  };

  const selectedBucketName = selectedBucket ?? undefined;
  const selectedIndexName = selectedIndex ?? undefined;

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Breadcrumb
        items={[
          { title: <Link to="/">Dashboard</Link> },
          { title: 'Query Console' },
        ]}
      />
      <Typography.Title level={3} style={{ margin: 0, color: '#f0f4f8' }}>
        Query Console
      </Typography.Title>

      <ErrorBanner error={bucketError} onDismiss={() => setBucketError(null)} />

      <Card
        title="Connection"
        style={{
          background: '#151e2e',
          border: '1px solid #1e293b',
        }}
      >
        <Row gutter={24}>
          <Col span={12}>
            <div style={{ marginBottom: 8 }}>
              <Typography.Text
                strong
                style={{ color: '#cbd5e1', fontSize: 13 }}
              >
                Bucket
              </Typography.Text>
            </div>
            <Select
              placeholder="Select bucket"
              style={{ width: '100%' }}
              value={selectedBucket ?? undefined}
              onChange={(val) => {
                setSelectedBucket(val ?? null);
                setSelectedIndex(null);
              }}
              allowClear
              options={buckets}
            />
          </Col>
          <Col span={12}>
            <div style={{ marginBottom: 8 }}>
              <Typography.Text
                strong
                style={{ color: '#cbd5e1', fontSize: 13 }}
              >
                Index
              </Typography.Text>
            </div>
            {indexLoading ? (
              <Skeleton.Input active style={{ width: '100%', height: 32 }} />
            ) : (
              <Select
                placeholder="Select index"
                style={{ width: '100%' }}
                value={selectedIndex ?? undefined}
                onChange={(val) => setSelectedIndex(val ?? null)}
                disabled={!selectedBucket}
                allowClear
                options={indexes}
              />
            )}
          </Col>
        </Row>

        {indexError && (
          <div style={{ marginTop: 12 }}>
            <ErrorBanner
              error={indexError}
              onDismiss={() => setIndexError(null)}
            />
          </div>
        )}
      </Card>

      {indexInfoLoading && (
        <Card
          title="Index Info"
          style={{
            background: '#151e2e',
            border: '1px solid #1e293b',
          }}
        >
          <Skeleton active paragraph={{ rows: 2 }} />
        </Card>
      )}

      {indexInfoError && (
        <ErrorBanner
          error={indexInfoError}
          onDismiss={() => setIndexInfoError(null)}
        />
      )}

      {indexInfo && !indexInfoLoading && (
        <Card
          title="Index Info"
          style={{
            background: '#151e2e',
            border: '1px solid #1e293b',
          }}
        >
          <Descriptions column={2} size="small">
            <Descriptions.Item label="Index Name">
              <Typography.Text
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  color: '#f0f4f8',
                }}
              >
                {indexInfo.indexName}
              </Typography.Text>
            </Descriptions.Item>
            <Descriptions.Item label="Dimension">
              <Tag color="cyan">{indexInfo.dimension}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Distance Metric">
              <Tag color="blue">{indexInfo.distanceMetric}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Created">
              {indexInfo.creationTime.toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="ARN" span={2}>
              <Space>
                <Typography.Text
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 12,
                    color: '#94a3b8',
                    wordBreak: 'break-all',
                  }}
                >
                  {indexInfo.indexArn}
                </Typography.Text>
                <CopyOutlined
                  onClick={() => void handleCopyArn(indexInfo.indexArn)}
                  style={{ color: '#22d3ee', cursor: 'pointer' }}
                />
              </Space>
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}

      {selectedBucketName && selectedIndexName ? (
        <Card
          title="Query"
          style={{
            background: '#151e2e',
            border: '1px solid #1e293b',
          }}
        >
          <QueryForm
            bucketName={selectedBucketName}
            indexName={selectedIndexName}
            vectorService={vectorService}
            dimension={indexInfo?.dimension}
          />
        </Card>
      ) : (
        <Card
          style={{
            background: '#151e2e',
            border: '1px dashed #334155',
            textAlign: 'center',
            padding: '48px 24px',
          }}
        >
          <Typography.Text style={{ color: '#94a3b8' }}>
            Select a bucket and index to build a query.
          </Typography.Text>
        </Card>
      )}
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
