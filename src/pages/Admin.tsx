import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { Helmet } from 'react-helmet';

const Admin = () => {
  return (
    <ProtectedRoute>
      <Helmet>
        <title>Admin Dashboard - DMT Code</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <AdminDashboard />
    </ProtectedRoute>
  );
};

export default Admin;
