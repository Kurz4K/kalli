
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Letter, UserRole } from './types';
import { INITIAL_LETTERS } from './constants';
import BackgroundDecor from './components/BackgroundDecor';

// Supabase Configuration
const SUPABASE_URL = 'https://cvsydgnfndwpivipbkce.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_wtdfOx8aSr1MmZ4iQkTqxg_VK4F3VIM';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface Toast {
  message: string;
  type: 'success' | 'error' | 'info';
}

const App: React.FC = () => {
  const [letters, setLetters] = useState<Letter[]>([]);
  const [selectedLetter, setSelectedLetter] = useState<Letter | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [accessCode, setAccessCode] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStep, setSaveStep] = useState('');
  const [isDbConnected, setIsDbConnected] = useState<boolean | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [showSqlGuide, setShowSqlGuide] = useState(false);
  
  const [showDraftForm, setShowDraftForm] = useState(false);
  const [newLetterTitle, setNewLetterTitle] = useState('');
  const [newLetterContent, setNewLetterContent] = useState('');
  const [newLetterCategory, setNewLetterCategory] = useState('Romantic');
  const [showBurnConfirm, setShowBurnConfirm] = useState(false);
  
  const [currentReaction, setCurrentReaction] = useState('');

  // Handle body scroll locking
  useEffect(() => {
    if (selectedLetter) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
      setShowBurnConfirm(false);
    }
    return () => document.body.classList.remove('overflow-hidden');
  }, [selectedLetter]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
  };

  useEffect(() => {
    const savedRole = localStorage.getItem('userRole') as UserRole;
    if (savedRole) setUserRole(savedRole);
    fetchLetters();
  }, []);

  const fetchLetters = async () => {
    setIsLoading(true);
    setLastError(null);
    try {
      const { data, error } = await supabase
        .from('letters')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setIsDbConnected(true);
      if (data && data.length > 0) {
        setLetters(data as Letter[]);
      } else {
        setLetters(INITIAL_LETTERS);
      }
    } catch (err: any) {
      console.error("Supabase Fetch Error:", err);
      setIsDbConnected(false);
      setLastError(err.message || "Archive Unreachable");
      setLetters(INITIAL_LETTERS);
      showNotification("Archives offline. Using local scrolls.", "error");
    } finally {
      setTimeout(() => setIsLoading(false), 800);
    }
  };

  const handleUnlock = () => {
    const code = accessCode.trim();
    if (code === 'kurzkalli01') {
      setUserRole('kurzkalli01');
      localStorage.setItem('userRole', 'kurzkalli01');
      showNotification("Welcome back, Kalliana.", "success");
    } else if (code === 'Kurzsantol143') {
      setUserRole('Kurzsantol143');
      localStorage.setItem('userRole', 'Kurzsantol143');
      showNotification("Welcome, Moshi.", "success");
    } else {
      showNotification("The key failed to turn.", "error");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    setUserRole(null);
  };

  const saveDraft = async () => {
    if (!newLetterContent.trim() || !newLetterTitle.trim()) {
      showNotification("Title and content are needed.", "info");
      return;
    }

    setIsSaving(true);
    setSaveStep('Applying Wax Seal...');
    
    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });

    const letterToSave: Partial<Letter> = {
      id: Date.now().toString(),
      title: newLetterTitle,
      date: formattedDate,
      excerpt: newLetterContent.slice(0, 100).trim() + '...',
      content: newLetterContent,
      category: newLetterCategory as any || 'Romantic',
      is_favorite: false
    };

    try {
      await new Promise(r => setTimeout(r, 1000));
      setSaveStep('Drying Ink...');
      
      const { error } = await supabase.from('letters').insert([letterToSave]);
      if (error) throw error;
      
      setSaveStep('Archiving...');
      await new Promise(r => setTimeout(r, 500));

      setLetters([letterToSave as Letter, ...letters]);
      setNewLetterContent('');
      setNewLetterTitle('');
      setNewLetterCategory('Romantic');
      setShowDraftForm(false);
      showNotification("Your words are safely archived.", "success");
      setLastError(null);
    } catch (err: any) {
      console.error("Save Error:", err);
      setLastError(err.message || "Database failed");
      showNotification("Save failed. Local recovery active.", "error");
      
      const backupKey = `recovery_${Date.now()}`;
      localStorage.setItem(backupKey, JSON.stringify(letterToSave));
    } finally {
      setIsSaving(false);
      setSaveStep('');
    }
  };

  const saveReaction = async (id: string) => {
    setIsSaving(true);
    setSaveStep('Sealing Reflection...');
    try {
      const { error } = await supabase
        .from('letters')
        .update({ reaction: currentReaction })
        .eq('id', id);

      if (error) throw error;

      const updated = letters.map(l => l.id === id ? { ...l, reaction: currentReaction } : l);
      setLetters(updated);
      if (selectedLetter) {
        setSelectedLetter({ ...selectedLetter, reaction: currentReaction });
      }
      setCurrentReaction('');
      showNotification("Reflection recorded.", "success");
    } catch (err) {
      showNotification("Failed to save reflection.", "error");
    } finally {
      setIsSaving(false);
      setSaveStep('');
    }
  };

  const toggleFavorite = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('letters')
        .update({ is_favorite: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      const updatedLetters = letters.map(l => l.id === id ? { ...l, is_favorite: !currentStatus } : l);
      setLetters(updatedLetters);
      if (selectedLetter && selectedLetter.id === id) {
        setSelectedLetter({ ...selectedLetter, is_favorite: !currentStatus });
      }
    } catch (err) {
      showNotification("Failed to update status.", "error");
    }
  };

  const handleDeleteLetter = async (id: string) => {
    setIsSaving(true);
    setSaveStep('Burning...');
    try {
      const { error } = await supabase.from('letters').delete().eq('id', id);
      if (error) throw error;
      setLetters(letters.filter(l => l.id !== id));
      setSelectedLetter(null);
      setShowBurnConfirm(false);
      showNotification("Dispatch struck from archives.", "info");
    } catch (err) {
      showNotification("Failed to destroy.", "error");
    } finally {
      setIsSaving(false);
      setSaveStep('');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center text-[#f2e8cf]">
         <BackgroundDecor />
         <div className="z-10">
            <div className="w-12 h-12 border-2 border-[#f2e8cf]/20 border-t-[#8b4513] rounded-full animate-spin mb-6 mx-auto"></div>
            <h2 className="font-serif text-xl uppercase tracking-widest opacity-80">Accessing Archives</h2>
            <p className="font-typewriter text-[10px] mt-2 italic opacity-60">Wait for the seals to break...</p>
         </div>
      </div>
    );
  }

  const isAuthor = userRole === 'Kurzsantol143';
  const isRecipient = userRole === 'kurzkalli01';

  if (!userRole) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
        <BackgroundDecor />
        <div className="max-w-md w-full paper-sheet rounded shadow-2xl p-10 md:p-12 text-center z-10 border-t-8 border-[#8b4513] animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="text-4xl mb-6 grayscale opacity-60">✒️</div>
          <h1 className="font-elegant text-5xl text-[#3d2b1f] mb-2">Kalliana</h1>
          <p className="text-[#8b4513] mb-10 italic font-typewriter text-xs uppercase tracking-widest">A Private Correspondence</p>
          <div className="space-y-6">
            <input
              type="password"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              placeholder="The Heart's Key..."
              className="w-full px-4 py-3 bg-[#f2e8cf]/30 rounded-none border-b-2 border-[#d2b48c] focus:outline-none focus:border-[#8b4513] text-center font-typewriter text-base placeholder:opacity-50"
              onKeyPress={(e) => e.key === 'Enter' && handleUnlock()}
            />
            <button
              onClick={handleUnlock}
              className="w-full btn-vintage font-bold py-3 uppercase tracking-[0.2em] text-xs shadow-md"
            >
              Open Archives
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 relative px-4 pt-10">
      <BackgroundDecor />

      {/* Connection status stickers */}
      <div className="fixed top-4 left-4 z-50 flex flex-col gap-2 pointer-events-none">
          <div className={`px-3 py-1 text-[8px] font-bold uppercase tracking-widest rounded shadow-sm border ${isDbConnected ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'} transition-all`}>
            {isDbConnected ? 'Archives Sync: OK' : 'Archives Sync: Offline'}
          </div>
          {isSaving && (
            <div className="px-3 py-1 bg-[#8b4513] text-[#f2e8cf] text-[8px] font-bold uppercase tracking-widest rounded shadow-md animate-pulse">
              {saveStep}
            </div>
          )}
      </div>

      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] animate-in fade-in slide-in-from-top-4 duration-500">
          <div className={`px-6 py-3 rounded-full shadow-2xl border-2 font-typewriter text-xs uppercase tracking-widest flex items-center gap-3 ${
            toast.type === 'success' ? 'bg-white border-green-600 text-green-800' :
            toast.type === 'error' ? 'bg-white border-red-600 text-red-800' :
            'bg-white border-[#8b4513] text-[#8b4513]'
          }`}>
             <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>
             {toast.message}
          </div>
        </div>
      )}
      
      {/* Header */}
      <header className="max-w-5xl mx-auto mb-16 relative z-10 text-[#f2e8cf]">
        <div className="border-b border-[#f2e8cf]/20 pb-8 text-center">
            <div className="flex justify-between items-end mb-4 text-[10px] font-typewriter uppercase tracking-[0.3em] opacity-60">
                <span>VOL. I — NO. 143</span>
                <span className="font-handwriting text-xl text-[#d2b48c] lowercase tracking-normal">for the munchie</span>
                <span>EST. JAN 2026</span>
            </div>
            <h1 className="font-serif text-5xl md:text-8xl font-bold uppercase tracking-tighter mb-2">The Archives</h1>
            <div className="h-0.5 bg-[#f2e8cf]/40 w-full mb-1"></div>
            <div className="h-px bg-[#f2e8cf]/40 w-full"></div>
            <div className="mt-4 flex justify-center gap-8 items-center text-[9px] uppercase tracking-widest font-bold">
                <button onClick={handleLogout} className="hover:text-white transition-colors underline underline-offset-4 decoration-[#8b4513]">Lock Desk</button>
                {isAuthor && (
                  <button onClick={() => setShowDraftForm(!showDraftForm)} className="bg-[#8b4513] px-4 py-1.5 rounded-sm hover:bg-[#5d2e0a] transition-colors shadow-lg border border-[#5d2e0a]">New Dispatch</button>
                )}
            </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="max-w-6xl mx-auto relative z-10">
        
        {/* Write View */}
        {showDraftForm && isAuthor && (
          <div className="mb-20 animate-in fade-in zoom-in duration-500">
             <div className="paper-sheet p-8 md:p-16 max-w-3xl mx-auto rounded-sm border-t-[12px] border-[#8b4513] shadow-inner">
                <div className="flex flex-col md:flex-row gap-6 mb-8">
                  <div className="flex-1">
                    <label className="text-[10px] uppercase font-bold text-[#8b4513] block mb-2 font-typewriter tracking-widest">Subject</label>
                    <input
                      type="text"
                      value={newLetterTitle}
                      onChange={(e) => setNewLetterTitle(e.target.value)}
                      className="w-full bg-transparent border-b border-[#d2b48c] py-2 focus:outline-none focus:border-[#8b4513] font-serif text-2xl text-[#3d2b1f]"
                      placeholder="Title..."
                    />
                  </div>
                  <div className="w-full md:w-48">
                    <label className="text-[10px] uppercase font-bold text-[#8b4513] block mb-2 font-typewriter tracking-widest">Category</label>
                    <input
                      type="text"
                      value={newLetterCategory}
                      onChange={(e) => setNewLetterCategory(e.target.value)}
                      className="w-full bg-transparent border-b border-[#d2b48c] py-2 focus:outline-none focus:border-[#8b4513] font-serif text-2xl text-[#3d2b1f]"
                      placeholder="Theme..."
                    />
                  </div>
                </div>

                <div className="relative mb-10">
                  <label className="text-[10px] uppercase font-bold text-[#8b4513] block mb-4 font-typewriter tracking-widest">Correspondence</label>
                  <textarea
                    value={newLetterContent}
                    onChange={(e) => setNewLetterContent(e.target.value)}
                    className="w-full h-80 bg-transparent focus:outline-none font-typewriter text-[#3d2b1f] resize-none leading-relaxed text-lg"
                    placeholder="Dearest Kalliana..."
                  />
                  <div className="h-px bg-gradient-to-r from-transparent via-[#d2b48c] to-transparent mt-4"></div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="font-handwriting text-2xl text-[#8b4513]">Always, Moshi</div>
                  <div className="flex gap-4">
                    <button onClick={() => setShowDraftForm(false)} className="text-[10px] font-bold uppercase tracking-widest text-[#8b4513]">Cancel</button>
                    <button 
                        onClick={saveDraft}
                        disabled={isSaving}
                        className="btn-vintage px-10 py-3 text-xs font-bold uppercase tracking-widest disabled:opacity-50"
                    >
                        {isSaving ? 'Sealing...' : 'Seal Dispatch'}
                    </button>
                  </div>
                </div>
             </div>
          </div>
        )}

        {/* List View */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 items-start">
          {letters.length === 0 && !isLoading && (
            <div className="col-span-full text-center py-20 text-[#f2e8cf]/40 italic font-typewriter">
                The archives are currently empty.
            </div>
          )}
          {letters.map((letter, index) => {
            const rotation = (index % 3 === 0) ? '-1deg' : (index % 3 === 1) ? '1deg' : '0.5deg';
            const cardStyle = (index % 4 === 0) ? 'paper-stack' : (index % 4 === 1) ? 'postcard' : 'paper-sheet';
            
            return (
              <div
                key={letter.id}
                onClick={() => {
                  setSelectedLetter(letter);
                  setCurrentReaction(letter.reaction || '');
                }}
                className={`${cardStyle} p-6 md:p-8 cursor-pointer hover:-translate-y-2 hover:rotate-0 transition-all duration-300 group`}
                style={{ transform: `rotate(${rotation})` }}
              >
                {letter.is_favorite && (
                    <div className="absolute -top-3 -left-3 text-red-800 text-xl drop-shadow-md z-20">📌</div>
                )}
                
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[8px] font-bold border-b border-[#8b4513] text-[#8b4513] uppercase tracking-widest">{letter.category || 'Romantic'}</span>
                  <span className="text-[9px] text-[#8b4513]/60 font-typewriter italic">{letter.date}</span>
                </div>

                <h3 className="font-serif text-xl font-bold text-[#3d2b1f] mb-3 group-hover:text-[#8b4513] transition-colors uppercase leading-tight">{letter.title}</h3>
                <p className="text-[#3d2b1f]/70 text-[13px] font-typewriter line-clamp-4 leading-relaxed italic border-l-2 border-[#d2b48c]/30 pl-3">
                  {letter.excerpt}
                </p>
                
                <div className="mt-6 flex justify-between items-center opacity-40 group-hover:opacity-100 transition-opacity">
                    <span className="font-elegant text-lg text-[#8b4513]">Moshi</span>
                    {letter.reaction && <span className="text-xs">💌</span>}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Detail View Modal */}
      {selectedLetter && (
        <div className="fixed inset-0 z-[100] bg-[#1a110a]/95 backdrop-blur-md overflow-y-auto overflow-x-hidden flex flex-col p-4 md:p-10 lg:p-16">
          <div className="absolute inset-0 cursor-pointer" onClick={() => setSelectedLetter(null)}></div>
          
          <div className="relative w-full max-w-4xl mx-auto my-auto bg-[#fdf5e6] rounded-sm shadow-2xl border-[1px] border-[#d2b48c] paper-sheet flex flex-col z-10 animate-in zoom-in duration-300">
            
            {/* Modal Header Redesign */}
            <div className="p-4 md:p-6 border-b border-[#d2b48c]/30 flex justify-between items-center bg-[#fdf5e6]/50">
                <button 
                  onClick={() => setSelectedLetter(null)} 
                  className="btn-paper-tab flex items-center gap-3"
                >
                    <span className="opacity-70">&larr;</span> TUCK AWAY
                </button>

                <div className="text-[#8b4513]/30 font-typewriter uppercase text-[9px] tracking-[0.4em] hidden sm:block">
                    {selectedLetter.category} — {selectedLetter.date}
                </div>

                {isAuthor && (
                    <button 
                        onClick={() => setShowBurnConfirm(!showBurnConfirm)}
                        className={`text-[9px] uppercase tracking-widest font-bold px-4 py-2 border border-transparent transition-all ${showBurnConfirm ? 'bg-red-900 text-white shadow-inner' : 'text-red-900/40 hover:text-red-900 hover:border-red-900/20'}`}
                    >
                        {showBurnConfirm ? 'WAIT...' : 'BURN'}
                    </button>
                )}
            </div>

            {/* Content Container */}
            <div className="p-10 md:p-20 lg:p-24 font-typewriter text-[#3d2b1f] relative min-h-[60vh]">
                
                {/* Burn Confirmation Overlay */}
                {showBurnConfirm && (
                   <div className="absolute inset-0 z-50 flex items-center justify-center p-10 text-center bg-[#fdf5e6]/90 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
                      <div className="max-w-sm">
                         <div className="text-4xl mb-6 grayscale">🔥</div>
                         <h4 className="font-serif text-2xl text-red-900 uppercase tracking-widest mb-4">Strike from Record?</h4>
                         <p className="text-xs text-[#3d2b1f]/70 leading-relaxed mb-10 italic">This manuscript will be lost to time. You cannot undo this act of erasure.</p>
                         <div className="flex gap-4 justify-center">
                            <button onClick={() => setShowBurnConfirm(false)} className="px-6 py-2 border border-[#d2b48c] text-[10px] uppercase font-bold tracking-widest hover:bg-[#efe6d5] transition-colors">Relent</button>
                            <button onClick={() => handleDeleteLetter(selectedLetter.id)} className="px-6 py-2 bg-red-900 text-white text-[10px] uppercase font-bold tracking-widest hover:bg-black transition-colors shadow-lg">Incinerate</button>
                         </div>
                      </div>
                   </div>
                )}

                <div className="max-w-2xl mx-auto">
                    <div className="mb-16">
                        <div className="font-handwriting text-3xl text-[#8b4513] mb-2">Dearest Munchie,</div>
                        <div className="h-px w-20 bg-[#8b4513]/20"></div>
                    </div>

                    <div className="text-xl md:text-2xl leading-[1.9] space-y-10 whitespace-pre-wrap">
                        {selectedLetter.content}
                    </div>

                    {/* Signature and Seal */}
                    <div className="mt-20 flex flex-col items-end relative">
                        <div className="font-elegant text-5xl text-[#8b4513] mb-4">Always yours,</div>
                        <div className="font-serif font-bold uppercase tracking-[0.5em] text-sm mb-12">Moshi</div>
                        
                        <div 
                          onClick={(e) => { e.stopPropagation(); toggleFavorite(selectedLetter.id, !!selectedLetter.is_favorite); }}
                          className={`wax-seal select-none hover:scale-110 transition-transform cursor-pointer absolute -bottom-4 right-0 ${selectedLetter.is_favorite ? 'shadow-[0_0_20px_rgba(139,0,0,0.4)] scale-110' : 'opacity-80'}`}
                          style={{ backgroundColor: selectedLetter.is_favorite ? '#8b0000' : '#4d3b2e' }}
                          title={selectedLetter.is_favorite ? "Unpin Memory" : "Pin Memory"}
                        >
                          <span className="text-xs">{selectedLetter.is_favorite ? '❤' : 'M'}</span>
                        </div>
                    </div>

                    {/* Reflection Section */}
                    <div className="mt-32 pt-16 border-t border-[#d2b48c]/50">
                        <h4 className="font-serif text-[11px] font-bold text-[#8b4513] uppercase tracking-[0.4em] mb-8 text-center">A Heart's Reflection</h4>
                        {isRecipient ? (
                          <div className="bg-[#f2e8cf]/20 p-8 rounded-sm border border-dashed border-[#d2b48c] shadow-inner">
                            <textarea
                              value={currentReaction}
                              onChange={(e) => setCurrentReaction(e.target.value)}
                              placeholder="Whisper back to the archive..."
                              className="w-full bg-transparent border-none focus:outline-none h-24 italic text-sm font-typewriter resize-none leading-relaxed"
                            />
                            <div className="flex justify-end mt-4">
                                <button 
                                  onClick={() => saveReaction(selectedLetter.id)}
                                  disabled={isSaving}
                                  className="btn-vintage px-8 py-2.5 text-[10px] uppercase font-bold tracking-widest"
                                >
                                  {isSaving ? 'Sealing...' : 'Seal Reflection'}
                                </button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center italic px-10">
                             <p className="text-sm opacity-60 leading-relaxed font-typewriter">
                               {selectedLetter.reaction ? `"${selectedLetter.reaction}"` : "The archive is silent... awaiting a reflection."}
                             </p>
                          </div>
                        )}
                    </div>
                </div>
            </div>
          </div>
          <div className="h-20 w-full shrink-0"></div>
        </div>
      )}

      {/* Diagnostic Fix */}
      {showSqlGuide && isAuthor && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80">
            <div className="relative bg-white p-8 max-w-xl w-full border-t-8 border-red-800 shadow-2xl rounded-sm">
               <h3 className="font-serif text-xl font-bold mb-4">Fix Archive Schema</h3>
               <p className="text-xs mb-4">Run this in your Supabase SQL Editor:</p>
               <pre className="bg-gray-100 p-4 text-[10px] font-mono rounded overflow-x-auto select-all mb-6">
{`ALTER TABLE letters ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false;
ALTER TABLE letters ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Romantic';
ALTER TABLE letters ADD COLUMN IF NOT EXISTS reaction TEXT;`}
               </pre>
               <div className="flex justify-end gap-4">
                    <button onClick={() => setShowSqlGuide(false)} className="text-xs font-bold uppercase underline">Close</button>
                    <button onClick={fetchLetters} className="bg-red-800 text-white px-6 py-2 text-xs font-bold uppercase rounded">Reload</button>
               </div>
            </div>
        </div>
      )}

      <footer className="mt-32 pt-16 pb-20 text-center opacity-30 text-[#f2e8cf] relative z-10">
        <div className="w-16 h-px bg-current mx-auto mb-4"></div>
        <p className="font-typewriter uppercase tracking-[0.5em] text-[8px]">Private Collection — № 0143 — EST. JAN 2026</p>
      </footer>
    </div>
  );
};

export default App;
