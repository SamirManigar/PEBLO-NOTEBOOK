import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Sparkles, Tag, Calendar, User } from 'lucide-react';

export default async function SharedNotePage({ params }: { params: Promise<{ shareId: string }> }) {
  const resolvedParams = await params;
  
  const note = await prisma.note.findUnique({
    where: { shareId: resolvedParams.shareId },
    include: {
      user: { select: { name: true } },
      tags: true
    }
  });

  if (!note || !note.isPublic) {
    notFound();
  }

  return (
    <div className="shared-layout">
      <div className="shared-container">
        <header className="shared-header">
          <div className="brand-badge">Peblo Intelligence</div>
          <h1 className="title">{note.title || 'Untitled Knowledge'}</h1>
          
          <div className="meta-info">
            <div className="meta-item">
              <User size={12} />
              <span>{note.user.name}</span>
            </div>
            <div className="meta-item">
              <Calendar size={12} />
              <span>{new Date(note.updatedAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>
          </div>
          
          {note.tags && note.tags.length > 0 && (
            <div className="tags">
              {note.tags.map((t: any) => (
                <span key={t.id} className="badge">{t.name}</span>
              ))}
            </div>
          )}
        </header>

        <div className="content">
          {note.content ? (
            note.content.split('\n').map((para: string, i: number) => (
              para.trim() ? <p key={i}>{para}</p> : <br key={i} />
            ))
          ) : (
            <p className="empty">This document is currently empty.</p>
          )}
        </div>

        {(note.aiSummary || (note.aiActions && note.aiActions !== '[]')) && (
          <div className="ai-box">
            <div className="ai-header">
              <Sparkles size={14} fill="currentColor" />
              <span>Neural Synthesis</span>
            </div>
            
            <div className="ai-body">
              {note.aiSummary && (
                <div className="ai-section">
                  <h3>Intelligence Summary</h3>
                  <p>{note.aiSummary}</p>
                </div>
              )}
              
              {note.aiActions && note.aiActions !== '[]' && (
                <div className="ai-section">
                  <h3>Actionable Insights</h3>
                  <ul className="ai-actions-list">
                    {JSON.parse(note.aiActions).map((act: string, i: number) => (
                      <li key={i}>{act}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .ai-body {
          padding: 1rem 0;
        }

        .ai-actions-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .ai-actions-list li {
          position: relative;
          padding-left: 1.5rem;
          margin-bottom: 0.75rem;
          font-size: 0.95rem;
          line-height: 1.6;
        }

        .ai-actions-list li::before {
          content: "";
          position: absolute;
          left: 0;
          top: 0.65rem;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--brand-primary);
        }

        .empty {
          text-align: center;
          color: var(--text-dim);
          padding: 4rem 0;
          font-style: italic;
        }
      `}</style>
    </div>
  );
}
