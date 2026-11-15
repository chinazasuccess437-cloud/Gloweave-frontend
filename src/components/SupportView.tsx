import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  Globe,
  HelpCircle,
  Info,
  LifeBuoy,
  Loader2,
  Mail,
  Send,
} from 'lucide-react';
import { ABOUT_GLOWEAVE, FAQ_ITEMS, HELP_CENTER_GUIDES } from '../data/legalDocuments';
import { LegalDocumentId, SupportTabId } from '../types/gloweave';

interface SupportViewProps {
  activeTab: SupportTabId;
  onSelectTab: (tab: SupportTabId) => void;
  userEmail?: string;
  onBack?: () => void;
  onOpenLegal: (docId: LegalDocumentId) => void;
  onToast: (msg: string) => void;
}

export const SupportView: React.FC<SupportViewProps> = ({
  activeTab,
  onSelectTab,
  userEmail,
  onBack,
  onOpenLegal,
  onToast,
}) => {
  const [openFaqId, setOpenFaqId] = useState<string>(FAQ_ITEMS[0]?.id || '');

  // Contact Support state
  const [supportTopic, setSupportTopic] = useState('Account & Verification');
  const [supportEmail, setSupportEmail] = useState(userEmail || '');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportBusy, setSupportBusy] = useState(false);
  const [supportError, setSupportError] = useState('');
  const [supportDraftReady, setSupportDraftReady] = useState<string | null>(null);

  // Report a Problem state
  const [reportCategory, setReportCategory] = useState('Broken Link / Submission Issue');
  const [reportLocation, setReportLocation] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [reportBusy, setReportBusy] = useState(false);
  const [reportError, setReportError] = useState('');
  const [reportLoggedText, setReportLoggedText] = useState<string | null>(null);

  const tabs: { id: SupportTabId; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'help-center', label: 'Help Center', icon: BookOpen },
    { id: 'faq', label: 'FAQ', icon: HelpCircle },
    { id: 'contact', label: 'Contact Support', icon: Mail },
    { id: 'report', label: 'Report a Problem', icon: AlertTriangle },
    { id: 'about', label: 'About Gloweave', icon: Info },
  ];

  const handleSubmitSupport = (e: React.FormEvent) => {
    e.preventDefault();
    setSupportError('');
    setSupportDraftReady(null);

    if (!supportEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supportEmail.trim())) {
      setSupportError('Enter a valid contact email address.');
      return;
    }
    if (supportMessage.trim().length < 10) {
      setSupportError('Please describe your question in at least 10 characters.');
      return;
    }

    setSupportBusy(true);
    window.setTimeout(() => {
      const formatted = `[Gloweave Support Request]\nTopic: ${supportTopic}\nReply-To: ${supportEmail.trim()}\nMessage:\n${supportMessage.trim()}`;
      setSupportDraftReady(formatted);
      setSupportBusy(false);
      onToast('Support request drafted locally (awaiting backend ticketing endpoint).');
    }, 450);
  };

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    setReportError('');
    setReportLoggedText(null);

    if (reportDetails.trim().length < 10) {
      setReportError('Please provide at least 10 characters describing the problem.');
      return;
    }

    setReportBusy(true);
    window.setTimeout(() => {
      const formatted = `[Gloweave Issue Report]\nCategory: ${reportCategory}\nScreen / URL: ${
        reportLocation.trim() || 'Not specified'
      }\nDetails:\n${reportDetails.trim()}`;
      setReportLoggedText(formatted);
      setReportBusy(false);
      onToast('Problem report formatted locally (awaiting backend moderation queue).');
    }, 450);
  };

  const copyText = async (text: string, label: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      }
      onToast(`${label} copied to clipboard.`);
    } catch {
      onToast('Copy failed — please select and copy the text manually.');
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="space-y-1">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-[#38BDF8] hover:underline mb-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Settings</span>
          </button>
        )}
        <h2 className="text-2xl font-extrabold text-white flex items-center space-x-2.5">
          <LifeBuoy className="w-6 h-6 text-[#38BDF8]" />
          <span>Help &amp; Support</span>
        </h2>
        <p className="text-xs text-slate-400">
          Guides, answers, issue reporting, and information about Gloweave.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 p-1.5 bg-[#0A1633] border border-[#1E386E] rounded-2xl w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition whitespace-nowrap cursor-pointer ${
                activeTab === tab.id ? 'btn-royal text-white' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. HELP CENTER */}
      {activeTab === 'help-center' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {HELP_CENTER_GUIDES.map((guide) => (
              <div key={guide.title} className="glass-card p-5 rounded-2xl space-y-2">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <BookOpen className="w-4 h-4 text-[#38BDF8]" />
                  <span>{guide.title}</span>
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">{guide.description}</p>
              </div>
            ))}
          </div>

          <div className="glass-card p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white">Looking for specific answers?</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Browse the FAQ or report an issue directly.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onSelectTab('faq')}
                className="px-4 py-2 rounded-xl bg-[#0A1633] border border-[#1E386E] text-xs font-semibold text-slate-200 hover:border-sky-400/50 cursor-pointer"
              >
                Browse FAQ
              </button>
              <button
                type="button"
                onClick={() => onSelectTab('contact')}
                className="px-4 py-2 rounded-xl btn-royal text-white text-xs font-bold cursor-pointer"
              >
                Contact Support
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. FAQ */}
      {activeTab === 'faq' && (
        <div className="glass-card rounded-2xl divide-y divide-slate-800/80 max-w-4xl overflow-hidden">
          {FAQ_ITEMS.map((item) => {
            const expanded = openFaqId === item.id;
            return (
              <div key={item.id} className="p-4 sm:p-5">
                <button
                  type="button"
                  onClick={() => setOpenFaqId(expanded ? '' : item.id)}
                  className="w-full text-left flex items-center justify-between gap-4 cursor-pointer"
                >
                  <span className="text-xs sm:text-sm font-bold text-white">{item.question}</span>
                  {expanded ? (
                    <ChevronUp className="w-4 h-4 text-[#38BDF8] shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>
                {expanded && (
                  <p className="text-xs text-slate-300 leading-relaxed mt-3 pt-3 border-t border-slate-800/70">
                    {item.answer}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 3. CONTACT SUPPORT */}
      {activeTab === 'contact' && (
        <div className="glass-card p-6 rounded-2xl space-y-5 max-w-2xl">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-base font-extrabold text-white">Contact Support</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Prepare a support inquiry regarding your account, verification, or submissions.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-400/35 text-[10px] font-bold text-amber-300">
              Awaiting Backend Ticketing Integration
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-400/30 text-[11px] text-amber-100 leading-relaxed">
            Automated support ticket dispatch is awaiting backend integration. Submitting this form
            validates and prepares your formatted message locally so you can copy or email it
            without losing details.
          </div>

          <form onSubmit={handleSubmitSupport} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Topic</label>
                <select
                  value={supportTopic}
                  onChange={(e) => setSupportTopic(e.target.value)}
                  className="w-full bg-[#040A1A] border border-[#1E386E] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-sky-400"
                >
                  <option>Account &amp; Verification</option>
                  <option>Batch Submission &amp; Analysis</option>
                  <option>Solution Evidence Review</option>
                  <option>Privacy or Data Request</option>
                  <option>General Feedback</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Reply Email Address
                </label>
                <input
                  type="email"
                  value={supportEmail}
                  onChange={(e) => {
                    setSupportEmail(e.target.value);
                    setSupportError('');
                  }}
                  placeholder="name@domain.com"
                  className="w-full bg-[#040A1A] border border-[#1E386E] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                How can we help?
              </label>
              <textarea
                rows={4}
                value={supportMessage}
                onChange={(e) => {
                  setSupportMessage(e.target.value);
                  setSupportError('');
                }}
                placeholder="Describe your question or issue..."
                className="w-full bg-[#040A1A] border border-[#1E386E] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400"
              />
            </div>

            {supportError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
                {supportError}
              </div>
            )}

            <button
              type="submit"
              disabled={supportBusy}
              className="px-5 py-2.5 rounded-xl btn-royal text-white text-xs font-bold flex items-center space-x-2 cursor-pointer disabled:opacity-60"
            >
              {supportBusy ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>{supportBusy ? 'Preparing Request...' : 'Prepare Support Request'}</span>
            </button>
          </form>

          {supportDraftReady && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-400/35 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-emerald-300 flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Support Request Prepared Locally</span>
                </span>
                <button
                  type="button"
                  onClick={() => copyText(supportDraftReady, 'Support request')}
                  className="px-2.5 py-1 rounded-lg bg-[#0A1633] border border-[#1E386E] text-[11px] font-semibold text-[#38BDF8] flex items-center space-x-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </button>
              </div>
              <pre className="text-[11px] text-slate-200 whitespace-pre-wrap font-mono bg-[#040A1A] p-3 rounded-lg border border-[#1E386E]">
                {supportDraftReady}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* 4. REPORT A PROBLEM */}
      {activeTab === 'report' && (
        <div className="glass-card p-6 rounded-2xl space-y-5 max-w-2xl">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-base font-extrabold text-white">Report a Problem</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Flag inaccurate matches, broken evidence URLs, bugs, or guideline violations.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-400/35 text-[10px] font-bold text-amber-300">
              Awaiting Backend Moderation Queue
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-400/30 text-[11px] text-amber-100 leading-relaxed">
            Live moderation queue submission awaits backend API integration. Reports submitted here
            are validated and formatted locally so you can copy and archive them.
          </div>

          <form onSubmit={handleSubmitReport} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Issue Category
                </label>
                <select
                  value={reportCategory}
                  onChange={(e) => setReportCategory(e.target.value)}
                  className="w-full bg-[#040A1A] border border-[#1E386E] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-sky-400"
                >
                  <option>Broken Link / Submission Issue</option>
                  <option>Misleading Solution Evidence</option>
                  <option>Inaccurate AI Match</option>
                  <option>Community Guidelines Concern</option>
                  <option>UI / Technical Bug</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Screen or URL (Optional)
                </label>
                <input
                  type="text"
                  value={reportLocation}
                  onChange={(e) => setReportLocation(e.target.value)}
                  placeholder="e.g. Matches, Discover, or https://..."
                  className="w-full bg-[#040A1A] border border-[#1E386E] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Problem Details
              </label>
              <textarea
                rows={4}
                value={reportDetails}
                onChange={(e) => {
                  setReportDetails(e.target.value);
                  setReportError('');
                }}
                placeholder="Describe what happened or which item needs review..."
                className="w-full bg-[#040A1A] border border-[#1E386E] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400"
              />
            </div>

            {reportError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
                {reportError}
              </div>
            )}

            <button
              type="submit"
              disabled={reportBusy}
              className="px-5 py-2.5 rounded-xl btn-royal text-white text-xs font-bold flex items-center space-x-2 cursor-pointer disabled:opacity-60"
            >
              {reportBusy ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5" />
              )}
              <span>{reportBusy ? 'Formatting Report...' : 'Submit Problem Report'}</span>
            </button>
          </form>

          {reportLoggedText && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-400/35 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-emerald-300 flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Report Formatted Locally</span>
                </span>
                <button
                  type="button"
                  onClick={() => copyText(reportLoggedText, 'Problem report')}
                  className="px-2.5 py-1 rounded-lg bg-[#0A1633] border border-[#1E386E] text-[11px] font-semibold text-[#38BDF8] flex items-center space-x-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </button>
              </div>
              <pre className="text-[11px] text-slate-200 whitespace-pre-wrap font-mono bg-[#040A1A] p-3 rounded-lg border border-[#1E386E]">
                {reportLoggedText}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* 5. ABOUT GLOWEAVE */}
      {activeTab === 'about' && (
        <div className="glass-card p-6 sm:p-8 rounded-2xl space-y-6 max-w-3xl">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#0066FF] to-[#19C8FF] flex items-center justify-center shadow-[0_0_18px_rgba(25,200,255,0.4)] shrink-0">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-white">About Gloweave</h3>
              <p className="text-[11px] text-[#38BDF8] font-semibold uppercase tracking-wider">
                {ABOUT_GLOWEAVE.tagline} · {ABOUT_GLOWEAVE.version}
              </p>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
            {ABOUT_GLOWEAVE.summary}
          </p>

          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Core Platform Workflow
            </h4>
            <div className="space-y-2">
              {ABOUT_GLOWEAVE.workflowSteps.map((stepText, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-[#040A1A] border border-[#1E386E] flex items-start space-x-3 text-xs text-slate-200"
                >
                  <span className="w-5 h-5 rounded-full bg-[#0D2352] border border-sky-400/35 text-[#38BDF8] font-bold flex items-center justify-center shrink-0 text-[11px]">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed">{stepText}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 flex flex-wrap gap-2">
            {(
              [
                { id: 'privacy', label: 'Privacy Policy' },
                { id: 'terms', label: 'Terms & Conditions' },
                { id: 'guidelines', label: 'Community Guidelines' },
                { id: 'data-ai', label: 'Data & AI Policy' },
              ] as const
            ).map((docLink) => (
              <button
                key={docLink.id}
                type="button"
                onClick={() => onOpenLegal(docLink.id)}
                className="px-3.5 py-2 rounded-xl bg-[#0A1633] border border-[#1E386E] text-xs font-semibold text-[#38BDF8] hover:border-sky-400/50 cursor-pointer"
              >
                {docLink.label} →
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
