'use client';

import { useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Plus, Tag, Clock, Calendar, FileText, ArrowRight } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function NotesPage() {
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const router = useRouter();

  const { data, error, isLoading, mutate } = useSWR(
    `/api/notes?q=${search}&tag=${tagFilter}`,
    fetcher
  );

  const notes = Array.isArray(data) ? data : [];

  const createNote = async () => {
    const res = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Untitled Note', content: '' })
    });
    if (res.ok) {
      const note = await res.json();
      router.push(`/notes/${note.id}`);
    }
  };

  return (
    <div className="notes-container">
      <header className="page-header">
        <div className="header-text">
          <h1 className="page-title">My Workspace</h1>
          <p className="page-subtitle">Elevate your thoughts with AI-powered organization.</p>
        </div>
        <button onClick={createNote} className="btn-primary create-btn">
          <Plus size={18} />
          <span>New Note</span>
        </button>
      </header>

      <div className="search-and-filter">
        <div className="filter-group">
          <div className="input-wrapper search-wrapper">
            <Search size={18} className="input-icon" />
            <input 
              type="text" 
              placeholder="Search your thoughts..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="styled-input"
            />
          </div>
          <div className="input-wrapper tag-wrapper">
            <Tag size={18} className="input-icon" />
            <input 
              type="text" 
              placeholder="Filter by tag..." 
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="styled-input"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="state-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Synchronizing your workspace...</p>
        </div>
      ) : error ? (
        <div className="state-container error">
          <div className="error-icon">!</div>
          <h3>Connection Issue</h3>
          <p>We're having trouble reaching your notes. Please check your connection.</p>
          <button onClick={() => mutate()} className="btn-secondary mt-4">Retry Connection</button>
        </div>
      ) : notes.length === 0 && (!search && !tagFilter) ? (
        <div className="state-container empty">
          <div className="empty-illustration">
            <div className="pulse-circle"></div>
            <FileText size={42} />
          </div>
          <h3>Your workspace is clear</h3>
          <p>Every great idea starts with a single note. What's on your mind?</p>
          <button onClick={createNote} className="btn-primary mt-6">
            <Plus size={18} />
            <span>Create First Note</span>
          </button>
        </div>
      ) : notes.length === 0 && (search || tagFilter) ? (
        <div className="state-container empty-search">
          <div className="empty-illustration">
            <Search size={32} />
          </div>
          <h3>No matching notes found</h3>
          <p>Try adjusting your search terms or filters.</p>
          <button onClick={() => { setSearch(''); setTagFilter(''); }} className="btn-secondary mt-6">
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="notes-grid">
          {notes.map((note: any) => (
            <Link href={`/notes/${note.id}`} key={note.id} className="note-card-wrapper">
              <div className="note-card">
                <div className="note-card-glow"></div>
                <div className="note-card-inner">
                  <div className="note-card-content">
                    <h3 className="note-title">{note.title || 'Untitled Note'}</h3>
                    <p className="note-preview">
                      {note.content ? note.content.substring(0, 140) + (note.content.length > 140 ? '...' : '') : 'Capture your thoughts here...'}
                    </p>
                  </div>
                  
                  <div className="note-card-footer">
                    <div className="note-meta">
                      <div className="note-date">
                        <Calendar size={12} />
                        <span>{new Date(note.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                      </div>
                    </div>
                    
                    <div className="note-footer-right">
                      {note.tags && note.tags.length > 0 && (
                        <div className="note-tags">
                          {note.tags.slice(0, 1).map((t: any) => (
                            <span key={t.id} className="tag-pill">{t.name}</span>
                          ))}
                          {note.tags.length > 1 && <span className="tag-pill">+{note.tags.length - 1}</span>}
                        </div>
                      )}
                      <ArrowRight size={14} className="hover-arrow" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <style jsx>{`
        .notes-container {
          padding: 3rem;
          max-width: 1400px;
          margin: 0 auto;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 3.5rem;
        }

        .page-title {
          font-size: 2.5rem;
          font-weight: 800;
          letter-spacing: -0.03em;
          margin-bottom: 0.5rem;
        }

        .page-subtitle {
          color: var(--text-muted);
          font-size: 1.125rem;
        }

        .create-btn {
          width: auto;
          padding: 0.8rem 1.75rem;
          font-size: 0.9rem;
          font-weight: 700;
          background: hsl(262, 72%, 72%);
          color: #000;
          border: none;
          transition: filter 0.2s;
        }
        .create-btn:hover {
          filter: brightness(1.1);
        }

        .search-and-filter {
          margin-bottom: 3rem;
        }

        .filter-group {
          display: flex;
          width: 100%;
          gap: 1.5rem;
        }

        .search-wrapper {
          position: relative;
          flex: 2;
        }

        .tag-wrapper {
          position: relative;
          flex: 1;
        }

        .input-icon {
          position: absolute;
          left: 1.25rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-dim);
          pointer-events: none;
        }

        .styled-input {
          width: 100%;
          padding: 0.9rem 1.25rem 0.9rem 3rem;
          background: #1a1a1f;
          border: 1px solid hsla(0,0%,100%,0.08);
          border-radius: 12px;
          color: #fff;
          font-size: 0.9rem;
          transition: all 0.2s;
        }

        .styled-input:focus {
          border-color: hsl(262, 72%, 72%);
          background: #1e1e24;
          box-shadow: 0 0 0 4px hsla(262, 72%, 72%, 0.15);
          outline: none;
        }

        .notes-grid {
          display: grid;
          grid-template-columns: repeat(1, minmax(0, 1fr));
          gap: 1.5rem;
        }

        @media (min-width: 768px) {
          .notes-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }

        @media (min-width: 1024px) {
          .notes-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        }

        @media (min-width: 1280px) {
          .notes-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
        }

        .note-card {
          background: #161619;
          border: 1px solid hsla(0,0%,100%,0.08);
          border-radius: 16px;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          height: 16rem;
          cursor: pointer;
          text-decoration: none;
          color: inherit;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .note-card:hover {
          background: var(--bg-surface-hover);
          border-color: var(--border-bright);
          transform: translateY(-4px);
          box-shadow: 0 12px 24px -8px rgba(0, 0, 0, 0.4);
        }

        .note-card-content {
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .note-title {
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: 0.25rem;
          color: var(--text-base);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .note-preview {
          color: var(--text-muted);
          font-size: 0.95rem;
          line-height: 1.6;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .note-card-footer {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid hsla(0,0%,100%,0.05);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .note-footer-right {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .hover-arrow {
          color: hsl(262, 72%, 72%);
          opacity: 0;
          transform: translateX(-4px);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .note-card:hover .hover-arrow {
          opacity: 1;
          transform: translateX(0);
        }

        .note-date {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8rem;
          color: var(--text-dim);
          font-weight: 500;
        }

        .note-tags {
          display: flex;
          gap: 0.5rem;
        }

        .tag-pill {
          background: rgba(99, 102, 241, 0.08);
          color: var(--brand-primary);
          padding: 0.25rem 0.625rem;
          border-radius: var(--radius-sm);
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }

        .state-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 8rem 0;
          color: var(--text-muted);
          text-align: center;
        }

        .empty-illustration {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: var(--bg-surface);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-dim);
          margin-bottom: 2rem;
          border: 1px solid var(--border-base);
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

        .mt-4 { margin-top: 1rem; }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .notes-container { padding: 1.5rem; }
          .page-header { flex-direction: column; align-items: flex-start; gap: 1.5rem; }
          .filter-group { flex-direction: column; }
          .input-wrapper { max-width: none; }
        }
      `}</style>
    </div>
  );
}
