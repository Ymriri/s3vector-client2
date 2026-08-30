import { Layout } from 'antd';
import AppRoutes from './AppRoutes';

function AppLayout() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AppRoutes />
    </Layout>
  );
}

export default AppLayout;
