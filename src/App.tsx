import { ConfigProvider, theme } from 'antd';
import AppLayout from './components/AppLayout';

const darkTheme = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorPrimary: '#22d3ee',
    colorBgBase: '#0b0f14',
    colorBgContainer: '#151e2e',
    colorBgElevated: '#1e293b',
    colorBorder: '#1e293b',
    colorBorderSecondary: '#1e293b',
    colorText: '#f0f4f8',
    colorTextSecondary: '#cbd5e1',
    colorLink: '#22d3ee',
    borderRadius: 8,
    fontFamily:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  components: {
    Table: {
      headerBg: '#0f172a',
      headerColor: '#f0f4f8',
      rowHoverBg: '#0f172a',
      borderColor: '#1e293b',
      colorBgContainer: '#0b0f14',
    },
    Card: {
      colorBgContainer: '#151e2e',
      colorBorder: '#1e293b',
    },
    Menu: {
      darkItemBg: '#0b0f14',
      darkSubMenuItemBg: '#0b0f14',
      darkItemSelectedBg: '#0f172a',
      darkItemColor: '#94a3b8',
      darkItemSelectedColor: '#f0f4f8',
      darkItemHoverBg: '#0f172a',
      darkItemHoverColor: '#f0f4f8',
    },
    Input: {
      colorBgContainer: '#151e2e',
      colorBorder: '#1e293b',
      activeBorderColor: '#22d3ee',
      hoverBorderColor: '#334155',
    },
    Select: {
      colorBgContainer: '#151e2e',
      colorBorder: '#1e293b',
      optionSelectedBg: '#0f172a',
      optionActiveBg: '#0f172a',
    },
    Button: {
      colorPrimary: '#22d3ee',
      colorPrimaryHover: '#06b6d4',
      defaultBg: '#151e2e',
      defaultBorderColor: '#1e293b',
      defaultColor: '#f0f4f8',
    },
    Sider: {
      colorBgBody: '#0b0f14',
      colorBgTrigger: '#0b0f14',
    },
    Layout: {
      colorBgBody: '#0b0f14',
      colorBgHeader: '#0b0f14',
    },
    Breadcrumb: {
      colorBgContainer: '#0b0f14',
    },
    Descriptions: {
      colorBgContainer: '#151e2e',
    },
    Tabs: {
      colorBgContainer: '#0b0f14',
    },
    Collapse: {
      colorBgContainer: '#0b0f14',
    },
    Form: {
      colorBgContainer: '#0b0f14',
    },
    Spin: {
      colorPrimary: '#22d3ee',
    },
  },
};

function App() {
  return (
    <ConfigProvider theme={darkTheme}>
      <AppLayout />
    </ConfigProvider>
  );
}

export default App;
