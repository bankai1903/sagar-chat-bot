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
  Flame,
  Award
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const DOMAIN_OPTIONS = [
  { key: 'all', label: 'Smart Auto', icon: Compass, color: 'text-rose-600 dark:text-rose-400', badge: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300' },
  { key: 'academics', label: 'Academics & Labs', icon: GraduationCap, color: 'text-amber-600 dark:text-amber-400', badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300' },
  { key: 'admissions', label: 'Admissions & Fees', icon: Coins, color: 'text-rose-600 dark:text-rose-400', badge: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300' },
  { key: 'hostels', label: 'Hostels & Campus', icon: Building2, color: 'text-amber-600 dark:text-amber-400', badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300' },
  { key: 'placements', label: 'Placements (T&P)', icon: Briefcase, color: 'text-rose-600 dark:text-rose-400', badge: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300' },
  { key: 'administration', label: 'Contacts & Leaders', icon: Megaphone, color: 'text-amber-600 dark:text-amber-400', badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300' },
];

const FEATURED_CARDS = [
  {
    title: "Placements & 21 LPA Packages",
    desc: "TCS, Cisco, Infosys recruitment drives & student placement testimonials.",
    query: "What is the highest package in SISTec placements and which top companies recruit?",
    icon: Award,
    badge: "21 LPA Highest",
    badgeColor: "bg-rose-50 text-rose-600 border-rose-200"
  },
  {
    title: "B.Tech Admissions & Fee Waivers",
    desc: "CSE eligibility, MP DTE counseling, Bihar Student Credit Card (BSCC) & MMVY.",
    query: "What is the admission procedure for B.Tech CSE and available fee waiver scholarships?",
    icon: Coins,
    badge: "Admissions 2026",
    badgeColor: "bg-amber-50 text-amber-600 border-amber-200"
  },
  {
    title: "Hostel Life & 100+ Bus Routes",
    desc: "AC/Non-AC rooms, daily mess food, gym, sports grounds, and bus routes across Bhopal.",
    query: "Tell me about hostel room options, mess food menu and college bus connectivity.",
    icon: Building2,
    badge: "35+ Routes",
    badgeColor: "bg-rose-50 text-rose-600 border-rose-200"
  },
  {
    title: "Campuses & Sagar Fiesta Fest",
    desc: "Gandhi Nagar vs Ratibad campuses, celebrity nights, aftermovies and contacts.",
    query: "Where are Gandhi Nagar and Ratibad campuses located, and how can I watch Sagar Fiesta videos?",
    icon: MapPin,
    badge: "2 Campuses",
    badgeColor: "bg-amber-50 text-amber-600 border-amber-200"
  }
];

const QUICK_PROMPTS = [
  "💼 Placements 2026 highlights",
  "🎓 B.Tech CSE cutoffs",
  "🏡 Hostels & mess menu",
  "💰 Bihar Credit Card (BSCC)",
  "✈️ How to reach Gandhi Nagar",
  "🎉 Sagar Fiesta aftermovie"
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
      content: "### Namaste & Welcome! 🎓\n\nI am **Sagar Mitra**, your interactive campus companion for **Sagar Institute of Science and Technology (SISTec), Bhopal**.\n\nI have verified access to official college records across all domains:\n- 🎓 **Academics & Labs**: B.Tech/M.Tech/MBA/Pharmacy, RGPV syllabus, NBA & NAAC accredited labs\n- 💰 **Admissions & Fees**: Fee breakdowns, Bihar Student Credit Card (BSCC), MMVY scholarships\n- 🏡 **Hostels & Transport**: AC/Non-AC room fees, mess menu, 100+ bus network across Bhopal\n- 💼 **Placements (T&P)**: Highest 21 LPA package, TCS, Cisco, Capgemini hiring statistics\n- 📢 **Contacts & Events**: Gandhi Nagar & Ratibad helplines, Sagar Fiesta & Silver Jubilee videos\n\n*Tap any quick question below or ask me anything directly!*",
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
        throw new Error(`Server error ${res.status}`);
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
          content: `⚠️ **Connection Note**: Unable to communicate with the backend server. Please ensure FastAPI is running on port 8000.\n\n*Technical Details: ${err.message}*`,
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
          content: "### Fresh Conversation Started! ✨\n\nHow can I assist you with SISTec today? Ask about B.Tech branches, fee waivers, placement statistics, hostels, or campus life!",
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
    <div className={`h-screen max-h-screen overflow-hidden flex flex-col transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-[#121013] text-stone-100' 
        : 'bg-[#faf8f6] text-stone-800'
    }`}>
      {/* Luxury Ambient Glow Background Orbs */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-rose-400/10 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse"></div>
      <div className="fixed top-1/3 right-1/4 w-80 h-80 bg-amber-400/10 rounded-full blur-3xl pointer-events-none -z-10"></div>
      <div className="fixed -bottom-10 left-1/3 w-96 h-96 bg-rose-300/10 rounded-full blur-3xl pointer-events-none -z-10"></div>

      {/* Header Bar - Fixed, No Overflow */}
      <header className={`flex-shrink-0 z-30 border-b transition-colors ${
        isDarkMode
          ? 'bg-[#18151a]/90 border-stone-800/80 backdrop-blur-md'
          : 'bg-white/90 border-amber-200/50 backdrop-blur-md shadow-xs'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-15 flex items-center justify-between">
          
          {/* Logo & Assistant Identity */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 via-rose-600 to-amber-500 p-0.5 shadow-md shadow-rose-500/20 animate-float">
                <div className="w-full h-full bg-white dark:bg-stone-900 rounded-[14px] flex items-center justify-center">
                  <span className="text-xl select-none">🎓</span>
                </div>
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-rose-500 border-2 border-white dark:border-stone-900 rounded-full"></span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base tracking-tight bg-gradient-to-r from-stone-900 via-rose-950 to-amber-900 dark:from-white dark:via-rose-100 dark:to-amber-200 bg-clip-text text-transparent">
                  Sagar Mitra
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r from-rose-100 to-amber-100 dark:from-rose-950/60 dark:to-amber-950/60 text-rose-800 dark:text-rose-200 border border-amber-200/80 font-bold flex items-center gap-1 shadow-2xs">
                  <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                  SISTec Campus AI
                </span>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">
                Sagar Institute of Science & Technology • Bhopal
              </p>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className={`hidden sm:flex items-center gap-1 p-1 rounded-xl border ${
            isDarkMode 
              ? 'bg-stone-900 border-stone-800' 
              : 'bg-stone-100/80 border-amber-100 shadow-inner'
          }`}>
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'chat'
                  ? 'bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Campus Chat</span>
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'documents'
                  ? 'bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Knowledge Base ({documents.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('architecture')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'architecture'
                  ? 'bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>LangGraph Flow</span>
            </button>
          </nav>

          {/* Quick Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetChat}
              title="Start New Session"
              className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                isDarkMode
                  ? 'border-stone-800 bg-stone-900 hover:bg-stone-800 text-stone-300'
                  : 'border-amber-200/60 bg-white hover:bg-amber-50/50 text-stone-700 shadow-2xs'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
              <span className="hidden md:inline text-xs">New Chat</span>
            </button>

            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              title={isDarkMode ? "Light Mode" : "Dark Mode"}
              className={`p-2 rounded-xl border transition-all ${
                isDarkMode
                  ? 'border-stone-800 bg-stone-900 text-amber-300 hover:bg-stone-800'
                  : 'border-amber-200/60 bg-white text-stone-700 hover:bg-amber-50/50 shadow-2xs'
              }`}
            >
              {isDarkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Single-Page Viewport Container */}
      <main className="flex-1 min-h-0 max-w-6xl w-full mx-auto p-2 sm:p-4 flex flex-col overflow-hidden">
        {activeTab === 'chat' && (
          <div className={`flex-1 min-h-0 flex flex-col rounded-2xl sm:rounded-3xl border shadow-lg overflow-hidden transition-all ${
            isDarkMode
              ? 'bg-[#18151a]/95 border-stone-800'
              : 'bg-white/95 border-amber-200/50 shadow-stone-200/40'
          }`}>
            
            {/* Domain Filter Pills - WRAPPED, NO HORIZONTAL SCROLL/SLIDER */}
            <div className={`flex-shrink-0 px-3 py-2 border-b flex flex-wrap items-center gap-1.5 transition-colors ${
              isDarkMode ? 'bg-[#151216] border-stone-800' : 'bg-[#fffcf9] border-amber-100/70'
            }`}>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 pl-1 pr-1 flex items-center gap-1">
                <Compass className="w-3 h-3 text-rose-500" /> Domain:
              </span>
              {DOMAIN_OPTIONS.map(opt => {
                const Icon = opt.icon;
                const isSelected = selectedDomain === opt.key;
                return (
                  <button
                    key={opt.key}
                    onClick={() => setSelectedDomain(opt.key)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-gradient-to-r from-rose-500 via-rose-600 to-amber-500 text-white shadow-xs'
                        : isDarkMode
                          ? 'bg-stone-850 bg-stone-900/90 text-stone-300 hover:bg-stone-800 border border-stone-800'
                          : 'bg-white text-stone-700 hover:bg-rose-50/50 hover:text-rose-700 border border-amber-200/60 shadow-2xs'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>

            {/* ONLY Message Thread Scrolls Vertically */}
            <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-5 space-y-4">
              
              {/* Clean Welcome Card when 1 initial message */}
              {messages.length === 1 && (
                <div className="mb-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {FEATURED_CARDS.map((card, i) => {
                      const Icon = card.icon;
                      return (
                        <div
                          key={i}
                          onClick={() => handleSendMessage(card.query)}
                          className={`p-3.5 rounded-2xl border cursor-pointer card-3d-hover group relative overflow-hidden transition-all ${
                            isDarkMode
                              ? 'bg-stone-900/60 border-stone-800 hover:border-rose-500/50'
                              : 'bg-gradient-to-br from-white via-white to-amber-50/30 border-amber-200/50 hover:border-rose-300 hover:shadow-xs'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-100 to-amber-100 dark:from-rose-950/60 dark:to-amber-950/60 text-rose-600 dark:text-rose-300 flex items-center justify-center">
                              <Icon className="w-4 h-4" />
                            </div>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${card.badgeColor}`}>
                              {card.badge}
                            </span>
                          </div>
                          <h4 className="font-bold text-xs text-stone-900 dark:text-white mb-0.5 group-hover:text-rose-600 dark:group-hover:text-rose-300 transition-colors">
                            {card.title}
                          </h4>
                          <p className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-2 leading-relaxed">
                            {card.desc}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Messages Flow */}
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
                    <div
                      className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center shadow-xs ${
                        isUser
                          ? 'bg-gradient-to-tr from-rose-500 to-rose-600 text-white'
                          : 'bg-gradient-to-tr from-rose-500 via-rose-600 to-amber-500 text-white shadow-rose-500/20'
                      }`}
                    >
                      {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>

                    {/* Message Bubble */}
                    <div className="flex flex-col space-y-1 max-w-[90%] sm:max-w-[84%]">
                      <div
                        className={`rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed ${
                          isUser
                            ? 'bg-gradient-to-r from-rose-500 via-rose-600 to-amber-500 text-white rounded-tr-none shadow-md shadow-rose-500/15'
                            : isDarkMode
                              ? 'bg-stone-900 border border-stone-800 text-stone-200 rounded-tl-none shadow-sm'
                              : 'bg-white border border-amber-200/60 text-stone-800 rounded-tl-none shadow-xs'
                        }`}
                      >
                        {/* Domain Routing Badge Pill */}
                        {!isUser && routingDomain && routingDomain !== 'general' && (
                          <div className="mb-2.5 pb-2 border-b border-stone-100 dark:border-stone-800 flex items-center flex-wrap gap-2 text-xs">
                            <span className={`px-2 py-0.5 rounded-md border font-bold text-[10px] flex items-center gap-1 ${
                              routingOption?.badge || 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}>
                              <Layers className="w-3 h-3 text-rose-500" />
                              <span>{routingOption ? routingOption.label : routingDomain}</span>
                            </span>

                            {msg.routing?.target_domains && msg.routing.target_domains.length > 1 && (
                              <span className="px-1.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[10px] font-mono">
                                Multi-Store: {msg.routing.target_domains.join(' + ')}
                              </span>
                            )}

                            {msg.routing?.confidence && (
                              <span className="text-[10px] text-stone-400 font-medium ml-auto">
                                {(msg.routing.confidence * 100).toFixed(0)}% match
                              </span>
                            )}
                          </div>
                        )}

                        {/* Markdown Text */}
                        <div className={`prose prose-sm max-w-none leading-relaxed ${
                          isUser 
                            ? 'prose-invert text-white prose-p:text-white prose-strong:text-white prose-headings:text-white' 
                            : isDarkMode
                              ? 'prose-invert text-stone-200 prose-headings:text-amber-200 prose-strong:text-amber-200 prose-a:text-rose-400'
                              : 'prose-stone text-stone-800 prose-headings:text-stone-900 prose-strong:text-rose-900 prose-a:text-rose-600 prose-a:font-semibold'
                        }`}>
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>

                        {/* Citations Accordion */}
                        {!isUser && msg.citations && msg.citations.length > 0 && (
                          <div className="mt-3 pt-2.5 border-t border-stone-100 dark:border-stone-800">
                            <div className="text-[11px] font-bold text-stone-500 dark:text-stone-400 mb-1.5 flex items-center gap-1.5">
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
                                    className={`rounded-lg border text-[11px] overflow-hidden transition-colors ${
                                      isDarkMode
                                        ? 'bg-stone-950/60 border-stone-800'
                                        : 'bg-[#fffdfb] border-amber-200/50'
                                    }`}
                                  >
                                    <button
                                      onClick={() => toggleCitation(index, cite.id)}
                                      className="w-full px-2.5 py-1.5 text-left flex items-center justify-between text-stone-700 dark:text-stone-300 hover:text-rose-600 transition-colors"
                                    >
                                      <span className="font-mono text-[10px] font-semibold truncate pr-2">
                                        [{cite.id}] {cite.source_file} &rsaquo; {cite.heading}
                                      </span>
                                      {isExpanded ? (
                                        <ChevronUp className="w-3 h-3 flex-shrink-0 text-stone-400" />
                                      ) : (
                                        <ChevronDown className="w-3 h-3 flex-shrink-0 text-stone-400" />
                                      )}
                                    </button>
                                    {isExpanded && (
                                      <div className={`px-3 py-2 text-[10px] font-mono leading-relaxed border-t ${
                                        isDarkMode
                                          ? 'bg-stone-950 border-stone-800 text-stone-400'
                                          : 'bg-white border-amber-100 text-stone-600'
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

                      {/* Micro-Action Bar */}
                      <div className={`flex items-center gap-2 px-1 text-[10px] text-stone-400 ${
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
                                  <span className="text-rose-500 font-medium">Copied</span>
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
                                likedMessages[index] === 'dislike' ? 'text-amber-600 font-bold' : 'hover:text-stone-600'
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

              {/* Typing Wave Indicator */}
              {isLoading && (
                <div className="flex gap-2.5 max-w-xl mr-auto items-center animate-slide-up">
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 text-white flex items-center justify-center shadow-xs">
                    <Bot className="w-3.5 h-3.5 animate-bounce" />
                  </div>
                  <div className={`rounded-xl rounded-tl-none px-3.5 py-2 text-xs flex items-center gap-2.5 border shadow-2xs ${
                    isDarkMode ? 'bg-stone-900 border-stone-800 text-stone-300' : 'bg-white border-amber-200/60 text-stone-600'
                  }`}>
                    <div className="flex items-center gap-1 py-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 typing-dot-1"></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 typing-dot-2"></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 typing-dot-3"></span>
                    </div>
                    <span className="text-stone-500 dark:text-stone-400 text-[11px] font-medium">
                      Consulting verified SISTec knowledge bases...
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestion Chips - WRAPPED, NO HORIZONTAL SCROLL/SLIDER */}
            <div className={`flex-shrink-0 px-3 py-2 border-t flex flex-wrap items-center gap-1.5 transition-colors ${
              isDarkMode ? 'bg-[#151216] border-stone-800' : 'bg-[#fffcf9] border-amber-100/70'
            }`}>
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1 pl-1 pr-1">
                <Sparkles className="w-3 h-3 text-amber-500" /> Prompts:
              </span>
              {QUICK_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  disabled={isLoading}
                  onClick={() => handleSendMessage(prompt.replace(/^[^\s]+\s/, ''))}
                  className={`text-xs px-2.5 py-1 rounded-lg transition-all card-3d-button border ${
                    isDarkMode
                      ? 'bg-stone-900 text-stone-300 border-stone-800 hover:bg-stone-800 hover:text-white'
                      : 'bg-white text-stone-700 border-amber-200/60 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 shadow-2xs'
                  }`}
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Input Dock - Pinned at Bottom, No Overflow */}
            <div className={`flex-shrink-0 p-3 border-t transition-colors ${
              isDarkMode ? 'bg-[#18151a] border-stone-800' : 'bg-white border-amber-200/50'
            }`}>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
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
                  className={`w-full rounded-xl px-4 py-3 text-xs sm:text-sm transition-all focus:outline-none focus:ring-2 focus:ring-rose-400/30 ${
                    isDarkMode
                      ? 'bg-stone-900 border border-stone-800 text-white placeholder-stone-500 focus:border-rose-500'
                      : 'bg-[#faf9f8] border border-amber-200/70 text-stone-900 placeholder-stone-400 focus:bg-white focus:border-rose-500 shadow-inner'
                  }`}
                />
                <button
                  type="submit"
                  disabled={!inputQuery.trim() || isLoading}
                  className="px-5 py-3 rounded-xl bg-gradient-to-r from-rose-500 via-rose-600 to-amber-500 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-md shadow-rose-500/20 card-3d-button disabled:opacity-40"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Tab 2: Document Manager */}
        {activeTab === 'documents' && (
          <div className="flex-1 min-h-0 space-y-4 overflow-y-auto pr-1">
            <div className={`border rounded-2xl p-5 shadow-sm transition-all ${
              isDarkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-amber-200/60'
            }`}>
              <h2 className="text-base font-bold mb-1 flex items-center gap-2 text-stone-900 dark:text-white">
                <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
                  <Upload className="w-4 h-4" />
                </div>
                <span>Upload Document to Knowledge Base</span>
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 mb-4 pl-8">
                Upload official circulars, syllabus PDFs, or brochures to instantly generate vector embeddings.
              </p>

              <form onSubmit={handleUploadSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300 mb-1.5">
                      Target Domain
                    </label>
                    <select
                      value={uploadDomain}
                      onChange={(e) => setUploadDomain(e.target.value)}
                      className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-rose-500 ${
                        isDarkMode
                          ? 'bg-stone-950 border-stone-800 text-stone-200'
                          : 'bg-stone-50 border-amber-200/60 text-stone-800'
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
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300 mb-1.5">
                      Select File (.pdf, .txt, .md)
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.txt,.md"
                      onChange={(e) => setUploadFile(e.target.files[0] || null)}
                      className={`w-full text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-rose-600 file:text-white hover:file:bg-rose-500 cursor-pointer border rounded-xl p-1 ${
                        isDarkMode ? 'text-stone-400 bg-stone-950 border-stone-800' : 'text-stone-600 bg-stone-50 border-amber-200/60'
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
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs card-3d-button disabled:opacity-50"
                  >
                    {isUploading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    <span>{isUploading ? 'Indexing...' : 'Index Document'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Document Index Table */}
            <div className={`border rounded-2xl p-5 shadow-sm transition-all ${
              isDarkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-amber-200/60'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-stone-900 dark:text-white text-sm">Indexed Knowledge Base Documents</h3>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400">{documents.length} files across 5 domain vector stores.</p>
                </div>
                <button
                  onClick={handleReindex}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all card-3d-button ${
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
                    <tr className={`border-b text-stone-400 font-bold uppercase tracking-wider text-[10px] ${
                      isDarkMode ? 'border-stone-800 bg-stone-950/40' : 'border-stone-100 bg-[#fffdfb]'
                    }`}>
                      <th className="py-2.5 px-3">Document Name</th>
                      <th className="py-2.5 px-3">Domain</th>
                      <th className="py-2.5 px-3">Size</th>
                      <th className="py-2.5 px-3">Chunks</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDarkMode ? 'divide-stone-800/60' : 'divide-stone-100'}`}>
                    {documents.map((doc, idx) => (
                      <tr key={idx} className={`transition-colors ${isDarkMode ? 'hover:bg-stone-800/40' : 'hover:bg-rose-50/30'}`}>
                        <td className="py-2.5 px-3 font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                          <span className="truncate max-w-xs">{doc.file_name}</span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-semibold text-[10px]">
                            {doc.domain_name}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-stone-500 font-mono text-[11px]">
                          {(doc.size_bytes / 1024).toFixed(1)} KB
                        </td>
                        <td className="py-2.5 px-3 text-amber-700 dark:text-amber-400 font-mono font-bold text-[11px]">
                          {doc.total_domain_chunks}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => handleDeleteDoc(doc.domain, doc.file_name)}
                            className="p-1 rounded text-stone-400 hover:text-rose-500 transition-colors"
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

        {/* Tab 3: LangGraph Flow */}
        {activeTab === 'architecture' && (
          <div className="flex-1 min-h-0 space-y-4 overflow-y-auto pr-1">
            <div className={`border rounded-2xl p-5 shadow-sm transition-all ${
              isDarkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-amber-200/60'
            }`}>
              <h2 className="text-base font-bold mb-1 flex items-center gap-2 text-stone-900 dark:text-white">
                <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                  <Layers className="w-4 h-4" />
                </div>
                <span>LangGraph Agentic StateGraph Architecture</span>
              </h2>
              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed mb-4 pl-8">
                Execution is orchestrated across stateful agentic nodes with domain-level routing and zero-hallucination guardrails:
              </p>

              <div className={`rounded-xl p-4 border font-mono text-[11px] space-y-3 ${
                isDarkMode ? 'bg-stone-950 border-stone-800 text-stone-300' : 'bg-[#fffdfb] border-amber-200/60 text-stone-700'
              }`}>
                <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-center text-rose-700 dark:text-rose-300 font-bold">
                  START &rarr; Node 1: route_node (Classifies Domain Intent)
                </div>
                <div className="text-center text-stone-400">&darr; Conditional Branch (route_decision)</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-center">
                    <span className="text-amber-700 dark:text-amber-400 font-bold block">Greeting Branch</span>
                    <span className="text-[10px] text-stone-500">&rarr; greeting_node &rarr; END</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-center">
                    <span className="text-rose-700 dark:text-rose-400 font-bold block">College Domain Query</span>
                    <span className="text-[10px] text-stone-500">&rarr; retrieve_node (ChromaDB)</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-stone-500/10 border border-stone-500/30 text-center">
                    <span className="text-stone-600 dark:text-stone-400 font-bold block">Out-of-Scope Branch</span>
                    <span className="text-[10px] text-stone-500">&rarr; fallback_node &rarr; END</span>
                  </div>
                </div>
                <div className="text-center text-stone-400">&darr; Next State Transition</div>
                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-center text-amber-700 dark:text-amber-300 font-bold">
                  Node 2: retrieve_node (5 ChromaDB Vector Stores)
                </div>
                <div className="text-center text-stone-400">&darr;</div>
                <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-center text-rose-700 dark:text-rose-300 font-bold">
                  Node 3: grade_documents_node (Agentic Relevance Check)
                </div>
                <div className="text-center text-stone-400">&darr; Conditional Branch (grade_decision)</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-center">
                    <span className="text-rose-700 dark:text-rose-400 font-bold block">Valid Documents</span>
                    <span className="text-[10px] text-stone-500">&rarr; generate_node (Gemini LLM) &rarr; END</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-stone-500/10 border border-stone-500/30 text-center">
                    <span className="text-stone-600 dark:text-stone-400 font-bold block">No Records Found</span>
                    <span className="text-[10px] text-stone-500">&rarr; fallback_node &rarr; END</span>
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
