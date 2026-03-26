/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Book as BookIcon, 
  MessageSquare, 
  Sparkles, 
  Settings, 
  LogOut, 
  Lock, 
  ChevronRight, 
  ChevronLeft,
  Type,
  Bookmark,
  Highlighter,
  Search,
  ArrowLeft
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { GoogleGenAI } from "@google/genai";
import { cn } from './lib/utils';
import { Book, User, Post, AdminConfig } from './types';
import { BOOKS, GAS_API_URL } from './constants';

// --- Components ---

const Login = ({ onLogin }: { onLogin: (user: User) => void }) => {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name === '태혁' && password === '1229') {
      onLogin({ name: '태혁', role: 'admin' });
    } else if (name && password === '1234') {
      onLogin({ name, role: 'student' });
    } else {
      setError('이름 또는 비밀번호가 올바르지 않습니다.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#F5F2ED]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-[#E6D5BC]"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#433422] mb-2">훈초정음</h1>
          <p className="text-[#8C7851] whitespace-pre-line">
            초등학생을 바르게 이끄는 독서 플랫폼{"\n"}고전을 읽고 함께 토론합시다.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#433422] mb-1">이름</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-[#E6D5BC] focus:ring-2 focus:ring-[#8C7851] outline-none transition-all"
              placeholder="이름을 입력하세요"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#433422] mb-1">비밀번호</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-[#E6D5BC] focus:ring-2 focus:ring-[#8C7851] outline-none transition-all"
              placeholder="비밀번호를 입력하세요"
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button 
            type="submit"
            className="w-full bg-[#8C7851] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#726142] transition-colors shadow-lg active:scale-95"
          >
            로그인하기
          </button>
        </form>
      </motion.div>
    </div>
  );
};

const Bookshelf = ({ books, onSelectBook }: { books: Book[], onSelectBook: (book: Book) => void }) => {
  return (
    <div className="py-8 px-4 overflow-hidden">
      <h2 className="text-2xl font-bold text-[#433422] mb-6 flex items-center gap-2">
        <BookIcon className="w-6 h-6" /> 나의 서재
      </h2>
      <div className="flex gap-6 overflow-x-auto pb-8 bookshelf-scroll snap-x">
        {books.map((book) => (
          <motion.div 
            key={book.id}
            whileHover={!book.isLocked ? { scale: 1.05 } : {}}
            whileTap={!book.isLocked ? { scale: 0.95 } : {}}
            onClick={() => !book.isLocked && onSelectBook(book)}
            className={cn(
              "flex-shrink-0 w-48 snap-start cursor-pointer group",
              book.isLocked && "opacity-60 grayscale cursor-not-allowed"
            )}
          >
            <div className="relative aspect-[3/4] rounded-xl overflow-hidden shadow-lg mb-3 bg-white border border-[#E6D5BC]">
              <img 
                src={book.cover} 
                alt={book.title} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              {book.isLocked && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Lock className="text-white w-10 h-10" />
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/10">
                <div 
                  className="h-full bg-[#8C7851]" 
                  style={{ width: `${book.progress}%` }}
                />
              </div>
            </div>
            <h3 className="font-bold text-[#433422] truncate">{book.title}</h3>
            <p className="text-sm text-[#8C7851]">{book.author}</p>
            <p className="text-xs font-bold text-[#8C7851] mt-1">{book.progress}% 읽음</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentMode, setCurrentMode] = useState<'library' | 'reader' | 'ai' | 'board' | 'admin'>('library');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [fontSize, setFontSize] = useState(3); // 1 to 5
  const [isGoalReached, setIsGoalReached] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [aiQuestions, setAiQuestions] = useState<{ debate: string[], inference: string[] }>({ debate: [], inference: [] });
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedText, setSelectedText] = useState<{ text: string, x: number, y: number } | null>(null);

  const handleTextSelect = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelectedText({
        text: selection.toString().trim(),
        x: rect.left + rect.width / 2,
        y: rect.top
      });
    } else {
      setSelectedText(null);
    }
  };

  const saveToWordbook = async (word: string) => {
    if (!user) return;
    try {
      await fetch(GAS_API_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'saveWord',
          studentName: user.name,
          word: word,
          timestamp: new Date().toISOString()
        })
      });
      alert(`'${word}'가 단어장에 저장되었습니다.`);
      setSelectedText(null);
    } catch (error) {
      console.error("GAS Error:", error);
      alert("단어장 저장에 실패했습니다. (네트워크 확인)");
    }
  };

  const saveAdminConfig = async (config: AdminConfig) => {
    try {
      await fetch(GAS_API_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'saveConfig',
          ...config
        })
      });
      alert("설정이 저장되었습니다.");
    } catch (error) {
      console.error("GAS Error:", error);
      alert("설정 저장에 실패했습니다.");
    }
  };
  useEffect(() => {
    setPosts([
      { id: '1', author: '민수', content: '심청이가 인당수에 빠지는 장면이 너무 슬펐어요.', timestamp: Date.now() - 100000 },
      { id: '2', author: '지우', content: '효심이란 무엇일까 생각해보게 되었습니다.', timestamp: Date.now() - 50000 },
    ]);
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
    if (userData.role === 'admin') setCurrentMode('admin');
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentMode('library');
    setSelectedBook(null);
  };

  const handleSelectBook = (book: Book) => {
    setSelectedBook(book);
    setCurrentMode('reader');
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#8C7851', '#E6D5BC', '#433422']
    });
    setIsGoalReached(true);
  };

  const generateQuestions = async (topic: string) => {
    if (!topic) return;
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `초등학생 독서 토론을 위한 질문을 생성해줘. 주제: "${topic}". 
        논쟁 질문(찬반이 갈릴 수 있는 것) 3개와 추론 질문(내용을 바탕으로 깊이 생각할 수 있는 것) 3개를 JSON 형식으로 응답해줘. 
        형식: { "debate": ["질문1", "질문2", "질문3"], "inference": ["질문1", "질문2", "질문3"] }`,
        config: { responseMimeType: "application/json" }
      });
      
      const result = JSON.parse(response.text || '{}');
      setAiQuestions(result);
    } catch (error) {
      console.error("AI Error:", error);
      // Fallback mock data
      setAiQuestions({
        debate: ["심청이의 행동은 진정한 효도인가?", "용왕의 요구는 정당한가?", "심봉사는 딸을 보내지 말았어야 했나?"],
        inference: ["심청이가 인당수에 빠지기 직전 어떤 기분이었을까?", "연꽃에서 다시 태어난 심청이는 어떤 삶을 살았을까?", "심봉사가 눈을 뜬 것은 어떤 의미일까?"]
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (!user) return <Login onLogin={handleLogin} />;

  return (
    <div className="min-h-screen bg-[#F5F2ED] flex flex-col">
      {/* Navigation Bar */}
      <nav className="bg-white border-b border-[#E6D5BC] px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <h1 
            className="text-2xl font-bold text-[#433422] cursor-pointer"
            onClick={() => setCurrentMode('library')}
          >
            훈초정음
          </h1>
          <div className="h-6 w-px bg-[#E6D5BC]" />
          <div className="flex gap-2">
            <NavButton 
              active={currentMode === 'library'} 
              onClick={() => setCurrentMode('library')}
              icon={<BookIcon size={20} />}
              label="서재"
            />
            <NavButton 
              active={currentMode === 'ai'} 
              onClick={() => setCurrentMode('ai')}
              icon={<Sparkles size={20} />}
              label="AI 질문"
            />
            <NavButton 
              active={currentMode === 'board'} 
              onClick={() => setCurrentMode('board')}
              icon={<MessageSquare size={20} />}
              label="나눔터"
            />
            {user.role === 'admin' && (
              <NavButton 
                active={currentMode === 'admin'} 
                onClick={() => setCurrentMode('admin')}
                icon={<Settings size={20} />}
                label="관리자"
              />
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-[#433422] font-medium">
            <span className="text-[#8C7851] font-bold">{user.name}</span> 학생 반갑습니다!
          </span>
          <button 
            onClick={handleLogout}
            className="p-2 text-[#8C7851] hover:bg-[#F5F2ED] rounded-full transition-colors"
          >
            <LogOut size={20} />
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {currentMode === 'library' && (
            <motion.div 
              key="library"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="max-w-7xl mx-auto w-full"
            >
              <div className="p-8">
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-[#E6D5BC] mb-8">
                  <h2 className="text-3xl font-bold text-[#433422] mb-2">오늘의 독서 목표</h2>
                  <p className="text-[#8C7851]">심청전을 50%까지 읽고 나눔터에 의견을 남겨주세요!</p>
                </div>
                <Bookshelf books={BOOKS} onSelectBook={handleSelectBook} />
              </div>
            </motion.div>
          )}

          {currentMode === 'reader' && selectedBook && (
            <motion.div 
              key="reader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#F4ECD8] flex flex-col"
            >
              {/* Reader Header */}
              <div className="bg-white/80 backdrop-blur-md border-b border-[#E6D5BC] px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setCurrentMode('library')}
                    className="p-2 hover:bg-[#F5F2ED] rounded-full"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <h3 className="font-bold text-[#433422]">{selectedBook.title}</h3>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center bg-[#F5F2ED] rounded-lg p-1">
                    <button onClick={() => setFontSize(Math.max(1, fontSize - 1))} className="p-2 hover:bg-white rounded-md"><Type size={16} /></button>
                    <span className="px-3 font-bold text-sm">{fontSize}</span>
                    <button onClick={() => setFontSize(Math.min(5, fontSize + 1))} className="p-2 hover:bg-white rounded-md"><Type size={24} /></button>
                  </div>
                  <button className="p-2 text-[#8C7851]"><Bookmark size={20} /></button>
                  <button className="p-2 text-[#8C7851]"><Highlighter size={20} /></button>
                </div>
              </div>

              {/* Reader Content */}
              <div 
                className="flex-1 overflow-y-auto p-8 md:p-16 max-w-4xl mx-auto w-full"
                onMouseUp={handleTextSelect}
                onTouchEnd={handleTextSelect}
              >
                <div 
                  className={cn(
                    "font-serif leading-relaxed text-[#5B4636] transition-all duration-300",
                    fontSize === 1 && "text-sm",
                    fontSize === 2 && "text-base",
                    fontSize === 3 && "text-xl",
                    fontSize === 4 && "text-2xl",
                    fontSize === 5 && "text-3xl",
                  )}
                >
                  <h1 className="text-4xl font-bold mb-8 text-center">{selectedBook.title}</h1>
                  <p className="mb-6">
                    옛날 어느 마을에 심학도라는 사람이 살고 있었습니다. 그는 앞이 보이지 않는 맹인이었으나, 마음씨가 매우 착하고 어질어 사람들은 그를 심 봉사라 불렀습니다. 심 봉사에게는 심청이라는 딸이 하나 있었는데, 심청이는 태어나자마자 어머니를 여의고 아버지의 손에서 자라났습니다.
                  </p>
                  <p className="mb-6">
                    심청이는 자라면서 아버지의 눈이 되어 드렸습니다. 아침이면 아버지를 모시고 산책을 나가고, 저녁이면 맛있는 밥을 지어 대접했습니다. 마을 사람들은 심청이의 효심에 감동하여 칭찬이 자자했습니다.
                  </p>
                  <p className="mb-6">
                    그러던 어느 날, 심 봉사는 길을 가다 개천에 빠지고 말았습니다. 그때 지나가던 승려가 그를 구해 주며 말했습니다. "공양미 삼백 석을 시주하면 눈을 뜰 수 있을 것입니다." 심 봉사는 그 말에 덜컥 약속을 하고 말았지만, 가난한 형편에 공양미 삼백 석을 구할 길은 막막했습니다.
                  </p>
                  <div className="h-32 flex items-center justify-center border-t border-dashed border-[#8C7851]/30 mt-12">
                    {!isGoalReached ? (
                      <button 
                        onClick={triggerConfetti}
                        className="bg-[#8C7851] text-white px-8 py-4 rounded-2xl font-bold shadow-lg hover:scale-105 transition-transform"
                      >
                        오늘의 목표 달성! (클릭)
                      </button>
                    ) : (
                      <div className="text-center">
                        <p className="text-[#8C7851] font-bold mb-4">축하합니다! 오늘의 목표를 다 읽었습니다.</p>
                        <div className="flex gap-4">
                          <button className="bg-white border border-[#8C7851] text-[#8C7851] px-6 py-3 rounded-xl font-bold">독서오락관 가기</button>
                          <button onClick={() => setCurrentMode('board')} className="bg-[#8C7851] text-white px-6 py-3 rounded-xl font-bold">나눔터에 글쓰기</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Word Tooltip */}
              <AnimatePresence>
                {selectedText && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                    style={{ 
                      position: 'fixed', 
                      left: selectedText.x, 
                      top: selectedText.y - 10,
                      transform: 'translateX(-50%) translateY(-100%)'
                    }}
                    className="z-[100] bg-white p-4 rounded-2xl shadow-2xl border border-[#E6D5BC] w-64"
                  >
                    <h4 className="font-bold text-[#433422] mb-1">{selectedText.text}</h4>
                    <p className="text-xs text-[#8C7851] mb-3">뜻풀이: [사전 데이터 로딩 중...]</p>
                    <button 
                      onClick={() => saveToWordbook(selectedText.text)}
                      className="w-full bg-[#8C7851] text-white py-2 rounded-lg text-xs font-bold"
                    >
                      단어장에 저장
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {currentMode === 'ai' && (
            <motion.div 
              key="ai"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto w-full p-8"
            >
              <div className="bg-white rounded-3xl shadow-sm border border-[#E6D5BC] p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-[#F5F2ED] rounded-2xl">
                    <Sparkles className="text-[#8C7851]" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-[#433422]">AI 질문 생성기</h2>
                    <p className="text-[#8C7851]">책을 읽고 궁금한 점이나 토론하고 싶은 주제를 입력해보세요.</p>
                  </div>
                </div>

                <div className="flex gap-3 mb-8">
                  <input 
                    type="text" 
                    placeholder="예: 심청이의 효심, 인당수 제물..."
                    className="flex-1 px-6 py-4 rounded-2xl border border-[#E6D5BC] focus:ring-2 focus:ring-[#8C7851] outline-none"
                    onKeyDown={(e) => e.key === 'Enter' && generateQuestions(e.currentTarget.value)}
                  />
                  <button 
                    disabled={isGenerating}
                    onClick={() => {
                      const input = document.querySelector('input') as HTMLInputElement;
                      generateQuestions(input.value);
                    }}
                    className="bg-[#8C7851] text-white px-8 py-4 rounded-2xl font-bold hover:bg-[#726142] transition-colors disabled:opacity-50"
                  >
                    {isGenerating ? '생성 중...' : '질문 만들기'}
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-bold text-[#433422] flex items-center gap-2">
                      <MessageSquare size={18} className="text-blue-500" /> 논쟁 질문 후보
                    </h3>
                    {aiQuestions.debate.map((q, i) => (
                      <motion.div 
                        key={i}
                        whileHover={{ x: 5 }}
                        className="p-4 bg-[#F5F2ED] rounded-xl border border-[#E6D5BC] cursor-pointer hover:border-[#8C7851] transition-colors group"
                      >
                        <p className="text-[#5B4636] text-sm leading-relaxed">{q}</p>
                        <div className="mt-2 flex justify-end">
                          <span className="text-[10px] font-bold text-[#8C7851] opacity-0 group-hover:opacity-100 transition-opacity">질문 선택하기 →</span>
                        </div>
                      </motion.div>
                    ))}
                    {aiQuestions.debate.length === 0 && <p className="text-sm text-[#8C7851] italic">주제를 입력하면 질문이 나타납니다.</p>}
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-bold text-[#433422] flex items-center gap-2">
                      <Search size={18} className="text-orange-500" /> 추론 질문 후보
                    </h3>
                    {aiQuestions.inference.map((q, i) => (
                      <motion.div 
                        key={i}
                        whileHover={{ x: 5 }}
                        className="p-4 bg-[#F5F2ED] rounded-xl border border-[#E6D5BC] cursor-pointer hover:border-[#8C7851] transition-colors group"
                      >
                        <p className="text-[#5B4636] text-sm leading-relaxed">{q}</p>
                        <div className="mt-2 flex justify-end">
                          <span className="text-[10px] font-bold text-[#8C7851] opacity-0 group-hover:opacity-100 transition-opacity">질문 선택하기 →</span>
                        </div>
                      </motion.div>
                    ))}
                    {aiQuestions.inference.length === 0 && <p className="text-sm text-[#8C7851] italic">주제를 입력하면 질문이 나타납니다.</p>}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {currentMode === 'board' && (
            <motion.div 
              key="board"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex h-full"
            >
              <div className="flex-1 p-8 overflow-y-auto">
                <div className="max-w-5xl mx-auto">
                  <div className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-bold text-[#433422]">자유 나눔터</h2>
                    <button 
                      onClick={() => {
                        const content = prompt('내용을 입력하세요:');
                        if (content) {
                          setPosts([{ id: Date.now().toString(), author: user.name, content, timestamp: Date.now() }, ...posts]);
                        }
                      }}
                      className="bg-[#8C7851] text-white px-6 py-3 rounded-xl font-bold shadow-lg"
                    >
                      글쓰기
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {posts.map((post) => (
                      <motion.div 
                        layout
                        key={post.id}
                        className="bg-white p-6 rounded-2xl shadow-sm border border-[#E6D5BC] relative group"
                      >
                        <p className="font-bold text-[#433422] mb-3">{post.author}</p>
                        <p className="text-[#5B4636] leading-relaxed">{post.content}</p>
                        {post.author === user.name && (
                          <button className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-2 text-[#8C7851] hover:bg-[#F5F2ED] rounded-lg transition-all">
                            수정
                          </button>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <aside className="w-64 bg-white border-l border-[#E6D5BC] p-6 hidden lg:block">
                <h3 className="font-bold text-[#433422] mb-4">참여 현황</h3>
                <p className="text-xs text-[#8C7851] mb-6 uppercase tracking-wider font-bold">아직 글을 쓰지 않은 친구</p>
                <ul className="space-y-3">
                  {['김철수', '이영희', '박지민', '최수연'].map((name) => (
                    <li key={name} className="flex items-center gap-2 text-[#5B4636]">
                      <div className="w-2 h-2 rounded-full bg-gray-300" />
                      {name}
                    </li>
                  ))}
                </ul>
              </aside>
            </motion.div>
          )}

          {currentMode === 'admin' && (
            <motion.div 
              key="admin"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-4xl mx-auto w-full p-8"
            >
              <div className="bg-white rounded-3xl shadow-sm border border-[#E6D5BC] p-8">
                <h2 className="text-2xl font-bold text-[#433422] mb-8">관리자 설정</h2>
                
                <div className="space-y-8">
                  <div>
                    <label className="block font-bold text-[#433422] mb-4">오늘 읽을 책 지정</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {BOOKS.map(book => (
                        <div 
                          key={book.id}
                          className={cn(
                            "p-4 rounded-2xl border-2 cursor-pointer transition-all",
                            book.id === '1' ? "border-[#8C7851] bg-[#F5F2ED]" : "border-[#E6D5BC] hover:border-[#8C7851]/50"
                          )}
                        >
                          <img src={book.cover} alt="" className="w-full aspect-[3/4] object-cover rounded-lg mb-2" />
                          <p className="text-xs font-bold truncate">{book.title}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block font-bold text-[#433422] mb-2">시작 범위 (%)</label>
                      <input type="number" defaultValue={0} className="w-full px-4 py-3 rounded-xl border border-[#E6D5BC]" />
                    </div>
                    <div>
                      <label className="block font-bold text-[#433422] mb-2">종료 범위 (%)</label>
                      <input type="number" defaultValue={50} className="w-full px-4 py-3 rounded-xl border border-[#E6D5BC]" />
                    </div>
                  </div>

                  <button className="w-full bg-[#433422] text-white py-4 rounded-xl font-bold text-lg shadow-lg">
                    설정 저장하기 (GAS 전송)
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer / Status */}
      <footer className="bg-white border-t border-[#E6D5BC] px-6 py-2 text-[10px] text-[#8C7851] flex justify-between uppercase tracking-widest font-bold">
        <span>훈초정음 v1.0.0</span>
        <span>Chromebook Optimized</span>
      </footer>
    </div>
  );
}

const NavButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button 
    onClick={onClick}
    className={cn(
      "flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all",
      active ? "bg-[#8C7851] text-white shadow-md" : "text-[#8C7851] hover:bg-[#F5F2ED]"
    )}
  >
    {icon}
    <span className="hidden md:inline">{label}</span>
  </button>
);

const QuestionCard = ({ text }: { text: string }) => (
  <motion.div 
    whileHover={{ x: 5 }}
    className="p-4 bg-[#F5F2ED] rounded-xl border border-[#E6D5BC] cursor-pointer hover:border-[#8C7851] transition-colors group"
  >
    <p className="text-[#5B4636] text-sm leading-relaxed">{text}</p>
    <div className="mt-2 flex justify-end">
      <span className="text-[10px] font-bold text-[#8C7851] opacity-0 group-hover:opacity-100 transition-opacity">질문 선택하기 →</span>
    </div>
  </motion.div>
);
