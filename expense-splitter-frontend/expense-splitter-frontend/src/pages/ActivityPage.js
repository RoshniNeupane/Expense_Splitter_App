import React, { useEffect, useState, useCallback } from 'react';
import { activitiesAPI, groupsAPI } from '../utils/api';
import { formatRelativeTime, ACTION_LABELS, getInitials } from '../utils/helpers';
import toast from 'react-hot-toast';

const ACTION_ICONS = {
  expense_added:        '💸',
  expense_edited:       '✏️',
  expense_deleted:      '🗑',
  settlement_created:   '💳',
  settlement_completed: '✅',
  member_added:         '👋',
  member_removed:       '👤',
  group_created:        '🎉',
};

export default function ActivityPage() {
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [activities, setActivities] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [activitiesLoading, setActivitiesLoading] = useState(false);

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

  // Load activities when active group changes
  const loadActivities = useCallback((group) => {
    if (!group?.id) return;
    setActivitiesLoading(true);
    setActivities([]);
    activitiesAPI.list(group.id)
      .then(r => {
        const list = Array.isArray(r.data) ? r.data : (r.data?.results ?? []);
        setActivities(list);
      })
      .catch(() => toast.error('Failed to load activity feed'))
      .finally(() => setActivitiesLoading(false));
  }, []);

  useEffect(() => {
    if (activeGroup) loadActivities(activeGroup);
  }, [activeGroup, loadActivities]);

  // Group activities by calendar date
  const grouped = activities.reduce((acc, act) => {
    try {
      const d = new Date(act.created_at).toDateString();
      if (!acc[d]) acc[d] = [];
      acc[d].push(act);
    } catch {
      // skip malformed dates
    }
    return acc;
  }, {});

  if (groupsLoading) {
    return (
      <div>
        <div className="skeleton" style={{ height: 32, width: 200, borderRadius: 8, marginBottom: 12 }} />
        {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 64, marginBottom: 8, borderRadius: 10 }} />)}
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, marginBottom: 4 }}>Activity Feed</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Full history of all group actions</p>
      </div>

      {/* Group tabs */}
      {groups.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">👥</div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, marginBottom: 8 }}>No groups yet</h3>
          <p style={{ fontSize: 13 }}>Create a group to start tracking activity</p>
        </div>
      ) : (
        <>
          {groups.length > 1 && (
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

          {activitiesLoading ? (
            <div>
              {[1,2,3,4,5].map(i => (
                <div key={i} className="skeleton" style={{ height: 64, marginBottom: 8, borderRadius: 10 }} />
              ))}
            </div>
          ) : activities.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📜</div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, marginBottom: 8 }}>No activity yet</h3>
              <p style={{ fontSize: 13 }}>Activity appears here as members add expenses and record settlements</p>
            </div>
          ) : (
            Object.entries(grouped).map(([date, acts]) => (
              <div key={date} style={{ marginBottom: 28 }}>
                {/* Date separator */}
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
                  textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12,
                  display: 'flex', alignItems: 'center', gap: 12 }}>
                  {date}
                  <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
                </div>

                <div className="es-card" style={{ overflow: 'hidden' }}>
                  {acts.map((act, i) => (
                    <div key={act.id ?? i}
                      style={{ display: 'flex', gap: 14, padding: '16px 20px', alignItems: 'flex-start',
                        borderBottom: i < acts.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                        transition: 'background 0.15s' }}
                      onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                      onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                      {/* Action icon */}
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--bg-elevated)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 18, flexShrink: 0 }}>
                        {ACTION_ICONS[act.action] || '📌'}
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                          <div className="es-avatar es-avatar-sm">
                            {getInitials(act.user?.full_name || act.user?.email)}
                          </div>
                          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                            {act.user?.full_name || act.user?.email || 'Someone'}
                          </span>
                          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                            {ACTION_LABELS[act.action] || act.action}
                          </span>
                        </div>
                        {act.description && (
                          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, paddingLeft: 36,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {act.description}
                          </p>
                        )}
                      </div>

                      {/* Timestamp */}
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0, paddingTop: 2 }}>
                        {act.created_at ? formatRelativeTime(act.created_at) : ''}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </>
      )}
    </div>
  );
}
