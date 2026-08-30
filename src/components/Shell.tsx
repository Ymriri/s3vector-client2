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
      <Sider theme="light" breakpoint="lg" collapsedWidth="0">
        <div
          style={{
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 600,
          }}
        >
          S3Vector
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey(location.pathname)]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Content style={{ margin: 24 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}

export default Shell;
