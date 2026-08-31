import { Layout, Menu } from 'antd';
import {
  DashboardOutlined,
  DatabaseOutlined,
  SearchOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

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
