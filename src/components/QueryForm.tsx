import { useState } from 'react';
import {
  Button,
  Collapse,
  Input,
  InputNumber,
  Space,
  Switch,
  Table,
  Typography,
} from 'antd';
import type { VectorService } from '../api/vectors';
import { ErrorBanner, type AwsErrorLike } from './ErrorBanner';
import { errorFromCaught } from '../lib/error';
import { formatJson } from '../lib/format';

export interface QueryFormProps {
  bucketName: string;
  indexName: string;
  vectorService: VectorService;
}

const monoFontFamily = 'JetBrains Mono, ui-monospace, monospace';

function parseJsonArray(value: string): number[] | null {
  if (!value.trim()) return null;
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function parseJsonObject(value: string): Record<string, unknown> | null {
  if (!value.trim()) return null;
  try {
    const parsed = JSON.parse(value);
    if (
      parsed === null ||
      typeof parsed !== 'object' ||
      Array.isArray(parsed)
    ) {
      return null;
    }
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function QueryForm({
  bucketName,
  indexName,
  vectorService,
}: QueryFormProps) {
  const [queryVector, setQueryVector] = useState('');
  const [topK, setTopK] = useState<number | null>(10);
  const [filter, setFilter] = useState('');
  const [returnMetadata, setReturnMetadata] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AwsErrorLike | null>(null);
  const [result, setResult] = useState<Awaited<
    ReturnType<VectorService['queryVectors']>
  > | null>(null);

  const handleRun = async () => {
    setError(null);
    const parsedVector = parseJsonArray(queryVector);
    if (parsedVector === null) {
      setError({
        name: 'Invalid JSON',
        message: 'Query vector must be a valid JSON array of numbers.',
      });
      return;
    }
    const parsedFilter = filter.trim() ? parseJsonObject(filter) : undefined;
    if (filter.trim() && parsedFilter === null) {
      setError({
        name: 'Invalid JSON',
        message: 'Filter must be a valid JSON object.',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await vectorService.queryVectors(bucketName, indexName, {
        queryVector: parsedVector,
        topK: topK ?? 10,
        ...(parsedFilter !== undefined && parsedFilter !== null
          ? { filter: parsedFilter }
          : {}),
        ...(returnMetadata ? { returnMetadata: true } : {}),
      });
      setResult(response);
    } catch (err) {
      setError(errorFromCaught(err));
    } finally {
      setLoading(false);
    }
  };

  const vectors = result?.vectors ?? [];

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Space wrap>
        <label htmlFor="query-vector">
          Query vector
          <Input.TextArea
            id="query-vector"
            placeholder="Query vector JSON array, e.g. [0.1, 0.2, 0.3]"
            value={queryVector}
            onChange={(e) => setQueryVector(e.target.value)}
            rows={3}
            style={{ width: 320, fontFamily: monoFontFamily }}
          />
        </label>
        <label htmlFor="top-k">
          topK
          <InputNumber
            id="top-k"
            min={1}
            max={1000}
            precision={0}
            value={topK}
            onChange={(v) => setTopK(v)}
            style={{ width: 80, display: 'block' }}
          />
        </label>
        <label htmlFor="filter">
          Filter (optional)
          <Input.TextArea
            id="filter"
            placeholder="Filter JSON object"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            rows={3}
            style={{ width: 280, fontFamily: monoFontFamily }}
          />
        </label>
        <label
          htmlFor="return-metadata"
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <span>Return metadata</span>
          <Switch
            id="return-metadata"
            aria-label="Return metadata"
            checked={returnMetadata}
            onChange={(checked) => setReturnMetadata(checked)}
          />
        </label>
        <Button
          type="primary"
          loading={loading}
          onClick={() => void handleRun()}
          style={{ alignSelf: 'flex-end' }}
        >
          Run query
        </Button>
      </Space>

      <ErrorBanner error={error} onDismiss={() => setError(null)} />

      {result ? (
        vectors.length === 0 ? (
          <Typography.Text type="secondary">
            No vectors matched your query.
          </Typography.Text>
        ) : (
          <Table
            rowKey={(r) => r.key ?? ''}
            dataSource={vectors}
            pagination={false}
            columns={[
              { title: 'Key', dataIndex: 'key' },
              {
                title: 'Distance',
                dataIndex: 'distance',
                render: (v: number | undefined) => (v !== undefined ? v : '—'),
              },
              {
                title: 'Metadata',
                dataIndex: 'metadata',
                render: (v: Record<string, unknown> | undefined) =>
                  v !== undefined
                    ? (formatJson(JSON.stringify(v)) ?? JSON.stringify(v))
                    : '—',
              },
            ]}
          />
        )
      ) : null}

      {result ? (
        <Collapse
          ghost
          items={[
            {
              key: 'raw',
              label: 'Raw JSON',
              children: (
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
                  {formatJson(JSON.stringify(result)) ?? JSON.stringify(result)}
                </pre>
              ),
            },
          ]}
        />
      ) : null}
    </Space>
  );
}
