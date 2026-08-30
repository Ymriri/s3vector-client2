import { useEffect, useMemo, useState } from 'react';
import {
  Breadcrumb,
  Button,
  Card,
  Drawer,
  Empty,
  Input,
  Modal,
  Space,
  Spin,
  Table,
  Tabs,
  Typography,
} from 'antd';
import { Link, useParams } from 'react-router-dom';
import type {
  GetOutputVector,
  Index,
  ListOutputVector,
} from '@aws-sdk/client-s3vectors';
import { IndexService } from '../api/indexes';
import { useIndexService } from '../api/useIndexService';
import type { VectorService } from '../api/vectors';
import { useVectorService } from '../api/useVectorService';
import { QueryForm } from '../components/QueryForm';
import { ErrorBanner, type AwsErrorLike } from '../components/ErrorBanner';
import { errorFromCaught } from '../lib/error';
import { formatDate, formatJson } from '../lib/format';
import { unwrapVectorData } from '../api/vectors';

const monoFontFamily = 'JetBrains Mono, ui-monospace, monospace';

export interface IndexDetailViewProps {
  bucketName: string;
  indexName: string;
  indexService?: IndexService;
  vectorService?: VectorService;
}

interface VectorListItem extends ListOutputVector {
  key: string;
}

type VectorDetail = GetOutputVector & { key: string };

function isVectorBatch(value: unknown): value is {
  key: string;
  data: number[];
  metadata?: Record<string, unknown>;
}[] {
  if (!Array.isArray(value)) return false;
  return value.every(
    (item) =>
      item != null &&
      typeof item === 'object' &&
      typeof (item as { key?: unknown }).key === 'string' &&
      Array.isArray((item as { data?: unknown }).data)
  );
}

function IndexDetailView({
  bucketName,
  indexName,
  indexService: indexServiceProp,
  vectorService: vectorServiceProp,
}: IndexDetailViewProps) {
  const defaultIndexService = useIndexService();
  const defaultVectorService = useVectorService();
  const indexService = indexServiceProp ?? defaultIndexService;
  const vectorService = vectorServiceProp ?? defaultVectorService;

  const [index, setIndex] = useState<Index | null>(null);
  const [indexLoading, setIndexLoading] = useState(false);
  const [indexError, setIndexError] = useState<AwsErrorLike | null>(null);

  const [vectors, setVectors] = useState<VectorListItem[]>([]);
  const [vectorsLoading, setVectorsLoading] = useState(false);
  const [vectorsError, setVectorsError] = useState<AwsErrorLike | null>(null);
  const [nextToken, setNextToken] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState('');

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [detailKey, setDetailKey] = useState<string | null>(null);
  const [detail, setDetail] = useState<VectorDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<AwsErrorLike | null>(null);

  const [putOpen, setPutOpen] = useState(false);
  const [putDraft, setPutDraft] = useState('');
  const [putLoading, setPutLoading] = useState(false);
  const [putError, setPutError] = useState<AwsErrorLike | null>(null);

  const [deleteOpen, setDeleteOpen] = useState<string | null>(null);
  const [batchDeleteOpen, setBatchDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadIndex = async () => {
    setIndexLoading(true);
    setIndexError(null);
    try {
      const response = await indexService.getIndex(bucketName, indexName);
      setIndex(response.index ?? null);
    } catch (err) {
      setIndexError(errorFromCaught(err));
    } finally {
      setIndexLoading(false);
    }
  };

  const loadVectors = async (token?: string) => {
    setVectorsLoading(true);
    setVectorsError(null);
    try {
      const response = await vectorService.listVectors(bucketName, indexName, {
        maxResults: 10,
        nextToken: token,
        returnData: true,
        returnMetadata: true,
      });
      setVectors(
        (response.vectors ?? [])
          .filter((v): v is VectorListItem => typeof v.key === 'string')
          .map((v) => ({ ...v, key: v.key as string }))
      );
      setNextToken(response.nextToken ?? undefined);
    } catch (err) {
      setVectorsError(errorFromCaught(err));
    } finally {
      setVectorsLoading(false);
    }
  };

  useEffect(() => {
    void loadIndex();
    void loadVectors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indexService, vectorService, bucketName, indexName]);

  useEffect(() => {
    if (!detailKey) {
      setDetail(null);
      return;
    }
    const key: string = detailKey;
    let cancelled = false;
    async function load() {
      setDetailLoading(true);
      setDetailError(null);
      try {
        const response = await vectorService.getVectors(
          bucketName,
          indexName,
          [key],
          { returnData: true, returnMetadata: true }
        );
        if (cancelled) return;
        const match = (response.vectors ?? []).find((v) => v.key === key);
        setDetail(match ? { ...match, key } : null);
      } catch (err) {
        if (cancelled) return;
        setDetailError(errorFromCaught(err));
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [detailKey, vectorService, bucketName, indexName]);

  const filteredVectors = useMemo(() => {
    if (!search.trim()) return vectors;
    return vectors.filter((v) =>
      v.key.toLowerCase().includes(search.toLowerCase())
    );
  }, [vectors, search]);

  const handleDelete = async () => {
    const keys = deleteOpen ? [deleteOpen] : selectedRowKeys.map(String);
    if (keys.length === 0) return;
    setDeleteLoading(true);
    try {
      await vectorService.deleteVectors(bucketName, indexName, keys);
      setDeleteOpen(null);
      setBatchDeleteOpen(false);
      setSelectedRowKeys([]);
      await loadVectors();
    } catch (err) {
      setVectorsError(errorFromCaught(err));
    } finally {
      setDeleteLoading(false);
    }
  };

  const handlePut = async () => {
    setPutError(null);
    let parsed: unknown;
    try {
      parsed = JSON.parse(putDraft);
    } catch {
      setPutError({
        name: 'Invalid JSON',
        message: 'Payload must be a valid JSON array.',
      });
      return;
    }
    if (!isVectorBatch(parsed)) {
      setPutError({
        name: 'ValidationError',
        message:
          'Payload must be an array of objects with key (string) and data (number[]).',
      });
      return;
    }
    if (parsed.length > 500) {
      setPutError({
        name: 'ValidationError',
        message: 'Cannot put more than 500 vectors in a single batch.',
      });
      return;
    }
    setPutLoading(true);
    try {
      await vectorService.putVectors(bucketName, indexName, parsed);
      setPutOpen(false);
      setPutDraft('');
      await loadVectors();
    } catch (err) {
      setPutError(errorFromCaught(err));
    } finally {
      setPutLoading(false);
    }
  };

  const columns = [
    {
      title: 'Key',
      dataIndex: 'key',
      render: (v: string) => (
        <Typography.Text style={{ fontFamily: monoFontFamily }}>
          {v}
        </Typography.Text>
      ),
    },
    {
      title: 'Distance',
      render: () => '—',
    },
    {
      title: 'Metadata',
      dataIndex: 'metadata',
      render: (v: Record<string, unknown> | undefined) =>
        v !== undefined
          ? (formatJson(JSON.stringify(v)) ?? JSON.stringify(v))
          : '—',
    },
    {
      title: 'Data',
      dataIndex: 'data',
      render: (_: unknown, r: VectorListItem) => {
        const arr = unwrapVectorData(r.data);
        return arr !== undefined
          ? `[${arr.slice(0, 3).join(', ')}${arr.length > 3 ? ', …' : ''}]`
          : '—';
      },
    },
    {
      title: 'Actions',
      render: (_: unknown, r: VectorListItem) => (
        <Space>
          <Button type="link" onClick={() => setDetailKey(r.key)}>
            View
          </Button>
          <Button danger onClick={() => setDeleteOpen(r.key)}>
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  const vectorsTab = (
    <Card
      title="Vectors"
      extra={
        <Space>
          <Button type="primary" onClick={() => setPutOpen(true)}>
            Add vectors
          </Button>
          <Button
            danger
            disabled={selectedRowKeys.length === 0}
            onClick={() => setBatchDeleteOpen(true)}
          >
            Delete selected ({selectedRowKeys.length})
          </Button>
        </Space>
      }
    >
      <Space style={{ marginBottom: 16 }} wrap>
        <Input.Search
          placeholder="Search vector keys…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onSearch={() => undefined}
          style={{ width: 280 }}
        />
        <Button onClick={() => void loadVectors()} loading={vectorsLoading}>
          Refresh
        </Button>
      </Space>

      <ErrorBanner
        error={vectorsError}
        onDismiss={() => setVectorsError(null)}
      />

      {vectorsLoading ? (
        <div data-testid="vectors-loading">
          <Spin />
        </div>
      ) : filteredVectors.length === 0 ? (
        <Empty description="No vectors in this index">
          <Button type="primary" onClick={() => setPutOpen(true)}>
            Add vectors
          </Button>
        </Empty>
      ) : (
        <Table
          rowKey={(r) => r.key}
          dataSource={filteredVectors}
          columns={columns}
          pagination={false}
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys),
          }}
        />
      )}

      {nextToken || vectors.length > 0 ? (
        <Space style={{ marginTop: 16 }}>
          <Button
            disabled={!nextToken}
            onClick={() => void loadVectors(nextToken)}
            loading={vectorsLoading}
          >
            Next page
          </Button>
        </Space>
      ) : null}

      <Modal
        title="Add vectors"
        open={putOpen}
        onOk={() => void handlePut()}
        onCancel={() => {
          setPutOpen(false);
          setPutError(null);
        }}
        okText="Put vectors"
        confirmLoading={putLoading}
      >
        <ErrorBanner error={putError} onDismiss={() => setPutError(null)} />
        <Input.TextArea
          data-testid="put-vectors-editor"
          rows={10}
          placeholder='JSON array of vector objects: [{"key":"id","data":[0.1,0.2,0.3],"metadata":{}}]'
          value={putDraft}
          onChange={(e) => setPutDraft(e.target.value)}
          style={{ fontFamily: monoFontFamily }}
        />
      </Modal>

      <Modal
        title={deleteOpen ? 'Delete vector?' : 'Delete selected vectors?'}
        open={!!deleteOpen || batchDeleteOpen}
        onOk={() => void handleDelete()}
        onCancel={() => {
          setDeleteOpen(null);
          setBatchDeleteOpen(false);
        }}
        okButtonProps={{ danger: true }}
        confirmLoading={deleteLoading}
        okText={deleteOpen ? 'Delete vector' : 'Delete selected'}
      >
        <Typography.Text>
          This will permanently delete{' '}
          <Typography.Text type="danger" strong>
            {deleteOpen ?? `${selectedRowKeys.length} selected vectors`}
          </Typography.Text>
          .
        </Typography.Text>
      </Modal>

      <Drawer
        title={detailKey ?? 'Vector detail'}
        width={560}
        open={!!detailKey}
        onClose={() => setDetailKey(null)}
      >
        {detailLoading ? (
          <Spin data-testid="detail-loading" />
        ) : detailError ? (
          <ErrorBanner
            error={detailError}
            onDismiss={() => setDetailError(null)}
          />
        ) : detail ? (
          <Space direction="vertical" style={{ width: '100%' }}>
            <Typography.Title level={4} style={{ fontFamily: monoFontFamily }}>
              {detail.key}
            </Typography.Title>
            <Card title="Vector data">
              <pre
                style={{
                  margin: 0,
                  fontFamily: monoFontFamily,
                  fontSize: 13,
                  lineHeight: 1.55,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {JSON.stringify(unwrapVectorData(detail.data), null, 2)}
              </pre>
            </Card>
            <Card title="Metadata">
              <pre
                style={{
                  margin: 0,
                  fontFamily: monoFontFamily,
                  fontSize: 13,
                  lineHeight: 1.55,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {detail.metadata !== undefined
                  ? (formatJson(JSON.stringify(detail.metadata)) ??
                    JSON.stringify(detail.metadata))
                  : '—'}
              </pre>
            </Card>
            <Button
              danger
              onClick={() => {
                setDetailKey(null);
                setDeleteOpen(detail.key);
              }}
            >
              Delete vector
            </Button>
          </Space>
        ) : (
          <Typography.Text type="secondary">Vector not found.</Typography.Text>
        )}
      </Drawer>
    </Card>
  );

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Breadcrumb
        items={[
          { title: <Link to="/buckets">Vector Buckets</Link> },
          { title: <Link to={`/buckets/${bucketName}`}>{bucketName}</Link> },
          { title: indexName },
        ]}
      />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <Typography.Title level={3} style={{ margin: 0 }}>
          {indexName}
        </Typography.Title>
      </div>

      <ErrorBanner error={indexError} onDismiss={() => setIndexError(null)} />

      {indexLoading ? (
        <Spin data-testid="index-loading" />
      ) : index ? (
        <Space direction="vertical" size={0} style={{ marginBottom: 8 }}>
          <Typography.Text
            type="secondary"
            copyable
            style={{ fontFamily: monoFontFamily }}
          >
            {index.indexArn ?? '—'}
          </Typography.Text>
          <Typography.Text type="secondary">
            Dimension {index.dimension ?? '—'} · Distance metric{' '}
            {index.distanceMetric ?? '—'} · Created{' '}
            {formatDate(index.creationTime)}
          </Typography.Text>
        </Space>
      ) : null}

      {indexLoading ? null : (
        <Tabs
          defaultActiveKey="vectors"
          items={[
            {
              key: 'vectors',
              label: 'Vectors',
              children: vectorsTab,
              disabled: !!indexError,
            },
            {
              key: 'query',
              label: 'Query',
              children: (
                <QueryForm
                  bucketName={bucketName}
                  indexName={indexName}
                  vectorService={vectorService}
                />
              ),
              disabled: !!indexError,
            },
          ]}
        />
      )}
    </Space>
  );
}

function IndexDetail() {
  const { bucketName, indexName } = useParams<{
    bucketName: string;
    indexName: string;
  }>();
  const indexService = useIndexService();
  const vectorService = useVectorService();

  if (!bucketName || !indexName) {
    return <Typography.Text type="secondary">Index not found.</Typography.Text>;
  }

  return (
    <IndexDetailView
      bucketName={bucketName}
      indexName={indexName}
      indexService={indexService}
      vectorService={vectorService}
    />
  );
}

export default IndexDetail;
export { IndexDetailView };
