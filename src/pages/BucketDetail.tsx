import { useEffect, useState } from 'react';
import {
  Breadcrumb,
  Button,
  Card,
  Empty,
  Input,
  Modal,
  Space,
  Spin,
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

const monoFontFamily = 'JetBrains Mono, ui-monospace, monospace';

interface BucketDetailViewProps {
  bucketService: BucketService;
  bucketName: string;
}

function BucketDetailView({
  bucketService,
  bucketName,
}: BucketDetailViewProps) {
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

  const indexesTab = (
    <Card>
      <Empty description="No indexes in this bucket yet">
        <Button
          type="primary"
          disabled
          title="Index management arrives in milestone M3"
        >
          Create index
        </Button>
      </Empty>
      <Typography.Paragraph type="secondary" style={{ marginTop: 12 }}>
        Index management will be available in milestone M3.
      </Typography.Paragraph>
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

  if (!bucketName) {
    return (
      <Typography.Text type="secondary">Bucket not found.</Typography.Text>
    );
  }

  return (
    <BucketDetailView bucketService={bucketService} bucketName={bucketName} />
  );
}

export default BucketDetail;

export { BucketDetailView };
