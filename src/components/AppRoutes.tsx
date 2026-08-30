import { Routes, Route, Navigate } from 'react-router-dom';
import Shell from './Shell';
import Dashboard from '../pages/Dashboard';
import VectorBuckets from '../pages/VectorBuckets';
import BucketDetail from '../pages/BucketDetail';
import QueryConsole from '../pages/QueryConsole';
import Settings from '../pages/Settings';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Shell />}>
        <Route index element={<Dashboard />} />
        <Route path="buckets" element={<VectorBuckets />} />
        <Route path="buckets/:bucketName" element={<BucketDetail />} />
        <Route path="query" element={<QueryConsole />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;
