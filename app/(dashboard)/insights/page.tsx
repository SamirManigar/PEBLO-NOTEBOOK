'use client';

import useSWR from 'swr';
import { Book, Zap, Tag, TrendingUp, Clock, ChevronRight, BarChart3 } from 'lucide-react';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function InsightsPage() {
  const { data, error, isLoading } = useSWR('/api/insights', fetcher);

  if (isLoading) return (
    <div className="state-container">
      <div className="loading-spinner"></div>
      <p>Crunching your data...</p>
    </div>
  );

  if (error) return (
    <div className="state-container error">
      <p>Failed to load your productivity insights.</p>
    </div>
  );

  return (
    <div className="notes-container">
      <header className="page-header">
        <div className="header-text">
          <h1 className="page-title">Workspace Analytics</h1>
          <p className="page-subtitle">Visualizing your knowledge evolution and AI productivity.</p>
        </div>
      </header>

      <div className="stats-row">
        <div className="stat-box">
          <div className="stat-header">
            <div className="stat-icon-bg brand-bg">
              <Book size={18} />
            </div>
            <span className="stat-label">Knowledge Base</span>
          </div>
          <div className="stat-body">
            <h2 className="stat-value">{data.totalNotes}</h2>
            <p className="stat-trend">Notes archived</p>
          </div>
        </div>

        <div className="stat-box">
          <div className="stat-header">
            <div className="stat-icon-bg warning-bg">
              <Zap size={18} />
            </div>
            <span className="stat-label">AI Intelligence</span>
          </div>
          <div className="stat-body">
            <h2 className="stat-value">{data.aiUsage}</h2>
            <p className="stat-trend">Neural enhancements</p>
          </div>
        </div>

        <div className="stat-box">
          <div className="stat-header">
            <div className="stat-icon-bg success-bg">
              <TrendingUp size={18} />
            </div>
            <span className="stat-label">Active Velocity</span>
          </div>
          <div className="stat-body">
            <h2 className="stat-value">{data.weeklyActivity}</h2>
            <p className="stat-trend">Updates this week</p>
          </div>
        </div>
      </div>

      <div className="insights-grid">
        <div className="insights-panel">
          <div className="panel-head">
            <div className="panel-title">
              <Clock size={16} />
              <h3>Recent Chronology</h3>
            </div>
          </div>
          <div className="panel-body">
            {data.recentNotes?.length > 0 ? (
              <div className="recent-list">
                {data.recentNotes.map((note: any) => (
                  <Link href={`/notes/${note.id}`} key={note.id} className="recent-item">
                    <div className="recent-info">
                      <span className="recent-name">{note.title || 'Untitled Note'}</span>
                      <span className="recent-meta">{new Date(note.updatedAt).toLocaleDateString()}</span>
                    </div>
                    <ChevronRight size={14} className="recent-arrow" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="panel-empty">
                <p>No recent activity detected.</p>
              </div>
            )}
          </div>
        </div>

        <div className="insights-panel">
          <div className="panel-head">
            <div className="panel-title">
              <BarChart3 size={16} />
              <h3>Topic Taxonomy</h3>
            </div>
          </div>
          <div className="panel-body">
            {data.topTags?.length > 0 ? (
              <div className="tag-distribution">
                {data.topTags.map((tag: any, i: number) => {
                  const maxCount = Math.max(...data.topTags.map((t: any) => t.count));
                  const percentage = (tag.count / maxCount) * 100;
                  return (
                    <div key={i} className="tag-stat-row">
                      <div className="tag-stat-info">
                        <span className="tag-stat-name">{tag.name}</span>
                        <span className="tag-stat-count">{tag.count} documents</span>
                      </div>
                      <div className="tag-progress-bg">
                        <div className="tag-progress-fill" style={{ width: `${percentage}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="panel-empty">
                <p>Start tagging notes to see distribution.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .stats-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
          margin-bottom: 3rem;
        }

        .stat-box {
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          padding: 2.5rem;
          transition: var(--transition);
        }

        .stat-box:hover {
          background: var(--bg-card-hover);
          border-color: var(--border-bright);
          transform: translateY(-4px);
          box-shadow: var(--shadow-premium);
        }

        .stat-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }

        .stat-icon-bg {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .brand-bg { background: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary)); }
        .warning-bg { background: linear-gradient(135deg, #f59e0b, #d97706); }
        .success-bg { background: linear-gradient(135deg, #10b981, #059669); }

        .stat-label {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-dim);
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .stat-value {
          font-size: 3rem;
          font-weight: 800;
          line-height: 1;
          margin-bottom: 0.5rem;
          color: var(--text-main);
          font-family: 'Outfit', sans-serif;
        }

        .stat-trend {
          font-size: 0.85rem;
          color: var(--text-soft);
        }

        .insights-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
          gap: 1.5rem;
        }

        .insights-panel {
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          overflow: hidden;
        }

        .panel-head {
          padding: 1.5rem 2rem;
          border-bottom: 1px solid var(--border-subtle);
          background: rgba(255, 255, 255, 0.02);
        }

        .panel-title {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: var(--text-main);
        }

        .panel-title h3 {
          font-size: 0.95rem;
          font-weight: 700;
          letter-spacing: -0.01em;
        }

        .panel-body {
          padding: 2rem;
        }

        .recent-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .recent-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem;
          border-radius: 12px;
          transition: var(--transition);
        }

        .recent-item:hover {
          background: hsla(0, 0%, 100%, 0.03);
          transform: translateX(4px);
        }

        .recent-item:hover .recent-name {
          color: var(--text-main);
        }

        .recent-info {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .recent-name {
          font-weight: 600;
          font-size: 0.95rem;
          color: var(--text-soft);
          transition: var(--transition);
        }

        .recent-meta {
          font-size: 0.75rem;
          color: var(--text-dim);
        }

        .recent-arrow {
          color: var(--text-dim);
        }

        .tag-stat-row {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .tag-stat-info {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .tag-stat-name {
          color: var(--text-soft);
        }

        .tag-stat-count {
          color: var(--text-dim);
        }

        .tag-progress-bg {
          height: 6px;
          background: hsla(0, 0%, 100%, 0.03);
          border-radius: 999px;
          overflow: hidden;
        }

        .tag-progress-fill {
          height: 100%;
          background: var(--text-main);
          border-radius: 999px;
          transition: width 1.5s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .panel-empty {
          padding: 4rem 0;
          text-align: center;
          color: var(--text-dim);
          font-size: 0.9rem;
        }

        .state-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          padding: 8rem 0;
          color: var(--text-muted);
          text-align: center;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid var(--border-base);
          border-top-color: var(--brand-primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1.5rem;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 640px) {
          .insights-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
