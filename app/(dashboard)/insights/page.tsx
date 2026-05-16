'use client';

import useSWR from 'swr';
import { Archive, Book, Zap, TrendingUp, Clock, ChevronRight, BarChart3, Hash } from 'lucide-react';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function InsightsPage() {
  const { data, error, isLoading } = useSWR('/api/insights', fetcher);

  if (isLoading) return (
    <div className="state-container">
      <div className="loading-spinner"></div>
      <p style={{ marginTop: '1rem', color: 'var(--text-dim)', fontSize: '0.9rem' }}>Crunching your data…</p>
    </div>
  );

  if (error) return (
    <div className="state-container">
      <p style={{ color: 'var(--danger)' }}>Failed to load insights.</p>
    </div>
  );

  const weeklyBreakdown: any[] = data.weeklyBreakdown || [];
  const weeklyMax = Math.max(1, ...weeklyBreakdown.map((d: any) => d.count));
  const todayLabel = new Date().toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();

  return (
    <div style={{ flex: 1, minHeight: 0, overflow: 'auto', background: 'var(--bg-main)' }}>
      <div className="insights-container">

        <header className="page-header">
          <div>
            <h1 className="page-title" style={{ fontWeight: 900, fontSize: '1.85rem', letterSpacing: '-0.02em' }}>
              Workspace Analytics
            </h1>
            <p className="page-subtitle" style={{ marginTop: '0.25rem', opacity: 0.7, fontSize: '0.9rem' }}>
              Your knowledge base at a glance
            </p>
          </div>
        </header>

        {/* Stats Grid - 2x2 on mobile, 4x1 on desktop */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon brand-bg"><Book size={16} /></div>
            <div className="stat-num">{data.totalNotes ?? 0}</div>
            <div className="stat-lbl">Total Notes</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon warning-bg"><Zap size={16} /></div>
            <div className="stat-num">{data.aiUsage ?? 0}</div>
            <div className="stat-lbl">AI Enhanced</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon success-bg"><TrendingUp size={16} /></div>
            <div className="stat-num">{data.weeklyActivity ?? 0}</div>
            <div className="stat-lbl">This Week</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon archive-bg"><Archive size={16} /></div>
            <div className="stat-num">{data.archivedNotes ?? 0}</div>
            <div className="stat-lbl">Archived</div>
          </div>
        </div>

        {/* Weekly Activity Chart */}
        <div className="panel">
          <div className="panel-head">
            <TrendingUp size={15} />
            <h3>Weekly Activity</h3>
            <span className="panel-badge">{data.weeklyActivity ?? 0} updates</span>
          </div>
          <div className="panel-body">
            {weeklyMax <= 1 && weeklyBreakdown.every((d: any) => d.count === 0) ? (
              <div className="chart-empty">
                <p>No activity recorded this week yet.</p>
                <p style={{ fontSize: '0.78rem', marginTop: '0.25rem', opacity: 0.6 }}>Start writing notes to see your progress here.</p>
              </div>
            ) : (
              <div className="chart-wrap">
                <div className="chart-bars">
                  {weeklyBreakdown.map((day: any) => {
                    const pct = weeklyMax > 0 ? (day.count / weeklyMax) * 100 : 0;
                    const isToday = day.label?.toUpperCase() === todayLabel;
                    return (
                      <div className={`bar-col ${isToday ? 'today' : ''}`} key={day.date}>
                        <div className="bar-count">{day.count > 0 ? day.count : ''}</div>
                        <div className="bar-track">
                          <div
                            className="bar-fill"
                            style={{ height: `${Math.max(day.count > 0 ? 8 : 0, pct)}%` }}
                            title={`${day.count} update${day.count !== 1 ? 's' : ''}`}
                          />
                        </div>
                        <div className="bar-label">{day.label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom panels */}
        <div className="panels-row">
          {/* Recent Notes */}
          <div className="panel">
            <div className="panel-head">
              <Clock size={15} />
              <h3>Recent Notes</h3>
            </div>
            <div className="panel-body panel-body--compact">
              {data.recentNotes?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', padding: '0.4rem 0' }}>
                  {data.recentNotes.map((note: any) => (
                    <Link
                      href={`/notes/${note.id}`}
                      key={note.id}
                      style={{
                        display: 'flex', flexDirection: 'row', alignItems: 'center',
                        gap: '0.85rem', padding: '0.85rem 1rem', margin: '0 0.4rem',
                        borderRadius: 12, textDecoration: 'none',
                        border: '1px solid transparent', transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLAnchorElement).style.background = 'var(--bg-card-hover)';
                        (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--border-base)';
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
                        (e.currentTarget as HTMLAnchorElement).style.borderColor = 'transparent';
                      }}
                    >
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--brand-primary)', flexShrink: 0, opacity: 0.75 }} />
                      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.1rem', overflow: 'hidden' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {note.title || 'Untitled Note'}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
                          {new Date(note.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <ChevronRight size={13} style={{ color: 'var(--text-dim)', flexShrink: 0 }} />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="panel-empty"><p>No recent notes.</p></div>
              )}
            </div>
          </div>

          {/* Top Tags */}
          <div className="panel">
            <div className="panel-head">
              <BarChart3 size={15} />
              <h3>Top Tags</h3>
            </div>
            <div className="panel-body panel-body--compact">
              {data.topTags?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.75rem 1.25rem' }}>
                  {data.topTags.map((tag: any, i: number) => {
                    const maxCount = Math.max(...data.topTags.map((t: any) => t.count));
                    const pct = maxCount > 0 ? (tag.count / maxCount) * 100 : 0;
                    return (
                      <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Hash size={11} style={{ color: 'var(--brand-primary)', flexShrink: 0 }} />
                            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-soft)' }}>{tag.name}</span>
                          </div>
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)' }}>{tag.count}</span>
                        </div>
                        <div style={{ height: 5, background: 'var(--bg-input)', borderRadius: 999, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, var(--brand-primary), var(--brand-secondary))', borderRadius: 999, transition: 'width 1.2s cubic-bezier(0.16,1,0.3,1)' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ padding: '2.5rem 1.25rem', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem' }}><p>No tags yet. Add tags to your notes to see distribution.</p></div>
              )}
            </div>
          </div>
        </div>

      </div>

      <style jsx>{`
        .insights-container {
          padding: 2rem 1.5rem 8rem;
          max-width: 900px;
          margin: 0 auto;
        }

        .page-header { margin-bottom: 2rem; }

        /* Stats 2x2 mobile, 4-col desktop */
        .stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.85rem;
          margin-bottom: 1.5rem;
        }
        @media (min-width: 640px) {
          .stats-grid { grid-template-columns: repeat(4, 1fr); gap: 1.25rem; }
        }

        .stat-card {
          background: var(--bg-card);
          border: 1px solid var(--border-base);
          border-radius: 16px;
          padding: 1.25rem 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          transition: all 0.2s;
        }
        .stat-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }

        .stat-icon {
          width: 32px; height: 32px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          color: white; margin-bottom: 0.25rem;
        }
        .brand-bg  { background: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary)); }
        .warning-bg { background: linear-gradient(135deg, #f59e0b, #d97706); }
        .success-bg { background: linear-gradient(135deg, #10b981, #059669); }
        .archive-bg { background: linear-gradient(135deg, #14b8a6, #0891b2); }

        .stat-num {
          font-size: 2rem; font-weight: 900; line-height: 1;
          color: var(--text-main); font-family: 'Outfit', sans-serif;
        }
        [data-theme='light'] .stat-num { color: #000; }
        .stat-lbl { font-size: 0.72rem; font-weight: 700; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.06em; }
        @media (min-width: 640px) { .stat-num { font-size: 2.5rem; } }

        /* Panels */
        .panel {
          background: var(--bg-card);
          border: 1px solid var(--border-base);
          border-radius: 18px;
          overflow: hidden;
          margin-bottom: 1.25rem;
        }
        .panel-head {
          display: flex; align-items: center; gap: 0.6rem;
          padding: 1rem 1.25rem;
          border-bottom: 1px solid var(--border-subtle);
          color: var(--text-soft);
        }
        .panel-head h3 { font-size: 0.88rem; font-weight: 700; color: var(--text-main); flex: 1; }
        .panel-badge {
          font-size: 0.7rem; font-weight: 700; background: var(--brand-primary-soft);
          color: var(--brand-primary); padding: 0.2rem 0.6rem; border-radius: 20px;
        }
        .panel-body { padding: 1.25rem; }
        .panel-body--compact { padding: 0.5rem 0; }

        /* Bottom panels row */
        .panels-row { display: grid; grid-template-columns: 1fr; gap: 0; }
        @media (min-width: 640px) { .panels-row { grid-template-columns: 1fr 1fr; gap: 1.25rem; } }
        @media (min-width: 640px) { .panels-row .panel { margin-bottom: 0; } }

        /* Weekly Chart */
        .chart-wrap { padding: 0.5rem 0; }
        .chart-bars {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 0.5rem;
          align-items: end;
          height: 180px;
        }
        @media (min-width: 480px) { .chart-bars { gap: 0.75rem; height: 200px; } }

        .bar-col {
          display: flex; flex-direction: column; align-items: center;
          gap: 0.35rem; height: 100%;
        }
        .bar-col.today .bar-fill { background: linear-gradient(180deg, var(--brand-primary), var(--brand-secondary)); }
        .bar-col.today .bar-label { color: var(--brand-primary); font-weight: 900; }

        .bar-count {
          font-size: 0.65rem; font-weight: 800; color: var(--brand-primary);
          height: 14px; line-height: 14px;
        }
        .bar-track {
          flex: 1; width: 100%; background: var(--bg-input);
          border: 1px solid var(--border-base); border-radius: 8px;
          display: flex; align-items: flex-end; overflow: hidden;
          min-height: 0;
        }
        .bar-fill {
          width: 100%; border-radius: 6px 6px 0 0;
          background: linear-gradient(180deg, hsla(262,72%,72%,0.7), hsla(262,72%,72%,0.3));
          transition: height 0.9s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .bar-label {
          font-size: 0.6rem; font-weight: 700; color: var(--text-dim);
          text-transform: uppercase; letter-spacing: 0.03em;
        }
        @media (min-width: 480px) { .bar-label { font-size: 0.68rem; } }

        .chart-empty {
          text-align: center; padding: 3rem 1rem; color: var(--text-dim); font-size: 0.875rem;
        }

        /* Recent notes */
        .recent-list { display: flex; flex-direction: column; gap: 0.25rem; padding: 0.5rem 0; }
        .recent-item {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 0.75rem;
          padding: 0.85rem 1.25rem;
          margin: 0 0.5rem;
          border-radius: 12px;
          border: 1px solid transparent;
          transition: background 0.15s, border-color 0.15s;
          text-decoration: none;
        }
        .recent-item:hover { background: var(--bg-card-hover); border-color: var(--border-base); }
        .recent-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--brand-primary); flex-shrink: 0; opacity: 0.7; }
        .recent-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0.15rem; overflow: hidden; }
        .recent-name { font-size: 0.875rem; font-weight: 600; color: var(--text-main); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .recent-meta { font-size: 0.72rem; color: var(--text-dim); white-space: nowrap; }

        /* Tags */
        .tags-list { display: flex; flex-direction: column; padding: 0.75rem 1.25rem; gap: 1rem; }
        .tag-row { display: flex; flex-direction: column; gap: 0.4rem; }
        .tag-row-head { display: flex; align-items: center; justify-content: space-between; }
        .tag-name-wrap { display: flex; align-items: center; gap: 0.35rem; }
        .tag-name { font-size: 0.82rem; font-weight: 600; color: var(--text-soft); }
        .tag-count { font-size: 0.72rem; font-weight: 700; color: var(--text-dim); }
        .tag-bar-bg { height: 5px; background: var(--bg-input); border-radius: 999px; overflow: hidden; }
        .tag-bar-fill { height: 100%; background: linear-gradient(90deg, var(--brand-primary), var(--brand-secondary)); border-radius: 999px; transition: width 1.2s cubic-bezier(0.16, 1, 0.3, 1); }

        .panel-empty { padding: 2.5rem 1.25rem; text-align: center; color: var(--text-dim); font-size: 0.85rem; }

        /* State */
        .state-container { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 8rem 2rem; text-align: center; }
        .loading-spinner { width: 36px; height: 36px; border: 3px solid var(--border-base); border-top-color: var(--brand-primary); border-radius: 50%; animation: spin 0.9s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 640px) {
          .insights-container { padding: 1.5rem 1rem 8rem; }
          .page-header { margin-bottom: 1.5rem; }
          .panel-head { padding: 0.9rem 1rem; }
        }
      `}</style>
    </div>
  );
}
