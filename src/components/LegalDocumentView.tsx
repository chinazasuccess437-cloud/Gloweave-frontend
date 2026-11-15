import React from 'react';
import { ArrowLeft, Calendar, FileText, Scale, ShieldAlert, X } from 'lucide-react';
import { LEGAL_DOCUMENTS, LEGAL_DOCUMENT_LIST } from '../data/legalDocuments';
import { LegalDocumentId } from '../types/gloweave';

interface LegalDocumentViewProps {
  activeDocId: LegalDocumentId;
  onSelectDoc: (docId: LegalDocumentId) => void;
  onBack?: () => void;
  backLabel?: string;
}

export const LegalDocumentView: React.FC<LegalDocumentViewProps> = ({
  activeDocId,
  onSelectDoc,
  onBack,
  backLabel = 'Back to Settings',
}) => {
  const doc = LEGAL_DOCUMENTS[activeDocId] || LEGAL_DOCUMENTS.privacy;

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center space-x-1.5 text-xs font-semibold text-[#38BDF8] hover:underline mb-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{backLabel}</span>
            </button>
          )}
          <h2 className="text-2xl font-extrabold text-white flex items-center space-x-2.5">
            <Scale className="w-6 h-6 text-[#38BDF8]" />
            <span>Legal &amp; Platform Policies</span>
          </h2>
          <p className="text-xs text-slate-400">
            Draft governance documents clearly marked pending formal legal review.
          </p>
        </div>
      </div>

      {/* Document Switcher Tabs */}
      <div className="flex flex-wrap gap-1.5 p-1.5 bg-[#0A1633] border border-[#1E386E] rounded-2xl w-fit">
        {LEGAL_DOCUMENT_LIST.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelectDoc(item.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
              activeDocId === item.id ? 'btn-royal text-white' : 'text-slate-300 hover:text-white'
            }`}
          >
            {item.shortTitle}
          </button>
        ))}
      </div>

      {/* Draft Review Notice */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-400/35 flex items-start space-x-3">
        <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-100 space-y-1 leading-relaxed">
          <div className="font-bold text-amber-300">
            Draft Document — Pending Formal Legal Review
          </div>
          <p className="text-amber-100/85">
            This policy is a transparent working draft describing Gloweave&apos;s current web
            application behaviour. It does not assert external compliance certifications or formal
            legal guarantees prior to legal counsel sign-off.
          </p>
        </div>
      </div>

      {/* Document Card */}
      <article className="glass-card rounded-2xl p-6 sm:p-8 space-y-6 border border-sky-400/20 max-w-4xl">
        <header className="pb-5 border-b border-slate-800/80 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-sky-500/15 border border-sky-400/35 text-[11px] font-bold text-[#38BDF8]">
              <FileText className="w-3 h-3" />
              <span>{doc.statusBadge}</span>
            </span>
            <span className="inline-flex items-center space-x-1.5 text-[11px] text-slate-400 font-medium">
              <Calendar className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span>
                Last updated: {doc.lastUpdated} · {doc.version}
              </span>
            </span>
          </div>

          <h3 className="text-xl sm:text-2xl font-extrabold text-white">{doc.title}</h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{doc.summary}</p>
        </header>

        <div className="space-y-6">
          {doc.sections.map((section) => (
            <section key={section.heading} className="space-y-2.5">
              <h4 className="text-sm sm:text-base font-bold text-white">{section.heading}</h4>
              {section.paragraphs.map((p, idx) => (
                <p key={idx} className="text-xs sm:text-[13px] text-slate-300 leading-relaxed">
                  {p}
                </p>
              ))}
              {section.bullets && section.bullets.length > 0 && (
                <ul className="space-y-1.5 pl-4 list-disc text-xs sm:text-[13px] text-slate-300 leading-relaxed">
                  {section.bullets.map((bullet, bIdx) => (
                    <li key={bIdx}>{bullet}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      </article>
    </div>
  );
};

interface LegalDocumentModalProps {
  open: boolean;
  activeDocId: LegalDocumentId;
  onSelectDoc: (docId: LegalDocumentId) => void;
  onClose: () => void;
}

export const LegalDocumentModal: React.FC<LegalDocumentModalProps> = ({
  open,
  activeDocId,
  onSelectDoc,
  onClose,
}) => {
  if (!open) return null;
  const doc = LEGAL_DOCUMENTS[activeDocId] || LEGAL_DOCUMENTS.privacy;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={doc.title}
    >
      <div
        className="w-full max-w-2xl max-h-[86vh] glass-card rounded-3xl border border-sky-400/30 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 sm:p-5 border-b border-[#172B54] flex items-center justify-between gap-3 bg-[#060E22]">
          <div className="flex items-center space-x-2.5 min-w-0">
            <Scale className="w-5 h-5 text-[#38BDF8] shrink-0" />
            <div className="min-w-0">
              <h3 className="text-sm font-extrabold text-white truncate">{doc.title}</h3>
              <p className="text-[11px] text-slate-400">
                {doc.statusBadge} · Last updated {doc.lastUpdated}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close legal document"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-4 sm:px-5 py-2.5 bg-[#071129] border-b border-[#172B54] flex flex-wrap gap-1.5">
          {LEGAL_DOCUMENT_LIST.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectDoc(item.id)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                activeDocId === item.id
                  ? 'btn-royal text-white'
                  : 'bg-[#0A1633] text-slate-300 hover:text-white border border-[#1E386E]'
              }`}
            >
              {item.shortTitle}
            </button>
          ))}
        </div>

        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-400/35 text-[11px] text-amber-100 leading-relaxed">
            <strong className="text-amber-300">Draft Pending Legal Review:</strong> No external
            compliance certifications or formal legal warranties are claimed in this draft.
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">{doc.summary}</p>

          {doc.sections.map((section) => (
            <section key={section.heading} className="space-y-2">
              <h4 className="text-xs sm:text-sm font-bold text-white">{section.heading}</h4>
              {section.paragraphs.map((p, idx) => (
                <p key={idx} className="text-xs text-slate-300 leading-relaxed">
                  {p}
                </p>
              ))}
              {section.bullets && section.bullets.length > 0 && (
                <ul className="space-y-1 pl-4 list-disc text-xs text-slate-300 leading-relaxed">
                  {section.bullets.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        <div className="p-4 border-t border-[#172B54] bg-[#060E22] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl btn-royal text-white text-xs font-bold cursor-pointer"
          >
            Close Document
          </button>
        </div>
      </div>
    </div>
  );
};
