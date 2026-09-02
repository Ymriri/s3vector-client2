import { Layout, Menu, Select, Typography, theme } from 'antd';
import {
  DashboardOutlined,
  DatabaseOutlined,
  SearchOutlined,
  SettingOutlined,
  CloudOutlined,
} from '@ant-design/icons';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useProfilesStore } from '../settings/profilesStore';

const { Sider, Content } = Layout;

const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/buckets', icon: <DatabaseOutlined />, label: 'Vector Buckets' },
  { key: '/query', icon: <SearchOutlined />, label: 'Query Console' },
  { key: '/settings', icon: <SettingOutlined />, label: 'Settings' },
];

function selectedKey(pathname: string): string {
  if (pathname.startsWith('/buckets')) return '/buckets';
  if (pathname.startsWith('/query')) return '/query';
  if (pathname.startsWith('/settings')) return '/settings';
  return '/';
}

function Shell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { token } = theme.useToken();
  const profiles = useProfilesStore((s) => s.profiles);
  const activeProfileId = useProfilesStore((s) => s.activeProfileId);
  const applyProfile = useProfilesStore((s) => s.applyProfile);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider theme="dark" breakpoint="lg" collapsedWidth="0" width={240}>
        <div
          style={{
            height: 56,
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 24,
            fontWeight: 600,
            fontSize: 16,
            color: '#f0f4f8',
            borderBottom: '1px solid #1e293b',
          }}
        >
          <span style={{ color: '#ff9900' }}>●</span>{' '}
          <span style={{ marginLeft: 6 }}>S3Vectors</span>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey(location.pathname)]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ borderRight: 0, marginTop: 8 }}
        />
        {profiles.length > 0 && (
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '12px 16px 16px',
              borderTop: `1px solid ${token.colorBorderSecondary}`,
            }}
          >
            <Typography.Text
              type="secondary"
              style={{
                fontSize: 11,
                display: 'block',
                marginBottom: 6,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              <CloudOutlined /> 当前连接
            </Typography.Text>
            <Select
              size="small"
              style={{ width: '100%' }}
              aria-label="current connection profile"
              value={activeProfileId ?? undefined}
              placeholder="未选择配置"
              onChange={(id) => applyProfile(id)}
              options={profiles.map((p) => ({
                value: p.id,
                label: p.name,
              }))}
            />
          </div>
        )}
      </Sider>
      <Layout style={{ background: '#0b0f14' }}>
        <Content
          style={{
            margin: 0,
            padding: 24,
            background: '#0b0f14',
            minHeight: '100vh',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}

export default Shell;
