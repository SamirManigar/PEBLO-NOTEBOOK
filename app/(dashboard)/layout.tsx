'use client';

import { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BookOpen, BarChart3, LogOut, ChevronRight, Menu, Sun, Moon } from 'lucide-react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

/* ── Isolated theme toggle so it can read/write the html attribute ── */
function ThemeToggleRow() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('peblo-theme');
    const dark = saved ? saved === 'dark' : true;
    setIsDark(dark);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    const theme = next ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('peblo-theme', theme);
  };

  return (
    <button
      onClick={toggle}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: '0.6rem',
        padding: '0.75rem 1rem', background: 'none', border: 'none', cursor: 'pointer',
        color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600,
        transition: 'color 0.15s', textAlign: 'left',
        borderBottom: '1px solid var(--border-subtle)',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--brand-primary)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: 1 }}>
        {isDark ? <Moon size={14} /> : <Sun size={14} />}
        <span>{isDark ? 'Dark Mode' : 'Light Mode'}</span>
      </div>
      {/* pill indicator - On (Right) = Dark, Off (Left) = Light */}
      <div style={{
        width: 34, height: 18, borderRadius: 99,
        background: isDark ? 'var(--brand-primary)' : 'var(--bg-surface-hover)',
        border: `1px solid ${isDark ? 'var(--brand-primary)' : 'var(--border-base)'}`,
        position: 'relative', flexShrink: 0, transition: 'all 0.25s',
      }}>
        <div style={{
          position: 'absolute', top: 2,
          left: isDark ? 16 : 2,
          width: 12, height: 12, borderRadius: '50%',
          background: '#fff',
          transition: 'left 0.25s cubic-bezier(0.4,0,0.2,1)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
        }} />
      </div>
    </button>
  );
}

function HeaderThemeButton() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('peblo-theme');
    const dark = saved ? saved === 'dark' : true;
    setIsDark(dark);
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    const theme = next ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('peblo-theme', theme);
  };

  return (
    <button
      onClick={toggle}
      style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border-base)', borderRadius: 8, padding: '0.4rem', cursor: 'pointer', color: 'var(--text-soft)', display: 'flex'
      }}
    >
      {isDark ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const { data: userData } = useSWR('/api/auth/me', fetcher);
  const user = userData?.user;

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const navItems = [
    { name: 'My Notes', href: '/notes', icon: BookOpen, desc: 'All your notes' },
    { name: 'Insights', href: '/insights', icon: BarChart3, desc: 'Analytics & stats' },
  ];

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const SidebarContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo */}
      <div style={{ padding: '1.75rem 1.5rem 1.25rem' }}>
        <Link href="/notes" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: 'linear-gradient(135deg, hsl(262,72%,65%), hsl(330,85%,60%))',
            display: 'grid', placeItems: 'center', fontSize: '1rem', fontWeight: 900,
            color: '#fff', fontFamily: 'Outfit, sans-serif', flexShrink: 0,
            boxShadow: '0 4px 12px hsla(262,72%,65%,0.4)'
          }}>P</div>
          <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.4rem', fontWeight: 900, color: 'var(--brand-primary)', letterSpacing: '-0.03em' }}>
            Peblo
          </span>
        </Link>
      </div>

      <nav style={{ flex: 1, padding: '0.5rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto' }}>
        <div style={{ padding: '0 0.5rem', marginBottom: '0.75rem', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-main)' }}>
          Workspace
        </div>
        {navItems.map(({ name, href, icon: Icon, desc }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.65rem 0.75rem',
                borderRadius: isActive ? '0 10px 10px 0' : 10,
                textDecoration: 'none',
                transition: 'all 0.15s',
                background: isActive ? 'var(--brand-primary-soft)' : 'transparent',
                borderLeft: isActive ? '3px solid var(--brand-primary)' : '3px solid transparent',
                color: isActive ? 'var(--brand-primary)' : 'var(--text-muted)',
                paddingLeft: isActive ? '0.6rem' : '0.75rem',
              }}
            >
              <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: isActive ? 800 : 600, lineHeight: 1.3 }}>{name}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '1px' }}>{desc}</div>
              </div>
              {isActive && <ChevronRight size={12} style={{ opacity: 0.6 }} />}
            </Link>
          );
        })}
      </nav>

      {/* Footer - Static */}
      <div style={{ padding: '1rem 0.75rem 1.5rem', marginTop: 'auto' }}>
        <div style={{
          border: '1px solid var(--border-base)',
          borderRadius: 14,
          background: 'var(--bg-surface)',
          overflow: 'hidden'
        }}>
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.9rem 1rem', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg, hsl(262,72%,50%), hsl(330,85%,50%))',
                display: 'grid', placeItems: 'center',
                fontSize: '0.85rem', fontWeight: 800, color: '#fff',
                position: 'relative'
              }}>
                {initials}
                <div style={{
                  position: 'absolute', bottom: 0, right: 0,
                  width: 9, height: 9, borderRadius: '50%',
                  background: 'hsl(142,71%,45%)',
                  border: '1.5px solid var(--bg-sidebar)'
                }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
              </div>
            </div>
          )}

          {/* Theme toggle */}
          <ThemeToggleRow />

          {/* Sign out */}
          <button
            onClick={handleLogout}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '0.6rem',
              padding: '0.8rem 1rem', background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600,
              transition: 'color 0.15s', textAlign: 'left',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'hsl(0,72%,68%)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="dashboard-layout">
      {/* Desktop Sidebar */}
      <aside style={{
        width: 250, flexShrink: 0,
        borderRight: '1px solid var(--border-subtle)',
        background: 'var(--bg-sidebar)',
        display: 'flex', flexDirection: 'column',
        height: '100vh',
      }} className="desktop-sidebar">
        <SidebarContent />
      </aside>

      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top Header - Desktop & Mobile */}
        <header className="main-header">
          <div className="header-left hide-desktop">
            <Link href="/notes" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: 'linear-gradient(135deg, hsl(262,72%,65%), hsl(330,85%,60%))',
                display: 'grid', placeItems: 'center', fontSize: '0.85rem', fontWeight: 900,
                color: '#fff', fontFamily: 'Outfit, sans-serif'
              }}>P</div>
              <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: '1.25rem', color: 'var(--brand-primary)', letterSpacing: '-0.02em' }}>Peblo</span>
            </Link>
          </div>

          <div className="header-right">
            <HeaderThemeButton />

            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="profile-trigger"
              >
                {initials}
              </button>

              {profileMenuOpen && (
                <div className="profile-dropdown" onMouseLeave={() => setProfileMenuOpen(false)}>
                  <div className="dropdown-user-info">
                    <div className="user-name">{user?.name}</div>
                    <div className="user-email">{user?.email}</div>
                  </div>
                  <div className="dropdown-divider" />
                  <button onClick={handleLogout} className="dropdown-item danger">
                    <LogOut size={14} />
                    <span>Sign out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Note header fix - for mobile editor */}
        {pathname.startsWith('/notes/') && pathname !== '/notes' && (
          <div className="mobile-editor-nav-spacer show-mobile" style={{ display: 'none', height: '0' }} />
        )}

        {children}
      </main>

      {/* Bottom Nav for Mobile - Hide when deep in a note */}
      {!(pathname.startsWith('/notes/') && pathname !== '/notes') && (
        <nav className="bottom-nav">
          {navItems.map(({ name, href, icon: Icon }) => {
            const isActive = pathname.startsWith(href);
            return (
              <Link key={href} href={href} className={`bottom-nav-item ${isActive ? 'active' : ''}`} style={{ flex: 1 }}>
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                <span>{name}</span>
              </Link>
            );
          })}
        </nav>
      )}

      <style jsx global>{`
        .main-header {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          padding: 0.75rem 1.5rem;
          background: var(--bg-main);
          border-bottom: 1px solid var(--border-subtle);
          height: 60px;
          position: sticky;
          top: 0;
          z-index: 40;
        }
        .header-left { display: flex; align-items: center; gap: 1rem; }
        .header-right { display: flex; align-items: center; gap: 1rem; }
        .page-context { font-size: 0.82rem; font-weight: 700; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.05em; }
        
        /* Light mode specific overrides for requested black titles */
        [data-theme='light'] .page-title { color: #000000 !important; font-weight: 900 !important; -webkit-text-fill-color: #000000 !important; }
        [data-theme='light'] .user-name { color: #000000 !important; }
        [data-theme='light'] .page-subtitle { color: #333333 !important; }
        
        .profile-trigger {
          width: 34px; height: 34px; border-radius: 50%; border: none; cursor: pointer;
          background: linear-gradient(135deg, hsl(262,72%,50%), hsl(330,85%,50%));
          display: grid; place-items: center;
          font-size: 0.85rem; font-weight: 800; color: #fff;
          transition: transform 0.2s;
        }
        .profile-trigger:hover { transform: scale(1.05); }

        .profile-dropdown {
          position: absolute; top: calc(100% + 10px); right: 0;
          width: 200px; background: var(--bg-surface);
          border: 1px solid var(--border-bright); border-radius: 12px;
          box-shadow: var(--shadow-lg); overflow: hidden; z-index: 100;
          padding: 0.5rem;
          animation: dropdownSlide 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        @keyframes dropdownSlide {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .dropdown-user-info { padding: 0.75rem 0.75rem 0.5rem; }
        .user-name { font-size: 0.85rem; font-weight: 700; color: var(--text-main); }
        .user-email { font-size: 0.75rem; color: var(--text-dim); }
        .dropdown-divider { height: 1px; background: var(--border-subtle); margin: 0.5rem; }
        .dropdown-item {
          width: 100%; display: flex; align-items: center; gap: 0.75rem; padding: 0.6rem 0.75rem;
          border: none; background: none; color: var(--text-soft); font-size: 0.82rem; font-weight: 600;
          cursor: pointer; border-radius: 8px; transition: all 0.15s;
        }
        .dropdown-item:hover { background: var(--bg-card-hover); color: var(--text-main); }
        .dropdown-item.danger { color: #ef4444; }
        .dropdown-item.danger:hover { background: #fee2e2; color: #b91c1c; }

        .mobile-drawer-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); z-index: 100;
          display: flex; animation: fadeIn 0.3s ease;
        }
        .mobile-drawer-content {
          width: 280px; height: 100%; background: var(--bg-sidebar); border-right: 1px solid var(--border-subtle);
          animation: slideIn 0.3s ease;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideIn { from { transform: translateX(-100%); } to { transform: translateX(0); } }

        @media (max-width: 768px) {
          .desktop-sidebar { display: none !important; }
          .main-header { justify-content: space-between; padding: 0.75rem 1rem; }
          .menu-toggle-btn { display: flex !important; }
          .hide-mobile { display: none !important; }
          .show-mobile { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
