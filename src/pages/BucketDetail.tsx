import { useEffect, useState } from 'react';
import {
  Breadcrumb,
  Button,
  Card,
  Empty,
  Input,
  InputNumber,
  Modal,
  Radio,
  Space,
  Spin,
  Table,
  Tabs,
  Typography,
} from 'antd';
import { Link, useParams } from 'react-router-dom';
import type { VectorBucket } from '@aws-sdk/client-s3vectors';
import { BucketService } from '../api/buckets';
import { useBucketService } from '../api/useBucketService';
import { ErrorBanner, type AwsErrorLike } from '../components/ErrorBanner';
import { errorFromCaught } from '../lib/error';
import { formatDate, formatJson } from '../lib/format';
import { IndexService } from '../api/indexes';
import { useIndexService } from '../api/useIndexService';
import type { IndexSummary } from '@aws-sdk/client-s3vectors';

const monoFontFamily = 'JetBrains Mono, ui-monospace, monospace';

interface BucketDetailViewProps {
  bucketService: BucketService;
  bucketName: string;
  indexService?: IndexService;
}

function BucketDetailView({
  bucketService,
  bucketName,
  indexService,
}: BucketDetailViewProps) {
  const defaultIndexService = useIndexService();
  const resolvedIndexService = indexService ?? defaultIndexService;
  const [bucket, setBucket] = useState<VectorBucket | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AwsErrorLike | null>(null);

  const [policy, setPolicy] = useState<string | null>(null);
  const [policyLoading, setPolicyLoading] = useState(false);
  const [policyError, setPolicyError] = useState<AwsErrorLike | null>(null);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<AwsErrorLike | null>(null);
  const [overwriteOpen, setOverwriteOpen] = useState(false);
  const [deletePolicyOpen, setDeletePolicyOpen] = useState(false);
  const [deletingPolicy, setDeletingPolicy] = useState(false);
  const [deletePolicyError, setDeletePolicyError] =
    useState<AwsErrorLike | null>(null);

  const loadBucket = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await bucketService.getVectorBucket(bucketName);
      setBucket(response.vectorBucket ?? null);
    } catch (err) {
      setError(errorFromCaught(err));
    } finally {
      setLoading(false);
    }
  };

  const loadPolicy = async () => {
    setPolicyLoading(true);
    setPolicyError(null);
    try {
      const response = await bucketService.getVectorBucketPolicy(bucketName);
      setPolicy(response.policy ?? null);
      setDraft(
        response.policy ? (formatJson(response.policy) ?? response.policy) : ''
      );
    } catch (err) {
      setPolicyError(errorFromCaught(err));
    } finally {
      setPolicyLoading(false);
    }
  };

  useEffect(() => {
    void loadBucket();
    void loadPolicy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bucketService, bucketName]);

  const doSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await bucketService.putVectorBucketPolicy(bucketName, draft);
      setOverwriteOpen(false);
      await loadPolicy();
    } catch (err) {
      setSaveError(errorFromCaught(err));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveClick = () => {
    if (!draft.trim()) {
      setSaveError({
        name: 'InvalidJson',
        message: 'Policy JSON is required.',
      });
      return;
    }
    if (formatJson(draft) === null) {
      setSaveError({
        name: 'InvalidJson',
        message: 'Policy must be valid JSON.',
      });
      return;
    }
    setSaveError(null);
    if (policy !== null) {
      setOverwriteOpen(true);
    } else {
      void doSave();
    }
  };

  const handleFormat = () => {
    const formatted = formatJson(draft);
    if (formatted === null) {
      setSaveError({
        name: 'InvalidJson',
        message: 'Cannot format: policy is not valid JSON.',
      });
      return;
    }
    setDraft(formatted);
    setSaveError(null);
  };

  const handleDeletePolicy = async () => {
    setDeletingPolicy(true);
    setDeletePolicyError(null);
    try {
      await bucketService.deleteVectorBucketPolicy(bucketName);
      setDeletePolicyOpen(false);
      await loadPolicy();
    } catch (err) {
      setDeletePolicyError(errorFromCaught(err));
    } finally {
      setDeletingPolicy(false);
    }
  };

  const [indexes, setIndexes] = useState<IndexSummary[]>([]);
  const [indexesLoading, setIndexesLoading] = useState(false);
  const [indexesError, setIndexesError] = useState<AwsErrorLike | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createError, setCreateError] = useState<AwsErrorLike | null>(null);
  const [form, setForm] = useState({
    name: '',
    dimension: 3,
    metric: 'cosine' as 'cosine' | 'euclidean',
    keys: '',
  });
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState<string | null>(null);
  const loadIndexes = async () => {
    setIndexesLoading(true);
    setIndexesError(null);
    try {
      const r = await resolvedIndexService.listIndexes({
        vectorBucketName: bucketName,
      });
      setIndexes(r.indexes ?? []);
    } catch (e) {
      setIndexesError(errorFromCaught(e));
    } finally {
      setIndexesLoading(false);
    }
  };
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    void loadIndexes();
  }, [bucketName, resolvedIndexService]);
  /* eslint-enable react-hooks/exhaustive-deps */
  const createIndex = async () => {
    if (
      !/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,62}$/.test(form.name) ||
      !Number.isInteger(form.dimension) ||
      form.dimension < 1 ||
      form.dimension > 4096
    ) {
      setCreateError({
        name: 'ValidationError',
        message: 'Enter a valid name and integer dimension from 1 to 4096.',
      });
      return;
    }
    setCreateError(null);
    try {
      await resolvedIndexService.createIndex({
        bucketName,
        indexName: form.name,
        dimension: form.dimension,
        distanceMetric: form.metric,
        metadataConfiguration: form.keys.trim()
          ? {
              nonFilterableMetadataKeys: form.keys
                .split(',')
                .map((k) => k.trim())
                .filter(Boolean),
            }
          : undefined,
      });
      setCreateOpen(false);
      await loadIndexes();
    } catch (e) {
      setCreateError(errorFromCaught(e));
    }
  };
  const deleteIndex = async () => {
    if (!deleteOpen) return;
    setDeleting(deleteOpen);
    try {
      await resolvedIndexService.deleteIndex(bucketName, deleteOpen);
      setDeleteOpen(null);
      await loadIndexes();
    } catch (e) {
      setIndexesError(errorFromCaught(e));
    } finally {
      setDeleting(null);
    }
  };
  const indexesTab = (
    <Card
      extra={
        <Button type="primary" onClick={() => setCreateOpen(true)}>
          Create index
        </Button>
      }
    >
      <ErrorBanner
        error={indexesError}
        onDismiss={() => setIndexesError(null)}
      />
      {indexesLoading ? (
        <div data-testid="indexes-loading">
          <Spin />
        </div>
      ) : indexes.length === 0 ? (
        <Empty description="No indexes in this bucket yet">
          <Button type="primary" onClick={() => setCreateOpen(true)}>
            Create index
          </Button>
        </Empty>
      ) : (
        <Table
          rowKey={(r) => r.indexName ?? ''}
          dataSource={indexes}
          pagination={{ pageSize: 10 }}
          columns={[
            {
              title: 'Name',
              dataIndex: 'indexName',
              render: (v: string) => (
                <Link to={`/buckets/${bucketName}/indexes/${v}`}>{v}</Link>
              ),
            },
            {
              title: 'Created',
              dataIndex: 'creationTime',
              render: (v: Date) => formatDate(v),
            },
            { title: 'Dimension', render: () => '—' },
            { title: 'Distance metric', render: () => '—' },
            {
              title: 'Actions',
              render: (_: unknown, r: IndexSummary) => (
                <Button
                  danger
                  loading={deleting === r.indexName}
                  onClick={() => setDeleteOpen(r.indexName ?? null)}
                >
                  Delete
                </Button>
              ),
            },
          ]}
        />
      )}
      <Modal
        title="Create index"
        open={createOpen}
        onOk={() => void createIndex()}
        onCancel={() => setCreateOpen(false)}
        okText="Create"
      >
        <ErrorBanner
          error={createError}
          onDismiss={() => setCreateError(null)}
        />
        <Space direction="vertical" style={{ width: '100%' }}>
          <Input
            placeholder="Index name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <InputNumber
            min={1}
            max={4096}
            precision={0}
            style={{ width: '100%' }}
            value={form.dimension}
            onChange={(v) => setForm({ ...form, dimension: v ?? 0 })}
          />
          <Radio.Group
            value={form.metric}
            onChange={(e) => setForm({ ...form, metric: e.target.value })}
          >
            <Radio value="cosine">Cosine</Radio>
            <Radio value="euclidean">Euclidean</Radio>
          </Radio.Group>
          <Input
            placeholder="Non-filterable metadata keys (comma-separated)"
            value={form.keys}
            onChange={(e) => setForm({ ...form, keys: e.target.value })}
          />
        </Space>
      </Modal>
      <Modal
        title="Delete index?"
        open={!!deleteOpen}
        onOk={() => void deleteIndex()}
        onCancel={() => setDeleteOpen(null)}
        okButtonProps={{ danger: true }}
        confirmLoading={!!deleting}
      >
        <Typography.Text>
          This will permanently delete{' '}
          <Typography.Text type="danger" strong>
            {deleteOpen}
          </Typography.Text>
          .
        </Typography.Text>
      </Modal>
    </Card>
  );

  const policyViewer = policyLoading ? (
    <div data-testid="policy-loading">
      <Spin />
    </div>
  ) : policyError ? (
    <ErrorBanner error={policyError} onDismiss={() => setPolicyError(null)} />
  ) : policy === null ? (
    <Typography.Text type="secondary">
      No policy attached to this bucket.
    </Typography.Text>
  ) : (
    <pre
      data-testid="policy-viewer"
      style={{
        margin: 0,
        fontFamily: monoFontFamily,
        fontSize: 13,
        lineHeight: 1.55,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}
    >
      {formatJson(policy) ?? policy}
    </pre>
  );

  const policyTab = (
    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
      <Card title="Current policy" style={{ flex: '1 1 58%', minWidth: 320 }}>
        {policyViewer}
      </Card>
      <Card title="Policy editor" style={{ flex: '1 1 38%', minWidth: 320 }}>
        <Input.TextArea
          data-testid="policy-editor"
          rows={12}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={'{\n  "Version": "2012-10-17"\n}'}
          style={{ fontFamily: monoFontFamily }}
        />
        <ErrorBanner error={saveError} onDismiss={() => setSaveError(null)} />
        <Space style={{ marginTop: 12 }} wrap>
          <Button type="primary" loading={saving} onClick={handleSaveClick}>
            Save policy
          </Button>
          <Button onClick={handleFormat}>Format JSON</Button>
          <Button
            danger
            disabled={policy === null}
            onClick={() => setDeletePolicyOpen(true)}
          >
            Delete policy
          </Button>
        </Space>
      </Card>
    </div>
  );

  return (
    <>
      <Breadcrumb
        items={[
          { title: <Link to="/buckets">Vector Buckets</Link> },
          { title: bucketName },
        ]}
      />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 8,
          marginBottom: 4,
        }}
      >
        <Typography.Title level={3} style={{ margin: 0 }}>
          {bucketName}
        </Typography.Title>
      </div>
      <Space direction="vertical" size={0} style={{ marginBottom: 16 }}>
        <Typography.Text
          type="secondary"
          copyable
          style={{ fontFamily: monoFontFamily }}
        >
          {bucket?.vectorBucketArn ?? '—'}
        </Typography.Text>
        <Typography.Text
          type="secondary"
          style={{ fontFamily: monoFontFamily }}
        >
          Created {formatDate(bucket?.creationTime)}
        </Typography.Text>
      </Space>

      <ErrorBanner error={error} onDismiss={() => setError(null)} />

      {loading ? (
        <div data-testid="bucket-detail-loading">
          <Spin />
        </div>
      ) : (
        <Tabs
          defaultActiveKey="indexes"
          items={[
            {
              key: 'indexes',
              label: 'Indexes',
              children: indexesTab,
              disabled: !!error,
            },
            {
              key: 'policy',
              label: 'Policy',
              children: policyTab,
              disabled: !!error,
            },
          ]}
        />
      )}

      <Modal
        title="Overwrite existing policy?"
        open={overwriteOpen}
        onOk={() => void doSave()}
        onCancel={() => setOverwriteOpen(false)}
        confirmLoading={saving}
        okText="Overwrite policy"
        okButtonProps={{ danger: true }}
      >
        <ErrorBanner
          error={overwriteOpen ? saveError : null}
          onDismiss={() => setSaveError(null)}
        />
        <Typography.Text>
          A policy is already attached to{' '}
          <Typography.Text type="danger" strong>
            {bucketName}
          </Typography.Text>
          . Saving will replace it.
        </Typography.Text>
      </Modal>

      <Modal
        title="Delete policy?"
        open={deletePolicyOpen}
        onOk={() => void handleDeletePolicy()}
        onCancel={() => {
          setDeletePolicyOpen(false);
          setDeletePolicyError(null);
        }}
        confirmLoading={deletingPolicy}
        okText="Delete policy"
        okButtonProps={{ danger: true }}
      >
        <ErrorBanner
          error={deletePolicyError}
          onDismiss={() => setDeletePolicyError(null)}
        />
        <Typography.Text>
          This will remove the access-control policy from{' '}
          <Typography.Text type="danger" strong>
            {bucketName}
          </Typography.Text>
          .
        </Typography.Text>
      </Modal>
    </>
  );
}

function BucketDetail() {
  const { bucketName } = useParams<{ bucketName: string }>();
  const bucketService = useBucketService();
  const indexService = useIndexService();

  if (!bucketName) {
    return (
      <Typography.Text type="secondary">Bucket not found.</Typography.Text>
    );
  }

  return (
    <BucketDetailView
      bucketService={bucketService}
      bucketName={bucketName}
      indexService={indexService}
    />
  );
}

export default BucketDetail;

export { BucketDetailView };
