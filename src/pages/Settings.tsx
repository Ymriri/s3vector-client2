import { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Checkbox,
  Alert,
  Space,
  Typography,
} from 'antd';
import { useSettingsStore } from '../settings/settingsStore';
import { S3VectorsClientFactory } from '../api/S3VectorsClientFactory';
import { BucketService } from '../api/buckets';
import {
  sanitizeAccessKeyId,
  sanitizeSecretAccessKey,
  sanitizePlainInput,
} from '../lib/credential';

function Settings() {
  const settings = useSettingsStore();
  const relayEnabled = settings.relay !== false;
  const [form] = Form.useForm();
  const [testStatus, setTestStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    form.setFieldsValue({
      accessKeyId: settings.accessKeyId,
      secretAccessKey: settings.secretAccessKey,
      sessionToken: settings.sessionToken,
      region: settings.region,
      endpoint: settings.endpoint,
      sessionOnly: settings.sessionOnly,
    });
  }, [form, settings]);
  const handleSave = (values: {
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken: string;
    region: string;
    endpoint: string;
    sessionOnly: boolean;
    relay?: boolean;
  }) => {
    // Credentials pasted from chat tools / JSON payloads are frequently
    // mangled by escaping layers (\/, \uXXXX, stray newlines). Decode and
    // validate them at save time so SigV4 signing works on the first try.
    const akResult = sanitizeAccessKeyId(values.accessKeyId);
    const skResult = sanitizeSecretAccessKey(values.secretAccessKey);
    const warnings: string[] = [];
    if (!akResult.valid && akResult.reason)
      warnings.push(`AccessKey: ${akResult.reason}`);
    if (!skResult.valid && skResult.reason)
      warnings.push(`SecretKey: ${skResult.reason}`);

    settings.saveSettings({
      accessKeyId: akResult.value,
      secretAccessKey: skResult.value,
      sessionToken: sanitizePlainInput(values.sessionToken || ''),
      region: sanitizePlainInput(values.region) || 'us-east-1',
      endpoint: sanitizePlainInput(values.endpoint),
      sessionOnly: values.sessionOnly,
      relay: values.relay !== false,
    });
    setTestStatus(
      warnings.length > 0
        ? { type: 'error', message: warnings.join('；') }
        : null
    );
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestStatus(null);
    try {
      const factory = new S3VectorsClientFactory({
        region: settings.region,
        accessKeyId: settings.accessKeyId,
        secretAccessKey: settings.secretAccessKey,
        sessionToken: settings.sessionToken || undefined,
        endpoint: settings.endpoint || undefined,
        relay: settings.relay !== false,
      });
      const bucketService = new BucketService(factory);
      const response = await bucketService.listVectorBuckets();
      const count = response.vectorBuckets?.length ?? 0;
      setTestStatus({
        type: 'success',
        message: `Connection OK — ${count} bucket${count === 1 ? '' : 's'} found.`,
      });
    } catch (err) {
      const error = err as { name?: string; code?: string; message?: string };
      const code = error.code ?? error.name ?? 'UnknownError';
      const message = error.message ?? 'An unexpected error occurred.';
      setTestStatus({
        type: 'error',
        message: `${code}: ${message}`,
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <>
      <Typography.Title level={3}>Settings</Typography.Title>
      <Card style={{ maxWidth: 640 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          initialValues={{
            accessKeyId: settings.accessKeyId,
            secretAccessKey: settings.secretAccessKey,
            sessionToken: settings.sessionToken,
            region: settings.region,
            endpoint: settings.endpoint,
            sessionOnly: settings.sessionOnly,
            relay: settings.relay !== false,
          }}
        >
          <Form.Item
            label="Access Key ID"
            name="accessKeyId"
            rules={[{ required: true, message: 'Access Key ID is required' }]}
          >
            <Input placeholder="AKIA..." />
          </Form.Item>

          <Form.Item
            label="Secret Access Key"
            name="secretAccessKey"
            rules={[
              { required: true, message: 'Secret Access Key is required' },
            ]}
          >
            <Input.Password placeholder="..." />
          </Form.Item>

          <Form.Item label="Session Token" name="sessionToken">
            <Input.TextArea
              rows={2}
              placeholder="Optional temporary session token"
            />
          </Form.Item>

          <Form.Item
            label="Region"
            name="region"
            rules={[{ required: true, message: 'Region is required' }]}
          >
            <Input placeholder="us-east-1" />
          </Form.Item>

          <Form.Item
            label="Endpoint (SDK 真实地址)"
            name="endpoint"
            extra={
              relayEnabled
                ? '填 SDK 实际地址即可（如 http://10.x.x.x:12001）。浏览器请求会自动经本页同源中转，无需关心 CORS/代理细节。'
                : 'Optional; leave empty for the official AWS endpoint.'
            }
          >
            <Input placeholder="https://s3vectors.us-east-1.api.aws (optional)" />
          </Form.Item>

          <Form.Item name="relay" valuePropName="checked">
            <Checkbox>
              自动中转（推荐）：浏览器请求经本页同源转发到上面的地址，规避内网服务缺少
              CORS 的问题
            </Checkbox>
          </Form.Item>

          <Form.Item name="sessionOnly" valuePropName="checked">
            <Checkbox>
              Session-only (do not persist credentials across browser sessions)
            </Checkbox>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Save
              </Button>
              <Button onClick={handleTestConnection} loading={testing}>
                Test Connection
              </Button>
            </Space>
          </Form.Item>
        </Form>

        {testStatus && (
          <Alert
            type={testStatus.type}
            message={testStatus.message}
            showIcon
            closable
            onClose={() => setTestStatus(null)}
          />
        )}
      </Card>
    </>
  );
}

export default Settings;
