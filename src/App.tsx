import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ThumbsUp, ThumbsDown, Sparkles, MapPin, Loader2, Home, MessageSquare, User, Moon, Sun, Send, Filter, Compass } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Markdown from 'react-markdown';

const DIMENSIONS = ['Music', 'Food', 'Art', 'Tech', 'Outdoor', 'Nightlife', 'Luxury'];
const LEARNING_RATE = 0.15;

interface Event {
  id: string;
  eventName: string;
  description: string;
  location: string;
  imageUrl: string;
  eventVector: Record<string, number>;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function App() {
  const [events, setEvents] = useState<Event[]>([]);
  const [weights, setWeights] = useState<number[]>(Array(7).fill(0.5));
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [interactedEvents, setInteractedEvents] = useState<Record<string, 'like' | 'pass'>>({});
  
  const [currentTab, setCurrentTab] = useState<'feed' | 'assistant' | 'profile'>('feed');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [filter, setFilter] = useState<string>('All');
  
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hi! I'm your Roam AI guide. Looking for something specific to do today?" }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Theme toggle
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Fetch events
  useEffect(() => {
    setLoadingEvents(true);
    fetch('/api/live-events')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setEvents(data);
        } else {
          setEvents([]);
        }
        setLoadingEvents(false);
      })
      .catch(err => {
        console.error(err);
        setLoadingEvents(false);
      });
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getScore = (eventVector: Record<string, number>, userWeights: number[]) => {
    const rawScore = DIMENSIONS.reduce((sum, dim, i) => sum + (eventVector[dim] || 0) * userWeights[i], 0);
    const maxPossible = DIMENSIONS.reduce((sum, dim) => sum + (eventVector[dim] || 0), 0);
    return maxPossible > 0 ? rawScore / maxPossible : 0;
  };

  const handleInteraction = (eventId: string, eventVector: Record<string, number>, isLike: boolean) => {
    const currentInteraction = interactedEvents[eventId];
    const targetInteraction = isLike ? 'like' : 'pass';

    let newWeights = [...weights];
    const applySign = (sign: number) => {
      newWeights = newWeights.map((w, i) => {
        let updated = w + sign * LEARNING_RATE * (eventVector[DIMENSIONS[i]] || 0);
        return Math.max(0, Math.min(1, updated));
      });
    };

    if (currentInteraction === targetInteraction) {
      // Toggle off
      applySign(isLike ? -1 : 0.5);
      setInteractedEvents(prev => {
        const next = { ...prev };
        delete next[eventId];
        return next;
      });
    } else {
      // Revert previous if switching
      if (currentInteraction === 'like') applySign(-1);
      else if (currentInteraction === 'pass') applySign(0.5);
      
      // Apply new
      applySign(isLike ? 1 : -0.5);
      setInteractedEvents(prev => ({ ...prev, [eventId]: targetInteraction }));
    }
    setWeights(newWeights);
  };

  const handleSliderChange = (index: number, value: number) => {
    const newWeights = [...weights];
    newWeights[index] = value;
    setWeights(newWeights);
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim()) return;
    
    const userMsg = chatInput.trim();
    setChatInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsChatLoading(true);

    try {
      const res = await fetch('/api/chat-recommendation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMsg, events, userWeights: weights })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply || "Sorry, I couldn't process that." }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm having trouble connecting right now. Please try again." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const filteredAndRankedEvents = useMemo(() => {
    let filtered = events;
    if (filter !== 'All') {
      filtered = events.filter(e => (e.eventVector[filter] || 0) > 0.3);
    }
    return filtered.sort((a, b) => getScore(b.eventVector, weights) - getScore(a.eventVector, weights));
  }, [events, weights, filter]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans transition-colors duration-200">
      {/* Top Navigation */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center shadow-sm shadow-indigo-600/20">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Roam</h1>
          </div>
          
          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800/50 p-1 rounded-full">
            <button onClick={() => setCurrentTab('feed')} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${currentTab === 'feed' ? 'bg-white dark:bg-zinc-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'}`}>Feed</button>
            <button onClick={() => setCurrentTab('assistant')} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${currentTab === 'assistant' ? 'bg-white dark:bg-zinc-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'}`}>Assistant</button>
            <button onClick={() => setCurrentTab('profile')} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${currentTab === 'profile' ? 'bg-white dark:bg-zinc-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'}`}>Profile</button>
          </nav>

          <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-600 dark:text-zinc-400">
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-6 pb-24 md:pb-8">
        <AnimatePresence mode="wait">
          
          {/* FEED TAB */}
          {currentTab === 'feed' && (
            <motion.div key="feed" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
              
              {/* Filters */}
              <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                <div className="flex items-center justify-center px-3 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-500 mr-1 shrink-0">
                  <Filter className="w-4 h-4" />
                </div>
                {['All', ...DIMENSIONS].map(dim => (
                  <button 
                    key={dim} 
                    onClick={() => setFilter(dim)} 
                    className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors shrink-0 ${filter === dim ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}
                  >
                    {dim}
                  </button>
                ))}
              </div>

              {loadingEvents ? (
                <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-12 flex flex-col items-center justify-center text-center shadow-sm">
                  <Loader2 className="w-10 h-10 text-indigo-600 dark:text-indigo-400 animate-spin mb-4" />
                  <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">Discovering Events...</h3>
                  <p className="text-zinc-500 dark:text-zinc-400 max-w-sm text-sm">Scanning local sources and parsing activities with AI.</p>
                </div>
              ) : filteredAndRankedEvents.length === 0 ? (
                <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
                  No events found for this category.
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredAndRankedEvents.map((event, index) => {
                    const score = getScore(event.eventVector, weights);
                    return (
                      <motion.div layout key={event.id} className="bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-sm border border-zinc-200 dark:border-zinc-800">
                        <div className="h-56 relative">
                          <img src={event.imageUrl} alt={event.eventName} className="w-full h-full object-cover" />
                          <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full border border-white/10">
                            {score > 0.7 ? '🔥 High Match' : `#${index + 1} For You`}
                          </div>
                        </div>
                        <div className="p-6">
                          <div className="flex justify-between items-start mb-2 gap-4">
                            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 leading-tight">{event.eventName}</h3>
                            <div className="text-xs font-mono bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 px-2 py-1 rounded-md shrink-0 border border-indigo-100 dark:border-indigo-500/20">
                              {(score * 100).toFixed(0)}% Match
                            </div>
                          </div>
                          <div className="flex items-center text-zinc-500 dark:text-zinc-400 text-sm mb-4">
                            <MapPin className="w-4 h-4 mr-1.5" />
                            {event.location}
                          </div>
                          <p className="text-zinc-600 dark:text-zinc-300 text-sm mb-6 leading-relaxed">{event.description}</p>
                          
                          <div className="flex gap-2 flex-wrap mb-6">
                            {DIMENSIONS.map((dim) => {
                              const val = event.eventVector[dim] || 0;
                              if (val > 0.3) {
                                return (
                                  <span key={dim} className="text-[10px] uppercase font-bold tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2.5 py-1 rounded-md">
                                    {dim}
                                  </span>
                                );
                              }
                              return null;
                            })}
                          </div>

                          <div className="flex gap-3">
                            <button 
                              onClick={() => handleInteraction(event.id, event.eventVector, false)}
                              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl transition-colors font-medium text-sm ${interactedEvents[event.id] === 'pass' ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/50' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 border border-transparent'}`}
                            >
                              <ThumbsDown className="w-4 h-4" /> {interactedEvents[event.id] === 'pass' ? 'Passed' : 'Pass'}
                            </button>
                            <button 
                              onClick={() => handleInteraction(event.id, event.eventVector, true)}
                              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl transition-colors font-medium text-sm shadow-sm ${interactedEvents[event.id] === 'like' ? 'bg-indigo-800 text-white border border-indigo-700' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-600/20 border border-transparent'}`}
                            >
                              <ThumbsUp className="w-4 h-4" /> {interactedEvents[event.id] === 'like' ? 'Liked' : 'Like'}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* ASSISTANT TAB */}
          {currentTab === 'assistant' && (
            <motion.div key="assistant" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-12rem)] md:h-[600px]">
              <div className="bg-indigo-600 p-4 flex items-center gap-3 text-white">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold">Roam Assistant</h3>
                  <p className="text-xs text-indigo-200">Personalized event recommendations</p>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-bl-sm'}`}>
                      <div className="markdown-body">
                        <Markdown>{m.content}</Markdown>
                      </div>
                    </div>
                  </div>
                ))}
                {isChatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-zinc-100 dark:bg-zinc-800 rounded-2xl rounded-bl-sm px-4 py-3">
                      <Loader2 className="w-4 h-4 text-zinc-500 animate-spin" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={chatInput} 
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendChatMessage()}
                    className="flex-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/50 dark:text-white transition-all" 
                    placeholder="e.g. Find me a quiet art gallery..." 
                  />
                  <button 
                    onClick={sendChatMessage} 
                    disabled={!chatInput.trim() || isChatLoading}
                    className="bg-indigo-600 text-white p-2.5 rounded-full hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    <Send className="w-4 h-4"/>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* PROFILE TAB */}
          {currentTab === 'profile' && (
            <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-zinc-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Your Taste Profile</h2>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Weights update automatically as you like/pass events.</p>
                  </div>
                </div>

                <div className="space-y-5">
                  {DIMENSIONS.map((dim, i) => (
                    <div key={dim}>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-medium text-zinc-700 dark:text-zinc-300">{dim}</span>
                        <span className="text-zinc-500 font-mono bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-xs">{(weights[i] * 100).toFixed(0)}%</span>
                      </div>
                      <div className="relative h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <motion.div 
                          className="absolute top-0 left-0 h-full bg-indigo-500 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${weights[i] * 100}%` }}
                          transition={{ type: 'spring', bounce: 0, duration: 0.8 }}
                        />
                      </div>
                      <input 
                        type="range" 
                        min="0" max="1" step="0.05"
                        value={weights[i]}
                        onChange={(e) => handleSliderChange(i, parseFloat(e.target.value))}
                        className="w-full mt-2 opacity-0 absolute -translate-y-6 cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-lg border-t border-zinc-200 dark:border-zinc-800 pb-safe z-30">
        <div className="flex justify-around items-center h-16 px-2">
          <button onClick={() => setCurrentTab('feed')} className={`flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors ${currentTab === 'feed' ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-500 dark:text-zinc-400'}`}>
            <Home className={`w-5 h-5 ${currentTab === 'feed' ? 'fill-current' : ''}`} />
            <span className="text-[10px] font-medium">Feed</span>
          </button>
          <button onClick={() => setCurrentTab('assistant')} className={`flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors ${currentTab === 'assistant' ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-500 dark:text-zinc-400'}`}>
            <MessageSquare className={`w-5 h-5 ${currentTab === 'assistant' ? 'fill-current' : ''}`} />
            <span className="text-[10px] font-medium">Assistant</span>
          </button>
          <button onClick={() => setCurrentTab('profile')} className={`flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors ${currentTab === 'profile' ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-500 dark:text-zinc-400'}`}>
            <User className={`w-5 h-5 ${currentTab === 'profile' ? 'fill-current' : ''}`} />
            <span className="text-[10px] font-medium">Profile</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
