import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Bot,
  User,
  GraduationCap,
  Coins,
  Building2,
  Briefcase,
  Megaphone,
  Upload,
  Trash2,
  RefreshCw,
  FileText,
  Layers,
  ChevronDown,
  ChevronUp,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Compass
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const DOMAIN_OPTIONS = [
  { key: 'all', label: 'Auto Router', icon: Compass, color: 'from-blue-500 to-indigo-600' },
  { key: 'academics', label: 'Academics', icon: GraduationCap, color: 'from-emerald-500 to-teal-600' },
  { key: 'admissions', label: 'Admissions & Fees', icon: Coins, color: 'from-amber-500 to-orange-600' },
  { key: 'hostels', label: 'Hostels & Campus', icon: Building2, color: 'from-purple-500 to-pink-600' },
  { key: 'placements', label: 'Placements (T&P)', icon: Briefcase, color: 'from-blue-600 to-cyan-600' },
  { key: 'administration', label: 'Administration', icon: Megaphone, color: 'from-rose-500 to-red-600' },
];

const SUGGESTED_QUERIES = [
  "What is the highest package in placement and top recruiters?",
  "What B.Tech branches are offered and what is the affiliation?",
  "What are the hostel room options and annual fee?",
  "What is the admission eligibility for B.Tech CSE?",
  "Where are Gandhi Nagar and Ratibad campuses located?"
];

export default function App() {
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'documents' | 'architecture'
  const [selectedDomain, setSelectedDomain] = useState('all');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "👋 **Welcome to the SISTec Campus Multi-RAG Assistant!**\n\nI am connected to 5 specialized knowledge bases for **Sagar Institute of Science and Technology (SISTec), Bhopal**:\n- 🎓 **Academics & Examination** (Syllabus, B.Tech, M.Tech, MBA, RGPV affiliation)\n- 💰 **Admissions & Fees** (Cutoffs, scholarships, fee breakdown)\n- 🏢 **Hostels & Facilities** (Rooms, mess, 100+ bus routes across Bhopal)\n- 💼 **Training & Placements** (TCS, Cisco, Amazon, average & highest packages)\n- 📢 **Administration & Contacts** (Gandhi Nagar & Ratibad helplines)\n\n*Ask any question, or click one of the quick suggestions below!*",
      routing: { primary_domain: 'general', confidence: 1.0 },
      citations: []
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedCitations, setExpandedCitations] = useState({});

  // Documents state
  const [documents, setDocuments] = useState([]);
  const [uploadDomain, setUploadDomain] = useState('academics');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // System stats
  const [domainStats, setDomainStats] = useState([]);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchStatsAndDocs();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const fetchStatsAndDocs = async () => {
    try {
      const [domRes, docRes] = await Promise.all([
        fetch('/api/domains'),
        fetch('/api/documents')
      ]);
      if (domRes.ok) {
        const stats = await domRes.json();
        setDomainStats(stats);
      }
      if (docRes.ok) {
        const docs = await docRes.json();
        setDocuments(docs);
      }
    } catch (err) {
      console.error("Failed to fetch initial stats:", err);
    }
  };

  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || inputQuery).trim();
    if (!query || isLoading) return;

    setInputQuery('');
    const newHistory = [...messages, { role: 'user', content: query }];
    setMessages(newHistory);
    setIsLoading(true);

    try {
      const payload = {
        query,
        forced_domain: selectedDomain === 'all' ? null : selectedDomain,
        chat_history: newHistory.slice(-4)
      };

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(`Server returned error ${res.status}`);
      }

      const data = await res.json();
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: data.answer,
          routing: data.routing,
          citations: data.citations || []
        }
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ **Connection Error**: Unable to connect to backend server. Make sure the FastAPI server is running at port 8000.\n\n*Details: ${err.message}*`,
          routing: { primary_domain: 'error' },
          citations: []
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCitation = (msgIndex, citeId) => {
    const key = `${msgIndex}_${citeId}`;
    setExpandedCitations(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;

    setIsUploading(true);
    setUploadStatus(null);
    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('domain', uploadDomain);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setUploadStatus({ type: 'success', message: data.message });
        setUploadFile(null);
        fetchStatsAndDocs();
      } else {
        setUploadStatus({ type: 'error', message: data.detail || 'Upload failed' });
      }
    } catch (err) {
      setUploadStatus({ type: 'error', message: err.message });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDoc = async (domain, filename) => {
    if (!confirm(`Delete ${filename} from ${domain}?`)) return;
    try {
      const res = await fetch(`/api/documents/${domain}/${filename}`, { method: 'DELETE' });
      if (res.ok) {
        fetchStatsAndDocs();
      }
    } catch (err) {
      alert("Delete failed: " + err.message);
    }
  };

  const handleReindex = async () => {
    try {
      const res = await fetch('/api/reindex', { method: 'POST' });
      if (res.ok) {
        alert("Knowledge bases successfully re-indexed!");
        fetchStatsAndDocs();
      }
    } catch (err) {
      alert("Reindex failed: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-teal-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 font-bold text-white text-lg">
              S
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg text-white tracking-tight">SISTec AI Assistant</h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 font-medium">
                  LangGraph Multi-RAG
                </span>
              </div>
              <p className="text-xs text-slate-400">Sagar Institute of Science and Technology • Bhopal</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'chat'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Bot className="w-4 h-4" />
              <span>Campus Chat</span>
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'documents'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Document Manager</span>
            </button>
            <button
              onClick={() => setActiveTab('architecture')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'architecture'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>LangGraph Architecture</span>
            </button>
          </nav>

          {/* Live Badge */}
          <div className="hidden md:flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>LangGraph Agentic StateGraph Active</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col overflow-hidden">
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col bg-slate-900/60 rounded-2xl border border-slate-800/80 shadow-2xl overflow-hidden backdrop-blur-sm">
            {/* Domain Filter Pills Bar */}
            <div className="p-3 border-b border-slate-800/80 bg-slate-950/40 flex items-center gap-2 overflow-x-auto scrollbar-none">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider pl-2 pr-1 flex items-center gap-1">
                <Compass className="w-3.5 h-3.5" /> Router:
              </span>
              {DOMAIN_OPTIONS.map(opt => {
                const IconComponent = opt.icon;
                const isSelected = selectedDomain === opt.key;
                return (
                  <button
                    key={opt.key}
                    onClick={() => setSelectedDomain(opt.key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all border ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm font-semibold'
                        : 'bg-slate-800/60 text-slate-300 border-slate-700/60 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <IconComponent className="w-3.5 h-3.5" />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Chat Messages Feed */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {messages.map((msg, index) => {
                const isUser = msg.role === 'user';
                const routingDomain = msg.routing?.primary_domain;
                const routingOption = DOMAIN_OPTIONS.find(d => d.key === routingDomain);

                return (
                  <div
                    key={index}
                    className={`flex gap-3.5 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center shadow-md ${
                        isUser
                          ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white'
                          : 'bg-gradient-to-tr from-slate-800 to-slate-700 text-indigo-400 border border-slate-700'
                      }`}
                    >
                      {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>

                    {/* Content Box */}
                    <div
                      className={`rounded-2xl px-5 py-4 text-sm leading-relaxed ${
                        isUser
                          ? 'bg-indigo-600 text-white rounded-tr-none shadow-lg shadow-indigo-600/10'
                          : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none shadow-md'
                      }`}
                    >
                      {/* Domain routing pill for bot */}
                      {!isUser && routingDomain && routingDomain !== 'general' && (
                        <div className="mb-3 flex items-center flex-wrap gap-2 text-xs">
                          <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-medium flex items-center gap-1">
                            <Layers className="w-3 h-3 text-indigo-400" />
                            <span>Routed Domain: {routingOption ? routingOption.label : routingDomain}</span>
                          </span>
                          {msg.routing?.target_domains && msg.routing.target_domains.length > 1 && (
                            <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20 font-mono text-[11px]">
                              Multi-Search: {msg.routing.target_domains.join(' + ')}
                            </span>
                          )}
                          {msg.routing?.confidence && (
                            <span className="text-slate-500 text-[11px]">
                              {(msg.routing.confidence * 100).toFixed(0)}% match
                            </span>
                          )}
                        </div>
                      )}

                      {/* Markdown rendered text */}
                      <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-headings:text-slate-100 prose-strong:text-white prose-ul:my-2 prose-li:my-0.5">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>

                      {/* Source Citations Accordion */}
                      {!isUser && msg.citations && msg.citations.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-slate-800/80">
                          <div className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                            <span>Verified Sources ({msg.citations.length}):</span>
                          </div>
                          <div className="space-y-1.5">
                            {msg.citations.map((cite) => {
                              const citeKey = `${index}_${cite.id}`;
                              const isExpanded = !!expandedCitations[citeKey];
                              return (
                                <div
                                  key={cite.id}
                                  className="rounded-lg bg-slate-950/50 border border-slate-800/80 text-xs overflow-hidden"
                                >
                                  <button
                                    onClick={() => toggleCitation(index, cite.id)}
                                    className="w-full px-3 py-2 text-left flex items-center justify-between text-slate-300 hover:text-white hover:bg-slate-800/40 transition-colors"
                                  >
                                    <span className="font-mono text-indigo-400 font-medium">
                                      [{cite.id}] {cite.source_file} &rsaquo; {cite.heading}
                                    </span>
                                    {isExpanded ? (
                                      <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                                    ) : (
                                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                                    )}
                                  </button>
                                  {isExpanded && (
                                    <div className="px-3 pb-2.5 pt-1 text-slate-400 bg-slate-950/70 border-t border-slate-800/60 font-mono text-[11px] leading-relaxed">
                                      {cite.snippet}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {isLoading && (
                <div className="flex gap-3 max-w-xl mr-auto items-center">
                  <div className="w-8 h-8 rounded-xl bg-slate-800 text-indigo-400 flex items-center justify-center border border-slate-700 animate-pulse">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-slate-900 border border-slate-800 text-slate-400 rounded-2xl rounded-tl-none px-4 py-3 text-xs flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                    <span>Routing query across SISTec domain vector stores...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestion Pills */}
            <div className="px-4 py-2 bg-slate-950/40 border-t border-slate-800/50 flex items-center gap-2 overflow-x-auto scrollbar-none">
              <span className="text-[11px] text-slate-500 font-medium whitespace-nowrap flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" /> Suggestions:
              </span>
              {SUGGESTED_QUERIES.map((q, i) => (
                <button
                  key={i}
                  disabled={isLoading}
                  onClick={() => handleSendMessage(q)}
                  className="text-xs px-2.5 py-1 rounded-md bg-slate-800/70 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 whitespace-nowrap transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <div className="p-3 sm:p-4 bg-slate-950/80 border-t border-slate-800">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  placeholder={
                    selectedDomain === 'all'
                      ? "Ask anything about SISTec (Academics, Fees, Hostels, Placements, Contacts)..."
                      : `Ask specifically about ${DOMAIN_OPTIONS.find(d => d.key === selectedDomain)?.label}...`
                  }
                  disabled={isLoading}
                  className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
                <button
                  type="submit"
                  disabled={!inputQuery.trim() || isLoading}
                  className="px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-medium text-sm flex items-center gap-2 hover:from-indigo-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-600/20"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Send</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Tab 2: Document Manager */}
        {activeTab === 'documents' && (
          <div className="flex-1 space-y-6 overflow-y-auto">
            {/* Upload Box */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                <Upload className="w-5 h-5 text-indigo-400" />
                <span>Upload College Document to Domain Knowledge Base</span>
              </h2>
              <p className="text-xs text-slate-400 mb-6">
                Upload official circulars, syllabus PDFs, hostel manuals, or placement brochures. The system will automatically chunk, tag with metadata, and generate embeddings for instant retrieval.
              </p>

              <form onSubmit={handleUploadSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">
                      Target Domain Knowledge Base
                    </label>
                    <select
                      value={uploadDomain}
                      onChange={(e) => setUploadDomain(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                    >
                      {DOMAIN_OPTIONS.filter(d => d.key !== 'all').map(opt => (
                        <option key={opt.key} value={opt.key}>
                          {opt.label} ({opt.key})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">
                      Select File (.pdf, .txt, .md)
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.txt,.md"
                      onChange={(e) => setUploadFile(e.target.files[0] || null)}
                      className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer bg-slate-950 border border-slate-800 rounded-xl p-1"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    {uploadStatus && (
                      <div className={`text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 ${
                        uploadStatus.type === 'success'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {uploadStatus.type === 'success' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                        <span>{uploadStatus.message}</span>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={!uploadFile || isUploading}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-2 disabled:opacity-50 transition-all shadow-md shadow-indigo-600/20"
                  >
                    {isUploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    <span>{isUploading ? 'Indexing Document...' : 'Index Document'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Document Index Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-white text-base">Active Knowledge Base Documents</h3>
                  <p className="text-xs text-slate-400">Total {documents.length} files indexed across 5 domain vector stores.</p>
                </div>
                <button
                  onClick={handleReindex}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 border border-slate-700 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Re-Index All</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/40">
                      <th className="py-3 px-4 font-semibold">Document Name</th>
                      <th className="py-3 px-4 font-semibold">Domain</th>
                      <th className="py-3 px-4 font-semibold">Size</th>
                      <th className="py-3 px-4 font-semibold">Chunks in Chroma</th>
                      <th className="py-3 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {documents.map((doc, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4 font-medium text-slate-200 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-indigo-400" />
                          <span>{doc.file_name}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-medium">
                            {doc.domain_name}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400 font-mono">
                          {(doc.size_bytes / 1024).toFixed(1)} KB
                        </td>
                        <td className="py-3 px-4 text-emerald-400 font-mono">
                          {doc.total_domain_chunks} chunks
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleDeleteDoc(doc.domain, doc.file_name)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Delete file and unindex"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Architecture Explorer */}
        {activeTab === 'architecture' && (
          <div className="flex-1 space-y-6 overflow-y-auto">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <Layers className="w-6 h-6 text-indigo-400" />
                <span>LangGraph Agentic StateGraph Architecture</span>
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed mb-6">
                This backend runs on a stateful <strong>LangGraph StateGraph</strong> workflow. Rather than a linear script, the execution flow is coordinated across specialized agentic nodes with conditional branching:
              </p>

              {/* Architecture Flow Diagram */}
              <div className="bg-slate-950 rounded-xl p-6 border border-slate-800/80 font-mono text-xs text-slate-300 space-y-4">
                <div className="p-3 rounded-lg bg-indigo-950/40 border border-indigo-800/60 text-center text-indigo-200 font-bold">
                  START &rarr; Node 1: route_node (Classifies Domain Intent)
                </div>
                <div className="text-center text-slate-500">&darr; Conditional Branch (route_decision)</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-indigo-500/40 text-center">
                    <span className="text-indigo-400 font-bold block">Greeting Branch</span>
                    <span className="text-[11px] text-slate-400">&rarr; greeting_node &rarr; END</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-teal-500/40 text-center">
                    <span className="text-teal-400 font-bold block">College Domain Query</span>
                    <span className="text-[11px] text-slate-400">&rarr; retrieve_node (ChromaDB)</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-rose-500/40 text-center">
                    <span className="text-rose-400 font-bold block">Out-of-Scope Branch</span>
                    <span className="text-[11px] text-slate-400">&rarr; fallback_node &rarr; END</span>
                  </div>
                </div>
                <div className="text-center text-slate-500">&darr; Next State Transition</div>
                <div className="p-3 rounded-lg bg-blue-950/40 border border-blue-800/60 text-center text-blue-200 font-bold">
                  Node 2: retrieve_node (Multi-Domain Vector Extraction from 5 ChromaDB Collections)
                </div>
                <div className="text-center text-slate-500">&darr;</div>
                <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-800/60 text-center text-amber-200 font-bold">
                  Node 3: grade_documents_node (Agentic Document Relevance Validation)
                </div>
                <div className="text-center text-slate-500">&darr; Conditional Branch (grade_decision)</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-emerald-500/40 text-center">
                    <span className="text-emerald-400 font-bold block">Valid Documents</span>
                    <span className="text-[11px] text-slate-400">&rarr; generate_node (Gemini LLM) &rarr; END</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-rose-500/40 text-center">
                    <span className="text-rose-400 font-bold block">No Records Found</span>
                    <span className="text-[11px] text-slate-400">&rarr; fallback_node &rarr; END</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Technical Highlights Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <h4 className="font-bold text-white text-sm mb-2 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Zero Hallucination Guardrails</span>
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Strict prompt engineering ensures that if a question falls outside indexed college documents, the assistant admits lack of records and directs users to official helpline numbers.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <h4 className="font-bold text-white text-sm mb-2 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <span>Multi-Domain Intent Decomposition</span>
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  When a question touches multiple domains (e.g. "What is the hostel fee and average placement?"), the router queries both domain stores simultaneously and aggregates the findings.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <h4 className="font-bold text-white text-sm mb-2 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-cyan-400" />
                  <span>Dynamic Live Ingestion</span>
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  College administrators can upload new PDFs or circulars anytime through the Document Manager, instantly updating vector indexes without restarting the server.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
