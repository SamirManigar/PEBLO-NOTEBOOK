'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Book, BarChart2, LogOut, Settings } from 'lucide-react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const navItems = [
    { name: 'My Notes', href: '/notes', icon: Book },
    { name: 'Insights', href: '/insights', icon: BarChart2 },
  ];

  const { data: userData } = useSWR('/api/auth/me', fetcher);
  const user = userData?.user;

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        {/* Logo */}
        <div className="sidebar-header">
          <Link href="/notes" className="brand">
            <span className="brand-text">Pebl</span><span className="brand-o">
              o
              <svg className="hat-icon" viewBox="0 0 512 512" fill="currentColor">
                <path d="M472 313.3c-13.8-31-48.4-50-84.3-52.9-8.9-66.2-57.5-122.9-123.6-136.2-47.5-9.6-96 2.8-132.3 31.7-9.1-8-22.9-11.4-35.3-7.7-17.7 5.3-29.8 21.8-30.8 40.4L62 260.4c-35.8 7.9-63.1 38.8-61.9 76.3C1.2 374.3 31.5 406 69.5 406h373.1c25.4 0 49-14.7 60.8-37.4 12.2-30.8-4.1-56.6-31.4-62.7z M69.5 376c-21.2 0-38.6-17.8-39.4-39-.8-23.7 16.5-43.9 40-47.1l1.7-.2c2.7-3.9 6.2-7.3 10.2-10.1l4-2.8 2-4.5c18.5-42.3 58.8-70.3 105-73.4 29.1-1.9 58.2 7 80.7 24.6l10.9 8.5 9.2-9.7c18.7-19.6 45.2-28.7 72.2-24.8 11.9 1.7 23.3 6.2 33.3 12.9l16.1 10.7-4.2 18.8c-2.3 10.1-3.6 20.6-3.8 31.1v2l1.9.5c22.5 5.9 39.1 25 39.8 48 .7 21.3-16 39.5-37.3 41.2-1.1.1-2.2.1-3.3.1H69.5z"/>
                <path d="M127.4 266.3c-4.4 3.1-8.3 6.8-11.3 11l-.4.6 270.8-54.2c.4-3.5.6-7 .9-10.4L127.4 266.3z" opacity="0.4"/>
              </svg>
            </span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          <div className="nav-section-label">WORKSPACE</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={16} strokeWidth={isActive ? 2.5 : 1.8} className="nav-icon-svg" />
                <span className="nav-label">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer user profile box */}
        <div className="sidebar-footer">
          <div className="user-profile-box">
            <button className="settings-btn" title="Settings">
              <Settings size={15} />
            </button>
            {user && (
              <div className="user-profile">
                <div className="user-avatar-wrapper">
                  <div className="user-avatar">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="status-dot"></div>
                </div>
                <div className="user-info">
                  <div className="user-name">{user.name}</div>
                  <div className="user-email">{user.email}</div>
                </div>
              </div>
            )}
            <div className="profile-divider" />
            <button onClick={handleLogout} className="logout-btn">
              <LogOut size={15} />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        {children}
      </main>

      <style jsx>{`
        .dashboard-layout {
          display: flex;
          height: 100vh;
          background: #0f0f12;
          overflow: hidden;
        }

        /* ── Sidebar ── */
        .sidebar {
          width: 260px;
          flex-shrink: 0;
          border-right: 1px solid hsla(0,0%,100%,0.05);
          background: #121215;
          display: flex;
          flex-direction: column;
        }

        .sidebar-header {
          padding: 2rem 1.5rem 1.5rem;
        }

        .brand {
          display: flex;
          flex-direction: row;
          align-items: baseline;
          text-decoration: none;
        }

        .brand-text {
          font-family: 'Outfit', sans-serif;
          font-size: 2.3rem;
          font-weight: 800;
          color: hsl(262, 72%, 72%);
          letter-spacing: -0.02em;
          line-height: 1;
        }

        .brand-o {
          font-family: 'Outfit', sans-serif;
          font-size: 2.3rem;
          font-weight: 800;
          color: hsl(262, 72%, 72%);
          line-height: 1;
          position: relative;
        }

        .hat-icon {
          position: absolute;
          top: -0.85rem;
          left: -0.3rem;
          width: 2.1rem;
          height: 2.1rem;
          color: hsl(260, 20%, 75%);
          transform: rotate(12deg);
        }

        /* ── Nav ── */
        .sidebar-nav {
          flex: 1;
          padding: 0.5rem 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.1rem;
        }

        .nav-section-label {
          padding: 0 0.6rem;
          margin-bottom: 0.6rem;
          font-size: 0.6rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          color: hsla(0,0%,100%,0.28);
        }

        .nav-item {
          display: flex !important;
          flex-direction: row !important;
          align-items: center;
          gap: 0.75rem;
          padding: 0.55rem 0.75rem;
          border-radius: 8px;
          color: hsla(0,0%,100%,0.45);
          font-size: 0.84rem;
          font-weight: 500;
          transition: all 0.15s ease;
          text-decoration: none;
          white-space: nowrap;
          line-height: 1;
          border-left: 3px solid transparent;
        }

        .nav-label {
          flex: 1;
        }

        .nav-item:hover {
          background: hsla(0,0%,100%,0.05);
          color: hsla(0,0%,100%,0.8);
        }

        .nav-item.active {
          background: hsla(0,0%,100%,0.08);
          color: #fff;
          font-weight: 600;
          border-left: 3px solid hsl(262, 72%, 72%);
          border-radius: 0 8px 8px 0;
        }

        /* ── Footer / User Box ── */
        .sidebar-footer {
          padding: 1.25rem 1rem 1.5rem;
        }

        .user-profile-box {
          border: 1px solid hsla(0,0%,100%,0.08);
          border-radius: 12px;
          background: hsla(0,0%,100%,0.03);
          position: relative;
          padding: 1.1rem 0;
        }

        .user-profile {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          padding: 0 1.1rem 1rem 1.1rem;
        }

        .user-avatar-wrapper {
          position: relative;
          flex-shrink: 0;
        }

        .user-avatar {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: hsla(260,30%,50%,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 0.9rem;
          color: hsl(260,20%,80%);
        }

        .status-dot {
          position: absolute;
          bottom: 0px;
          right: 0px;
          width: 8px;
          height: 8px;
          background: #34d399;
          border: 1.5px solid #1c1c21;
          border-radius: 50%;
        }

        .user-info {
          flex: 1;
          min-width: 0;
        }

        .user-name {
          font-size: 0.85rem;
          font-weight: 700;
          color: hsla(0,0%,100%,0.95);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-email {
          font-size: 0.72rem;
          color: hsla(0,0%,100%,0.4);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 130px;
        }

        .settings-btn {
          position: absolute;
          top: 0.85rem;
          right: 0.85rem;
          color: hsla(0,0%,100%,0.4);
          background: none;
          border: none;
          cursor: pointer;
          transition: color 0.15s;
        }

        .settings-btn:hover {
          color: hsla(0,0%,100%,0.8);
        }

        .profile-divider {
          height: 1px;
          background: hsla(0,0%,100%,0.06);
          margin: 0 1rem;
        }

        .logout-btn {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          padding: 1rem 1rem 0 1rem;
          width: 100%;
          color: hsla(0,0%,100%,0.4);
          font-size: 0.85rem;
          font-weight: 500;
          transition: all 0.15s;
          cursor: pointer;
          background: transparent;
          border: none;
        }

        .logout-btn:hover {
          color: hsla(0,0%,100%,0.7);
        }

        /* ── Main content ── */
        .main-content {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
