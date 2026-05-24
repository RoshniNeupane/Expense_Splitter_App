import React, { useEffect, useState } from 'react';
import { groupsAPI } from '../utils/api';
import { formatCurrency, GROUP_CATEGORY_ICONS, getInitials } from '../utils/helpers';
import toast from 'react-hot-toast';

function CreateGroupModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', description: '', category: 'other' });
  const [loading, setLoading] = useState(false);
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await groupsAPI.create(form);
      toast.success(`Group "${data.name}" created!`);
      onCreated(data);
      onClose();
    } catch { toast.error('Failed to create group'); }
    setLoading(false);
  };

  return (
    <div className="es-modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="es-modal">
        <div className="es-modal-header">
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22 }}>Create New Group</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>Set up a new expense group</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="es-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="es-label">Group Name</label>
              <input className="es-input" value={form.name} onChange={set('name')} placeholder="e.g. Tokyo Trip 2025" required />
            </div>
            <div>
              <label className="es-label">Category</label>
              <select className="es-select" value={form.category} onChange={set('category')}>
                <option value="trip">✈️ Trip</option>
                <option value="home">🏠 Home</option>
                <option value="food">🍕 Food</option>
                <option value="other">👥 Other</option>
              </select>
            </div>
            <div>
              <label className="es-label">Description (optional)</label>
              <textarea className="es-input" value={form.description} onChange={set('description')} placeholder="What's this group for?" rows={3} style={{ resize: 'vertical' }} />
            </div>
          </div>
          <div className="es-modal-footer">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-gold" disabled={loading}>{loading ? 'Creating…' : 'Create Group'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddMemberModal({ group, onClose }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdd = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await groupsAPI.addMember(group.id, email);
      toast.success('Member added!');
      setEmail('');
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to add member'); }
    setLoading(false);
  };

  return (
    <div className="es-modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="es-modal">
        <div className="es-modal-header">
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22 }}>Add Member</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>Invite someone to {group.name}</p>
        </div>
        <form onSubmit={handleAdd}>
          <div className="es-modal-body">
            <label className="es-label">Member Email Address</label>
            <input className="es-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="friend@example.com" required />
          </div>
          <div className="es-modal-footer">
            <button type="button" className="btn-ghost" onClick={onClose}>Close</button>
            <button type="submit" className="btn-gold" disabled={loading}>{loading ? 'Adding…' : 'Add Member'}</button>
          </div>
        </form>
        {group.members?.length > 0 && (
          <div style={{ padding: '0 28px 24px' }}>
            <hr className="es-divider" />
            <p className="es-label" style={{ marginBottom: 12 }}>Current Members ({group.members.length})</p>
            {group.members.map(m => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
                <div className="es-avatar es-avatar-sm">{getInitials(m.full_name)}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{m.full_name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.email}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function GroupsPage({ onSelectGroup }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [addMemberGroup, setAddMemberGroup] = useState(null);

  useEffect(() => {
    groupsAPI.list().then(r => setGroups(r.data.results || r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete group "${name}"? This cannot be undone.`)) return;
    try {
      await groupsAPI.delete(id);
      setGroups(g => g.filter(x => x.id !== id));
      toast.success('Group deleted');
    } catch { toast.error('Failed to delete'); }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, marginBottom: 4 }}>Your Groups</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{groups.length} group{groups.length !== 1 ? 's' : ''} active</p>
        </div>
        <button className="btn-gold" onClick={() => setShowCreate(true)}>+ New Group</button>
      </div>

      {loading ? (
        <div className="grid-3">{[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 180, borderRadius: 16 }} />)}</div>
      ) : groups.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">👥</div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, marginBottom: 8 }}>No groups yet</h3>
          <p style={{ fontSize: 14, marginBottom: 20 }}>Create your first group to start tracking shared expenses</p>
          <button className="btn-gold" onClick={() => setShowCreate(true)}>Create First Group</button>
        </div>
      ) : (
        <div className="grid-3">
          {groups.map(g => (
            <div key={g.id} className="es-card" style={{ padding: 24, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 16 }}
              onClick={() => onSelectGroup(g)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ fontSize: 32 }}>{GROUP_CATEGORY_ICONS[g.category] || '👥'}</div>
                <span className="badge-gold">{g.category}</span>
              </div>
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, marginBottom: 4 }}>{g.name}</h3>
                {g.description && <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{g.description}</p>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, color: 'var(--gold)', fontWeight: 500 }}>{formatCurrency(g.total_expenses || 0)}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total Expenses</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {(g.members || []).slice(0, 4).map((m, i) => (
                    <div key={m.id} className="es-avatar es-avatar-sm" title={m.full_name}
                      style={{ marginLeft: i > 0 ? -8 : 0, border: '2px solid var(--bg-card)', zIndex: 4 - i }}>
                      {getInitials(m.full_name)}
                    </div>
                  ))}
                  {g.member_count > 4 && <div className="es-avatar es-avatar-sm" style={{ marginLeft: -8, background: 'var(--bg-elevated)', fontSize: 9, color: 'var(--text-muted)' }}>+{g.member_count - 4}</div>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, borderTop: '1px solid var(--border-subtle)', paddingTop: 14 }} onClick={e => e.stopPropagation()}>
                <button className="btn-ghost" style={{ flex: 1, fontSize: 12, padding: '7px 10px' }} onClick={() => setAddMemberGroup(g)}>+ Member</button>
                <button className="btn-ghost" style={{ flex: 1, fontSize: 12, padding: '7px 10px' }} onClick={() => onSelectGroup(g)}>View →</button>
                <button className="btn-danger-ghost" style={{ fontSize: 12, padding: '7px 12px' }} onClick={() => handleDelete(g.id, g.name)}>🗑</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && <CreateGroupModal onClose={() => setShowCreate(false)} onCreated={g => setGroups(p => [g, ...p])} />}
      {addMemberGroup && <AddMemberModal group={addMemberGroup} onClose={() => setAddMemberGroup(null)} />}
    </div>
  );
}
