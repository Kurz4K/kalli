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
  const [toast, setToast] = useState<Toast | null>(null);
  
  const [showDraftForm, setShowDraftForm] = useState(false);
  const [newLetterTitle, setNewLetterTitle] = useState('');
  const [newLetterContent, setNewLetterContent] = useState('');
  const [newLetterCategory, setNewLetterCategory] = useState('');
  const [showBurnConfirm, setShowBurnConfirm] = useState(false);
  
  const [currentReaction, setCurrentReaction] = useState('');

  useEffect(() => {
    if (selectedLetter) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
      setShowBurnConfirm(false);
    }
    return () => { document.body.style.overflow = 'auto'; };
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
    try {
      const { data, error } = await supabase
        .from('letters')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLetters(data || []);
    } catch (err: any) {
      setLetters(INITIAL_LETTERS); 
      showNotification("Archives offline.", "error");
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
      showNotification("Cipher invalid.", "error");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    setUserRole(null);
  };

  const saveDraft = async () => {
    if (!newLetterContent.trim() || !newLetterTitle.trim()) {
      showNotification("Details required.", "info");
      return;
    }
    setIsSaving(true);
    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const letterToSave: Partial<Letter> = {
      id: Date.now().toString(),
      title: newLetterTitle,
      date: formattedDate,
      excerpt: newLetterContent.slice(0, 100).trim() + '...',
      content: newLetterContent,
      category: (newLetterCategory.trim() || 'Romantic') as any,
      is_favorite: false
    };
    try {
      const { error } = await supabase.from('letters').insert([letterToSave]);
      if (error) throw error;
      setLetters([letterToSave as Letter, ...letters]);
      setNewLetterContent('');
      setNewLetterTitle('');
      setNewLetterCategory('');
      setShowDraftForm(false);
      showNotification("Dispatched.", "success");
    } catch (err: any) {
      showNotification("Dispatch failed.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const saveReaction = async (id: string) => {
    setIsSaving(true);
    try {
      const { error } = await supabase.from('letters').update({ reaction: currentReaction }).eq('id', id);
      if (error) throw error;
      const updated = letters.map(l => l.id === id ? { ...l, reaction: currentReaction } : l);
      setLetters(updated);
      if (selectedLetter) setSelectedLetter({ ...selectedLetter, reaction: currentReaction });
      showNotification("Reflection recorded.", "success");
    } catch (err) {
      showNotification("Failed to save.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleFavorite = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from('letters').update({ is_favorite: !currentStatus }).eq('id', id);
      if (error) throw error;
      const updatedLetters = letters.map(l => l.id === id ? { ...l, is_favorite: !currentStatus } : l);
      setLetters(updatedLetters);
      if (selectedLetter && selectedLetter.id === id) setSelectedLetter({ ...selectedLetter, is_favorite: !currentStatus });
    } catch (err) {
      showNotification("Failed update.", "error");
    }
  };

  const handleDeleteLetter = async (id: string) => {
    setIsSaving(true);
    try {
      const { error } = await supabase.from('letters').delete().eq('id', id);
      if (error) throw error;
      setLetters(letters.filter(l => l.id !== id));
      setSelectedLetter(null);
      showNotification("Destroyed.", "info");
    } catch (err) {
      showNotification("Failed erasure.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-[#2c1e14]">
         <BackgroundDecor />
         <div className="z-20 relative animate-pulse flex flex-col items-center">
            <div className="text-4xl mb-4">🖋️</div>
            <h2 className="font-serif text-xl uppercase tracking-widest text-[#f2e8cf]/60">Accessing Archives</h2>
         </div>
      </div>
    );
  }

  const isAuthor = userRole === 'Kurzsantol143';
  const isRecipient = userRole === 'kurzkalli01';

  if (!userRole) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 relative bg-[#2c1e14]">
        <BackgroundDecor />
        <div className="max-w-lg w-full relative z-20 text-center">
          <div className="mb-16">
             <h1 className="font-elegant text-8xl md:text-9xl text-[#d2b48c] drop-shadow-2xl">Kalliana</h1>
             <p className="font-handwriting text-2xl text-[#f2e8cf]/60 mt-4 italic">Memories archived in ink...</p>
          </div>
          <div className="paper-sheet p-10 md:p-16 border-t-[8px] border-[#8b4513] shadow-2xl">
             <div className="mb-10 flex justify-center">
                <div className="w-16 h-16 bg-[#8b0000] rounded-full flex items-center justify-center text-white shadow-xl animate-pulse">❤</div>
             </div>
             <input
                type="password"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                placeholder="The Cipher..."
                className="w-full px-4 py-4 bg-transparent border-b-2 border-[#d2b48c]/40 focus:outline-none focus:border-[#8b4513] text-center font-typewriter text-xl mb-10 text-[#3d2b1f]"
                onKeyPress={(e) => e.key === 'Enter' && handleUnlock()}
             />
             <button onClick={handleUnlock} className="w-full btn-vintage font-bold py-4 uppercase tracking-[0.4em] text-[10px]">
                Unseal Archives
             </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 relative px-4 pt-10">
      <BackgroundDecor />

      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[300] animate-in fade-in slide-in-from-top-4">
          <div className="px-6 py-3 rounded-full shadow-2xl bg-white border-2 border-[#8b4513] text-[#8b4513] font-typewriter text-[10px] uppercase tracking-widest font-bold">
             {toast.message}
          </div>
        </div>
      )}
      
      <header className="max-w-6xl mx-auto mb-16 relative z-10 text-[#f2e8cf]">
        <div className="border-b border-[#f2e8cf]/20 pb-8 text-center">
            <h1 className="font-serif text-5xl md:text-8xl font-bold uppercase tracking-tighter mb-4">The Archives</h1>
            <div className="flex justify-center gap-8 items-center text-[9px] uppercase tracking-widest font-bold opacity-60">
                <button onClick={handleLogout} className="hover:text-white transition-colors underline underline-offset-4">Lock Desk</button>
                {isAuthor && <button onClick={() => setShowDraftForm(!showDraftForm)} className="btn-vintage px-5 py-2">New Dispatch</button>}
            </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto relative z-10">
        {showDraftForm && isAuthor && (
          <div className="mb-24 animate-in fade-in zoom-in">
             <div className="paper-sheet p-8 md:p-16 max-w-4xl mx-auto border-t-[12px] border-[#8b4513] shadow-2xl">
                <div className="flex flex-col md:flex-row gap-6 mb-8">
                  <div className="flex-[2]">
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-[#8b4513]/60 mb-1 font-typewriter">Subject</label>
                    <input
                      type="text" value={newLetterTitle} onChange={(e) => setNewLetterTitle(e.target.value)}
                      className="w-full bg-transparent border-b border-[#d2b48c] py-2 focus:outline-none font-serif text-2xl text-[#3d2b1f]" placeholder="Title your memory..."
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-[#8b4513]/60 mb-1 font-typewriter">Category</label>
                    <input
                      type="text" value={newLetterCategory} onChange={(e) => setNewLetterCategory(e.target.value)}
                      className="w-full bg-transparent border-b border-[#d2b48c] py-2 focus:outline-none font-typewriter text-sm text-[#3d2b1f]" placeholder="Secret, Memory..."
                    />
                  </div>
                </div>
                <div className="mb-10">
                  <textarea
                    value={newLetterContent} onChange={(e) => setNewLetterContent(e.target.value)}
                    className="w-full h-96 bg-transparent focus:outline-none font-typewriter text-lg resize-none leading-relaxed text-[#3d2b1f]" placeholder="Dearest Kalliana..."
                  />
                </div>
                <div className="flex justify-between items-center">
                  <div className="font-handwriting text-2xl text-[#8b4513]">Moshi</div>
                  <div className="flex gap-4">
                    <button onClick={() => setShowDraftForm(false)} className="text-[10px] font-bold uppercase tracking-widest text-[#8b4513]/60">Discard</button>
                    <button onClick={saveDraft} disabled={isSaving} className="btn-vintage px-10 py-3 text-xs uppercase tracking-widest">Seal Dispatch</button>
                  </div>
                </div>
             </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-12 px-4">
          {letters.map((letter, index) => (
            <div
              key={letter.id}
              onClick={() => { setSelectedLetter(letter); setCurrentReaction(letter.reaction || ''); }}
              className={`paper-sheet p-8 pt-12 cursor-pointer ${index % 2 === 0 ? 'paper-texture-2' : 'paper-texture-3'}`}
              style={{ transform: `rotate(${(index % 3 === 0 ? 2 : index % 3 === 1 ? -2 : 1) * (Math.random() + 0.5)}deg)` }}
            >
              <div className="archive-stamp absolute top-4 right-4 scale-75 opacity-40">
                № {143 + index}<br/>Archive
              </div>
              <div className="font-typewriter text-[9px] uppercase tracking-widest text-[#8b4513]/60 mb-4">{letter.category || 'ROMANTIC'}</div>
              <h3 className="font-serif text-xl font-bold text-[#3d2b1f] uppercase mb-4 line-clamp-2 leading-tight">{letter.title}</h3>
              <p className="text-[#3d2b1f]/80 text-sm font-typewriter line-clamp-4 italic mb-8 leading-relaxed">{letter.excerpt}</p>
              <div className="flex justify-between items-end mt-auto">
                <div className="flex flex-col">
                  <span className="text-[9px] font-typewriter opacity-40 uppercase tracking-widest">{letter.date}</span>
                  <span className="font-elegant text-2xl text-[#8b4513] mt-1">Moshi</span>
                </div>
                {letter.is_favorite && <div className="text-[#8b0000]">❤</div>}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* MANUSCRIPT VIEW (EXACTLY LIKE SCREENSHOT) */}
      {selectedLetter && (
        <div className="fixed inset-0 z-[250] bg-[#1a110a] overflow-y-auto pt-6 pb-20 animate-in fade-in duration-500">
          
          {/* Header Controls */}
          <div className="sticky top-4 w-full px-6 flex justify-between items-center z-[260] mb-12">
            <button 
              onClick={() => setSelectedLetter(null)} 
              className="pill-btn-back shadow-lg active:scale-95 transition-transform"
            >
              &larr; Return to archives
            </button>
            {isAuthor && (
              <button 
                onClick={() => setShowBurnConfirm(true)}
                className="pill-btn-burn shadow-lg active:scale-95 transition-transform"
              >
                Burn<br/>Correspondence
              </button>
            )}
          </div>

          {/* The Manuscript */}
          <div className="manuscript-parchment animate-in zoom-in duration-700">
            {/* Stamp from screenshot */}
            <div className="absolute top-12 right-12">
              <div className="archive-stamp">
                 OFFICIAL<br/>
                 <div className="border-y border-dashed border-[#8b4513]/20 my-1 py-1 px-4">ARCHIVE</div>
                 POST NO. 143
              </div>
            </div>

            <div className="relative z-10">
              {/* Header text from screenshot */}
              <div className="mb-20">
                <div className="font-handwriting text-4xl text-[#8b4513]/60 mb-2 italic">
                  Sent from the heart
                </div>
                <div className="font-typewriter text-xs uppercase tracking-[0.4em] text-[#8b4513]/40 border-b border-[#8b4513]/10 pb-2 inline-block">
                  {selectedLetter.date.toUpperCase()}
                </div>
              </div>

              {/* Salutation from screenshot */}
              <div className="font-handwriting text-5xl text-[#3d2b1f] mb-16 leading-tight ink-bleed">
                Dearest Munchie,
              </div>

              {/* Content with screenshot's drop-cap style */}
              <div className="manuscript-content illuminated-drop-cap font-typewriter text-xl md:text-2xl leading-[2.5] text-[#3d2b1f] whitespace-pre-wrap ink-bleed">
                {selectedLetter.content}
              </div>

              {/* Signature block from screenshot */}
              <div className="mt-32 flex flex-col items-end mr-4">
                <div className="font-handwriting text-4xl text-[#8b4513] italic -rotate-2">
                  Forever yours,
                </div>
                <div className="font-handwriting text-5xl text-[#3d2b1f] mt-4 mr-8 ink-bleed">
                  Moshi
                </div>
                <div className="mt-8 opacity-20 font-typewriter text-sm tracking-widest mr-4">M</div>
                
                {/* Heart interaction */}
                <div 
                  onClick={() => toggleFavorite(selectedLetter.id, !!selectedLetter.is_favorite)}
                  className={`mt-16 w-16 h-16 rounded-full flex items-center justify-center cursor-pointer transition-all duration-500 hover:scale-110 shadow-2xl relative
                    ${selectedLetter.is_favorite ? 'bg-[#8b0000] text-white' : 'bg-[#3d2b1f]/20 text-[#3d2b1f]/40 grayscale'}`}
                >
                  <span className="text-xl">❤</span>
                  <div className="absolute -top-10 text-[8px] uppercase tracking-widest font-bold text-[#8b4513] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {selectedLetter.is_favorite ? 'Bound in Heart' : 'Press Heart'}
                  </div>
                </div>
              </div>

              {/* Reflection section (Styled like the bottom divider in screenshot) */}
              <div className="mt-48 pt-20 border-t border-[#d2b48c]/30 text-center relative">
                <p className="font-handwriting text-xl text-[#8b4513]/40 mb-10 italic">A heart's reflection...</p>
                {isRecipient ? (
                  <div className="max-w-xl mx-auto">
                    <textarea 
                      value={currentReaction} onChange={(e) => setCurrentReaction(e.target.value)}
                      className="w-full bg-transparent border-none focus:outline-none h-40 italic font-handwriting text-3xl text-center text-[#3d2b1f] placeholder:opacity-20 leading-relaxed"
                      placeholder="Write your heartbeat..."
                    />
                    <button onClick={() => saveReaction(selectedLetter.id)} className="mt-8 pill-btn-back px-12 py-3">
                      Seal Reflection
                    </button>
                  </div>
                ) : (
                  <div className="max-w-2xl mx-auto font-handwriting text-4xl text-[#3d2b1f]/60 italic leading-relaxed py-8">
                    {selectedLetter.reaction ? `"${selectedLetter.reaction}"` : "The archive is silent, waiting for your reflection..."}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showBurnConfirm && (
        <div className="fixed inset-0 z-[400] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-8 animate-in fade-in zoom-in duration-300">
          <div className="text-center max-w-sm">
            <div className="text-7xl mb-8 animate-pulse">🔥</div>
            <h3 className="font-serif text-3xl text-red-600 font-bold uppercase mb-4">Final Erasure</h3>
            <p className="text-[#f2e8cf]/60 font-typewriter italic mb-12">Burning this manuscript will remove it from the archives forever. Are you certain?</p>
            <div className="flex gap-4 justify-center">
              <button onClick={() => setShowBurnConfirm(false)} className="pill-btn-back px-8 py-3 bg-white/10 text-white border-white/20">Relent</button>
              <button onClick={() => handleDeleteLetter(selectedLetter?.id || '')} className="pill-btn-burn px-8 py-3 shadow-[0_0_30px_rgba(220,38,38,0.3)]">Confirm Burn</button>
            </div>
          </div>
        </div>
      )}

      <footer className="mt-32 pb-20 text-center opacity-20 text-[#f2e8cf]">
        <p className="font-typewriter uppercase tracking-[0.5em] text-[8px]">Private Correspondence Archives — MOSHI & KALLIANA</p>
      </footer>
    </div>
  );
};

export default App;