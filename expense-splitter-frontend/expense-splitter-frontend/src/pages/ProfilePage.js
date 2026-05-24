import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../utils/api';
import { getInitials, formatDate } from '../utils/helpers';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ first_name: user?.first_name || '', last_name: user?.last_name || '', phone: user?.phone || '', bio: user?.bio || '' });
  const [pwForm, setPwForm] = useState({ old_password: '', new_password: '' });
  const [saving, setSaving] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const setPw = k => e => setPwForm(p => ({ ...p, [k]: e.target.value }));

  const handleSave = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await authAPI.updateProfile(form);
      updateUser(data);
      toast.success('Profile updated!');
    } catch { toast.error('Failed to update profile'); }
    setSaving(false);
  };

  const handlePassword = async e => {
    e.preventDefault();
    setPwSaving(true);
    try {
      await authAPI.profile(); // just a ping test; real call below
      const res = await fetch('/api/auth/change-password/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('access_token')}` },
        body: JSON.stringify(pwForm),
      });
      if (res.ok) { toast.success('Password changed!'); setPwForm({ old_password: '', new_password: '' }); }
      else { const d = await res.json(); toast.error(d.error || 'Failed to change password'); }
    } catch { toast.error('Failed to change password'); }
    setPwSaving(false);
  };

  return (
    <div style={{ maxWidth: 720 }}>
      {/* Header card */}
      <div className="es-card-gold" style={{ padding: '28px 32px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 24 }}>
        <div className="es-avatar es-avatar-lg" style={{ width: 72, height: 72, fontSize: 26, border: '2px solid var(--border-accent)' }}>
          {getInitials(user?.full_name)}
        </div>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, marginBottom: 4 }}>{user?.full_name}</h2>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 4 }}>{user?.email}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Member since {formatDate(user?.created_at)}</div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <span className="badge-gold">Active</span>
        </div>
      </div>

      {/* Edit profile */}
      <div className="es-card" style={{ padding: 28, marginBottom: 20 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, marginBottom: 20 }}>Personal Information</h3>
        <form onSubmit={handleSave}>
          <div className="grid-2" style={{ marginBottom: 16 }}>
            <div><label className="es-label">First Name</label><input className="es-input" value={form.first_name} onChange={set('first_name')} placeholder="First name" /></div>
            <div><label className="es-label">Last Name</label><input className="es-input" value={form.last_name} onChange={set('last_name')} placeholder="Last name" /></div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label className="es-label">Phone</label>
            <input className="es-input" value={form.phone} onChange={set('phone')} placeholder="+1 555 000 0000" />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label className="es-label">Bio</label>
            <textarea className="es-input" value={form.bio} onChange={set('bio')} placeholder="A short bio about yourself…" rows={3} style={{ resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn-gold" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
          </div>
        </form>
      </div>

      {/* Change password */}
      <div className="es-card" style={{ padding: 28 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, marginBottom: 4 }}>Security</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 20 }}>Update your account password</p>
        <form onSubmit={handlePassword}>
          <div style={{ marginBottom: 16 }}>
            <label className="es-label">Current Password</label>
            <input className="es-input" type="password" value={pwForm.old_password} onChange={setPw('old_password')} placeholder="••••••••" required />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label className="es-label">New Password</label>
            <input className="es-input" type="password" value={pwForm.new_password} onChange={setPw('new_password')} placeholder="Min 8 characters" required />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn-ghost" disabled={pwSaving}>{pwSaving ? 'Changing…' : 'Change Password'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
