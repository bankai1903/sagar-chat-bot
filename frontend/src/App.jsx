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
  ShieldCheck,
  Compass,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Sun,
  Moon,
  MessageSquare,
  BookOpen,
  MapPin,
  Award,
  ArrowRight
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const DOMAIN_OPTIONS = [
  { key: 'all', label: 'All Topics', icon: Compass },
  { key: 'academics', label: 'Academics & Labs', icon: GraduationCap },
  { key: 'admissions', label: 'Admissions & Fees', icon: Coins },
  { key: 'hostels', label: 'Hostels & Transport', icon: Building2 },
  { key: 'placements', label: 'Placements (T&P)', icon: Briefcase },
  { key: 'administration', label: 'Contacts & Helplines', icon: Megaphone },
];

const SUGGESTIONS = [
  {
    title: "Placements & 21 LPA Offers",
    desc: "TCS, Cisco, Cognizant recruitment records & student salary packages.",
    query: "What is the highest package in SISTec placements and which top recruiters hire students?",
    icon: Award,
    badge: "Placements"
  },
  {
    title: "B.Tech Admissions & Fees",
    desc: "CSE eligibility, MP DTE counseling, Bihar Student Credit Card (BSCC) & MMVY.",
    query: "What is the admission procedure for B.Tech CSE and available fee waiver scholarships?",
    icon: Coins,
    badge: "Admissions 2026"
  },
  {
    title: "Hostel Life & 100+ Bus Routes",
    desc: "AC/Non-AC rooms, daily mess food, gym, sports grounds, and bus routes across Bhopal.",
    query: "Tell me about hostel room options, mess food menu and college bus connectivity.",
    icon: Building2,
    badge: "Campus Life"
  },
  {
    title: "Campuses & Sagar Fiesta Fest",
    desc: "Gandhi Nagar vs Ratibad campuses, celebrity nights, aftermovies and contacts.",
    query: "Where are Gandhi Nagar and Ratibad campuses located, and how can I watch Sagar Fiesta videos?",
    icon: MapPin,
    badge: "Events & Campuses"
  }
];

const QUICK_CHIPS = [
  "💼 Placements 2026",
  "🎓 B.Tech CSE Cutoffs",
  "🏡 Hostels & Mess Food",
  "💰 Bihar Credit Card (BSCC)",
  "✈️ Reach Gandhi Nagar",
  "🎉 Sagar Fiesta Fest"
];

export default function App() {
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'documents' | 'architecture'
  const [selectedDomain, setSelectedDomain] = useState('all');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [likedMessages, setLikedMessages] = useState({});

  const [messages, setMessages] = useState([]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedCitations, setExpandedCitations] = useState({});

  // Documents state
  const [documents, setDocuments] = useState([]);
  const [uploadDomain, setUploadDomain] = useState('academics');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchStatsAndDocs();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const fetchStatsAndDocs = async () => {
    try {
      const res = await fetch('/api/documents');
      if (res.ok) {
        setDocuments(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch documents:", err);
    }
  };

  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || inputQuery).trim();
    if (!query || isLoading) return;

    setInputQuery('');
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newHistory = [...messages, { role: 'user', content: query, timestamp: timeStr }];
    setMessages(newHistory);
    setIsLoading(true);

    try {
      const payload = {
        query,
        forced_domain: selectedDomain === 'all' ? null : selectedDomain,
        chat_history: newHistory.slice(-4).map(m => ({ role: m.role, content: m.content }))
      };

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const data = await res.json();
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: data.answer,
          routing: data.routing,
          citations: data.citations || [],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ **Connection Error**: Unable to reach backend server.\n\n*Technical Details: ${err.message}*`,
          routing: { primary_domain: 'error' },
          citations: [],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleFeedback = (index, type) => {
    setLikedMessages(prev => ({
      ...prev,
      [index]: prev[index] === type ? null : type
    }));
  };

  const handleResetChat = () => {
    setMessages([]);
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
    <div className={`h-screen max-h-screen overflow-hidden flex flex-col font-sans transition-colors duration-200 ${
      isDarkMode 
        ? 'bg-[#141216] text-[#f5f5f5]' 
        : 'bg-[#faf9f8] text-[#1c1917]'
    }`}>
      
      {/* 1. Header Bar - Clean, Crisp, High Contrast */}
      <header className={`flex-shrink-0 h-16 border-b px-4 sm:px-8 flex items-center justify-between z-20 transition-colors ${
        isDarkMode 
          ? 'bg-[#1c1920] border-stone-800' 
          : 'bg-white border-amber-200/60 shadow-xs'
      }`}>
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 via-rose-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-rose-500/20">
            <span className="text-xl">🎓</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                SISTec Campus Assistant
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                AI Guide
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Sagar Institute of Science & Technology • Bhopal
            </p>
          </div>
        </div>

        {/* Center: Navigation Tabs */}
        <nav className={`hidden md:flex items-center gap-1 p-1 rounded-xl border ${
          isDarkMode ? 'bg-stone-900 border-stone-800' : 'bg-stone-100/80 border-stone-200/70'
        }`}>
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'chat'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chat</span>
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'documents'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Knowledge Base ({documents.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('architecture')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'architecture'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Architecture</span>
          </button>
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button
              onClick={handleResetChat}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                isDarkMode 
                  ? 'border-stone-800 bg-stone-900 text-stone-300 hover:bg-stone-800' 
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-2xs'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
              <span>New Chat</span>
            </button>
          )}

          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2 rounded-xl border transition-all ${
              isDarkMode 
                ? 'border-stone-800 bg-stone-900 text-amber-300 hover:bg-stone-800' 
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-2xs'
            }`}
            title={isDarkMode ? "Light mode" : "Dark mode"}
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* 2. Main Content Area - Fullscreen Viewport */}
      <main className="flex-1 min-h-0 max-w-4xl w-full mx-auto flex flex-col px-3 sm:px-4 py-3 overflow-hidden">
        
        {/* Chat Mode */}
        {activeTab === 'chat' && (
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            
            {/* Messages Scroll Area */}
            <div className="flex-1 min-h-0 overflow-y-auto px-1 sm:px-3 space-y-4">
              
              {/* Zero State / Welcoming Hero (Shown when no messages yet) */}
              {messages.length === 0 && (
                <div className="h-full flex flex-col justify-center items-center py-6 text-center max-w-2xl mx-auto space-y-6">
                  
                  {/* Hero Intro */}
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 border border-amber-200/80 text-amber-800 dark:text-amber-200 text-xs font-bold mb-1 shadow-2xs">
                      <Sparkles className="w-3 h-3 text-amber-600" />
                      <span>Official SISTec Intelligence Portal</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                      What would you like to explore today?
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-lg mx-auto leading-relaxed">
                      Instant verified answers on SISTec admissions, highest placement packages, campus hostels, bus routes, and fests.
                    </p>
                  </div>

                  {/* 4 Clean Topic Cards with High Contrast Black Text */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left">
                    {SUGGESTIONS.map((item, idx) => {
                      const Icon = item.icon;
                      return (
                        <div
                          key={idx}
                          onClick={() => handleSendMessage(item.query)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer card-3d-hover ${
                            isDarkMode
                              ? 'bg-[#1c1920] border-stone-800 hover:border-rose-500/60'
                              : 'bg-white border-slate-200/90 hover:border-rose-300 hover:shadow-md'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300 flex items-center justify-center">
                              <Icon className="w-4 h-4" />
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300">
                              {item.badge}
                            </span>
                          </div>
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1">
                            {item.title}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                            {item.desc}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Message List */}
              {messages.map((msg, index) => {
                const isUser = msg.role === 'user';
                const routingDomain = msg.routing?.primary_domain;
                const routingOption = DOMAIN_OPTIONS.find(d => d.key === routingDomain);

                return (
                  <div
                    key={index}
                    className={`flex gap-3 max-w-3xl animate-slide-up ${
                      isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
                    }`}
                  >
                    {/* Avatar */}
                    <div className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center shadow-xs ${
                      isUser
                        ? 'bg-rose-600 text-white'
                        : 'bg-gradient-to-tr from-rose-500 to-amber-500 text-white'
                    }`}>
                      {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>

                    {/* Bubble */}
                    <div className="flex flex-col space-y-1 max-w-[88%] sm:max-w-[82%]">
                      <div className={`rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed ${
                        isUser
                          ? 'bg-rose-600 text-white rounded-tr-none shadow-md shadow-rose-600/15'
                          : isDarkMode
                            ? 'bg-[#1c1920] border border-stone-800 text-stone-200 rounded-tl-none shadow-xs'
                            : 'bg-white border border-slate-200/90 text-slate-800 rounded-tl-none shadow-xs'
                      }`}>
                        
                        {/* Domain Category Badge */}
                        {!isUser && routingDomain && routingDomain !== 'general' && (
                          <div className="mb-2 pb-1.5 border-b border-slate-100 dark:border-stone-800 flex items-center flex-wrap gap-2 text-xs">
                            <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center gap-1">
                              <Layers className="w-3 h-3 text-rose-500" />
                              <span>{routingOption ? routingOption.label : routingDomain}</span>
                            </span>
                            {msg.routing?.target_domains && msg.routing.target_domains.length > 1 && (
                              <span className="px-1.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 text-[10px] font-mono">
                                Multi-Store: {msg.routing.target_domains.join(' + ')}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Markdown Text */}
                        <div className={`prose prose-sm max-w-none leading-relaxed ${
                          isUser
                            ? 'prose-invert text-white prose-p:text-white prose-strong:text-white prose-headings:text-white'
                            : isDarkMode
                              ? 'prose-invert text-stone-200 prose-headings:text-amber-200 prose-strong:text-white prose-a:text-rose-400'
                              : 'prose-slate text-slate-800 prose-headings:text-slate-900 prose-strong:text-slate-900 prose-a:text-rose-600 prose-a:font-bold'
                        }`}>
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>

                        {/* Citations Accordion */}
                        {!isUser && msg.citations && msg.citations.length > 0 && (
                          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-stone-800">
                            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                              <ShieldCheck className="w-3 h-3 text-amber-500" />
                              <span>Verified Citations ({msg.citations.length}):</span>
                            </div>
                            <div className="space-y-1">
                              {msg.citations.map((cite) => {
                                const citeKey = `${index}_${cite.id}`;
                                const isExpanded = !!expandedCitations[citeKey];
                                return (
                                  <div
                                    key={cite.id}
                                    className={`rounded-lg border text-[11px] overflow-hidden ${
                                      isDarkMode ? 'bg-[#141216] border-stone-800' : 'bg-slate-50 border-slate-200'
                                    }`}
                                  >
                                    <button
                                      onClick={() => toggleCitation(index, cite.id)}
                                      className="w-full px-2.5 py-1.5 text-left flex items-center justify-between text-slate-700 dark:text-slate-300 hover:text-rose-600"
                                    >
                                      <span className="font-mono text-[10px] font-semibold truncate pr-2">
                                        [{cite.id}] {cite.source_file} &rsaquo; {cite.heading}
                                      </span>
                                      {isExpanded ? (
                                        <ChevronUp className="w-3 h-3 text-slate-400" />
                                      ) : (
                                        <ChevronDown className="w-3 h-3 text-slate-400" />
                                      )}
                                    </button>
                                    {isExpanded && (
                                      <div className={`px-3 py-2 text-[10px] font-mono leading-relaxed border-t ${
                                        isDarkMode ? 'bg-[#141216] border-stone-800 text-stone-400' : 'bg-white border-slate-200 text-slate-600'
                                      }`}>
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

                      {/* Micro Actions */}
                      <div className={`flex items-center gap-2 px-1 text-[10px] text-slate-400 ${
                        isUser ? 'justify-end' : 'justify-start'
                      }`}>
                        <span>{msg.timestamp}</span>
                        {!isUser && (
                          <>
                            <span>•</span>
                            <button
                              onClick={() => handleCopy(msg.content, index)}
                              className="hover:text-rose-600 flex items-center gap-1 transition-colors"
                            >
                              {copiedIndex === index ? (
                                <>
                                  <Check className="w-3 h-3 text-rose-500" />
                                  <span className="text-rose-500 font-semibold">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                            <span>•</span>
                            <button
                              onClick={() => handleFeedback(index, 'like')}
                              className={`p-0.5 rounded transition-colors ${
                                likedMessages[index] === 'like' ? 'text-rose-600 font-bold' : 'hover:text-rose-600'
                              }`}
                            >
                              <ThumbsUp className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleFeedback(index, 'dislike')}
                              className={`p-0.5 rounded transition-colors ${
                                likedMessages[index] === 'dislike' ? 'text-amber-600 font-bold' : 'hover:text-slate-600'
                              }`}
                            >
                              <ThumbsDown className="w-3 h-3" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Typing wave */}
              {isLoading && (
                <div className="flex gap-2.5 max-w-xl mr-auto items-center animate-slide-up">
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 text-white flex items-center justify-center">
                    <Bot className="w-3.5 h-3.5 animate-bounce" />
                  </div>
                  <div className={`rounded-xl rounded-tl-none px-3.5 py-2 text-xs flex items-center gap-2.5 border ${
                    isDarkMode ? 'bg-[#1c1920] border-stone-800 text-stone-300' : 'bg-white border-slate-200 text-slate-600 shadow-xs'
                  }`}>
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 typing-dot-1"></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 typing-dot-2"></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 typing-dot-3"></span>
                    </div>
                    <span className="text-slate-500 dark:text-slate-400 text-[11px] font-medium">
                      Consulting verified SISTec records...
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Chips Row (Above Input) */}
            <div className="flex-shrink-0 pt-2 pb-1 flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 pl-1">
                Suggested:
              </span>
              {QUICK_CHIPS.map((chip, i) => (
                <button
                  key={i}
                  disabled={isLoading}
                  onClick={() => handleSendMessage(chip.replace(/^[^\s]+\s/, ''))}
                  className={`text-xs px-2.5 py-1 rounded-xl transition-all border ${
                    isDarkMode
                      ? 'bg-[#1c1920] text-stone-300 border-stone-800 hover:border-rose-500/50'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-rose-300 hover:text-rose-600 hover:bg-rose-50/50 shadow-2xs'
                  }`}
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Input Bar - Pinned at bottom */}
            <div className="flex-shrink-0 pt-1 pb-2">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className={`flex items-center gap-2 p-1.5 rounded-2xl border shadow-sm transition-all ${
                  isDarkMode ? 'bg-[#1c1920] border-stone-800' : 'bg-white border-slate-200/90 shadow-slate-100'
                }`}
              >
                <input
                  type="text"
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  placeholder="Ask anything about SISTec (Placements, B.Tech, Fees, Hostels, Contacts)..."
                  disabled={isLoading}
                  className={`w-full px-4 py-2.5 text-xs sm:text-sm bg-transparent focus:outline-none ${
                    isDarkMode ? 'text-white placeholder-stone-500' : 'text-slate-900 placeholder-slate-400'
                  }`}
                />
                <button
                  type="submit"
                  disabled={!inputQuery.trim() || isLoading}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-40"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Knowledge Base Tab */}
        {activeTab === 'documents' && (
          <div className="flex-1 min-h-0 space-y-4 overflow-y-auto pr-1">
            <div className={`border rounded-2xl p-5 shadow-xs ${
              isDarkMode ? 'bg-[#1c1920] border-stone-800' : 'bg-white border-slate-200'
            }`}>
              <h2 className="text-base font-bold mb-1 flex items-center gap-2 text-slate-900 dark:text-white">
                <Upload className="w-4 h-4 text-rose-600" />
                <span>Upload Document to Knowledge Base</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Upload official circulars, syllabus PDFs, or brochures to instantly generate vector embeddings.
              </p>

              <form onSubmit={handleUploadSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                      Target Domain
                    </label>
                    <select
                      value={uploadDomain}
                      onChange={(e) => setUploadDomain(e.target.value)}
                      className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-rose-500 ${
                        isDarkMode ? 'bg-[#141216] border-stone-800 text-stone-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      {DOMAIN_OPTIONS.filter(d => d.key !== 'all').map(opt => (
                        <option key={opt.key} value={opt.key}>
                          {opt.label} ({opt.key})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                      Select File (.pdf, .txt, .md)
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.txt,.md"
                      onChange={(e) => setUploadFile(e.target.files[0] || null)}
                      className={`w-full text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-rose-600 file:text-white hover:file:bg-rose-500 cursor-pointer border rounded-xl p-1 ${
                        isDarkMode ? 'text-stone-400 bg-[#141216] border-stone-800' : 'text-slate-600 bg-slate-50 border-slate-200'
                      }`}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div>
                    {uploadStatus && (
                      <div className={`text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium ${
                        uploadStatus.type === 'success'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {uploadStatus.type === 'success' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                        <span>{uploadStatus.message}</span>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={!uploadFile || isUploading}
                    className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50"
                  >
                    {isUploading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    <span>{isUploading ? 'Indexing...' : 'Index Document'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Document Table */}
            <div className={`border rounded-2xl p-5 shadow-xs ${
              isDarkMode ? 'bg-[#1c1920] border-stone-800' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">Indexed Knowledge Base Documents</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{documents.length} files across 5 domain vector stores.</p>
                </div>
                <button
                  onClick={handleReindex}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                    isDarkMode
                      ? 'bg-stone-800 hover:bg-stone-700 text-stone-200 border-stone-700'
                      : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200'
                  }`}
                >
                  <RefreshCw className="w-3 h-3 text-amber-600" />
                  <span>Re-Index All</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className={`border-b text-slate-400 font-bold uppercase tracking-wider text-[10px] ${
                      isDarkMode ? 'border-stone-800 bg-[#141216]' : 'border-slate-100 bg-slate-50'
                    }`}>
                      <th className="py-2.5 px-3">Document Name</th>
                      <th className="py-2.5 px-3">Domain</th>
                      <th className="py-2.5 px-3">Size</th>
                      <th className="py-2.5 px-3">Chunks</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDarkMode ? 'divide-stone-800/60' : 'divide-slate-100'}`}>
                    {documents.map((doc, idx) => (
                      <tr key={idx} className={`transition-colors ${isDarkMode ? 'hover:bg-stone-800/40' : 'hover:bg-slate-50'}`}>
                        <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                          <span className="truncate max-w-xs">{doc.file_name}</span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-semibold text-[10px]">
                            {doc.domain_name}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                          {(doc.size_bytes / 1024).toFixed(1)} KB
                        </td>
                        <td className="py-2.5 px-3 text-amber-700 dark:text-amber-400 font-mono font-bold text-[11px]">
                          {doc.total_domain_chunks}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => handleDeleteDoc(doc.domain, doc.file_name)}
                            className="p-1 rounded text-slate-400 hover:text-rose-500 transition-colors"
                            title="Delete file"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

        {/* Architecture Flow Tab */}
        {activeTab === 'architecture' && (
          <div className="flex-1 min-h-0 space-y-4 overflow-y-auto pr-1">
            <div className={`border rounded-2xl p-5 shadow-xs ${
              isDarkMode ? 'bg-[#1c1920] border-stone-800' : 'bg-white border-slate-200'
            }`}>
              <h2 className="text-base font-bold mb-1 flex items-center gap-2 text-slate-900 dark:text-white">
                <Layers className="w-4 h-4 text-amber-600" />
                <span>LangGraph Agentic StateGraph Architecture</span>
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                Execution is orchestrated across stateful agentic nodes with domain-level routing and zero-hallucination guardrails:
              </p>

              <div className={`rounded-xl p-4 border font-mono text-[11px] space-y-3 ${
                isDarkMode ? 'bg-[#141216] border-stone-800 text-stone-300' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-center text-rose-700 dark:text-rose-300 font-bold">
                  START &rarr; Node 1: route_node (Classifies Domain Intent)
                </div>
                <div className="text-center text-slate-400">&darr; Conditional Branch (route_decision)</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-center">
                    <span className="text-amber-700 dark:text-amber-400 font-bold block">Greeting Branch</span>
                    <span className="text-[10px] text-slate-500">&rarr; greeting_node &rarr; END</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-center">
                    <span className="text-rose-700 dark:text-rose-400 font-bold block">College Domain Query</span>
                    <span className="text-[10px] text-slate-500">&rarr; retrieve_node (ChromaDB)</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-500/10 border border-slate-500/30 text-center">
                    <span className="text-slate-600 dark:text-slate-400 font-bold block">Out-of-Scope Branch</span>
                    <span className="text-[10px] text-slate-500">&rarr; fallback_node &rarr; END</span>
                  </div>
                </div>
                <div className="text-center text-slate-400">&darr; Next State Transition</div>
                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-center text-amber-700 dark:text-amber-300 font-bold">
                  Node 2: retrieve_node (5 ChromaDB Vector Stores)
                </div>
                <div className="text-center text-slate-400">&darr;</div>
                <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-center text-rose-700 dark:text-rose-300 font-bold">
                  Node 3: grade_documents_node (Agentic Relevance Check)
                </div>
                <div className="text-center text-slate-400">&darr; Conditional Branch (grade_decision)</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-center">
                    <span className="text-rose-700 dark:text-rose-400 font-bold block">Valid Documents</span>
                    <span className="text-[10px] text-slate-500">&rarr; generate_node (Gemini LLM) &rarr; END</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-500/10 border border-slate-500/30 text-center">
                    <span className="text-slate-600 dark:text-slate-400 font-bold block">No Records Found</span>
                    <span className="text-[10px] text-slate-500">&rarr; fallback_node &rarr; END</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
