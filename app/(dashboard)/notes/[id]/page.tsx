'use client';

import { useState, useEffect, useCallback, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { Archive, ArrowLeft, CheckCircle2, ChevronRight, Edit3, Eye, Folder, Loader2, PlusCircle, RotateCcw, Share2, Sparkles, Tag, Trash2, Wand2, X } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(res => res.json());

function normalizeTag(tag: string) {
  return tag.trim().toLowerCase();
}

function renderInlineMarkdown(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }

    return part;
  });
}

function renderMarkdown(content: string) {
  const lines = content.split('\n');

  return lines.map((line, index) => {
    const trimmed = line.trim();

    if (!trimmed) return <div key={index} className="md-space" />;
    if (trimmed.startsWith('### ')) return <h3 key={index}>{renderInlineMarkdown(trimmed.slice(4))}</h3>;
    if (trimmed.startsWith('## ')) return <h2 key={index}>{renderInlineMarkdown(trimmed.slice(3))}</h2>;
    if (trimmed.startsWith('# ')) return <h1 key={index}>{renderInlineMarkdown(trimmed.slice(2))}</h1>;
    if (trimmed.startsWith('> ')) return <blockquote key={index}>{renderInlineMarkdown(trimmed.slice(2))}</blockquote>;
    if (trimmed.startsWith('- [ ] ') || trimmed.startsWith('- [x] ')) {
      const checked = trimmed.startsWith('- [x] ');
      return (
        <p key={index} className="task-line">
          <span className={checked ? 'task-box checked' : 'task-box'}>{checked ? '✓' : ''}</span>
          {renderInlineMarkdown(trimmed.slice(6))}
        </p>
      );
    }
    if (trimmed.startsWith('- ')) return <p key={index} className="bullet-line">{renderInlineMarkdown(trimmed.slice(2))}</p>;

    return <p key={index}>{renderInlineMarkdown(line)}</p>;
  });
}

export default function NoteEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState('');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [suggestedTitle, setSuggestedTitle] = useState('');
  const [editorMode, setEditorMode] = useState<'write' | 'preview'>('write');
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const hasInitialized = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-expand removed in favor of native CSS grid trick
  const autoExpand = () => {};

  const { data: note, mutate } = useSWR(`/api/notes/${resolvedParams.id}`, fetcher, {
    onSuccess: (data) => {
      if (!hasInitialized.current) {
        setTitle(data.title || '');
        setContent(data.content || '');
        setCategory(data.category || '');
        setSelectedTags((data.tags || []).map((tag: any) => tag.name));
        hasInitialized.current = true;
        setTimeout(autoExpand, 50);
      }
    }
  });

  const saveNote = useCallback(async (
    newTitle: string,
    newContent: string,
    newCategory = category,
    nextTags = selectedTags
  ) => {
    setSaveState('saving');
    try {
      const res = await fetch(`/api/notes/${resolvedParams.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          content: newContent,
          category: newCategory,
          tags: nextTags,
        })
      });
      if (!res.ok) throw new Error('Failed to save');
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2000);
      mutate();
    } catch (e) {
      setSaveState('idle');
    }
  }, [category, selectedTags, resolvedParams.id, mutate]);

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
    const noteTags = (note.tags || []).map((tag: any) => tag.name).sort().join(',');
    const localTags = [...selectedTags].sort().join(',');
    const timer = setTimeout(() => {
      if (
        title !== note.title ||
        content !== note.content ||
        category !== (note.category || '') ||
        localTags !== noteTags
      ) {
        saveNote(title, content, category, selectedTags);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [title, content, category, selectedTags, note, saveNote]);

  const handleGenerateAI = async () => {
    setIsAiLoading(true);
    try {
      const res = await fetch(`/api/notes/${resolvedParams.id}/generate-summary`, {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        setSuggestedTitle(data.suggested_title || '');
        mutate();
      }
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleApplySuggestedTitle = () => {
    if (!suggestedTitle) return;
    setTitle(suggestedTitle);
    saveNote(suggestedTitle, content);
    setSuggestedTitle('');
  };

  const addTag = (rawTag = tagDraft) => {
    const normalized = normalizeTag(rawTag);
    if (!normalized || selectedTags.includes(normalized)) {
      setTagDraft('');
      return;
    }

    setSelectedTags([...selectedTags, normalized]);
    setTagDraft('');
  };

  const removeTag = (tagToRemove: string) => {
    setSelectedTags(selectedTags.filter((tag) => tag !== tagToRemove));
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
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2500);
        setTimeout(() => setShareUrl(''), 3000);
      }
    } finally {
      setIsSharing(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/notes/${resolvedParams.id}`, { method: 'DELETE' });
      if (res.ok) router.push('/notes');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleArchive = async () => {
    const nextArchived = !note.archived;
    const res = await fetch(`/api/notes/${resolvedParams.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ archived: nextArchived })
    });
    if (!res.ok) return;
    await mutate();
    router.push(`/notes${nextArchived ? '?archived=true' : ''}`);
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


  const Toast = () => (
    <div className="toast-notification">
      <Share2 size={14} /> Link copied to clipboard
      <style jsx>{`
        .toast-notification {
          position: fixed;
          bottom: 2rem;
          left: 50%;
          transform: translateX(-50%);
          background: var(--text-main);
          color: var(--bg-main);
          padding: 0.75rem 1.25rem;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 700;
          z-index: 1000;
          display: flex;
          align-items: center;
          gap: 0.6rem;
          box-shadow: 0 10px 40px rgba(0,0,0,0.4);
          animation: toastUp 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }
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
      onClick={() => {
        if (!isDeleting) setShowDeleteConfirm(false);
      }}
    >
      <div className="delete-confirm" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="delete-note-title">
        <div className="delete-confirm-icon"><Trash2 size={18} /></div>
        <div className="delete-confirm-copy">
          <h4 id="delete-note-title">Delete note?</h4>
          <p>{title || 'Untitled Note'} will be permanently removed from your workspace.</p>
        </div>
        <div className="delete-confirm-actions">
          <button type="button" className="delete-cancel" disabled={isDeleting} onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
          <button type="button" className="delete-confirm-btn" disabled={isDeleting} onClick={handleDelete}>
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
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
        }
        .delete-confirm {
          width: min(370px, 100%);
          background: var(--bg-surface);
          border: 1px solid var(--border-bright);
          border-radius: 14px;
          box-shadow: 0 24px 70px rgba(0, 0, 0, 0.42);
          padding: 1.15rem;
        }
        .delete-confirm-icon {
          width: 38px;
          height: 38px;
          display: grid;
          place-items: center;
          border-radius: 10px;
          color: hsl(0,80%,70%);
          background: hsla(0,80%,65%,0.12);
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
          border-color: hsla(0,80%,65%,0.45);
          background: hsl(0,80%,60%);
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

  return (
    <div className="editor-page">
      {showToast && <Toast />}
      {showDeleteConfirm && deleteConfirm}

            {/* Mobile AI Backdrop */}
      {showAiPanel && (
        <div 
          className="show-mobile" 
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(3px)', zIndex: 150, display: 'none' }} 
          onClick={() => setShowAiPanel(false)} 
        />
      )}

      {/* ── Left: editor area ── */}
      <div className="editor-main">

        {/* Top nav bar */}
        <header className="editor-nav">
          <div className="nav-left">
            <button onClick={() => router.push('/notes')} className="back-btn">
              <ArrowLeft size={15} />
            </button>
            <div className="breadcrumb hide-mobile">
              <span className="bc-root">Workspace</span>
              <ChevronRight size={13} className="bc-sep" />
              <span className="bc-title">{title || 'Untitled'}</span>
            </div>
            <div className="show-mobile bc-title-mobile" style={{ display: 'none' }}>
              {title || 'Untitled'}
            </div>
          </div>

          <div className="nav-right">
            {/* AI Toggle - Mobile Only */}
            <button 
              onClick={() => setShowAiPanel(!showAiPanel)} 
              className="nav-btn ai-toggle-btn show-mobile" 
              style={{ display: 'none' }}
              title="Neural Engine"
            >
              <Sparkles size={16} className={isAiLoading ? 'animate-spin' : ''} />
            </button>

            <div className="mode-toggle hide-mobile" aria-label="Editor mode">
              <button
                className={editorMode === 'write' ? 'active' : ''}
                onClick={() => setEditorMode('write')}
                type="button"
              >
                <Edit3 size={13} />
                Write
              </button>
              <button
                className={editorMode === 'preview' ? 'active' : ''}
                onClick={() => setEditorMode('preview')}
                type="button"
              >
                <Eye size={13} />
                Preview
              </button>
            </div>
            {/* Share */}
            <button onClick={handleShare} className="nav-btn share-btn" disabled={isSharing}>
              {shareUrl
                ? <><CheckCircle2 size={13} /><span className="hide-mobile">Copied</span></>
                : <><Share2 size={13} /><span className="hide-mobile">Share</span></>
              }
            </button>
            <button onClick={handleArchive} className="nav-btn archive-btn">
              {note.archived
                ? <><RotateCcw size={13} /><span className="hide-mobile">Restore</span></>
                : <><Archive size={13} /><span className="hide-mobile">Archive</span></>
              }
            </button>
            {/* Delete */}
            <button onClick={() => setShowDeleteConfirm(true)} className="nav-btn delete-btn hide-mobile">
              <Trash2 size={13} />
              <span className="hide-mobile">Delete</span>
            </button>
          </div>
        </header>

        {/* Scroll area for notebook content */}
        <div className="editor-scroll-area">
          <div className="editor-card">
            {/* Auto-save status – top right of card */}
            <div className="card-top-bar">
              <span className="kb-hint">Ctrl / Command + S to save</span>
              {saveState === 'idle' && (
                <span className="auto-save-text">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><circle cx="12" cy="16" r="0.5" fill="currentColor" /></svg>
                  Auto-save ready
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
            <div className="title-input-wrapper" data-replicated-value={title + ' '}>
              <textarea
                className="title-input"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Untitled"
                rows={1}
              />
            </div>

            {suggestedTitle && (
              <div className="suggestion-card">
                <div className="suggestion-copy">
                  <Wand2 size={14} />
                  <span>Suggested title:</span>
                  <strong>{suggestedTitle}</strong>
                </div>
                <button onClick={handleApplySuggestedTitle} type="button">Apply</button>
              </div>
            )}

            {/* Tags row */}
            <div className="tags-row">
              <div className="tags-label">
                <Tag size={14} />
                <span>Tags</span>
              </div>
              <div className="tags-chips">
                {selectedTags.map((tagName) => (
                  <span key={tagName} className="tag-chip">
                    {tagName}
                    <button type="button" onClick={() => removeTag(tagName)} aria-label={`Remove ${tagName}`}>
                      <X size={11} />
                    </button>
                  </span>
                ))}
                <div className="tag-input-shell">
                  <PlusCircle size={12} />
                  <input
                    value={tagDraft}
                    onChange={(event) => setTagDraft(event.target.value)}
                    onBlur={() => addTag()}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ',') {
                        event.preventDefault();
                        addTag();
                      }
                    }}
                    placeholder="Add tag"
                  />
                </div>
              </div>
            </div>

            {/* Body */}
            {editorMode === 'write' ? (
              <div className="body-input-wrapper" data-replicated-value={content + ' '}>
                <textarea
                  ref={textareaRef}
                  className="body-input"
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Start writing. Markdown is supported for headings, lists, tasks, quotes, and bold text."
                />
              </div>
            ) : (
              <div className="markdown-preview">
                {content.trim() ? renderMarkdown(content) : <p className="preview-empty">Nothing to preview yet.</p>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Right: Neural Engine sidebar ── */}
      <aside className={`ai-panel ${showAiPanel ? "mobile-open" : ""}`}>
        {/* Header */}
        <div className="ai-panel-header">
          <div className="ai-title-chip">
            <Sparkles size={14} />
            <span>Gemini 2.5 Pro</span>
          </div>
        </div>

        {/* Body */}
        <div className="ai-panel-body">
          {/* Action card */}
          <div className="ai-action-card">
            <p className="ai-desc">Powered by Gemini 2.5 Flash to synthesize raw data into structured summaries and action items.</p>
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
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m21 16-4 4-4-4" /><path d="M17 20V4" /><path d="m3 8 4-4 4 4" /><path d="M7 4v16" /></svg>
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

      <style jsx>{`/* ────────────────────────────────────────────────
           Page shell — Notion scroll strategy:
           Left sidebar + Right panel are locked (sticky).
           Center column is the only scrolling container.
        ──────────────────────────────────────────────── */
        .editor-page {
          display: flex;
          flex: 1;
          min-height: 0;
          background: var(--bg-main);
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
          background: var(--bg-main);
          position: relative;
          overflow: hidden;
        }

        .editor-scroll-area {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          /* Sleek scrollbar */
          scrollbar-width: thin;
          scrollbar-color: var(--border-bright) transparent;
        }
        
        .editor-scroll-area::-webkit-scrollbar {
          width: 8px;
        }
        .editor-scroll-area::-webkit-scrollbar-track {
          background: transparent;
        }
        .editor-scroll-area::-webkit-scrollbar-thumb {
          background: var(--border-bright);
          border-radius: 10px;
        }

        /* Top navigation bar */
        .editor-nav {
          height: 56px;
          padding: 0 3rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--border-subtle);
          flex-shrink: 0;
          position: sticky;
          top: 0;
          z-index: 10;
          background: var(--bg-main);
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
          border: 1px solid var(--border-base);
          background: transparent;
          color: var(--text-dim);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s;
        }
        .back-btn:hover { background: var(--bg-surface-hover); color: var(--text-main); }

        .breadcrumb {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.82rem;
        }

        .bc-root { color: var(--text-dim); flex-shrink: 0; }
        .bc-sep  { color: var(--text-dim); flex-shrink: 0; }
        .bc-title { 
          color: var(--text-main); 
          font-weight: 600;
          max-width: 180px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .nav-right {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .mode-toggle {
          display: inline-flex;
          align-items: center;
          gap: 0.2rem;
          padding: 0.2rem;
          border-radius: 8px;
          background: var(--bg-input);
          border: 1px solid var(--border-base);
        }

        .mode-toggle button {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.28rem 0.55rem;
          border-radius: 6px;
          color: var(--text-dim);
          font-size: 0.7rem;
          font-weight: 800;
          background: transparent;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .mode-toggle button.active {
          color: var(--text-main);
          background: var(--bg-surface-hover);
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
          border: 1px solid var(--border-bright);
          color: var(--text-muted);
        }
        .share-btn:hover { background: hsla(0,0%,100%,0.05); color: var(--text-main); }

        .archive-btn {
          background: transparent;
          border: 1px solid hsla(178,72%,55%,0.28);
          color: hsl(178,72%,68%);
        }
        .archive-btn:hover { background: hsla(178,72%,55%,0.08); }

        .delete-btn {
          background: transparent;
          border: 1px solid hsla(0,80%,65%,0.4);
          color: hsl(0,75%,68%);
        }
        .delete-btn:hover { background: hsla(0,80%,65%,0.08); }


        /* ── Editor card (now Full Bleed container) ── */
        .editor-card {
          padding: 3rem 2rem 5rem;
          width: 100%;
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
          color: var(--text-dim);
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .auto-save-text {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.68rem;
          color: var(--text-dim);
          letter-spacing: 0.03em;
          text-transform: uppercase;
        }

        .auto-save-text.saved { color: #10b981; }

        /* Title */
        .title-input-wrapper {
          display: grid;
          margin-bottom: 1.5rem;
          min-width: 0;
        }
        .title-input-wrapper::after {
          content: attr(data-replicated-value) " ";
          white-space: pre-wrap;
          word-break: break-word;
          visibility: hidden;
          font-size: 2.1rem;
          font-weight: 800;
          letter-spacing: -0.025em;
          line-height: 1.2;
          font-family: 'Inter', sans-serif;
          grid-area: 1 / 1 / 2 / 2;
        }
        .title-input {
          font-size: 2.1rem;
          font-weight: 800;
          letter-spacing: -0.025em;
          line-height: 1.2;
          color: var(--text-main);
          background: transparent;
          border: none;
          outline: none;
          box-shadow: none;
          width: 100%;
          font-family: 'Inter', sans-serif;
          resize: none;
          overflow: hidden;
          word-break: break-word;
          grid-area: 1 / 1 / 2 / 2;
        }
        .title-input::placeholder { color: var(--text-dim); }

        .suggestion-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: 0.75rem 0.9rem;
          margin: -0.35rem 0 1.25rem;
          border: 1px solid hsla(45, 93%, 55%, 0.18);
          border-radius: 10px;
          background: hsla(45, 93%, 50%, 0.1);
        }

        .suggestion-copy {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          min-width: 0;
          color: var(--warning);
          font-size: 0.78rem;
        }

        .suggestion-copy strong {
          color: var(--text-main);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .suggestion-card button {
          border: none;
          border-radius: 7px;
          background: hsl(45, 93%, 62%);
          color: #17130a;
          cursor: pointer;
          font-size: 0.68rem;
          font-weight: 900;
          padding: 0.35rem 0.65rem;
          text-transform: uppercase;
        }



        .category-input:focus {
          border-color: hsla(178,72%,55%,0.45);
          background: var(--bg-surface);
        }

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
          color: var(--text-dim);
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
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
        }

        .tag-chip button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 15px;
          height: 15px;
          border: none;
          border-radius: 50%;
          background: var(--bg-surface-hover);
          color: #fff;
          cursor: pointer;
        }

        .tag-input-shell {
          display: flex;
          align-items: center;
          gap: 0.3rem;
          font-size: 0.72rem;
          font-weight: 600;
          color: var(--text-dim);
          background: transparent;
          border: 1px dashed var(--border-bright);
          border-radius: 999px;
          padding: 0.2rem 0.65rem;
          transition: all 0.15s;
        }
        .tag-input-shell:focus-within { color: var(--text-main); border-color: var(--text-dim); }

        .tag-input-shell input {
          width: 5.5rem;
          min-width: 0;
          font-size: 0.72rem;
          color: var(--text-main);
          background: transparent;
        }

        /* Native CSS Grid auto-expanding wrapper */
        .body-input-wrapper {
          display: grid;
          flex: 1;
          min-width: 0;
        }
        .body-input-wrapper::after {
          content: attr(data-replicated-value) " ";
          white-space: pre-wrap;
          word-break: break-word;
          visibility: hidden;
          font-size: 1.05rem;
          line-height: 1.8;
          font-family: 'Inter', sans-serif;
          min-height: 500px;
          grid-area: 1 / 1 / 2 / 2;
        }

        /* Body textarea */
        .body-input {
          font-size: 1.05rem;
          line-height: 1.8;
          color: var(--text-main);
          background: transparent;
          border: none;
          outline: none;
          box-shadow: none;
          resize: none;
          overflow: hidden;
          width: 100%;
          font-family: 'Inter', sans-serif;
          word-break: break-word;
          grid-area: 1 / 1 / 2 / 2;
        }
        .body-input::placeholder { color: var(--text-dim); }

        .markdown-preview {
          flex: 1;
          min-height: 500px;
          color: var(--text-main);
          font-size: 1.02rem;
          line-height: 1.8;
        }

        .markdown-preview :global(h1),
        .markdown-preview :global(h2),
        .markdown-preview :global(h3) {
          color: var(--text-main);
          margin: 1.5rem 0 0.65rem;
          letter-spacing: 0;
        }

        .markdown-preview :global(h1) { font-size: 2rem; }
        .markdown-preview :global(h2) { font-size: 1.45rem; }
        .markdown-preview :global(h3) { font-size: 1.1rem; }

        .markdown-preview :global(blockquote) {
          border-left: 3px solid hsl(178,72%,55%);
          color: var(--text-muted);
          background: var(--brand-teal-soft, hsla(178,72%,55%,0.1));
          padding: 0.7rem 1rem;
          border-radius: 0 10px 10px 0;
          margin: 0.85rem 0;
        }

        .markdown-preview :global(strong) {
          color: var(--text-main);
          font-weight: 800;
        }

        .markdown-preview :global(.bullet-line)::before {
          content: "";
          display: inline-block;
          width: 6px;
          height: 6px;
          margin-right: 0.75rem;
          border-radius: 50%;
          background: hsl(262,72%,72%);
          vertical-align: middle;
        }

        .markdown-preview :global(.task-line) {
          display: flex;
          align-items: center;
          gap: 0.65rem;
        }

        .markdown-preview :global(.task-box) {
          width: 16px;
          height: 16px;
          border-radius: 5px;
          border: 1px solid var(--border-bright);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 0.62rem;
          color: #0f0f12;
          flex-shrink: 0;
        }

        .markdown-preview :global(.task-box.checked) {
          background: hsl(168,65%,48%);
          border-color: hsl(168,65%,48%);
        }

        .markdown-preview :global(.md-space) {
          height: 0.75rem;
        }

        .preview-empty {
          color: var(--text-dim);
          font-style: italic;
        }

        /* ────────────────────────────────────────────────
           Right: Neural Engine panel — locked, no scroll trap
        ──────────────────────────────────────────────── */
        .ai-panel {
          width: 340px;
          flex-shrink: 0;
          border-left: 1px solid var(--border-subtle);
          background: var(--bg-main);
          display: flex;
          flex-direction: column;
          height: 100vh;
          overflow: hidden;
        }

        .ai-panel-header {
          height: 56px;
          padding: 0 1.25rem;
          border-bottom: 1px solid var(--border-subtle);
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
          background: var(--bg-main);
          border: 1px solid var(--border-subtle);
          border-radius: 11px;
          padding: 1.1rem;
        }

        .ai-desc {
          font-size: 0.78rem;
          color: var(--text-dim);
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
          color: var(--text-muted);
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
          background: var(--bg-main);
          border: 1px solid var(--border-subtle);
          border-radius: 11px;
          padding: 1.1rem;
        }

        .results-card-eyebrow {
          font-size: 0.6rem;
          color: var(--text-dim);
          line-height: 1.4;
          margin-bottom: 0.3rem;
        }

        .results-card-title {
          font-size: 0.92rem;
          font-weight: 700;
          color: var(--text-main);
          margin-bottom: 1rem;
        }

        .result-block {
          margin-bottom: 0.9rem;
        }
        .result-block:last-child { margin-bottom: 0; }

        .result-block-label {
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--text-dim);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.35rem;
        }

        .result-block p {
          font-size: 0.8rem;
          line-height: 1.6;
          color: var(--text-muted);
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
          color: var(--text-muted);
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
          color: var(--text-dim);
        }
        .ai-empty-icon {
          margin-bottom: 0.5rem;
          opacity: 0.4;
        }
        .ai-empty p {
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--text-dim);
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
          color: var(--text-dim);
          background: var(--bg-main);
        }
        .loading-container p { font-size: 0.85rem; }

        @media (max-width: 1100px) {
          .ai-panel { width: 290px; }
        }
        @media (max-width: 900px) {
          .editor-page { flex-direction: column; position: relative; }
          .editor-main { height: 100vh; }
          .editor-scroll-area { padding-bottom: 120px; }
          
          /* AI Panel as Mobile Side Overlay */
          .ai-panel { 
            position: fixed; 
            top: 0; 
            right: 0; 
            bottom: 0; 
            width: 85%; 
            max-width: 320px;
            z-index: 200;
            background: var(--bg-sidebar);
            border-left: 1px solid var(--border-bright);
            transform: translateX(100%);
            transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: -10px 0 30px rgba(0,0,0,0.6);
            display: flex !important;
          }
          .ai-panel.mobile-open { transform: translateX(0); }
          .ai-panel-header { padding: 1.25rem; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-subtle); }
          
          .editor-card { padding: 1.5rem 1.25rem 6rem; gap: 0.5rem; }
          .editor-nav { 
            padding: 0 0.75rem; 
            height: 56px; 
            gap: 0.5rem; 
            background: var(--bg-main);
            position: sticky;
            top: 0;
            z-index: 50;
            border-bottom: 1px solid var(--border-subtle);
          }
          
          .card-top-bar { margin-bottom: 0.5rem; padding-top: 0.5rem; }
          .title-input-wrapper { margin-bottom: 0.75rem; }
          .title-input { font-size: 1.75rem; line-height: 1.2; font-weight: 800; }
          .title-input-wrapper::after { font-size: 1.75rem; line-height: 1.2; font-weight: 800; }
          .body-input { font-size: 1.05rem; line-height: 1.7; padding-bottom: 12rem; }
          
          .bc-title-mobile { font-size: 0.85rem; font-weight: 700; color: var(--text-main); max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
          
          .nav-btn { 
            width: 36px;
            height: 36px;
            padding: 0 !important;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 8px;
            background: var(--bg-surface);
            border: 1px solid var(--border-base);
          }
          .nav-btn span { display: none !important; }
          .nav-btn.share-btn { border-color: var(--brand-primary-soft); color: var(--brand-primary); }
          .ai-toggle-btn { display: flex !important; background: var(--brand-primary-soft) !important; border-color: var(--brand-primary) !important; color: var(--brand-primary) !important; }
          
          .ai-close-btn { display: flex !important; width: 32px; height: 32px; align-items: center; justify-content: center; border-radius: 6px; background: var(--bg-surface-hover); }
          
          .archive-btn.hide-mobile, .delete-btn.hide-mobile { display: none !important; }
          .kb-hint { display: none; }
          .auto-save-text { font-size: 0.6rem; }
        }
      `}</style>
    </div>
  );
}
