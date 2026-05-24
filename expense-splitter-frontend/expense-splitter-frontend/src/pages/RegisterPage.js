import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function RegisterPage({ onSwitch }) {
  const { register } = useAuth();
  const [form, setForm] = useState({ username: '', email: '', first_name: '', last_name: '', password: '', password2: '' });
  const [loading, setLoading] = useState(false);

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (form.password !== form.password2) { toast.error("Passwords don't match"); return; }
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created! Welcome aboard.');
    } catch (err) {
      const errs = err.response?.data;
      if (errs) Object.values(errs).flat().forEach(m => toast.error(m));
      else toast.error('Registration failed');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)', position: 'relative', overflow: 'hidden', padding: '40px 20px' }}>
      <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(45,212,160,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 480 }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg, var(--gold) 0%, #b8960c 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: '#0a0d14', margin: '0 auto 14px' }}>S</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 30, color: 'var(--text-primary)', marginBottom: 6 }}>Create account</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Join SplitWise and simplify group expenses</p>
        </div>

        <div className="es-card" style={{ padding: 32 }}>
          <form onSubmit={handleSubmit}>
            <div className="grid-2" style={{ marginBottom: 16 }}>
              <div><label className="es-label">First Name</label><input className="es-input" value={form.first_name} onChange={set('first_name')} placeholder="John" required /></div>
              <div><label className="es-label">Last Name</label><input className="es-input" value={form.last_name} onChange={set('last_name')} placeholder="Doe" required /></div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label className="es-label">Username</label>
              <input className="es-input" value={form.username} onChange={set('username')} placeholder="johndoe" required />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label className="es-label">Email</label>
              <input className="es-input" type="email" value={form.email} onChange={set('email')} placeholder="john@example.com" required />
            </div>
            <div className="grid-2" style={{ marginBottom: 28 }}>
              <div><label className="es-label">Password</label><input className="es-input" type="password" value={form.password} onChange={set('password')} placeholder="Min 8 chars" required /></div>
              <div><label className="es-label">Confirm</label><input className="es-input" type="password" value={form.password2} onChange={set('password2')} placeholder="Repeat" required /></div>
            </div>
            <button type="submit" className="btn-gold" style={{ width: '100%', padding: '12px' }} disabled={loading}>
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>
          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Already have an account? </span>
            <button onClick={onSwitch} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gold)', fontSize: 13, fontWeight: 600 }}>Sign in</button>
          </div>
        </div>
      </div>
    </div>
  );
}
