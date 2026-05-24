import React, { useEffect, useState } from 'react';
import { activitiesAPI, groupsAPI } from '../utils/api';
import { formatRelativeTime, ACTION_LABELS, getInitials } from '../utils/helpers';

const ACTION_ICONS = {
  expense_added: '💸', expense_edited: '✏️', expense_deleted: '🗑',
  settlement_created: '💳', settlement_completed: '✅',
  member_added: '👋', member_removed: '👤', group_created: '🎉',
};

export default function ActivityPage() {
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    groupsAPI.list().then(r => {
      const gs = r.data.results || r.data;
      setGroups(gs);
      if (gs.length > 0) setActiveGroup(gs[0]);
    });
  }, []);

  useEffect(() => {
    if (!activeGroup) return;
    setLoading(true);
    activitiesAPI.list(activeGroup.id)
      .then(r => setActivities(r.data.results || r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeGroup]);

  // Group activities by date
  const grouped = activities.reduce((acc, act) => {
    const d = new Date(act.created_at).toDateString();
    if (!acc[d]) acc[d] = [];
    acc[d].push(act);
    return acc;
  }, {});

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, marginBottom: 4 }}>Activity Feed</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Full history of all group actions</p>
      </div>

      {/* Group tabs */}
      {groups.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {groups.map(g => (
            <button key={g.id} onClick={() => setActiveGroup(g)}
              className={activeGroup?.id === g.id ? 'btn-gold' : 'btn-ghost'}
              style={{ fontSize: 13, padding: '7px 16px' }}>
              {g.name}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div>{[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 64, marginBottom: 8, borderRadius: 8 }} />)}</div>
      ) : activities.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📜</div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, marginBottom: 8 }}>No activity yet</h3>
          <p style={{ fontSize: 13 }}>Activity will appear here as group members add expenses and settlements</p>
        </div>
      ) : (
        Object.entries(grouped).map(([date, acts]) => (
          <div key={date} style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
              {date}
              <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
            </div>
            <div className="es-card" style={{ overflow: 'hidden' }}>
              {acts.map((act, i) => (
                <div key={act.id} style={{
                  display: 'flex', gap: 14, padding: '16px 20px',
                  borderBottom: i < acts.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                  transition: 'var(--transition)',
                  alignItems: 'flex-start'
                }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                    {ACTION_ICONS[act.action] || '📌'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <div className="es-avatar es-avatar-sm">{getInitials(act.user?.full_name)}</div>
                      <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
                        {act.user?.full_name || 'Someone'}
                      </span>
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        {ACTION_LABELS[act.action] || act.action}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, paddingLeft: 36 }}>{act.description}</p>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0, paddingTop: 2 }}>{formatRelativeTime(act.created_at)}</div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
