import React, { useEffect, useState, useCallback } from 'react';
import { settlementsAPI, groupsAPI } from '../utils/api';
import { formatCurrency, formatDate, getInitials } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

function CreateSettlementModal({ group, members, onClose, onCreated }) {
  const { user } = useAuth();
  // Initialise as strings so select comparison always works
  const defaultFrom = user?.id ? String(user.id) : (members[0]?.id ? String(members[0].id) : '');
  const [form, setForm] = useState({
    from_user_id: defaultFrom,
    to_user_id: '',
    amount: '',
    currency: 'USD',
    notes: '',
    payment_method: '',
  });
  const [loading, setLoading] = useState(false);
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.to_user_id) { toast.error('Please select who receives the payment'); return; }
    if (form.from_user_id === form.to_user_id) { toast.error("Payer and receiver can't be the same person"); return; }
    setLoading(true);
    try {
      const payload = {
        ...form,
        amount: parseFloat(form.amount),
        from_user_id: parseInt(form.from_user_id, 10),
        to_user_id: parseInt(form.to_user_id, 10),
      };
      const { data } = await settlementsAPI.create(group.id, payload);
      toast.success('Settlement recorded!');
      onCreated(data);
      onClose();
    } catch (err) {
      const errs = err.response?.data;
      if (errs && typeof errs === 'object') {
        Object.entries(errs).forEach(([k, v]) => toast.error(`${k}: ${Array.isArray(v) ? v.join(', ') : v}`));
      } else {
        toast.error('Failed to create settlement');
      }
    } finally {
      setLoading(false);
    }
  };

  const otherMembers = members.filter(m => String(m.id) !== form.from_user_id);

  return (
    <div className="es-modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="es-modal">
        <div className="es-modal-header">
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22 }}>Record Settlement</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>Record a payment between members</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="es-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="grid-2">
              <div>
                <label className="es-label">From (Payer)</label>
                <select className="es-select" value={form.from_user_id} onChange={set('from_user_id')}>
                  {members.map(m => <option key={m.id} value={String(m.id)}>{m.full_name || m.email}</option>)}
                </select>
              </div>
              <div>
                <label className="es-label">To (Receiver)</label>
                <select className="es-select" value={form.to_user_id} onChange={set('to_user_id')} required>
                  <option value="">Select member…</option>
                  {otherMembers.map(m => <option key={m.id} value={String(m.id)}>{m.full_name || m.email}</option>)}
                </select>
              </div>
            </div>
            <div className="grid-2">
              <div>
                <label className="es-label">Amount</label>
                <input className="es-input" type="number" min="0.01" step="0.01" value={form.amount}
                  onChange={set('amount')} placeholder="0.00" required />
              </div>
              <div>
                <label className="es-label">Currency</label>
                <select className="es-select" value={form.currency} onChange={set('currency')}>
                  {['USD','EUR','GBP','JPY','AUD','CAD','INR','NPR'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="es-label">Payment Method</label>
              <input className="es-input" value={form.payment_method} onChange={set('payment_method')}
                placeholder="e.g. Cash, PayPal, Bank Transfer" />
            </div>
            <div>
              <label className="es-label">Notes (optional)</label>
              <textarea className="es-input" value={form.notes} onChange={set('notes')}
                placeholder="Any notes about this payment…" rows={2} style={{ resize: 'vertical' }} />
            </div>
          </div>
          <div className="es-modal-footer">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-gold" disabled={loading}>{loading ? 'Recording…' : 'Record Settlement'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   badge: 'badge-gold',  color: 'var(--gold)' },
  completed: { label: 'Completed', badge: 'badge-green', color: 'var(--emerald)' },
  cancelled: { label: 'Cancelled', badge: 'badge-red',   color: 'var(--crimson)' },
};

export default function SettlementsPage() {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [settlements, setSettlements] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [settlementsLoading, setSettlementsLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState('all');

  // Load groups once
  useEffect(() => {
    setGroupsLoading(true);
    groupsAPI.list()
      .then(r => {
        const gs = Array.isArray(r.data) ? r.data : (r.data?.results ?? []);
        setGroups(gs);
        if (gs.length > 0) setActiveGroup(gs[0]);
      })
      .catch(() => toast.error('Failed to load groups'))
      .finally(() => setGroupsLoading(false));
  }, []);

  // Load settlements when active group changes
  const loadSettlements = useCallback((group) => {
    if (!group?.id) return;
    setSettlementsLoading(true);
    setSettlements([]);
    settlementsAPI.list(group.id)
      .then(r => {
        const list = Array.isArray(r.data) ? r.data : (r.data?.results ?? []);
        setSettlements(list);
      })
      .catch(() => toast.error('Failed to load settlements'))
      .finally(() => setSettlementsLoading(false));
  }, []);

  useEffect(() => {
    if (activeGroup) loadSettlements(activeGroup);
  }, [activeGroup, loadSettlements]);

  const handleComplete = async (groupId, settlementId) => {
    try {
      await settlementsAPI.complete(groupId, settlementId);
      setSettlements(p => p.map(s => s.id === settlementId ? { ...s, status: 'completed' } : s));
      toast.success('Settlement marked as completed!');
    } catch {
      toast.error('Failed to update settlement');
    }
  };

  const filtered = settlements.filter(s => filter === 'all' || s.status === filter);
  const totalPending = settlements
    .filter(s => s.status === 'pending')
    .reduce((acc, s) => acc + parseFloat(s.amount || 0), 0);

  const members = activeGroup?.members ?? [];

  if (groupsLoading) {
    return (
      <div>
        <div className="skeleton" style={{ height: 32, width: 220, borderRadius: 8, marginBottom: 12 }} />
        {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 60, marginBottom: 8, borderRadius: 10 }} />)}
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, marginBottom: 4 }}>Settlements</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Track and manage payments between group members</p>
        </div>
        {activeGroup && members.length >= 2 && (
          <button className="btn-gold" onClick={() => setShowCreate(true)}>+ Record Payment</button>
        )}
      </div>

      {/* Group tabs */}
      {groups.length > 1 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {groups.map(g => (
            <button key={g.id} onClick={() => setActiveGroup(g)}
              className={activeGroup?.id === g.id ? 'btn-gold' : 'btn-ghost'}
              style={{ fontSize: 13, padding: '7px 16px' }}>
              {g.name}
            </button>
          ))}
        </div>
      )}

      {/* No groups */}
      {groups.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">👥</div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, marginBottom: 8 }}>No groups yet</h3>
          <p style={{ fontSize: 13 }}>Create a group first to track settlements</p>
        </div>
      )}

      {/* Summary cards */}
      {activeGroup && (
        <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
          <div className="es-card" style={{ flex: 1, minWidth: 140, padding: 20 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Total Pending</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 24, color: 'var(--gold)', fontWeight: 500 }}>{formatCurrency(totalPending)}</div>
          </div>
          <div className="es-card" style={{ flex: 1, minWidth: 140, padding: 20 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Pending Count</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 24, color: 'var(--text-primary)' }}>
              {settlements.filter(s => s.status === 'pending').length}
            </div>
          </div>
          <div className="es-card" style={{ flex: 1, minWidth: 140, padding: 20 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Completed</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 24, color: 'var(--emerald)' }}>
              {settlements.filter(s => s.status === 'completed').length}
            </div>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      {activeGroup && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {['all', 'pending', 'completed', 'cancelled'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                border: 'none', cursor: 'pointer', transition: 'var(--transition)',
                background: filter === f ? 'var(--gold-muted)' : 'var(--bg-card)',
                color: filter === f ? 'var(--gold)' : 'var(--text-muted)' }}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      )}

      {/* Settlements list */}
      {activeGroup && (
        <div className="es-card" style={{ overflow: 'hidden' }}>
          {settlementsLoading ? (
            <div style={{ padding: 24 }}>
              {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 72, marginBottom: 8, borderRadius: 8 }} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">✅</div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, marginBottom: 8 }}>No settlements</h3>
              <p style={{ fontSize: 13 }}>
                {filter !== 'all' ? `No ${filter} settlements` : 'Record payments between group members'}
              </p>
            </div>
          ) : (
            filtered.map(s => {
              const cfg = STATUS_CONFIG[s.status] || STATUS_CONFIG.pending;
              const isMySettlement = s.from_user?.id === user?.id || s.to_user?.id === user?.id;
              return (
                <div key={s.id}
                  style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 24px',
                    borderBottom: '1px solid var(--border-subtle)',
                    background: isMySettlement ? 'rgba(212,175,55,0.02)' : 'transparent',
                    flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 180 }}>
                    <div className="es-avatar">{getInitials(s.from_user?.full_name || s.from_user?.email)}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>
                        {s.from_user?.full_name || s.from_user?.email || '—'}{' '}
                        <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>paid</span>{' '}
                        {s.to_user?.full_name || s.to_user?.email || '—'}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                        {s.created_at ? formatDate(s.created_at) : ''}
                        {s.payment_method ? ` · ${s.payment_method}` : ''}
                        {s.notes ? ` · ${s.notes}` : ''}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 500, color: cfg.color }}>
                      {formatCurrency(s.amount, s.currency || 'USD')}
                    </div>
                    <span className={cfg.badge} style={{ fontSize: 10 }}>{cfg.label}</span>
                  </div>
                  {s.status === 'pending' && (
                    <button className="btn-ghost" style={{ fontSize: 12, padding: '6px 12px', flexShrink: 0 }}
                      onClick={() => handleComplete(activeGroup.id, s.id)}>
                      Mark Paid ✓
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {showCreate && activeGroup && members.length >= 2 && (
        <CreateSettlementModal
          group={activeGroup}
          members={members}
          onClose={() => setShowCreate(false)}
          onCreated={s => setSettlements(p => [s, ...p])}
        />
      )}
    </div>
  );
}
