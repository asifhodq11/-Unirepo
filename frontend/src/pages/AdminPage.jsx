import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Users, DollarSign, Activity, AlertTriangle } from 'lucide-react';
import { Navigate } from 'react-router-dom';

export default function AdminPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Redundant structural guard just in case the route wasn't enough
  if (!user?.is_admin) {
    return <Navigate to="/dashboard" replace />;
  }

  useEffect(() => {
    async function fetchAdminData() {
      try {
        const [statsRes, usersRes] = await Promise.all([
          api.get('/admin/dashboard'),
          api.get('/admin/users')
        ]);
        
        setStats(statsRes);
        setUsers(usersRes.items || []);
      } catch (err) {
        console.error('Failed to load admin data:', err);
        setError('Failed to load secure admin data.');
      } finally {
        setLoading(false);
      }
    }
    fetchAdminData();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', height: '100%', padding: 'var(--space-6)' }}>
        <div className="spinner spinner-lg" />
        <p className="text-muted text-sm mt-4">Compiling financials...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 'var(--space-6)' }}>
        <div className="card border-danger" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'var(--space-6)', textAlign: 'center' }}>
          <AlertTriangle color="var(--danger-color)" size={48} style={{ marginBottom: 'var(--space-4)' }} />
          <h2 className="text-lg font-bold mb-2">Access Denied / Error</h2>
          <p className="text-muted">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: 'var(--space-6)' }}>
        <h1 className="text-2xl font-bold">Admin Business Intelligence</h1>
        <p className="text-muted">Real-time financial safety and platform metrics.</p>
      </header>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
        
        <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="card">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-muted">Estimated MRR</p>
              <h3 className="text-2xl font-bold text-success">${stats?.financials?.mrr?.toFixed(2) || '0.00'}</h3>
            </div>
            <div className="icon-wrapper" style={{ background: 'oklch(var(--success) / 0.1)', color: 'oklch(var(--success))', padding: '8px', borderRadius: '8px' }}>
              <DollarSign size={24} />
            </div>
          </div>
          <p className="text-xs text-muted">Projected off active plans</p>
        </motion.div>

        <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="card">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-muted">Total AI Cost</p>
              <h3 className="text-2xl font-bold text-danger">${stats?.financials?.ai_cost?.toFixed(4) || '0.0000'}</h3>
            </div>
            <div className="icon-wrapper" style={{ background: 'oklch(var(--danger) / 0.1)', color: 'oklch(var(--danger))', padding: '8px', borderRadius: '8px' }}>
              <Activity size={24} />
            </div>
          </div>
          <p className="text-xs text-muted">{stats?.usage?.total_tokens?.toLocaleString()} tokens across {stats?.usage?.total_replies} replies</p>
        </motion.div>

        <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="card">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-muted">Total Active Users</p>
              <h3 className="text-2xl font-bold">{stats?.users?.total || 0}</h3>
            </div>
            <div className="icon-wrapper" style={{ background: 'oklch(var(--accent) / 0.1)', color: 'oklch(var(--accent))', padding: '8px', borderRadius: '8px' }}>
              <Users size={24} />
            </div>
          </div>
          <p className="text-xs text-muted">{stats?.users?.pro} Pro / {stats?.users?.starter} Starter</p>
        </motion.div>

        <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="card">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-muted">Gross Margin</p>
              <h3 className="text-2xl font-bold text-success">${stats?.financials?.margin?.toFixed(2) || '0.00'}</h3>
            </div>
            <div className="icon-wrapper" style={{ background: 'oklch(var(--success) / 0.1)', color: 'oklch(var(--success))', padding: '8px', borderRadius: '8px' }}>
              <DollarSign size={24} />
            </div>
          </div>
          <p className="text-xs text-muted">MRR - AI Cost</p>
        </motion.div>
      </div>

      {/* User Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--border-color)' }}>
          <h2 className="text-lg font-bold">User Roster</h2>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: 'var(--space-3) var(--space-4)', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-muted)' }}>Email</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-muted)' }}>Business</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-muted)' }}>Plan</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-muted)' }}>Usage (Mo)</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-muted)' }}>Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-base)' }}>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: '0.875rem' }}>{u.email}</td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: '0.875rem' }}>{u.business_name}</td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <span className={`badge badge-sm ${u.plan === 'pro' ? 'badge-success' : u.plan === 'starter' ? 'badge-accent' : 'badge-muted'}`}>
                      {u.plan}
                    </span>
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: '0.875rem' }}>{u.reply_count_this_month}</td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
