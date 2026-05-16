'use client';

import { useState, useEffect, useRef } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search, Plus, Tag, Calendar, FileText, ArrowRight, SlidersHorizontal,
  Grid3x3, List, Archive, LayoutGrid, Sparkles, MoreVertical, Trash2, Share2, RotateCcw
} from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(r => r.json());

type SortOption = 'recent' | 'oldest' | 'az' | 'za';
type ViewMode = 'grid' | 'list';
type FilterMode = 'active' | 'archived';

function NoteCard({ note, view, mutate }: { note: any; view: ViewMode; mutate: any }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const tags = note.tags || [];
  const date = new Date(note.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const preview = note.content?.substring(0, view === 'list' ? 120 : 160) + (note.content?.length > (view === 'list' ? 120 : 160) ? '…' : '');
  const hasAI = note.aiSummary;

  useEffect(() => {
    if (!menuOpen) return;
    const handleGlobalClick = (event: MouseEvent | TouchEvent) => {
      if (menuRef.current?.contains(event.target as Node)) return;
      setMenuOpen(false);
    };
    window.addEventListener('mousedown', handleGlobalClick);
    window.addEventListener('touchstart', handleGlobalClick);
    return () => {
      window.removeEventListener('mousedown', handleGlobalClick);
      window.removeEventListener('touchstart', handleGlobalClick);
    };
  }, [menuOpen]);

  const handleAction = async (e: React.MouseEvent, action: string) => {
    e.preventDefault(); e.stopPropagation(); setMenuOpen(false);
    if (action === 'delete') {
      setShowDeleteConfirm(true);
    } else if (action === 'archive') {
      await fetch(`/api/notes/${note.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: !note.archived }),
      });
      mutate();
    } else if (action === 'share') {
      const url = `${window.location.origin}/notes/${note.id}`;
      await navigator.clipboard.writeText(url);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    }
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/notes/${note.id}`, { method: 'DELETE' });
      if (res.ok) {
        setShowDeleteConfirm(false);
        mutate();
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const menuItemStyle: React.CSSProperties = {
    width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem',
    padding: '0.8rem 1rem', border: 'none', background: 'none',
    color: 'var(--text-soft)', fontSize: '0.85rem', fontWeight: 600,
    cursor: 'pointer', borderRadius: 8, transition: 'background 0.12s',
    textAlign: 'left',
  };

  const ActionMenu = () => (
    <div ref={menuRef} style={{
      position: 'absolute', top: '2.8rem', right: '0.5rem', background: 'var(--bg-surface)',
      border: '1px solid var(--border-bright)', borderRadius: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      zIndex: 200, width: 180, overflow: 'hidden', padding: '0.4rem',
      display: 'flex', flexDirection: 'column',
    }} onClick={e => e.stopPropagation()}>
      <button style={menuItemStyle} onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-card-hover)')} onMouseLeave={e => (e.currentTarget.style.background = 'none')} onClick={e => handleAction(e, 'share')}>
        <Share2 size={15} /> <span>Share</span>
      </button>
      <button style={menuItemStyle} onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-card-hover)')} onMouseLeave={e => (e.currentTarget.style.background = 'none')} onClick={e => handleAction(e, 'archive')}>
        {note.archived ? <RotateCcw size={15} /> : <Archive size={15} />}
        <span>{note.archived ? 'Restore' : 'Archive'}</span>
      </button>
      <div style={{ height: 1, background: 'var(--border-subtle)', margin: '0.25rem 0.6rem' }} />
      <button style={{ ...menuItemStyle, color: '#ef4444' }} onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.color = '#b91c1c'; }} onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#ef4444'; }} onClick={e => handleAction(e, 'delete')}>
        <Trash2 size={15} /> <span>Delete</span>
      </button>
    </div>
  );

  const Toast = () => (
    <div style={{
      position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)',
      background: 'var(--text-main)', color: 'var(--bg-main)', padding: '0.75rem 1.25rem',
      borderRadius: 12, fontSize: '0.85rem', fontWeight: 700, zIndex: 1000,
      display: 'flex', alignItems: 'center', gap: '0.6rem', boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
      animation: 'toastUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
    }}>
      <Share2 size={14} /> Link copied to clipboard
      <style jsx>{`
        @keyframes toastUp {
          from { opacity: 0; transform: translate(-50%, 20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
    </div>
  );

  const deleteConfirm = (
    <div
      className="delete-confirm-backdrop"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isDeleting) setShowDeleteConfirm(false);
      }}
    >
      <div className="delete-confirm" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby={`delete-title-${note.id}`}>
        <div className="delete-confirm-icon"><Trash2 size={18} /></div>
        <div className="delete-confirm-copy">
          <h4 id={`delete-title-${note.id}`}>Delete note?</h4>
          <p>{note.title || 'Untitled Note'} will be permanently removed.</p>
        </div>
        <div className="delete-confirm-actions">
          <button type="button" className="delete-cancel" disabled={isDeleting} onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
          <button type="button" className="delete-confirm-btn" disabled={isDeleting} onClick={confirmDelete}>
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
      <style jsx>{`
        .delete-confirm-backdrop {
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          background: rgba(0, 0, 0, 0.48);
          backdrop-filter: blur(4px);
        }
        .delete-confirm {
          width: min(360px, 100%);
          background: var(--bg-surface);
          border: 1px solid var(--border-bright);
          border-radius: 14px;
          box-shadow: 0 24px 70px rgba(0, 0, 0, 0.42);
          padding: 1.1rem;
        }
        .delete-confirm-icon {
          width: 38px;
          height: 38px;
          display: grid;
          place-items: center;
          border-radius: 10px;
          color: #ef4444;
          background: rgba(239, 68, 68, 0.12);
          margin-bottom: 0.85rem;
        }
        .delete-confirm-copy h4 {
          margin: 0 0 0.35rem;
          color: var(--text-main);
          font-size: 1rem;
          font-weight: 850;
        }
        .delete-confirm-copy p {
          margin: 0;
          color: var(--text-dim);
          font-size: 0.86rem;
          line-height: 1.45;
        }
        .delete-confirm-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.6rem;
          margin-top: 1.15rem;
        }
        .delete-cancel,
        .delete-confirm-btn {
          min-width: 84px;
          height: 38px;
          border-radius: 9px;
          border: 1px solid var(--border-base);
          cursor: pointer;
          font-size: 0.82rem;
          font-weight: 800;
        }
        .delete-cancel {
          background: var(--bg-input);
          color: var(--text-soft);
        }
        .delete-confirm-btn {
          border-color: rgba(239, 68, 68, 0.45);
          background: #ef4444;
          color: #fff;
        }
        .delete-cancel:disabled,
        .delete-confirm-btn:disabled {
          cursor: not-allowed;
          opacity: 0.65;
        }
      `}</style>
    </div>
  );

  if (view === 'list') {
    return (
      <div style={{ position: 'relative', marginBottom: '1rem' }}>
        <Link href={`/notes/${note.id}`} style={{ textDecoration: 'none' }}>
          <div className="note-card-list">
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--brand-primary-soft)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <FileText size={18} style={{ color: 'var(--brand-primary)' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {note.title || 'Untitled Note'}
                </span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', opacity: 0.85 }}>
                {preview || 'No content yet…'}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 600, opacity: 0.6 }}>{date}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                {hasAI && <Sparkles size={14} style={{ color: 'var(--brand-primary)', opacity: 0.8 }} />}
                <button className="more-btn" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuOpen(!menuOpen); }}>
                  <MoreVertical size={18} />
                </button>
              </div>
            </div>
          </div>
        </Link>
        {menuOpen && <ActionMenu />}
        {showToast && <Toast />}
        {showDeleteConfirm && deleteConfirm}
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
      <Link href={`/notes/${note.id}`} style={{ textDecoration: 'none' }}>
        <div className="note-card-grid">
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.4, flex: 1 }}>
                {note.title || 'Untitled Note'}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                {hasAI && <Sparkles size={15} style={{ color: 'var(--brand-primary)', opacity: 0.8 }} />}
                <button className="more-btn" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuOpen(!menuOpen); }}>
                  <MoreVertical size={18} />
                </button>
              </div>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-dim)', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden', flex: 1, opacity: 0.9 }}>
              {preview || 'Start writing to capture your thoughts…'}
            </p>
          </div>
          <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600 }}>
              <Calendar size={12} /> {date}
            </div>
          </div>
        </div>
      </Link>
      {menuOpen && <ActionMenu />}
      {showToast && <Toast />}
      {showDeleteConfirm && deleteConfirm}
    </div>
  );
}

export default function NotesPage() {
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [sort, setSort] = useState<SortOption>('recent');
  const [view, setView] = useState<ViewMode>('grid');
  const [filter, setFilter] = useState<FilterMode>(() => {
    if (typeof window === 'undefined') return 'active';
    return new URLSearchParams(window.location.search).get('archived') === 'true' ? 'archived' : 'active';
  });
  const router = useRouter();

  const queryParams = new URLSearchParams({
    q: search, tag: tagFilter, sort,
    archived: filter === 'archived' ? 'true' : 'false',
  }).toString();

  const { data, error, isLoading, mutate } = useSWR(`/api/notes?${queryParams}`, fetcher);
  const notes = Array.isArray(data) ? data : [];

  const createNote = async () => {
    const res = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Untitled Note', content: '' }),
    });
    if (res.ok) {
      const note = await res.json();
      router.push(`/notes/${note.id}`);
    }
  };

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'recent', label: 'Recently Updated' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'az', label: 'Title A → Z' },
    { value: 'za', label: 'Title Z → A' },
  ];

  return (
    <div style={{ flex: 1, minHeight: 0, overflow: 'auto', background: 'var(--bg-main)' }}>
      <div className="notes-container">
        <header className="page-header">
          <div className="header-text">
            <h1 className="page-title" style={{ fontWeight: 900, fontSize: '1.85rem', letterSpacing: '-0.02em' }}>My Workspace</h1>
            <p className="page-subtitle" style={{ fontWeight: 500, opacity: 0.8 }}>Capture, organise, and enhance with AI.</p>
          </div>
          <button onClick={createNote} className="btn-primary" style={{ padding: '0.75rem 1.5rem', gap: '0.5rem' }}>
            <Plus size={17} /> New Note
          </button>
        </header>

        <div className="filters-row" style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div className="search-section">
            <label className="filter-field">
              <Search size={15} className="field-icon" />
              <input type="text" placeholder="Search notes by title or content…" value={search} onChange={e => setSearch(e.target.value)} className="filter-input" />
            </label>
            <label className="filter-field">
              <Tag size={14} className="field-icon" />
              <input type="text" placeholder="Filter by tag…" value={tagFilter} onChange={e => setTagFilter(e.target.value)} className="filter-input" />
            </label>
          </div>

          <div className="controls-row">
            <div className="tabs-container">
              {(['active', 'archived'] as FilterMode[]).map(f => (
                <button key={f} onClick={() => setFilter(f)} className={`tab-btn ${filter === f ? 'active' : ''}`}>
                  {f === 'archived' ? <Archive size={12} /> : <LayoutGrid size={12} />} <span>{f === 'active' ? 'Active' : 'Archived'}</span>
                </button>
              ))}
            </div>
            <div className="sort-container">
              <div className="sort-trigger">
                <SlidersHorizontal size={14} />
                <select value={sort} onChange={e => setSort(e.target.value as SortOption)} className="sort-select">
                  {sortOptions.map(o => (<option key={o.value} value={o.value}>{o.label}</option>))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="state-container"><div className="loading-spinner" /><p style={{ marginTop: '1rem', color: 'var(--text-dim)' }}>Loading workspace…</p></div>
        ) : error ? (
          <div className="state-container"><p style={{ color: 'var(--danger)' }}>Failed to load notes.</p><button onClick={() => mutate()} className="btn-secondary mt-4">Retry</button></div>
        ) : notes.length === 0 ? (
          <div className="state-container">
            <div className="empty-icon"><div className="pulse-ring" />{filter === 'archived' ? <Archive size={28} /> : <FileText size={28} />}</div>
            <h3>{filter === 'archived' ? 'No archived notes' : 'Your workspace is empty'}</h3>
            <p>{filter === 'archived' ? 'Notes you archive will stay safe here.' : 'Every genius starts with a blank page.'}</p>
            {filter !== 'archived' && <button onClick={createNote} className="btn-primary mt-4"><Plus size={16} /> Create Note</button>}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: view === 'grid' ? 'repeat(auto-fill, minmax(280px, 1fr))' : '1fr', gap: '1rem' }}>
            {notes.map((note: any) => (<NoteCard key={note.id} note={note} view={view} mutate={mutate} />))}
          </div>
        )}
      </div>

      <button className="fab show-mobile" onClick={createNote} style={{ display: 'none' }}><Plus size={24} /></button>

      <style jsx>{`
        .notes-container { padding: 2rem 1.5rem; max-width: 1200px; margin: 0 auto; }
        .search-section { display: flex; flex-direction: column; gap: 0.6rem; }
        .filter-field {
          display: flex; align-items: center; gap: 0.75rem;
          background: var(--bg-input); border: 1px solid var(--border-base);
          border-radius: 14px; padding: 0 1rem; transition: all 0.2s; cursor: text;
        }
        .filter-field:focus-within { border-color: var(--brand-primary); box-shadow: 0 0 0 3px var(--brand-primary-soft); }
        .field-icon { color: var(--text-dim); flex-shrink: 0; }
        .filter-input { flex: 1; padding: 0.8rem 0; background: transparent; border: none; outline: none; font-size: 0.875rem; color: var(--text-main); }
        .controls-row { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; }
        .tabs-container { display: flex; background: var(--bg-input); border-radius: 12px; padding: 4px; border: 1px solid var(--border-base); }
        .tab-btn { padding: 0.45rem 1.1rem; border-radius: 8px; border: none; cursor: pointer; font-size: 0.78rem; font-weight: 600; background: transparent; color: var(--text-dim); transition: all 0.15s; display: flex; align-items: center; gap: 0.35rem; }
        .tab-btn.active { background: var(--bg-card-hover); color: var(--text-main); }
        .sort-trigger { display: flex; align-items: center; justify-content: center; width: 44px; height: 44px; background: var(--bg-input); border: 1px solid var(--border-base); border-radius: 12px; color: var(--text-soft); cursor: pointer; transition: all 0.15s; position: relative; }
        .sort-trigger:hover { border-color: var(--brand-primary); color: var(--brand-primary); }
        .sort-select { position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%; height: 100%; }
        @media (max-width: 900px) {
          .notes-container { padding: 1.5rem 1rem 10rem; }
          .page-header { margin-bottom: 1.5rem; }
        }
        .fab { position: fixed; bottom: 5.5rem; right: 1.5rem; width: 56px; height: 56px; border-radius: 50%; background: var(--brand-primary); color: white; border: none; box-shadow: 0 4px 16px rgba(0,0,0,0.25); display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 100; transition: transform 0.2s; padding: 0; }
        .fab:active { transform: scale(0.9); }
        .more-btn { width: 44px; height: 44px; background: none; border: none; cursor: pointer; color: var(--text-dim); border-radius: 10px; transition: all 0.15s; display: flex; align-items: center; justify-content: center; margin: -0.4rem; }
        .more-btn:hover { background: var(--bg-surface-hover); color: var(--text-soft); }
        .menu-item { width: 100%; display: flex; align-items: center; gap: 0.75rem; padding: 0.6rem 0.8rem; border: none; background: none; color: var(--text-soft); font-size: 0.82rem; font-weight: 600; cursor: pointer; border-radius: 8px; transition: all 0.15s; }
        .menu-item:hover { background: var(--bg-card-hover); color: var(--text-main); }
        .menu-item.danger { color: #ef4444; }
        .menu-item.danger:hover { background: #fee2e2; color: #b91c1c; }
      `}</style>
    </div>
  );
}
