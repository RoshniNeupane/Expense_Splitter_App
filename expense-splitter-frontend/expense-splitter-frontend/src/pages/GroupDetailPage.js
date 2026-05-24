import React, { useEffect, useState } from 'react';
import { groupsAPI } from '../utils/api';
import { formatCurrency, getInitials } from '../utils/helpers';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['#d4af37', '#2dd4a0', '#f05060', '#4a90e2', '#a78bfa', '#fb923c'];

export default function GroupDetailPage({ group, onBack, onNavigateExpenses }) {
  const [balances, setBalances] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([groupsAPI.balances(group.id), groupsAPI.summary(group.id)])
      .then(([bRes, sRes]) => { setBalances(bRes.data); setSummary(sRes.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [group.id]);

  const pieData = balances.map(b => ({ name: b.user?.name || 'Unknown', value: Math.abs(parseFloat(b.paid || 0)) })).filter(d => d.value > 0);

  return (
    <div>
      {/* Back + Header */}
      <div style={{ marginBottom: 24 }}>
        <button className="btn-ghost" style={{ fontSize: 13, padding: '6px 14px', marginBottom: 16 }} onClick={onBack}>← Back to Groups</button>
        <div className="es-card-gold" style={{ padding: '24px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>{group.category}</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, marginBottom: 6 }}>{group.name}</h2>
            {group.description && <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>{group.description}</p>}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-ghost" style={{ fontSize: 13 }} onClick={onNavigateExpenses}>View Expenses →</button>
          </div>
        </div>
      </div>

      {/* Summary stats */}
      {summary && (
        <div className="grid-4" style={{ marginBottom: 24 }}>
          {[
            { label: 'Total Spent', value: formatCurrency(summary.total_expenses), color: 'gold' },
            { label: 'Expenses', value: summary.expense_count, color: 'blue' },
            { label: 'Members', value: summary.member_count, color: 'green' },
            { label: 'Pending Settlements', value: summary.pending_settlements, color: 'red' },
          ].map((s, i) => (
            <div key={i} className={`stat-card ${s.color}`}>
              <div className={`stat-value text-${s.color === 'blue' ? 'sapphire' : s.color === 'gold' ? 'gold' : s.color === 'red' ? 'crimson' : 'emerald'}`}>{s.value}</div>
              <div className="stat-label" style={{ marginTop: 6 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid-2" style={{ alignItems: 'start' }}>
        {/* Balances */}
        <div className="es-card" style={{ padding: 24 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, marginBottom: 20 }}>Member Balances</h3>
          {loading ? (
            [1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 52, marginBottom: 8, borderRadius: 8 }} />)
          ) : balances.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No balance data available</p>
          ) : (
            balances.map((b, i) => {
              const net = parseFloat(b.net || 0);
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div className="es-avatar" style={{ background: `linear-gradient(135deg, ${COLORS[i % COLORS.length]}, ${COLORS[(i+1) % COLORS.length]})` }}>
                    {getInitials(b.user?.name)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>{b.user?.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Paid: {formatCurrency(b.paid || 0)} · Owes: {formatCurrency(b.owed || 0)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 600, color: net >= 0 ? 'var(--emerald)' : 'var(--crimson)' }}>
                      {net >= 0 ? '+' : ''}{formatCurrency(Math.abs(net))}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{net >= 0 ? 'Gets back' : 'Owes'}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pie chart */}
        <div className="es-card" style={{ padding: 24 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, marginBottom: 20 }}>Spending Distribution</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} innerRadius={50} dataKey="value" paddingAngle={3}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={v => formatCurrency(v)} contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13 }} />
                <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: '40px 0' }}>
              <div className="empty-state-icon">📊</div>
              <p style={{ fontSize: 13 }}>Add expenses to see distribution</p>
            </div>
          )}
        </div>
      </div>

      {/* Members list */}
      <div className="es-card" style={{ padding: 24, marginTop: 20 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, marginBottom: 16 }}>Members ({group.members?.length || 0})</h3>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {(group.members || []).map((m, i) => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div className="es-avatar es-avatar-sm" style={{ background: `linear-gradient(135deg, ${COLORS[i % COLORS.length]}, ${COLORS[(i+1) % COLORS.length]})` }}>
                {getInitials(m.full_name)}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{m.full_name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.email}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
