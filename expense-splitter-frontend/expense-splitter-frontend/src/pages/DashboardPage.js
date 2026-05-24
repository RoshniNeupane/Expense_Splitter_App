import React, { useEffect, useState } from 'react';
import { dashboardAPI } from '../utils/api';
import { formatCurrency, formatRelativeTime, ACTION_LABELS } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const mockChartData = [
  { month: 'Jan', amount: 0 }, { month: 'Feb', amount: 0 },
  { month: 'Mar', amount: 0 }, { month: 'Apr', amount: 0 },
  { month: 'May', amount: 0 }, { month: 'Jun', amount: 0 },
];

export default function DashboardPage({ onNavigate }) {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.get()
      .then(res => setData(res.data))
      .catch(() => setData({ group_count: 0, total_paid: 0, total_owed: 0, pending_settlements: 0, recent_activities: [] }))
      .finally(() => setLoading(false));
  }, []);

  const stats = [
    { label: 'Total Groups', value: data?.group_count || 0, type: 'number', color: 'blue', icon: '👥' },
    { label: 'Total Paid', value: formatCurrency(data?.total_paid || 0), type: 'text', color: 'gold', icon: '💰' },
    { label: 'Amount Owed', value: formatCurrency(data?.total_owed || 0), type: 'text', color: 'red', icon: '📊' },
    { label: 'Pending Settlements', value: data?.pending_settlements || 0, type: 'number', color: 'green', icon: '✅' },
  ];

  return (
    <div>
      {/* Welcome banner */}
      <div className="es-card-gold" style={{ padding: '28px 32px', marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
        <div>
          <p style={{ color: 'var(--gold)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Good {getTimeOfDay()}</p>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--text-primary)', marginBottom: 8 }}>
            {user?.full_name || user?.username}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>Here's your financial overview for today.</p>
        </div>
        <button className="btn-gold" onClick={() => onNavigate('groups')}>+ New Group</button>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: 28 }}>
        {stats.map((s, i) => (
          <div key={i} className={`stat-card ${s.color}`} style={{ opacity: loading ? 0.5 : 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div style={{ fontSize: 24 }}>{s.icon}</div>
              <span className={`badge-${s.color === 'blue' ? 'blue' : s.color === 'gold' ? 'gold' : s.color === 'red' ? 'red' : 'green'}`}>Live</span>
            </div>
            <div className={`stat-value text-${s.color === 'blue' ? 'sapphire' : s.color === 'gold' ? 'gold' : s.color === 'red' ? 'crimson' : 'emerald'}`}>
              {loading ? <span className="skeleton" style={{ display: 'inline-block', width: 80, height: 28 }} /> : s.value}
            </div>
            <div className="stat-label" style={{ marginTop: 8 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        {/* Chart */}
        <div className="es-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--text-primary)' }}>Spending Overview</h3>
            <span className="badge-gold">6 months</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={mockChartData}>
              <defs>
                <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#d4af37" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#d4af37" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13 }} />
              <Area type="monotone" dataKey="amount" stroke="#d4af37" strokeWidth={2} fill="url(#goldGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Activity */}
        <div className="es-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--text-primary)' }}>Recent Activity</h3>
            <button onClick={() => onNavigate('activity')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gold)', fontSize: 13, fontWeight: 500 }}>View all →</button>
          </div>
          {loading ? (
            [1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 56, marginBottom: 10, borderRadius: 8 }} />)
          ) : (data?.recent_activities?.length > 0) ? (
            data.recent_activities.slice(0, 6).map(act => (
              <ActivityItem key={act.id} activity={act} />
            ))
          ) : (
            <div className="empty-state" style={{ padding: '30px 0' }}>
              <div className="empty-state-icon">🌟</div>
              <p style={{ fontSize: 13, margin: 0 }}>No activity yet. Add your first expense!</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="es-card" style={{ padding: 24, marginTop: 24 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, marginBottom: 16 }}>Quick Actions</h3>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[
            { label: '+ Create Group', page: 'groups', icon: '👥' },
            { label: '+ Add Expense', page: 'expenses', icon: '💸' },
            { label: '↔ Record Settlement', page: 'settlements', icon: '✅' },
            { label: '📊 View Balances', page: 'groups', icon: '' },
          ].map((a, i) => (
            <button key={i} className="btn-ghost" onClick={() => onNavigate(a.page)} style={{ fontSize: 13 }}>
              {a.icon && <span style={{ marginRight: 6 }}>{a.icon}</span>}{a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ActivityItem({ activity }) {
  return (
    <div style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
      <div className="es-avatar es-avatar-sm" style={{ marginTop: 2 }}>
        {activity.user?.full_name?.[0] || '?'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, color: 'var(--text-primary)', margin: 0, lineHeight: 1.4 }}>
          <strong style={{ fontWeight: 600 }}>{activity.user?.full_name}</strong>
          {' '}{ACTION_LABELS[activity.action]}
        </p>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 0' }}>{formatRelativeTime(activity.created_at)}</p>
      </div>
    </div>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
