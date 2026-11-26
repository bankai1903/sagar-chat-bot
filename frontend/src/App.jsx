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
  ExternalLink,
  MessageSquare,
  BookOpen,
  MapPin,
  HeartHandshake
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const DOMAIN_OPTIONS = [
  { key: 'all', label: 'Auto Smart Router', icon: Compass, color: 'from-amber-500 to-orange-500', badge: 'bg-amber-100 text-amber-800 border-amber-200' },
  { key: 'academics', label: 'Academics & Labs', icon: GraduationCap, color: 'from-blue-500 to-cyan-500', badge: 'bg-blue-100 text-blue-800 border-blue-200' },
  { key: 'admissions', label: 'Admissions & Fees', icon: Coins, color: 'from-emerald-500 to-teal-500', badge: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { key: 'hostels', label: 'Hostels & Facilities', icon: Building2, color: 'from-purple-500 to-pink-500', badge: 'bg-purple-100 text-purple-800 border-purple-200' },
  { key: 'placements', label: 'Placements (T&P)', icon: Briefcase, color: 'from-indigo-500 to-violet-500', badge: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  { key: 'administration', label: 'Contacts & Leadership', icon: Megaphone, color: 'from-rose-500 to-orange-500', badge: 'bg-rose-100 text-rose-800 border-rose-200' },
];

const FEATURED_CARDS = [
  {
    title: "Placements & Top Packages",
    desc: "21 LPA highest package, TCS, Cisco, Cognizant recruitment records & placement bytes.",
    query: "What is the highest package in SISTec placements and which top recruiters hire students?",
    icon: Briefcase,
    gradient: "from-blue-600/10 via-indigo-600/5 to-transparent",
    accent: "text-indigo-600 bg-indigo-50 border-indigo-200"
  },
  {
    title: "Admissions 2026 & Fee Schemes",
    desc: "B.Tech CSE eligibility, tuition fees, Bihar Student Credit Card (BSCC) & scholarships.",
    query: "What is the admission procedure, eligibility for B.Tech CSE and fee waiver schemes at SISTec?",
    icon: Coins,
    gradient: "from-emerald-600/10 via-teal-600/5 to-transparent",
    accent: "text-emerald-600 bg-emerald-50 border-emerald-200"
  },
  {
    title: "Hostel Life & 100+ Bus Routes",
    desc: "AC/Non-AC rooms, mess menu, gym, sports grounds, and bus routes across Bhopal.",
    query: "Tell me about hostel room options, mess food and college bus connectivity routes.",
    icon: Building2,
    gradient: "from-purple-600/10 via-pink-600/5 to-transparent",
    accent: "text-purple-600 bg-purple-50 border-purple-200"
  },
  {
    title: "Campuses, Fests & Videos",
    desc: "Gandhi Nagar vs Ratibad campuses, Sagar Fiesta aftermovie, and virtual tours.",
    query: "Where are Gandhi Nagar and Ratibad campuses located, and how can I watch Sagar Fiesta videos?",
    icon: MapPin,
    gradient: "from-amber-600/10 via-orange-600/5 to-transparent",
    accent: "text-amber-600 bg-amber-50 border-amber-200"
  }
];

const QUICK_PROMPTS = [
  "💼 Placements 2026 highlights",
  "🎓 B.Tech CSE branch cutoff",
  "🏡 Hostels & mess menu details",
  "💰 Bihar Credit Card (BSCC) process",
  "✈️ How to reach Gandhi Nagar campus",
  "🎉 Sagar Fiesta fest aftermovie",
  "📞 Official admission helpline numbers"
];

export default function App() {
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'documents' | 'architecture'
  const [selectedDomain, setSelectedDomain] = useState('all');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [likedMessages, setLikedMessages] = useState({});

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "### Namaste & Welcome! 🎓\n\nI am **Sagar Mitra**, your interactive campus companion for **Sagar Institute of Science and Technology (SISTec), Bhopal**.\n\nI'm directly connected to verified knowledge bases across all departments:\n- 🎓 **Academics & Labs**: Courses, B.Tech/M.Tech/MBA/Pharmacy syllabus, RGPV syllabus\n- 💰 **Admissions & Scholarships**: Fees, seat matrix, Bihar Credit Card, DTE counseling\n- 🏢 **Hostels & Transport**: AC/Non-AC rooms, daily mess food, 100+ bus routes\n- 💼 **Training & Placements**: Top offers (21 LPA), TCS, Cisco, Capgemini, recruiters speak\n- 📢 **Contacts & Events**: Campus locations, Sagar Fiesta aftermovies, emergency helplines\n\n*What would you like to know today? You can type your question or tap any topic below!*",
      routing: { primary_domain: 'general', confidence: 1.0 },
      citations: [],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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
        throw new Error(`Server returned error ${res.status}`);
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
          content: `⚠️ **Connection Note**: I couldn't connect to the backend server. Please verify that the FastAPI backend is running.\n\n*Technical Details: ${err.message}*`,
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
    if (messages.length <= 1 || confirm("Start a fresh conversation?")) {
      setMessages([
        {
          role: 'assistant',
          content: "### Fresh Conversation Started! ✨\n\nHow can I help you today? Ask about SISTec admissions, engineering courses, scholarships, campus facilities, placement packages, or student activities!",
          routing: { primary_domain: 'general', confidence: 1.0 },
          citations: [],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
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
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-slate-950 text-slate-100' 
        : 'bg-[#fafafc] text-slate-800'
    }`}>
      {/* Top Floating Glow Ambient Effects */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse"></div>
      <div className="fixed top-20 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -z-10"></div>
      <div className="fixed bottom-10 left-1/3 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -z-10"></div>

      {/* Modern Header */}
      <header className={`sticky top-0 z-40 transition-all border-b ${
        isDarkMode
          ? 'bg-slate-900/80 border-slate-800 backdrop-blur-xl'
          : 'bg-white/85 border-slate-200/80 backdrop-blur-xl shadow-xs'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          
          {/* Logo & Assistant Identity */}
          <div className="flex items-center gap-3.5">
            <div className="relative group">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-indigo-600 p-0.5 shadow-md shadow-orange-500/20 animate-float">
                <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[14px] flex items-center justify-center">
                  <span className="text-2xl select-none">🎓</span>
                </div>
              </div>
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full animate-ping"></span>
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-800 dark:from-white dark:via-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                  Sagar Mitra
                </h1>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500/15 to-orange-500/15 text-amber-700 dark:text-amber-300 border border-amber-300/40 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  SISTec Campus AI
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Sagar Institute of Science & Technology • Bhopal
              </p>
            </div>
          </div>

          {/* Navigation Pill Tabs */}
          <nav className={`hidden md:flex items-center gap-1 p-1 rounded-2xl border ${
            isDarkMode 
              ? 'bg-slate-950/70 border-slate-800' 
              : 'bg-slate-100/90 border-slate-200/90 shadow-inner'
          }`}>
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'chat'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Campus Chat</span>
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'documents'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Knowledge Base ({documents.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('architecture')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'architecture'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>LangGraph Flow</span>
            </button>
          </nav>

          {/* Quick Utility Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetChat}
              title="Reset Chat Session"
              className={`p-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all ${
                isDarkMode
                  ? 'border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-xs'
              }`}
            >
              <RotateCcw className="w-4 h-4 text-slate-500" />
              <span className="hidden lg:inline text-xs">New Chat</span>
            </button>

            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              className={`p-2 rounded-xl border transition-all ${
                isDarkMode
                  ? 'border-slate-800 bg-slate-900 text-amber-400 hover:bg-slate-800'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-xs'
              }`}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main App Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-3 sm:p-6 flex flex-col overflow-hidden">
        {activeTab === 'chat' && (
          <div className={`flex-1 flex flex-col rounded-3xl border shadow-xl overflow-hidden transition-all duration-300 ${
            isDarkMode
              ? 'bg-slate-900/90 border-slate-800 shadow-black/40'
              : 'bg-white/90 border-slate-200/90 shadow-slate-200/60'
          }`}>
            
            {/* Domain Filter Pills Bar */}
            <div className={`px-4 py-3 border-b flex items-center gap-2 overflow-x-auto scrollbar-none transition-colors ${
              isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50/80 border-slate-100'
            }`}>
              <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 pl-1 pr-2 whitespace-nowrap">
                <Compass className="w-3.5 h-3.5 text-amber-500" />
                <span>Domain:</span>
              </div>
              <div className="flex items-center gap-2">
                {DOMAIN_OPTIONS.map(opt => {
                  const Icon = opt.icon;
                  const isSelected = selectedDomain === opt.key;
                  return (
                    <button
                      key={opt.key}
                      onClick={() => setSelectedDomain(opt.key)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all card-3d-button ${
                        isSelected
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm ring-2 ring-indigo-400/20'
                          : isDarkMode
                            ? 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/60'
                            : 'bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80 shadow-xs'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Chat Messages Feed */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {/* Hero Topic Cards (Only visible when 1 initial message exists) */}
              {messages.length === 1 && (
                <div className="mb-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Quick Explore Categories</span>
                    </h3>
                    <span className="text-[11px] text-slate-400">Click any card to ask instantly</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {FEATURED_CARDS.map((card, i) => {
                      const Icon = card.icon;
                      return (
                        <div
                          key={i}
                          onClick={() => handleSendMessage(card.query)}
                          className={`p-4 rounded-2xl border cursor-pointer card-3d-hover group relative overflow-hidden transition-all ${
                            isDarkMode
                              ? 'bg-slate-800/40 border-slate-700/70 hover:border-indigo-500/50 hover:bg-slate-800/80'
                              : 'bg-gradient-to-br from-white to-slate-50 border-slate-200/80 hover:border-indigo-400/50 hover:shadow-md'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110 ${card.accent}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {card.title}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            {card.desc}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Conversation Messages */}
              {messages.map((msg, index) => {
                const isUser = msg.role === 'user';
                const routingDomain = msg.routing?.primary_domain;
                const routingOption = DOMAIN_OPTIONS.find(d => d.key === routingDomain);

                return (
                  <div
                    key={index}
                    className={`flex gap-3.5 max-w-3xl animate-slide-up ${
                      isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
                    }`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-9 h-9 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-md ${
                        isUser
                          ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-blue-500/20'
                          : 'bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 text-white shadow-amber-500/20'
                      }`}
                    >
                      {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>

                    {/* Content Bubble */}
                    <div className="flex flex-col space-y-1.5 max-w-[88%] sm:max-w-[82%]">
                      <div
                        className={`rounded-3xl px-5 py-4 text-sm leading-relaxed ${
                          isUser
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-none shadow-md shadow-blue-500/10'
                            : isDarkMode
                              ? 'bg-slate-850 bg-slate-800/80 border border-slate-700/80 text-slate-200 rounded-tl-none shadow-md'
                              : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-sm'
                        }`}
                      >
                        {/* Domain Routing Badge Pill */}
                        {!isUser && routingDomain && routingDomain !== 'general' && (
                          <div className="mb-3 pb-2.5 border-b border-slate-100 dark:border-slate-700/60 flex items-center flex-wrap gap-2 text-xs">
                            <span className={`px-2.5 py-0.5 rounded-lg border font-semibold text-[11px] flex items-center gap-1 ${
                              routingOption?.badge || 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}>
                              <Layers className="w-3 h-3" />
                              <span>{routingOption ? routingOption.label : routingDomain}</span>
                            </span>

                            {msg.routing?.target_domains && msg.routing.target_domains.length > 1 && (
                              <span className="px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[11px] font-mono">
                                Multi-Store: {msg.routing.target_domains.join(' + ')}
                              </span>
                            )}

                            {msg.routing?.confidence && (
                              <span className="text-[11px] text-slate-400 font-medium ml-auto">
                                {(msg.routing.confidence * 100).toFixed(0)}% verified match
                              </span>
                            )}
                          </div>
                        )}

                        {/* Markdown Text */}
                        <div className={`prose prose-sm max-w-none leading-relaxed ${
                          isUser 
                            ? 'prose-invert text-white prose-p:text-white prose-strong:text-white prose-headings:text-white' 
                            : isDarkMode
                              ? 'prose-invert text-slate-200 prose-headings:text-white prose-strong:text-white prose-a:text-indigo-400'
                              : 'prose-slate text-slate-800 prose-headings:text-slate-900 prose-strong:text-slate-900 prose-a:text-blue-600 prose-a:font-semibold'
                        }`}>
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>

                        {/* Citations Accordion */}
                        {!isUser && msg.citations && msg.citations.length > 0 && (
                          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/70">
                            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                              <ShieldCheck className="w-4 h-4 text-emerald-500" />
                              <span>Official Citations & References ({msg.citations.length}):</span>
                            </div>
                            <div className="space-y-1.5">
                              {msg.citations.map((cite) => {
                                const citeKey = `${index}_${cite.id}`;
                                const isExpanded = !!expandedCitations[citeKey];
                                return (
                                  <div
                                    key={cite.id}
                                    className={`rounded-xl border text-xs overflow-hidden transition-colors ${
                                      isDarkMode
                                        ? 'bg-slate-900/60 border-slate-800'
                                        : 'bg-slate-50 border-slate-200'
                                    }`}
                                  >
                                    <button
                                      onClick={() => toggleCitation(index, cite.id)}
                                      className="w-full px-3 py-2 text-left flex items-center justify-between text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors"
                                    >
                                      <span className="font-mono text-[11px] font-semibold truncate pr-2">
                                        [{cite.id}] {cite.source_file} &rsaquo; {cite.heading}
                                      </span>
                                      {isExpanded ? (
                                        <ChevronUp className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
                                      ) : (
                                        <ChevronDown className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
                                      )}
                                    </button>
                                    {isExpanded && (
                                      <div className={`px-3.5 py-2.5 text-[11px] font-mono leading-relaxed border-t ${
                                        isDarkMode
                                          ? 'bg-slate-950/70 border-slate-800 text-slate-400'
                                          : 'bg-white border-slate-200 text-slate-600'
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

                      {/* Timestamp & Micro-Action Bar */}
                      <div className={`flex items-center gap-2 px-1 text-[11px] text-slate-400 ${
                        isUser ? 'justify-end' : 'justify-start'
                      }`}>
                        <span>{msg.timestamp}</span>
                        {!isUser && (
                          <>
                            <span>•</span>
                            <button
                              onClick={() => handleCopy(msg.content, index)}
                              className="hover:text-slate-700 dark:hover:text-slate-200 flex items-center gap-1 transition-colors"
                              title="Copy response"
                            >
                              {copiedIndex === index ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-500" />
                                  <span className="text-emerald-500 font-medium">Copied</span>
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
                              className={`p-1 rounded-md transition-colors ${
                                likedMessages[index] === 'like'
                                  ? 'text-emerald-500 font-bold'
                                  : 'hover:text-slate-700 dark:hover:text-slate-200'
                              }`}
                              title="Helpful"
                            >
                              <ThumbsUp className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleFeedback(index, 'dislike')}
                              className={`p-1 rounded-md transition-colors ${
                                likedMessages[index] === 'dislike'
                                  ? 'text-rose-500 font-bold'
                                  : 'hover:text-slate-700 dark:hover:text-slate-200'
                              }`}
                              title="Not helpful"
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

              {/* Dynamic 3D Wave Typing Indicator */}
              {isLoading && (
                <div className="flex gap-3.5 max-w-xl mr-auto items-center animate-slide-up">
                  <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
                    <Bot className="w-4 h-4 animate-bounce" />
                  </div>
                  <div className={`rounded-2xl rounded-tl-none px-4 py-3 text-xs flex items-center gap-3 border shadow-sm ${
                    isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-600'
                  }`}>
                    <div className="flex items-center gap-1.5 py-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500 typing-dot-1"></span>
                      <span className="w-2 h-2 rounded-full bg-orange-500 typing-dot-2"></span>
                      <span className="w-2 h-2 rounded-full bg-indigo-500 typing-dot-3"></span>
                    </div>
                    <span className="text-slate-500 dark:text-slate-400 font-medium">
                      Consulting verified SISTec domain archives...
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestion Chips */}
            <div className={`px-4 py-2.5 border-t flex items-center gap-2 overflow-x-auto scrollbar-none transition-colors ${
              isDarkMode ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50/70 border-slate-100'
            }`}>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap flex items-center gap-1 pl-1">
                <Sparkles className="w-3 h-3 text-amber-500" /> Prompts:
              </span>
              {QUICK_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  disabled={isLoading}
                  onClick={() => handleSendMessage(prompt.replace(/^[^\s]+\s/, ''))}
                  className={`text-xs px-3 py-1 rounded-xl whitespace-nowrap transition-all card-3d-button border ${
                    isDarkMode
                      ? 'bg-slate-800 text-slate-300 border-slate-700/70 hover:bg-slate-700 hover:text-white'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 shadow-2xs'
                  }`}
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Floating Input Dock */}
            <div className={`p-3 sm:p-4 border-t transition-colors ${
              isDarkMode ? 'bg-slate-950/90 border-slate-800' : 'bg-white/95 border-slate-200'
            }`}>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={inputQuery}
                    onChange={(e) => setInputQuery(e.target.value)}
                    placeholder={
                      selectedDomain === 'all'
                        ? "Ask anything about SISTec (Placements, B.Tech, Fees, Hostels, Contacts)..."
                        : `Ask specifically about ${DOMAIN_OPTIONS.find(d => d.key === selectedDomain)?.label}...`
                    }
                    disabled={isLoading}
                    className={`w-full rounded-2xl px-5 py-3.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/30 ${
                      isDarkMode
                        ? 'bg-slate-900 border border-slate-700/80 text-white placeholder-slate-500 focus:border-indigo-500'
                        : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-500 shadow-inner'
                    }`}
                  />
                </div>
                <button
                  type="submit"
                  disabled={!inputQuery.trim() || isLoading}
                  className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 text-white font-semibold text-sm flex items-center gap-2 transition-all shadow-md shadow-indigo-600/25 card-3d-button disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Ask</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Tab 2: Document Manager */}
        {activeTab === 'documents' && (
          <div className="flex-1 space-y-6 overflow-y-auto">
            {/* Upload Box */}
            <div className={`border rounded-3xl p-6 sm:p-8 shadow-xl transition-all ${
              isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-slate-200/50'
            }`}>
              <h2 className="text-xl font-bold mb-1 flex items-center gap-2.5 text-slate-900 dark:text-white">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                  <Upload className="w-5 h-5" />
                </div>
                <span>Upload Document to Domain Knowledge Base</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 pl-10">
                Upload official circulars, syllabus PDFs, hostel manuals, or placement brochures. The system will automatically chunk, tag with metadata, and generate embeddings for instant retrieval.
              </p>

              <form onSubmit={handleUploadSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
                      Target Domain Knowledge Base
                    </label>
                    <select
                      value={uploadDomain}
                      onChange={(e) => setUploadDomain(e.target.value)}
                      className={`w-full border rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                        isDarkMode
                          ? 'bg-slate-950 border-slate-800 text-slate-200'
                          : 'bg-slate-50 border-slate-200 text-slate-800'
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
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
                      Select File (.pdf, .txt, .md)
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.txt,.md"
                      onChange={(e) => setUploadFile(e.target.files[0] || null)}
                      className={`w-full text-xs file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer border rounded-2xl p-1.5 ${
                        isDarkMode
                          ? 'text-slate-400 bg-slate-950 border-slate-800'
                          : 'text-slate-600 bg-slate-50 border-slate-200'
                      }`}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div>
                    {uploadStatus && (
                      <div className={`text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 font-medium ${
                        uploadStatus.type === 'success'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300'
                      }`}>
                        {uploadStatus.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                        <span>{uploadStatus.message}</span>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={!uploadFile || isUploading}
                    className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-2 transition-all shadow-md shadow-indigo-600/20 card-3d-button disabled:opacity-50"
                  >
                    {isUploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    <span>{isUploading ? 'Indexing Document...' : 'Index Document'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Document Index Table */}
            <div className={`border rounded-3xl p-6 sm:p-8 shadow-xl transition-all ${
              isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-slate-200/50'
            }`}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-lg">Active Knowledge Base Documents</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Total {documents.length} files indexed across 5 domain vector stores.</p>
                </div>
                <button
                  onClick={handleReindex}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all card-3d-button ${
                    isDarkMode
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  }`}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Re-Index All</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className={`border-b text-slate-400 font-bold uppercase tracking-wider text-[11px] ${
                      isDarkMode ? 'border-slate-800 bg-slate-950/40' : 'border-slate-100 bg-slate-50'
                    }`}>
                      <th className="py-3 px-4">Document Name</th>
                      <th className="py-3 px-4">Domain</th>
                      <th className="py-3 px-4">Size</th>
                      <th className="py-3 px-4">Chunks in Chroma</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800/60' : 'divide-slate-100'}`}>
                    {documents.map((doc, idx) => (
                      <tr key={idx} className={`transition-colors ${isDarkMode ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'}`}>
                        <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                          <span className="truncate max-w-xs">{doc.file_name}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-semibold text-[11px]">
                            {doc.domain_name}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500 dark:text-slate-400 font-mono">
                          {(doc.size_bytes / 1024).toFixed(1)} KB
                        </td>
                        <td className="py-3 px-4 text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                          {doc.total_domain_chunks} chunks
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleDeleteDoc(doc.domain, doc.file_name)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                            title="Delete file"
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

        {/* Tab 3: LangGraph Flow */}
        {activeTab === 'architecture' && (
          <div className="flex-1 space-y-6 overflow-y-auto">
            <div className={`border rounded-3xl p-6 sm:p-8 shadow-xl transition-all ${
              isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-slate-200/50'
            }`}>
              <h2 className="text-xl font-bold mb-2 flex items-center gap-2.5 text-slate-900 dark:text-white">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                  <Layers className="w-6 h-6" />
                </div>
                <span>LangGraph Agentic StateGraph Architecture</span>
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6 pl-11">
                The SISTec chatbot runs on a stateful <strong>LangGraph StateGraph</strong> workflow. Rather than a linear chain, execution is orchestrated through specialized agentic nodes with conditional branching and zero-hallucination guardrails:
              </p>

              {/* Architecture Visual Diagram */}
              <div className={`rounded-2xl p-6 border font-mono text-xs space-y-4 ${
                isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center text-amber-700 dark:text-amber-300 font-bold">
                  START &rarr; Node 1: route_node (Classifies Domain Intent)
                </div>
                <div className="text-center text-slate-400">&darr; Conditional Branch (route_decision)</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-center">
                    <span className="text-blue-600 dark:text-blue-400 font-bold block">Greeting Branch</span>
                    <span className="text-[11px] text-slate-500">&rarr; greeting_node &rarr; END</span>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold block">College Domain Query</span>
                    <span className="text-[11px] text-slate-500">&rarr; retrieve_node (ChromaDB)</span>
                  </div>
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-center">
                    <span className="text-rose-600 dark:text-rose-400 font-bold block">Out-of-Scope Branch</span>
                    <span className="text-[11px] text-slate-500">&rarr; fallback_node &rarr; END</span>
                  </div>
                </div>
                <div className="text-center text-slate-400">&darr; Next State Transition</div>
                <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-center text-indigo-700 dark:text-indigo-300 font-bold">
                  Node 2: retrieve_node (Multi-Domain Vector Extraction from 5 ChromaDB Collections)
                </div>
                <div className="text-center text-slate-400">&darr;</div>
                <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-center text-purple-700 dark:text-purple-300 font-bold">
                  Node 3: grade_documents_node (Agentic Document Relevance Validation)
                </div>
                <div className="text-center text-slate-400">&darr; Conditional Branch (grade_decision)</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold block">Valid Documents</span>
                    <span className="text-[11px] text-slate-500">&rarr; generate_node (Gemini LLM) &rarr; END</span>
                  </div>
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-center">
                    <span className="text-rose-600 dark:text-rose-400 font-bold block">No Records Found</span>
                    <span className="text-[11px] text-slate-500">&rarr; fallback_node &rarr; END</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Technical Highlights Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`border rounded-2xl p-5 shadow-sm ${
                isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <h4 className="font-bold text-sm mb-2 flex items-center gap-2 text-slate-900 dark:text-white">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Zero Hallucination Guardrails</span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Strict prompt engineering ensures that if a question falls outside indexed college documents, the assistant admits lack of records and directs users to official helpline numbers.
                </p>
              </div>

              <div className={`border rounded-2xl p-5 shadow-sm ${
                isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <h4 className="font-bold text-sm mb-2 flex items-center gap-2 text-slate-900 dark:text-white">
                  <Layers className="w-4 h-4 text-indigo-500" />
                  <span>Multi-Domain Decomposition</span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  When a question touches multiple domains (e.g. "What is the hostel fee and average placement?"), the router queries both domain stores simultaneously and aggregates findings.
                </p>
              </div>

              <div className={`border rounded-2xl p-5 shadow-sm ${
                isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <h4 className="font-bold text-sm mb-2 flex items-center gap-2 text-slate-900 dark:text-white">
                  <Upload className="w-4 h-4 text-blue-500" />
                  <span>Dynamic Live Ingestion</span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
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
