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
  const [toast, setToast] = useState<Toast | null>(null);
  
  const [showDraftForm, setShowDraftForm] = useState(false);
  const [newLetterTitle, setNewLetterTitle] = useState('');
  const [newLetterContent, setNewLetterContent] = useState('');
  const [newLetterCategory, setNewLetterCategory] = useState('Romantic');
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
      setIsDbConnected(true);
      setLetters(data || []);
    } catch (err: any) {
      setIsDbConnected(false);
      setLetters(INITIAL_LETTERS); 
      showNotification("Archives offline. Local scrolls empty.", "error");
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
    const formattedDate = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
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
      const { error } = await supabase.from('letters').insert([letterToSave]);
      if (error) throw error;
      setLetters([letterToSave as Letter, ...letters]);
      setNewLetterContent('');
      setNewLetterTitle('');
      setShowDraftForm(false);
      showNotification("Your words are safely archived.", "success");
    } catch (err: any) {
      showNotification("Save failed. Connection error.", "error");
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
      showNotification("Failed to save reflection.", "error");
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
      showNotification("Failed to update status.", "error");
    }
  };

  const handleDeleteLetter = async (id: string) => {
    setIsSaving(true);
    try {
      const { error } = await supabase.from('letters').delete().eq('id', id);
      if (error) throw error;
      setLetters(letters.filter(l => l.id !== id));
      setSelectedLetter(null);
      showNotification("Dispatch struck from archives.", "info");
    } catch (err) {
      showNotification("Failed to destroy manuscript.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center text-[#f2e8cf] relative bg-[#2c1e14]">
         <BackgroundDecor />
         <div className="z-20 relative animate-pulse">
            <div className="text-4xl mb-4">🖋️</div>
            <h2 className="font-serif text-xl uppercase tracking-widest opacity-80">Opening Archives</h2>
         </div>
      </div>
    );
  }

  const isAuthor = userRole === 'Kurzsantol143';
  const isRecipient = userRole === 'kurzkalli01';

  if (!userRole) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-[#2c1e14]">
        <BackgroundDecor />
        <div className="max-w-2xl w-full flex flex-col items-center relative z-20">
          <div className="text-center mb-12">
             <span className="font-typewriter text-[10px] text-[#f2e8cf]/40 uppercase tracking-[0.6em] block mb-4">Classified Correspondence</span>
             <h1 className="font-elegant text-8xl text-[#d2b48c] drop-shadow-lg">Kalliana</h1>
          </div>

          <div className="paper-sheet rounded-sm shadow-2xl p-8 md:p-16 text-center w-full max-w-lg border-t-[12px] border-[#8b4513] animate-in zoom-in duration-700">
            <div className="relative z-10">
              <div className="text-5xl mb-10 opacity-80">🗝️</div>
              <div className="space-y-8">
                <input
                  type="password"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  placeholder="The Heart's Key..."
                  className="w-full px-4 py-4 bg-[#f2e8cf]/40 rounded-none border-b-2 border-[#d2b48c] focus:outline-none focus:border-[#8b4513] text-center font-typewriter text-lg"
                  onKeyPress={(e) => e.key === 'Enter' && handleUnlock()}
                />
                <button onClick={handleUnlock} className="w-full btn-vintage font-bold py-4 uppercase tracking-[0.3em] text-[10px]">Break the Seal</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 relative px-4 pt-10">
      <BackgroundDecor />

      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] animate-in fade-in slide-in-from-top-4">
          <div className="px-6 py-3 rounded-full shadow-2xl bg-white border-2 border-[#8b4513] text-[#8b4513] font-typewriter text-xs uppercase tracking-widest">
             {toast.message}
          </div>
        </div>
      )}
      
      <header className="max-w-5xl mx-auto mb-16 relative z-10 text-[#f2e8cf]">
        <div className="border-b border-[#f2e8cf]/20 pb-8 text-center">
            <h1 className="font-serif text-5xl md:text-8xl font-bold uppercase tracking-tighter mb-4">The Archives</h1>
            <div className="flex justify-center gap-8 items-center text-[9px] uppercase tracking-widest font-bold">
                <button onClick={handleLogout} className="underline underline-offset-4 decoration-[#8b4513]">Lock Desk</button>
                {isAuthor && <button onClick={() => setShowDraftForm(!showDraftForm)} className="btn-vintage px-5 py-2 rounded-sm">New Dispatch</button>}
            </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto relative z-10">
        {showDraftForm && isAuthor && (
          <div className="mb-20 animate-in fade-in zoom-in">
             <div className="paper-sheet p-8 md:p-16 max-w-3xl mx-auto border-t-[12px] border-[#8b4513]">
                <input
                  type="text"
                  value={newLetterTitle}
                  onChange={(e) => setNewLetterTitle(e.target.value)}
                  className="w-full bg-transparent border-b border-[#d2b48c] py-2 mb-6 focus:outline-none font-serif text-2xl"
                  placeholder="Subject..."
                />
                <textarea
                  value={newLetterContent}
                  onChange={(e) => setNewLetterContent(e.target.value)}
                  className="w-full h-80 bg-transparent focus:outline-none font-typewriter text-lg resize-none mb-10"
                  placeholder="Dearest Kalliana..."
                />
                <div className="flex justify-between items-center">
                  <div className="font-handwriting text-2xl text-[#8b4513]">Moshi</div>
                  <button onClick={saveDraft} className="btn-vintage px-10 py-3 text-xs uppercase tracking-widest">Seal Dispatch</button>
                </div>
             </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {letters.map((letter, index) => (
            <div
              key={letter.id}
              onClick={() => { setSelectedLetter(letter); setCurrentReaction(letter.reaction || ''); }}
              className="paper-sheet p-8 cursor-pointer hover:-translate-y-2 transition-all duration-300 group"
              style={{ transform: `rotate(${(index % 2 === 0 ? 1 : -1) * 0.5}deg)` }}
            >
              <div className="flex justify-between items-start mb-4 opacity-60">
                <span className="text-[8px] font-bold uppercase tracking-widest">{letter.category || 'Romantic'}</span>
                <span className="text-[9px] font-typewriter italic">{letter.date}</span>
              </div>
              <h3 className="font-serif text-xl font-bold text-[#3d2b1f] mb-3 uppercase">{letter.title}</h3>
              <p className="text-[#3d2b1f]/70 text-[13px] font-typewriter line-clamp-3 italic mb-4">{letter.excerpt}</p>
              <div className="flex justify-between items-center opacity-40">
                  <span className="font-elegant text-xl">Moshi</span>
                  {letter.is_favorite && <span>📌</span>}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* DETAILED LETTER VIEW */}
      {selectedLetter && (
        <div className="fixed inset-0 z-[150] flex flex-col bg-[#1a110a]/98 backdrop-blur-xl overflow-y-auto animate-in fade-in duration-300">
          
          {/* Overlay Controls */}
          <div className="sticky top-0 z-[160] w-full p-4 flex justify-between items-center bg-gradient-to-b from-[#1a110a] to-transparent pointer-events-none">
            <button 
              onClick={() => setSelectedLetter(null)} 
              className="pointer-events-auto bg-[#fdf5e6] text-[#8b4513] px-6 py-2 rounded-full font-bold text-[10px] tracking-widest uppercase shadow-2xl border border-[#d2b48c] hover:scale-105 transition-transform"
            >
              &larr; Return to Archives
            </button>
            
            {isAuthor && !showBurnConfirm && (
              <button 
                onClick={() => setShowBurnConfirm(true)}
                className="pointer-events-auto bg-red-900/20 text-red-500 px-6 py-2 rounded-full font-bold text-[10px] tracking-widest uppercase border border-red-900/50 hover:bg-red-900 hover:text-white transition-all"
              >
                Burn Correspondence
              </button>
            )}
          </div>

          {/* THE PHYSICAL LETTER */}
          <div className="w-full max-w-4xl mx-auto px-4 py-12 md:py-24 relative z-[155]">
            <div className="torn-edge bg-[#fdf5e6] min-h-screen relative p-8 md:p-20 lg:p-32 shadow-[0_35px_60px_-15px_rgba(0,0,0,0.6)] animate-in zoom-in slide-in-from-bottom-12 duration-700">
              
              {/* Stationary Decoration */}
              <div className="absolute top-8 right-8 md:top-16 md:right-16 postage-stamp">
                 <span>Official</span>
                 <div className="my-1 border-y border-[#8b4513]/20 w-full py-1 text-center font-serif italic">Archive</div>
                 <div className="text-[6px] opacity-40 uppercase">Post No. 143</div>
              </div>

              {/* Letter Metadata */}
              <div className="mb-16 md:mb-24">
                <div className="font-handwriting text-xl text-[#8b4513]/60 mb-1">Sent from the heart</div>
                <div className="font-typewriter text-xs uppercase tracking-[0.4em] text-[#8b4513] opacity-80 border-b border-[#d2b48c]/30 inline-block pb-1">
                  {selectedLetter.date}
                </div>
              </div>

              {/* Letter Content */}
              <div className="max-w-2xl mx-auto relative">
                
                {/* Handwritten Annotation in Margin (Desktop) */}
                <div className="hidden lg:block absolute -left-48 top-20 w-40 font-handwriting text-[#8b4513]/40 text-sm -rotate-6 leading-relaxed">
                   "Read this whenever you feel far away..."
                </div>

                <div className="font-handwriting text-3xl md:text-4xl text-[#3d2b1f] mb-12">Dearest Munchie,</div>
                
                <div className="drop-cap font-typewriter text-lg md:text-2xl leading-[2] md:leading-[2.4] text-[#3d2b1f] whitespace-pre-wrap">
                  {selectedLetter.content}
                </div>

                <div className="mt-24 md:mt-32 flex flex-col items-end">
                  <div className="font-elegant text-5xl md:text-7xl text-[#8b4513] mb-4">Forever yours,</div>
                  <div className="font-handwriting text-3xl md:text-4xl text-[#3d2b1f]">Moshi</div>
                  
                  {/* Interactive Wax Seal */}
                  <div 
                    onClick={() => toggleFavorite(selectedLetter.id, !!selectedLetter.is_favorite)}
                    className={`wax-seal mt-8 scale-125 transition-all duration-500 hover:scale-150 ${selectedLetter.is_favorite ? 'shadow-[0_0_20px_rgba(139,0,0,0.4)]' : 'grayscale-[0.4] opacity-80'}`}
                  >
                    <span className="text-sm">{selectedLetter.is_favorite ? '❤' : 'M'}</span>
                  </div>
                </div>
              </div>

              {/* Reflection Section */}
              <div className="mt-32 md:mt-48 pt-20 border-t border-[#d2b48c]/40 text-center">
                <h4 className="font-serif italic text-[#8b4513] mb-8 text-xl">A Reflection for the Archives</h4>
                {isRecipient ? (
                  <div className="max-w-xl mx-auto">
                    <textarea
                      value={currentReaction}
                      onChange={(e) => setCurrentReaction(e.target.value)}
                      className="w-full bg-transparent border-none focus:outline-none h-32 italic text-lg font-handwriting text-center placeholder:opacity-20"
                      placeholder="Write your heartbeat here..."
                    />
                    <button 
                      onClick={() => saveReaction(selectedLetter.id)}
                      className="mt-6 btn-vintage px-12 py-3 text-[10px] uppercase tracking-[0.3em] font-bold"
                    >
                      {isSaving ? 'Sealing...' : 'Seal Reflection'}
                    </button>
                  </div>
                ) : (
                  <p className="font-handwriting text-2xl text-[#3d2b1f]/60 max-w-xl mx-auto italic leading-relaxed">
                    {selectedLetter.reaction ? `"${selectedLetter.reaction}"` : "The archive awaits a heartbeat..."}
                  </p>
                )}
              </div>
            </div>

            {/* Burn Confirmation Overlay */}
            {showBurnConfirm && (
              <div className="fixed inset-0 z-[170] bg-[#1a110a]/95 backdrop-blur-2xl flex items-center justify-center p-8 animate-in fade-in zoom-in duration-300">
                <div className="text-center max-w-md">
                  <div className="text-6xl mb-8 animate-pulse">🔥</div>
                  <h3 className="font-serif text-3xl text-red-500 font-bold uppercase mb-4">Final Erasure</h3>
                  <p className="text-[#f2e8cf]/60 font-typewriter italic mb-12">Burning this manuscript will remove it from the archives forever. Are you certain?</p>
                  <div className="flex gap-6 justify-center">
                    <button onClick={() => setShowBurnConfirm(false)} className="px-10 py-3 bg-[#f2e8cf]/10 text-[#f2e8cf] rounded-full uppercase text-[10px] tracking-widest font-bold">Relent</button>
                    <button onClick={() => handleDeleteLetter(selectedLetter.id)} className="px-10 py-3 bg-red-600 text-white rounded-full uppercase text-[10px] tracking-widest font-bold shadow-2xl">Confirm Burn</button>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Scroll Bottom Spacing */}
          <div className="h-24 w-full flex-shrink-0"></div>
        </div>
      )}

      <footer className="mt-32 pb-20 text-center opacity-30 text-[#f2e8cf]">
        <p className="font-typewriter uppercase tracking-[0.5em] text-[8px]">Private Collection — JAN 2026</p>
      </footer>
    </div>
  );
};

export default App;