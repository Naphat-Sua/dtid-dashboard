import React, { useState } from 'react';
import { Shield, Lock, User, LogIn, AlertTriangle, Eye, BarChart3, Database } from 'lucide-react';
import { useAuthStore } from '../store/useStore';

// Demo roles surfaced as one-click buttons (works offline, no backend).
const DEMO_ROLES = [
  { role: 'Admin',   icon: Database,  label: 'ผู้ดูแลระบบ',    desc: 'เพิ่ม/แก้ไข/ลบ + นำเข้า CSV', accent: 'var(--accent-purple)' },
  { role: 'Analyst', icon: BarChart3, label: 'นักวิเคราะห์',   desc: 'วิเคราะห์ KDE/Gi* + เครือข่าย', accent: 'var(--accent-blue)' },
  { role: 'Viewer',  icon: Eye,       label: 'ผู้บังคับบัญชา', desc: 'ดูแผนที่/สถิติ (อ่านอย่างเดียว)', accent: 'var(--accent-green)' },
];

const LoginPage = () => {
  const login = useAuthStore((s) => s.login);
  const loginDemo = useAuthStore((s) => s.loginDemo);
  const authError = useAuthStore((s) => s.authError);
  const isAuthLoading = useAuthStore((s) => s.isAuthLoading);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) return;
    await login(username, password);
  };

  return (
    <div className="flex items-center justify-center h-screen w-screen p-4"
      style={{ background: 'var(--bg-void)', color: 'var(--text-primary)' }}>
      <div className="w-full max-w-md spatial-card rounded-3xl p-8"
        style={{ background: 'var(--glass-regular)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--glow-blue)' }}>

        {/* Brand */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="p-3 rounded-2xl mb-3 animate-orbit-glow" style={{ background: 'var(--glass-regular)' }}>
            <Shield className="w-7 h-7" style={{ color: 'var(--accent-blue)' }} />
          </div>
          <h1 className="text-2xl font-bold" style={{ letterSpacing: '-0.03em' }}>DTID Dashboard</h1>
          <p className="text-xs font-medium mt-1" style={{ color: 'var(--text-tertiary)' }}>
            ระบบภูมิสารสนเทศสืบสวนคดียาเสพติด · สภ.สามพราน
          </p>
          <span className="mt-3 px-2.5 py-0.5 rounded-full text-[9px] font-bold"
            style={{ background: 'rgba(255,159,10,0.1)', color: 'var(--accent-orange)', border: '1px solid rgba(255,159,10,0.15)' }}>
            CONFIDENTIAL · เจ้าหน้าที่เท่านั้น
          </span>
        </div>

        {/* Real login form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-quaternary)' }} />
            <input
              type="text" autoComplete="username" placeholder="ชื่อผู้ใช้ (Username)" aria-label="ชื่อผู้ใช้"
              value={username} onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-2xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2"
              style={{ background: 'var(--glass-thin)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', '--tw-ring-color': 'var(--accent-blue)' }}
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-quaternary)' }} />
            <input
              type="password" autoComplete="current-password" placeholder="รหัสผ่าน (Password)" aria-label="รหัสผ่าน"
              value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2"
              style={{ background: 'var(--glass-thin)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', '--tw-ring-color': 'var(--accent-blue)' }}
            />
          </div>

          {authError && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
              style={{ background: 'rgba(255,69,58,0.1)', color: 'var(--accent-red)', border: '1px solid rgba(255,69,58,0.15)' }}>
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              {authError}
            </div>
          )}

          <button type="submit" disabled={isAuthLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-bold text-white transition-all duration-300 disabled:opacity-60"
            style={{ background: 'var(--accent-blue)', boxShadow: '0 4px 16px rgba(10,132,255,0.35)' }}>
            <LogIn className="w-4 h-4" />
            {isAuthLoading ? 'กำลังเข้าสู่ระบบ…' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
          <span className="text-[10px] font-semibold uppercase" style={{ color: 'var(--text-quaternary)', letterSpacing: '0.08em' }}>
            หรือเข้าโหมดสาธิต
          </span>
          <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
        </div>

        {/* Demo role quick-access */}
        <div className="space-y-2">
          {DEMO_ROLES.map((r) => (
            <button key={r.role} onClick={() => loginDemo(r.role)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-left transition-all duration-300"
              style={{ background: 'var(--glass-thin)', border: '1px solid var(--border-subtle)' }}
              onMouseOver={(e) => { e.currentTarget.style.borderColor = r.accent; }}
              onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}>
              <div className="p-2 rounded-xl" style={{ background: 'var(--glass-regular)' }}>
                <r.icon className="w-4 h-4" style={{ color: r.accent }} />
              </div>
              <div className="flex-1">
                <span className="text-[13px] font-semibold block" style={{ color: 'var(--text-primary)' }}>{r.label}</span>
                <span className="text-[10px]" style={{ color: 'var(--text-quaternary)' }}>{r.desc}</span>
              </div>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-md uppercase"
                style={{ background: `color-mix(in srgb, ${r.accent} 12%, transparent)`, color: r.accent }}>
                {r.role}
              </span>
            </button>
          ))}
        </div>

        <p className="text-[10px] text-center mt-5" style={{ color: 'var(--text-quaternary)' }}>
          บัญชีสาธิต: admin / analyst / viewer (รหัส …1234) เมื่อเชื่อมต่อฐานข้อมูลจริง
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
