import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Empty,
  Form,
  Input,
  Modal,
  Space,
  Table,
  Typography,
} from 'antd';
import {
  DeleteOutlined,
  EyeOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { BucketService } from '../api/buckets';
import { useBucketService } from '../api/useBucketService';
import { ErrorBanner, type AwsErrorLike } from '../components/ErrorBanner';
import { errorFromCaught } from '../lib/error';
import { formatDate } from '../lib/format';
import type { VectorBucketSummary } from '@aws-sdk/client-s3vectors';

interface BucketTableItem {
  key: string;
  name: string;
  arn: string;
  created: Date | undefined;
  raw: VectorBucketSummary;
}

interface VectorBucketsViewProps {
  bucketService: BucketService;
}

export function VectorBucketsView({ bucketService }: VectorBucketsViewProps) {
  const navigate = useNavigate();
  const [buckets, setBuckets] = useState<VectorBucketSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AwsErrorLike | null>(null);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm] = Form.useForm();
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<AwsErrorLike | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BucketTableItem | null>(
    null
  );
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<AwsErrorLike | null>(null);

  const loadBuckets = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await bucketService.listVectorBuckets();
      setBuckets(response.vectorBuckets ?? []);
    } catch (err) {
      setError(errorFromCaught(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadBuckets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bucketService]);

  const items = useMemo<BucketTableItem[]>(
    () =>
      buckets.map((bucket) => ({
        key: bucket.vectorBucketName ?? '',
        name: bucket.vectorBucketName ?? '',
        arn: bucket.vectorBucketArn ?? '',
        created: bucket.creationTime,
        raw: bucket,
      })),
    [buckets]
  );

  const filteredItems = useMemo(() => {
    const prefix = search.trim().toLowerCase();
    if (!prefix) return items;
    return items.filter(
      (item) =>
        item.name.toLowerCase().startsWith(prefix) ||
        item.arn.toLowerCase().includes(prefix)
    );
  }, [items, search]);

  const handleCreate = async (values: { vectorBucketName: string }) => {
    setCreating(true);
    setCreateError(null);
    try {
      await bucketService.createVectorBucket(values.vectorBucketName);
      setCreateOpen(false);
      createForm.resetFields();
      await loadBuckets();
    } catch (err) {
      setCreateError(errorFromCaught(err));
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await bucketService.deleteVectorBucket(deleteTarget.name);
      setDeleteTarget(null);
      await loadBuckets();
    } catch (err) {
      setDeleteError(errorFromCaught(err));
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <Typography.Text
          strong
          style={{ fontFamily: 'JetBrains Mono, ui-monospace, monospace' }}
        >
          {name}
        </Typography.Text>
      ),
    },
    {
      title: 'ARN',
      dataIndex: 'arn',
      key: 'arn',
      ellipsis: true,
      render: (arn: string) => (
        <Typography.Text
          style={{ fontFamily: 'JetBrains Mono, ui-monospace, monospace' }}
        >
          {arn}
        </Typography.Text>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'created',
      key: 'created',
      render: (created: Date | undefined) => formatDate(created),
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right' as const,
      render: (_: unknown, record: BucketTableItem) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() =>
              navigate(`/buckets/${encodeURIComponent(record.name)}`)
            }
          >
            View
          </Button>
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => setDeleteTarget(record)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  const showEmpty = !loading && !error && filteredItems.length === 0;
  const emptyIsSearch = showEmpty && items.length > 0;

  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <Typography.Title level={3} style={{ margin: 0 }}>
          Vector Buckets
        </Typography.Title>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => void loadBuckets()}
            loading={loading}
            data-testid="refresh-buckets-button"
          >
            Refresh
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateOpen(true)}
            data-testid="create-bucket-button"
          >
            Create bucket
          </Button>
        </Space>
      </div>

      <ErrorBanner error={error} onDismiss={() => setError(null)} />

      <Card styles={{ body: { padding: 0 } }}>
        <div style={{ padding: 12, borderBottom: '1px solid #1e293b' }}>
          <Input
            placeholder="Search buckets…"
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: 320 }}
            allowClear
          />
        </div>

        <Table
          dataSource={filteredItems}
          columns={columns}
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50],
            showTotal: (total) => `${total} bucket${total === 1 ? '' : 's'}`,
          }}
          locale={{
            emptyText: showEmpty ? (
              <Empty
                description={
                  emptyIsSearch ? (
                    <Space direction="vertical">
                      <span>No buckets match your search.</span>
                      <Button type="link" onClick={() => setSearch('')}>
                        Clear filters
                      </Button>
                    </Space>
                  ) : (
                    <Space direction="vertical">
                      <span>No buckets yet</span>
                      <Button
                        type="primary"
                        onClick={() => setCreateOpen(true)}
                      >
                        Create bucket
                      </Button>
                    </Space>
                  )
                }
              />
            ) : undefined,
          }}
        />
      </Card>

      <Modal
        title="Create bucket"
        open={createOpen}
        onOk={() => createForm.submit()}
        onCancel={() => {
          setCreateOpen(false);
          setCreateError(null);
          createForm.resetFields();
        }}
        confirmLoading={creating}
        okText="Create bucket"
      >
        <ErrorBanner
          error={createError}
          onDismiss={() => setCreateError(null)}
        />
        <Form form={createForm} layout="vertical" onFinish={handleCreate}>
          <Form.Item
            label="Bucket name"
            name="vectorBucketName"
            rules={[{ required: true, message: 'Bucket name is required' }]}
          >
            <Input placeholder="my-vector-bucket" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Delete bucket?"
        open={!!deleteTarget}
        onOk={handleDelete}
        onCancel={() => {
          setDeleteTarget(null);
          setDeleteError(null);
        }}
        confirmLoading={deleting}
        okText="Delete bucket"
        okButtonProps={{ danger: true }}
      >
        <ErrorBanner
          error={deleteError}
          onDismiss={() => setDeleteError(null)}
        />
        {deleteTarget && (
          <Typography.Text>
            This will permanently delete{' '}
            <Typography.Text type="danger" strong>
              {deleteTarget.name}
            </Typography.Text>
            . All indexes and vectors inside it will be lost.
          </Typography.Text>
        )}
      </Modal>
    </>
  );
}

function VectorBuckets() {
  const bucketService = useBucketService();
  return <VectorBucketsView bucketService={bucketService} />;
}

export default VectorBuckets;
