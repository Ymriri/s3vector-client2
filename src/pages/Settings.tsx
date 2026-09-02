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
  List,
  Tag,
  Modal,
  Popconfirm,
  theme,
} from 'antd';
import {
  PlusOutlined,
  SaveOutlined,
  DeleteOutlined,
  CheckCircleFilled,
  SwitcherOutlined,
} from '@ant-design/icons';
import { useSettingsStore } from '../settings/settingsStore';
import {
  useProfilesStore,
  type ConnectionProfile,
} from '../settings/profilesStore';
import { S3VectorsClientFactory } from '../api/S3VectorsClientFactory';
import { BucketService } from '../api/buckets';
import {
  sanitizeAccessKeyId,
  sanitizeSecretAccessKey,
  sanitizePlainInput,
} from '../lib/credential';

function Settings() {
  const settings = useSettingsStore();
  const { profiles, activeProfileId } = useProfilesStore();
  const addProfile = useProfilesStore((s) => s.addProfile);
  const removeProfile = useProfilesStore((s) => s.removeProfile);
  const applyProfile = useProfilesStore((s) => s.applyProfile);
  const syncActiveFromSettings = useProfilesStore(
    (s) => s.syncActiveFromSettings
  );
  const { token } = theme.useToken();
  const relayEnabled = settings.relay !== false;
  const [form] = Form.useForm();
  const [testStatus, setTestStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [testing, setTesting] = useState(false);
  const [saveAsOpen, setSaveAsOpen] = useState(false);
  const [saveAsName, setSaveAsName] = useState('');

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
    // Keep the active profile (if any) in sync with the live settings.
    syncActiveFromSettings();
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

  const handleSaveAsProfile = () => {
    const name = saveAsName.trim();
    if (!name) return;
    const current = form.getFieldsValue();
    addProfile({
      name,
      region: sanitizePlainInput(current.region) || 'us-east-1',
      accessKeyId: sanitizePlainInput(current.accessKeyId || ''),
      secretAccessKey: sanitizePlainInput(current.secretAccessKey || ''),
      sessionToken: sanitizePlainInput(current.sessionToken || ''),
      endpoint: sanitizePlainInput(current.endpoint || ''),
      relay: current.relay !== false,
      sessionOnly: current.sessionOnly ?? false,
    });
    const created = useProfilesStore.getState();
    const newest = created.profiles[created.profiles.length - 1];
    if (newest) created.applyProfile(newest.id);
    setSaveAsOpen(false);
    setSaveAsName('');
    setTestStatus({
      type: 'success',
      message: `已保存连接配置「${name}」并设为当前使用。`,
    });
  };

  const handleApplyProfile = (profile: ConnectionProfile) => {
    if (applyProfile(profile.id)) {
      form.setFieldsValue({
        accessKeyId: profile.accessKeyId,
        secretAccessKey: profile.secretAccessKey,
        sessionToken: profile.sessionToken,
        region: profile.region,
        endpoint: profile.endpoint,
        sessionOnly: profile.sessionOnly ?? false,
        relay: profile.relay ?? true,
      });
      setTestStatus({
        type: 'success',
        message: `已切换到连接配置「${profile.name}」。`,
      });
    }
  };

  const activeName = profiles.find((p) => p.id === activeProfileId)?.name;

  return (
    <>
      <Typography.Title level={3}>Settings</Typography.Title>
      <Card
        title={
          <Space>
            <SwitcherOutlined />
            连接配置（Profile）
            {activeName && (
              <Tag color="cyan" icon={<CheckCircleFilled />}>
                使用中：{activeName}
              </Tag>
            )}
          </Space>
        }
        style={{ maxWidth: 640, marginBottom: 24 }}
      >
        <List
          size="small"
          dataSource={profiles}
          locale={{
            emptyText:
              '还没有保存的连接配置，填好下方表单后点「另存为 Profile」',
          }}
          renderItem={(p) => {
            const isActive = p.id === activeProfileId;
            return (
              <List.Item
                style={{
                  opacity: isActive ? 1 : 0.75,
                  border: `1px solid ${
                    isActive ? token.colorPrimaryBorder : 'transparent'
                  }`,
                  borderRadius: 8,
                  paddingLeft: 8,
                  paddingRight: 8,
                }}
                actions={[
                  <Button
                    key="apply"
                    size="small"
                    type={isActive ? 'default' : 'primary'}
                    ghost={!isActive}
                    disabled={isActive}
                    onClick={() => handleApplyProfile(p)}
                  >
                    {isActive ? '使用中' : '使用'}
                  </Button>,
                  <Popconfirm
                    key="delete"
                    title="删除此连接配置？"
                    okText="删除"
                    cancelText="取消"
                    onConfirm={() => removeProfile(p.id)}
                  >
                    <Button
                      key="delete-btn"
                      size="small"
                      danger
                      type="text"
                      aria-label={`delete-${p.name}`}
                      icon={<DeleteOutlined />}
                    />
                  </Popconfirm>,
                ]}
              >
                <List.Item.Meta
                  title={
                    <Space size={8}>
                      <span style={{ fontWeight: 600 }}>{p.name}</span>
                      {p.endpoint ? (
                        <Tag color="blue">自定义端点</Tag>
                      ) : (
                        <Tag color="gold">AWS 官方</Tag>
                      )}
                      {p.relay === false && <Tag>直连</Tag>}
                    </Space>
                  }
                  description={
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      {p.region} · {p.accessKeyId || '（无 AK）'}
                      {p.endpoint ? ` · ${p.endpoint}` : ''}
                    </Typography.Text>
                  }
                />
              </List.Item>
            );
          }}
        />
        <Button
          icon={<SaveOutlined />}
          onClick={() => setSaveAsOpen(true)}
          style={{ marginTop: 12 }}
        >
          另存当前表单为 Profile
        </Button>
      </Card>

      <Modal
        title="另存为连接配置"
        open={saveAsOpen}
        onOk={handleSaveAsProfile}
        onCancel={() => setSaveAsOpen(false)}
        okText="保存"
        cancelText="取消"
        okButtonProps={{ disabled: saveAsName.trim() === '' }}
        destroyOnHidden
      >
        <Input
          placeholder="配置名称，如：AWS ap-southeast-1 / 内网环境"
          value={saveAsName}
          onChange={(e) => setSaveAsName(e.target.value)}
          onPressEnter={handleSaveAsProfile}
        />
      </Modal>

      <Card
        title="当前连接参数"
        style={{ maxWidth: 640 }}
        extra={
          <Button
            size="small"
            type="text"
            icon={<PlusOutlined />}
            onClick={() => setSaveAsOpen(true)}
          >
            另存为 Profile
          </Button>
        }
      >
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
              <Button
                icon={<SaveOutlined />}
                onClick={() => setSaveAsOpen(true)}
              >
                另存为 Profile
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
