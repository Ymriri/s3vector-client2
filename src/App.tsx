import { ConfigProvider } from 'antd';
import AppLayout from './components/AppLayout';

function App() {
  return (
    <ConfigProvider>
      <AppLayout />
    </ConfigProvider>
  );
}

export default App;
