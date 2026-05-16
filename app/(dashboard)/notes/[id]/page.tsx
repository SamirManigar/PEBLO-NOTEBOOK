'use client';

import { useState, useEffect, useCallback, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { Sparkles, Share2, ArrowLeft, Tag, Trash2, CheckCircle2, ChevronRight, Loader2, PlusCircle } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function NoteEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  const hasInitialized = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-expand textarea height to match content
  const autoExpand = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const { data: note, mutate } = useSWR(`/api/notes/${resolvedParams.id}`, fetcher, {
    onSuccess: (data) => {
      if (!hasInitialized.current) {
        setTitle(data.title || '');
        setContent(data.content || '');
        hasInitialized.current = true;
        // Trigger auto-expand after initial load
        setTimeout(autoExpand, 50);
      }
    }
  });

  const saveNote = useCallback(async (newTitle: string, newContent: string) => {
    setSaveState('saving');
    try {
      const res = await fetch(`/api/notes/${resolvedParams.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle, content: newContent })
      });
      if (!res.ok) throw new Error('Failed to save');
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2000);
      mutate();
    } catch (e) {
      setSaveState('idle');
    }
  }, [resolvedParams.id, mutate]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveNote(title, content);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [title, content, saveNote]);

  useEffect(() => {
    if (!note) return;
    const timer = setTimeout(() => {
      if (title !== note.title || content !== note.content) {
        saveNote(title, content);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [title, content, note, saveNote]);

  const handleGenerateAI = async () => {
    setIsAiLoading(true);
    try {
      const res = await fetch(`/api/notes/${resolvedParams.id}/generate-summary`, {
        method: 'POST'
      });
      if (res.ok) mutate();
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAddAiToNote = (text: string) => {
    const separator = content.trim() ? '\n\n---\n\n' : '';
    const newContent = content + separator + text;
    setContent(newContent);
    saveNote(title, newContent);
  };

  const handleShare = async () => {
    setIsSharing(true);
    try {
      const res = await fetch(`/api/notes/${resolvedParams.id}/share`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        const url = `${window.location.origin}/shared/${data.shareId}`;
        setShareUrl(url);
        navigator.clipboard.writeText(url);
        setTimeout(() => setShareUrl(''), 3000);
      }
    } finally {
      setIsSharing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    await fetch(`/api/notes/${resolvedParams.id}`, { method: 'DELETE' });
    router.push('/notes');
  };

  if (!note) return (
    <div className="loading-container">
      <Loader2 className="animate-spin" size={28} />
      <p>Opening your thoughts…</p>
    </div>
  );

  const aiActions = (() => {
    try { return JSON.parse(note.aiActions || '[]'); } catch { return []; }
  })();

  return (
    <div className="editor-page">

      {/* ── Left: editor area ── */}
      <div className="editor-main">

        {/* Top nav bar */}
        <header className="editor-nav">
          <div className="nav-left">
            <button onClick={() => router.push('/notes')} className="back-btn">
              <ArrowLeft size={15} />
            </button>
            <div className="breadcrumb">
              <span className="bc-root">Workspace</span>
              <ChevronRight size={13} className="bc-sep" />
              <span className="bc-title">{title || 'Untitled'}</span>
            </div>
          </div>

          <div className="nav-right">
            {/* Share */}
            <button onClick={handleShare} className="nav-btn share-btn" disabled={isSharing}>
              {shareUrl
                ? <><CheckCircle2 size={13} /> Copied</>
                : <><Share2 size={13} /> Share</>
              }
            </button>
            {/* Delete */}
            <button onClick={handleDelete} className="nav-btn delete-btn">
              <Trash2 size={13} />
              <span>Delete</span>
            </button>
          </div>
        </header>

        {/* Editor card */}
        <div className="editor-scroll-area">
          <div className="editor-card">
            {/* Auto-save status – top right of card */}
            <div className="card-top-bar">
              <span className="kb-hint">⌘S to save</span>
              {saveState === 'idle' && (
                <span className="auto-save-text">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r="0.5" fill="currentColor"/></svg>
                  Pause Auto-Save
                </span>
              )}
              {saveState === 'saving' && (
                <span className="auto-save-text">
                  <Loader2 size={12} className="animate-spin" /> Saving…
                </span>
              )}
              {saveState === 'saved' && (
                <span className="auto-save-text saved">
                  <CheckCircle2 size={12} /> Saved
                </span>
              )}
            </div>

            {/* Title */}
            <input
              type="text"
              className="title-input"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Untitled"
            />

            {/* Tags row */}
            <div className="tags-row">
              <div className="tags-label">
                <Tag size={14} />
                <span>Tags</span>
              </div>
              <div className="tags-chips">
                {note.tags?.map((t: any) => (
                  <span key={t.id} className="tag-chip">{t.name}</span>
                ))}
                <button className="add-tag-btn">
                  <PlusCircle size={12} /> Tag
                </button>
              </div>
            </div>

        {/* Body */}
            <textarea
              ref={textareaRef}
              className="body-input"
              value={content}
              onChange={e => {
                setContent(e.target.value);
                autoExpand();
              }}
              placeholder="Start writing…"
            />
          </div>
        </div>
      </div>

      {/* ── Right: Neural Engine sidebar ── */}
      <aside className="ai-panel">
        {/* Header */}
        <div className="ai-panel-header">
          <div className="ai-title-chip">
            <Sparkles size={14} />
            <span>Neural Engine</span>
          </div>
        </div>

        {/* Body */}
        <div className="ai-panel-body">
          {/* Action card */}
          <div className="ai-action-card">
            <p className="ai-desc">Synthesize raw data into structured intelligence using Google Gemini.</p>
            <button
              className="run-btn"
              onClick={handleGenerateAI}
              disabled={isAiLoading || content.length < 10}
            >
              {isAiLoading
                ? <><Loader2 size={14} className="animate-spin" /> Synthesizing…</>
                : <><Sparkles size={14} /> Run Analysis</>
              }
            </button>
          </div>

          {/* Results */}
          {(note.aiSummary || aiActions.length > 0) && (
            <div className="ai-results">
              {/* Section header row */}
              <div className="results-header">
                <span className="results-label">Intelligence Summary</span>
                <button
                  className="merge-btn"
                  onClick={() => handleAddAiToNote(
                    `Summary:\n${note.aiSummary}\n\nAction Items:\n${aiActions.join('\n')}`
                  )}
                >
                  {/* swap arrows icon */}
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m21 16-4 4-4-4"/><path d="M17 20V4"/><path d="m3 8 4-4 4 4"/><path d="M7 4v16"/></svg>
                  Merge
                </button>
              </div>

              {/* Card */}
              <div className="results-card">
                <p className="results-card-eyebrow uppercase text-xs font-bold tracking-widest text-zinc-500"></p>
                <h5 className="results-card-title">Intelligence Summary</h5>

                {note.aiSummary && (
                  <div className="result-block">
                    <div className="result-block-label">SUMMARY:</div>
                    <p>{note.aiSummary}</p>
                  </div>
                )}

                {aiActions.length > 0 && (
                  <div className="result-block">
                    <div className="result-block-label">ACTION ITEMS:</div>
                    <ul className="action-list">
                      {aiActions.map((a: string, i: number) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!note.aiSummary && aiActions.length === 0 && !isAiLoading && (
            <div className="ai-empty">
              <div className="ai-empty-icon"><Sparkles size={22} /></div>
              <p>Awaiting analysis</p>
              <span>Input text to activate the neural engine</span>
            </div>
          )}
        </div>
      </aside>

      <style jsx>{`
        /* ────────────────────────────────────────────────
           Page shell — Notion scroll strategy:
           Left sidebar + Right panel are locked (sticky).
           Center column is the only scrolling container.
        ──────────────────────────────────────────────── */
        .editor-page {
          display: flex;
          height: 100vh;
          background: #0f0f12;
          overflow: hidden;
        }

        /* ────────────────────────────────────────────────
           Left editor column — scrolls, sidebars do not
        ──────────────────────────────────────────────── */
        .editor-main {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          background: #0f0f12;
          height: 100vh;
          overflow: hidden;
        }

        /* Top navigation bar */
        .editor-nav {
          height: 56px;
          padding: 0 3rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid hsla(0,0%,100%,0.04);
          flex-shrink: 0;
        }

        .nav-left {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .back-btn {
          width: 28px;
          height: 28px;
          border-radius: 7px;
          border: 1px solid hsla(0,0%,100%,0.1);
          background: transparent;
          color: hsla(0,0%,100%,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s;
        }
        .back-btn:hover { background: hsla(0,0%,100%,0.06); color: #fff; }

        .breadcrumb {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.82rem;
        }

        .bc-root { color: hsla(0,0%,100%,0.4); }
        .bc-sep  { color: hsla(0,0%,100%,0.25); }
        .bc-title { color: hsla(0,0%,100%,0.85); font-weight: 600; }

        .nav-right {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        /* Outlined action buttons in nav */
        .nav-btn {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.35rem 0.75rem;
          border-radius: 6px;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.15s;
        }

        .share-btn {
          background: transparent;
          border: 1px solid hsla(0,0%,100%,0.15);
          color: hsla(0,0%,100%,0.6);
        }
        .share-btn:hover { background: hsla(0,0%,100%,0.05); color: #fff; }

        .delete-btn {
          background: transparent;
          border: 1px solid hsla(0,80%,65%,0.4);
          color: hsl(0,75%,68%);
        }
        .delete-btn:hover { background: hsla(0,80%,65%,0.08); }

        /* ── Editor scroll area — SINGLE scrollbar for the whole center ── */
        .editor-scroll-area {
          flex: 1;
          overflow-y: auto;
          /* Sleek scrollbar for this container */
          scrollbar-width: thin;
          scrollbar-color: #3f3f46 transparent;
        }

        /* ── Editor card (now Full Bleed container) ── */
        .editor-card {
          padding: 3rem 4rem 5rem;
          max-width: 900px;
          margin: 0 auto;
          min-height: calc(100vh - 56px);
          display: flex;
          flex-direction: column;
        }

        /* Auto-save hint – top right inside card */
        .card-top-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .kb-hint {
          font-size: 0.65rem;
          color: hsla(0,0%,100%,0.15);
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .auto-save-text {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.68rem;
          color: hsla(0,0%,100%,0.3);
          letter-spacing: 0.03em;
          text-transform: uppercase;
        }

        .auto-save-text.saved { color: #10b981; }

        /* Title */
        .title-input {
          font-size: 2.75rem;
          font-weight: 800;
          letter-spacing: -0.025em;
          line-height: 1.1;
          color: #fff;
          background: transparent;
          border: none;
          outline: none;
          box-shadow: none;
          width: 100%;
          margin-bottom: 1.5rem;
          font-family: 'Inter', sans-serif;
        }
        .title-input::placeholder { color: hsla(0,0%,100%,0.15); }

        /* Tags */
        .tags-row {
          display: flex;
          align-items: flex-start;
          gap: 1.25rem;
          margin-bottom: 1.5rem;
        }

        .tags-label {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          color: hsla(0,0%,100%,0.35);
          font-size: 0.82rem;
          padding-top: 0.15rem;
          white-space: nowrap;
        }

        .tags-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
        }

        .tag-chip {
          background: hsl(260, 65%, 55%);
          color: #fff;
          padding: 0.2rem 0.7rem;
          border-radius: 999px;
          font-size: 0.72rem;
          font-weight: 500;
        }

        .add-tag-btn {
          display: flex;
          align-items: center;
          gap: 0.3rem;
          font-size: 0.72rem;
          font-weight: 600;
          color: hsla(0,0%,100%,0.3);
          background: transparent;
          border: 1px dashed hsla(0,0%,100%,0.15);
          border-radius: 999px;
          padding: 0.2rem 0.65rem;
          cursor: pointer;
          transition: all 0.15s;
        }
        .add-tag-btn:hover { color: hsla(0,0%,100%,0.6); border-color: hsla(0,0%,100%,0.3); }

        /* Body textarea — auto-expanding, no internal scrollbar */
        .body-input {
          flex: 1;
          font-size: 1.05rem;
          line-height: 1.8;
          color: hsla(0,0%,100%,0.8);
          background: transparent;
          border: none;
          outline: none;
          box-shadow: none;
          resize: none;
          overflow: hidden;
          width: 100%;
          min-height: 500px;
          font-family: 'Inter', sans-serif;
        }
        .body-input::placeholder { color: hsla(0,0%,100%,0.2); }

        /* ────────────────────────────────────────────────
           Right: Neural Engine panel — locked, no scroll trap
        ──────────────────────────────────────────────── */
        .ai-panel {
          width: 340px;
          flex-shrink: 0;
          border-left: 1px solid hsla(0,0%,100%,0.04);
          background: #0f0f12;
          display: flex;
          flex-direction: column;
          height: 100vh;
          overflow: hidden;
        }

        .ai-panel-header {
          height: 56px;
          padding: 0 1.25rem;
          border-bottom: 1px solid hsla(0,0%,100%,0.04);
          display: flex;
          align-items: center;
          flex-shrink: 0;
        }

        /* "✦ Neural Engine" chip */
        .ai-title-chip {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          background: hsla(262, 72%, 72%, 0.1);
          border: 1px solid hsla(262, 72%, 72%, 0.25);
          border-radius: 7px;
          padding: 0.35rem 0.75rem;
          color: hsl(262, 72%, 72%);
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.01em;
        }

        .ai-panel-body {
          flex: 1;
          overflow-y: auto;
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        /* Action card */
        .ai-action-card {
          background: #0f0f12;
          border: 1px solid hsla(0,0%,100%,0.07);
          border-radius: 11px;
          padding: 1.1rem;
        }

        .ai-desc {
          font-size: 0.78rem;
          color: hsla(0,0%,100%,0.45);
          line-height: 1.55;
          margin-bottom: 1rem;
        }

        .run-btn {
          width: 100%;
          height: 38px;
          border: none;
          border-radius: 999px;
          background: hsl(260, 70%, 60%);
          color: #fff;
          font-size: 0.82rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          cursor: pointer;
          transition: filter 0.15s;
        }
        .run-btn:hover:not(:disabled) { filter: brightness(1.12); }
        .run-btn:disabled { opacity: 0.55; cursor: not-allowed; }

        /* Results section */
        .ai-results {
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
        }

        .results-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .results-label {
          font-size: 0.62rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: hsla(0,0%,100%,0.5);
        }

        /* Teal merge button – matches image exactly */
        .merge-btn {
          display: flex;
          align-items: center;
          gap: 0.3rem;
          font-size: 0.62rem;
          font-weight: 800;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: #000;
          background: hsl(168, 65%, 48%);
          border: none;
          border-radius: 5px;
          padding: 0.28rem 0.55rem;
          cursor: pointer;
          transition: filter 0.15s;
        }
        .merge-btn:hover { filter: brightness(1.08); }

        /* Results card */
        .results-card {
          background: #0f0f12;
          border: 1px solid hsla(0,0%,100%,0.07);
          border-radius: 11px;
          padding: 1.1rem;
        }

        .results-card-eyebrow {
          font-size: 0.6rem;
          color: hsla(0,0%,100%,0.22);
          line-height: 1.4;
          margin-bottom: 0.3rem;
        }

        .results-card-title {
          font-size: 0.92rem;
          font-weight: 700;
          color: #fff;
          margin-bottom: 1rem;
        }

        .result-block {
          margin-bottom: 0.9rem;
        }
        .result-block:last-child { margin-bottom: 0; }

        .result-block-label {
          font-size: 0.7rem;
          font-weight: 700;
          color: hsla(0,0%,100%,0.4);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.35rem;
        }

        .result-block p {
          font-size: 0.8rem;
          line-height: 1.6;
          color: hsla(0,0%,100%,0.55);
        }

        .action-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }
        .action-list li {
          font-size: 0.8rem;
          line-height: 1.5;
          color: hsla(0,0%,100%,0.55);
        }

        /* Empty state */
        .ai-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem 1rem;
          text-align: center;
          gap: 0.5rem;
          color: hsla(0,0%,100%,0.25);
        }
        .ai-empty-icon {
          margin-bottom: 0.5rem;
          opacity: 0.4;
        }
        .ai-empty p {
          font-size: 0.82rem;
          font-weight: 600;
          color: hsla(0,0%,100%,0.45);
        }
        .ai-empty span { font-size: 0.73rem; }

        /* Loading */
        .loading-container {
          height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          color: hsla(0,0%,100%,0.3);
          background: #0f0f12;
        }
        .loading-container p { font-size: 0.85rem; }

        @media (max-width: 1100px) {
          .ai-panel { width: 290px; }
        }
        @media (max-width: 900px) {
          .editor-page { flex-direction: column; }
          .ai-panel { width: 100%; border-left: none; border-top: 1px solid hsla(0,0%,100%,0.06); height: 380px; }
        }
      `}</style>
    </div>
  );
}
