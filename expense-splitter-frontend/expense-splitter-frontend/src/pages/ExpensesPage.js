import React, { useEffect, useState } from 'react';
import { expensesAPI, groupsAPI } from '../utils/api';
import { formatCurrency, formatDate, CATEGORY_ICONS, getInitials } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

function AddExpenseModal({ group, members, onClose, onCreated }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    description: '', amount: '', currency: 'USD', paid_by_id: user?.id || '',
    split_type: 'equal', category: 'other', date: new Date().toISOString().split('T')[0], notes: ''
  });
  const [loading, setLoading] = useState(false);
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await expensesAPI.create(group.id, { ...form, amount: parseFloat(form.amount) });
      toast.success('Expense added!');
      onCreated(data);
      onClose();
    } catch (err) {
      const errs = err.response?.data;
      if (errs) Object.entries(errs).forEach(([k, v]) => toast.error(`${k}: ${v}`));
      else toast.error('Failed to add expense');
    }
    setLoading(false);
  };

  return (
    <div className="es-modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="es-modal">
        <div className="es-modal-header">
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22 }}>Add Expense</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>Track a new shared expense</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="es-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label className="es-label">Description</label>
              <input className="es-input" value={form.description} onChange={set('description')} placeholder="e.g. Dinner at La Maison" required />
            </div>
            <div className="grid-2">
              <div>
                <label className="es-label">Amount</label>
                <input className="es-input" type="number" min="0.01" step="0.01" value={form.amount} onChange={set('amount')} placeholder="0.00" required />
              </div>
              <div>
                <label className="es-label">Currency</label>
                <select className="es-select" value={form.currency} onChange={set('currency')}>
                  {['USD','EUR','GBP','JPY','AUD','CAD','INR','NPR'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="grid-2">
              <div>
                <label className="es-label">Paid By</label>
                <select className="es-select" value={form.paid_by_id} onChange={set('paid_by_id')}>
                  {members.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                </select>
              </div>
              <div>
                <label className="es-label">Split Type</label>
                <select className="es-select" value={form.split_type} onChange={set('split_type')}>
                  <option value="equal">Equal Split</option>
                  <option value="exact">Exact Amounts</option>
                  <option value="percentage">Percentage</option>
                </select>
              </div>
            </div>
            <div className="grid-2">
              <div>
                <label className="es-label">Category</label>
                <select className="es-select" value={form.category} onChange={set('category')}>
                  {Object.entries(CATEGORY_ICONS).map(([k, v]) => <option key={k} value={k}>{v} {k.charAt(0).toUpperCase() + k.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="es-label">Date</label>
                <input className="es-input" type="date" value={form.date} onChange={set('date')} required />
              </div>
            </div>
            <div>
              <label className="es-label">Notes (optional)</label>
              <textarea className="es-input" value={form.notes} onChange={set('notes')} placeholder="Any additional details…" rows={2} style={{ resize: 'vertical' }} />
            </div>
          </div>
          <div className="es-modal-footer">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-gold" disabled={loading}>{loading ? 'Adding…' : 'Add Expense'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ExpensesPage({ selectedGroup, onNavigate }) {
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(selectedGroup || null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    groupsAPI.list().then(r => {
      const gs = r.data.results || r.data;
      setGroups(gs);
      if (!activeGroup && gs.length > 0) setActiveGroup(gs[0]);
    });
  }, []);

  useEffect(() => {
    if (!activeGroup) return;
    setLoading(true);
    expensesAPI.list(activeGroup.id)
      .then(r => setExpenses(r.data.results || r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeGroup]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await expensesAPI.delete(activeGroup.id, id);
      setExpenses(p => p.filter(e => e.id !== id));
      toast.success('Expense deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const total = expenses.reduce((s, e) => s + parseFloat(e.amount), 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, marginBottom: 4 }}>Expenses</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
            {activeGroup ? `${activeGroup.name} · ` : ''}{expenses.length} expense{expenses.length !== 1 ? 's' : ''}
          </p>
        </div>
        {activeGroup && <button className="btn-gold" onClick={() => setShowAdd(true)}>+ Add Expense</button>}
      </div>

      {/* Group selector */}
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

      {/* Summary bar */}
      {activeGroup && (
        <div className="es-card-gold" style={{ padding: '16px 24px', marginBottom: 20, display: 'flex', gap: 32 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Total</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, color: 'var(--text-primary)', fontWeight: 500 }}>{formatCurrency(total)}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Expenses</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, color: 'var(--text-secondary)' }}>{expenses.length}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Members</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, color: 'var(--text-secondary)' }}>{activeGroup.member_count || 0}</div>
          </div>
        </div>
      )}

      {/* Expenses table */}
      <div className="es-card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 24 }}>{[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 48, marginBottom: 8, borderRadius: 8 }} />)}</div>
        ) : expenses.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💸</div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, marginBottom: 8 }}>No expenses yet</h3>
            <p style={{ fontSize: 13, marginBottom: 16 }}>Add the first expense for this group</p>
            {activeGroup && <button className="btn-gold" onClick={() => setShowAdd(true)}>Add First Expense</button>}
          </div>
        ) : (
          <table className="es-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Amount</th>
                <th>Paid By</th>
                <th>Split</th>
                <th>Date</th>
                <th>Splits</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {expenses.map(exp => (
                <tr key={exp.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 20 }}>{CATEGORY_ICONS[exp.category] || '📌'}</span>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: 14 }}>{exp.description}</div>
                        {exp.notes && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{exp.notes}</div>}
                      </div>
                    </div>
                  </td>
                  <td><span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500, color: 'var(--gold)' }}>{formatCurrency(exp.amount, exp.currency)}</span></td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="es-avatar es-avatar-sm">{getInitials(exp.paid_by?.full_name)}</div>
                      <span style={{ fontSize: 13 }}>{exp.paid_by?.full_name}</span>
                    </div>
                  </td>
                  <td><span className="badge-blue">{exp.split_type}</span></td>
                  <td><span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{formatDate(exp.date)}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: -4 }}>
                      {(exp.splits || []).slice(0, 3).map((s, i) => (
                        <div key={s.id} className="es-avatar es-avatar-sm" title={`${s.user?.full_name}: ${formatCurrency(s.amount)}`}
                          style={{ marginLeft: i > 0 ? -6 : 0, border: '2px solid var(--bg-card)' }}>
                          {getInitials(s.user?.full_name)}
                        </div>
                      ))}
                      {exp.splits?.length > 3 && <div className="es-avatar es-avatar-sm" style={{ marginLeft: -6, fontSize: 9 }}>+{exp.splits.length - 3}</div>}
                    </div>
                  </td>
                  <td>
                    <button className="btn-danger-ghost" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => handleDelete(exp.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAdd && activeGroup && (
        <AddExpenseModal
          group={activeGroup}
          members={activeGroup.members || []}
          onClose={() => setShowAdd(false)}
          onCreated={e => setExpenses(p => [e, ...p])}
        />
      )}
    </div>
  );
}
