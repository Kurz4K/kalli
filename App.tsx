
import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Letter, UserRole } from './types';
import { INITIAL_LETTERS } from './constants';
import BackgroundDecor from './components/BackgroundDecor';
import AIAssistant from './components/AIAssistant';

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
  
  const [currentReaction, setCurrentReaction] = useState('');

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 6000);
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
      showNotification("Could not sync with Cloud Archive.", "error");
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
      showNotification("Ready to write, Moshi.", "success");
    } else {
      showNotification("The key does not turn.", "error");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    setUserRole(null);
  };

  const handleSuggest = (text: string) => {
    setNewLetterContent(text);
    setNewLetterTitle('A Spontaneous Dispatch');
    setShowDraftForm(true);
    showNotification("A draft has been prepared.", "info");
  };

  const saveDraft = async () => {
    if (!newLetterContent.trim() || !newLetterTitle.trim()) {
      showNotification("Title and message required.", "info");
      return;
    }

    setIsSaving(true);
    setSaveStep('Applying Wax Seal...');
    
    const letterToSave: Partial<Letter> = {
      id: Date.now().toString(),
      title: newLetterTitle,
      date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      excerpt: newLetterContent.slice(0, 80) + '...',
      content: newLetterContent,
      category: 'Romantic',
      is_favorite: false
    };

    try {
      await new Promise(r => setTimeout(r, 600));
      setSaveStep('Drying Ink...');
      
      const { error } = await supabase.from('letters').insert([letterToSave]);
      if (error) throw error;
      
      setSaveStep('Archiving...');
      await new Promise(r => setTimeout(r, 400));

      setLetters([letterToSave as Letter, ...letters]);
      setNewLetterContent('');
      setNewLetterTitle('');
      setShowDraftForm(false);
      showNotification("Memory safely archived.", "success");
      setLastError(null);
    } catch (err: any) {
      console.error("Save Error:", err);
      setLastError(err.message || "Database insert failed");
      showNotification("The ink bled. Could not save to cloud.", "error");
      
      // Local recovery option
      const backupKey = `backup_letter_${Date.now()}`;
      localStorage.setItem(backupKey, JSON.stringify(letterToSave));
    } finally {
      setIsSaving(false);
      setSaveStep('');
    }
  };

  const saveReaction = async (id: string) => {
    setIsSaving(true);
    setSaveStep('Sealing Reaction...');
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
      showNotification("Reflection sealed.", "success");
    } catch (err) {
      showNotification("Reaction could not be saved.", "error");
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
      showNotification("Could not update favorite status.", "error");
    }
  };

  const handleDeleteLetter = async (id: string) => {
    if (!window.confirm("Strike this memory from the record?")) return;
    setIsSaving(true);
    setSaveStep('Striking...');
    try {
      const { error } = await supabase.from('letters').delete().eq('id', id);
      if (error) throw error;
      setLetters(letters.filter(l => l.id !== id));
      setSelectedLetter(null);
      showNotification("Manuscript removed.", "info");
    } catch (err) {
      showNotification("Could not remove manuscript.", "error");
    } finally {
      setIsSaving(false);
      setSaveStep('');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f2e8cf] flex flex-col items-center justify-center p-8 text-center">
         <BackgroundDecor />
         <div className="z-10">
            <div className="w-16 h-16 border-4 border-[#8b4513] border-t-transparent rounded-full animate-spin mb-8 mx-auto"></div>
            <h2 className="font-serif text-2xl text-[#3d2b1f] uppercase tracking-widest mb-4">Opening Archives</h2>
            <p className="font-typewriter text-xs text-[#8b4513] italic animate-pulse">Syncing with Cloud...</p>
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
        <div className="max-w-md w-full bg-[#fdf5e6] rounded-2xl shadow-2xl p-8 md:p-10 text-center z-10 border-2 border-[#d2b48c] relative">
          <div className="absolute top-2 right-2 text-[#d2b48c] text-[10px] tracking-widest">№ 0143</div>
          <div className="text-5xl md:text-6xl mb-6 grayscale opacity-80">✉</div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-[#3d2b1f] mb-2 uppercase tracking-widest">Kalliana</h1>
          <p className="text-[#8b4513] mb-8 md:mb-10 italic font-typewriter text-xs md:text-sm">A private digital sanctuary.</p>
          <div className="space-y-6">
            <input
              type="password"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              placeholder="The Heart's Key..."
              className="w-full px-4 py-3 bg-[#f2e8cf] rounded-md border border-[#d2b48c] focus:outline-none focus:ring-1 focus:ring-[#8b4513] text-center font-typewriter text-base"
              onKeyPress={(e) => e.key === 'Enter' && handleUnlock()}
            />
            <button
              onClick={handleUnlock}
              className="w-full btn-vintage font-bold py-3 rounded-md shadow-md active:scale-95 uppercase tracking-widest text-xs"
            >
              Unlock the Heart
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 relative px-4">
      <BackgroundDecor />

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] animate-in fade-in slide-in-from-top-4">
          <div className={`px-6 py-3 rounded-lg shadow-2xl border-2 font-typewriter text-xs uppercase tracking-widest flex items-center gap-3 ${
            toast.type === 'success' ? 'bg-white border-green-600 text-green-800' :
            toast.type === 'error' ? 'bg-white border-red-600 text-red-800' :
            'bg-white border-[#8b4513] text-[#8b4513]'
          }`}>
             {toast.message}
          </div>
        </div>
      )}
      
      {isAuthor && <AIAssistant onSuggest={handleSuggest} />}

      {/* Header */}
      <header className="pt-16 md:pt-24 pb-12 md:pb-20 text-center relative z-10">
        <div className="absolute top-4 left-4 md:left-8 flex flex-col items-start gap-2">
           <div className="flex items-center gap-3 bg-white/60 px-3 py-1.5 rounded-full border border-[#d2b48c]/40 backdrop-blur-sm">
              <div className={`w-2.5 h-2.5 rounded-full ${isDbConnected === true ? 'bg-green-600 shadow-[0_0_8px_rgba(22,163,74,0.6)] animate-pulse' : isDbConnected === false ? 'bg-red-600' : 'bg-gray-400 animate-pulse'}`}></div>
              <span className="text-[9px] font-typewriter uppercase tracking-widest text-[#8b4513] font-bold">
                {isDbConnected === true ? 'Cloud Archive Linked' : isDbConnected === false ? 'Cloud Offline' : 'Syncing...'}
              </span>
           </div>
           {lastError && isAuthor && (
             <button 
               onClick={() => setShowSqlGuide(!showSqlGuide)} 
               className="text-[8px] uppercase tracking-widest text-red-700 underline font-bold bg-white/40 px-2 py-1 rounded"
             >
               View Diagnostic Guide
             </button>
           )}
        </div>

        <div className="inline-block border-y-2 border-[#d2b48c] py-4 md:py-6 px-6 md:px-12 mb-4 md:mb-6">
          <h1 className="font-serif text-3xl md:text-6xl text-[#3d2b1f] uppercase tracking-[0.2em] md:tracking-[0.25em] font-bold">The Archives</h1>
        </div>
        <p className="text-[#8b4513] font-cursive text-2xl md:text-3xl mb-4">Dedicated to Kalliana</p>
        <div className="flex justify-center gap-6 items-center">
            <button onClick={handleLogout} className="text-[10px] text-[#d2b48c] hover:text-[#8b4513] font-typewriter uppercase tracking-widest underline decoration-dotted">Relock Archive</button>
            {isSaving && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[#8b4513] font-typewriter italic">{saveStep}</span>
                <div className="w-1.5 h-1.5 bg-[#8b4513] rounded-full animate-bounce"></div>
              </div>
            )}
        </div>
      </header>

      {/* SQL Diagnostic Guide */}
      {showSqlGuide && isAuthor && (
        <div className="max-w-2xl mx-auto mb-12 bg-white p-6 border-2 border-red-200 rounded-lg shadow-xl relative z-50">
           <h3 className="font-serif font-bold text-red-800 mb-4 uppercase tracking-widest">Database Setup Guide</h3>
           <p className="text-xs font-typewriter text-[#3d2b1f] mb-4">
             If saving fails, ensure your Supabase table exists. Copy and run this in your Supabase SQL Editor:
           </p>
           <pre className="bg-gray-100 p-4 text-[10px] font-mono overflow-x-auto rounded border border-gray-300 select-all">
{`CREATE TABLE letters (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  category TEXT DEFAULT 'Romantic',
  reaction TEXT,
  is_favorite BOOLEAN DEFAULT false
);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE letters;`}
           </pre>
           <p className="text-[9px] text-red-600 mt-4 italic">Error: {lastError}</p>
           <button onClick={() => setShowSqlGuide(false)} className="mt-4 text-xs font-bold uppercase tracking-widest text-[#8b4513] underline">Close Guide</button>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-5xl mx-auto relative z-10">
        
        {isAuthor && (
          <div className="mb-12 md:mb-20">
             <button 
               onClick={() => setShowDraftForm(!showDraftForm)}
               disabled={isSaving}
               className={`w-full py-6 md:py-8 bg-white/40 border-2 border-dashed border-[#d2b48c] rounded-xl text-[#8b4513] hover:text-[#3d2b1f] hover:border-[#8b4513] transition-all flex items-center justify-center gap-4 md:gap-6 group font-typewriter shadow-inner ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
             >
               <span className="text-2xl md:text-3xl grayscale group-hover:grayscale-0 transition-all transform group-hover:scale-110">✒️</span>
               <span className="text-sm md:text-lg tracking-widest uppercase">
                 {isSaving ? saveStep : "Draft a New Dispatch..."}
               </span>
             </button>
             
             {showDraftForm && (
               <div className="mt-6 md:mt-8 bg-white rounded-xl shadow-2xl p-6 md:p-10 border-2 border-[#d2b48c] animate-in fade-in zoom-in duration-500 relative overflow-hidden">
                 {isSaving && <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-20 flex items-center justify-center rounded-xl font-serif text-xl text-[#8b4513] animate-pulse italic">{saveStep}</div>}
                 <div className="mb-6 md:mb-8">
                   <label className="block text-[10px] md:text-xs uppercase font-bold text-[#8b4513] mb-2 md:mb-3 font-typewriter tracking-widest underline">Subject of the Heart</label>
                   <input
                     type="text"
                     value={newLetterTitle}
                     disabled={isSaving}
                     onChange={(e) => setNewLetterTitle(e.target.value)}
                     className="w-full px-2 py-3 bg-gray-50/30 border-b border-[#d2b48c] focus:outline-none focus:border-[#8b4513] font-serif text-[#3d2b1f] text-2xl"
                     placeholder="Title..."
                   />
                 </div>
                 <div>
                   <label className="block text-[10px] md:text-xs uppercase font-bold text-[#8b4513] mb-2 md:mb-3 font-typewriter tracking-widest underline">The Correspondence</label>
                   <textarea
                     value={newLetterContent}
                     disabled={isSaving}
                     onChange={(e) => setNewLetterContent(e.target.value)}
                     className="w-full h-72 md:h-96 p-4 md:p-8 rounded-lg bg-gray-50/30 border border-[#d2b48c] focus:outline-none focus:ring-1 focus:ring-[#8b4513] font-typewriter text-[#3d2b1f] resize-none leading-loose text-lg"
                     placeholder="Write your soul into words..."
                   />
                 </div>
                 <div className="mt-6 md:mt-10 flex justify-end gap-4 md:gap-8">
                   <button onClick={() => setShowDraftForm(false)} className="px-4 py-2 text-[#8b4513] hover:text-[#3d2b1f] font-typewriter uppercase tracking-widest text-[10px]">Discard</button>
                   <button 
                     onClick={saveDraft} 
                     disabled={isSaving}
                     className="btn-vintage px-8 md:px-16 py-3 rounded-md font-bold shadow-xl uppercase tracking-widest text-[10px] transform hover:scale-105 active:scale-95 disabled:opacity-50"
                   >
                     {isSaving ? "Sealing..." : "Seal and File Away"}
                   </button>
                 </div>
               </div>
             )}
          </div>
        )}

        {/* Letters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          {letters.map((letter) => (
            <div
              key={letter.id}
              onClick={() => {
                setSelectedLetter(letter);
                setCurrentReaction(letter.reaction || '');
              }}
              className="bg-white rounded-sm p-8 md:p-12 shadow-md hover:shadow-2xl transition-all cursor-pointer border border-[#d2b48c] hover:-translate-y-1 group relative overflow-hidden"
            >
              {(letter.is_favorite || letter.category === 'Romantic') && (
                <div className="absolute top-0 right-8 md:right-12 w-8 h-12 bg-[#8b4513] shadow-lg z-20 flex flex-col items-center pt-1 border-x border-[#5d2e0a] after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-3 after:bg-white after:[clip-path:polygon(0%_100%,50%_0%,100%_100%)]">
                   <span className="text-white text-[8px] animate-pulse">❤</span>
                </div>
              )}

              <div className="flex justify-between items-start mb-6">
                <span className="text-[10px] font-bold border-b-2 border-[#8b4513] px-1 text-[#8b4513] uppercase tracking-widest">{letter.category || 'ROMANTIC'}</span>
                <span className="text-[10px] text-[#d2b48c] font-typewriter italic">{letter.date}</span>
              </div>
              <h3 className="font-serif text-2xl md:text-3xl font-bold text-[#3d2b1f] mb-4 group-hover:text-[#8b4513] transition-colors uppercase leading-tight">{letter.title}</h3>
              <p className="text-[#3d2b1f]/80 text-sm md:text-base font-typewriter line-clamp-3 leading-relaxed italic">{letter.excerpt}</p>
              
              {letter.reaction && (
                <div className="mt-6 pt-4 border-t border-[#d2b48c]/40 text-[10px] text-[#8b4513] font-typewriter italic">
                  "{letter.reaction}"
                </div>
              )}
            </div>
          ))}
        </div>
      </main>

      {/* Letter Viewer Modal */}
      {selectedLetter && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 md:p-12 lg:p-20">
          <div className="absolute inset-0 bg-[#3d2b1f]/90 backdrop-blur-sm" onClick={() => setSelectedLetter(null)}></div>
          <div className="relative w-full max-w-5xl bg-[#fdf5e6] rounded-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col max-h-[95vh] border-4 border-double border-[#d2b48c]">
            <div className="p-6 border-b border-[#d2b48c] flex justify-between items-center bg-white relative">
              <div className="flex flex-col">
                <div className="flex items-center gap-4">
                  <h2 className="font-serif text-xl md:text-3xl font-bold text-[#3d2b1f] uppercase tracking-widest">{selectedLetter.title}</h2>
                  {isAuthor && (
                    <button 
                      onClick={() => toggleFavorite(selectedLetter.id, !!selectedLetter.is_favorite)}
                      className={`text-xl transition-all transform hover:scale-125 ${selectedLetter.is_favorite ? 'text-red-700' : 'text-[#d2b48c] grayscale opacity-50'}`}
                    >
                      ❤
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[10px] text-[#d2b48c] italic font-typewriter">{selectedLetter.date}</span>
                </div>
              </div>
              <button onClick={() => setSelectedLetter(null)} className="p-2 hover:bg-gray-100 rounded-full text-[#8b4513]">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 md:p-20 lg:p-32 letter-paper relative">
               <div className="max-w-2xl mx-auto">
                 <div className="mb-10 text-[#8b4513] font-cursive text-3xl">Dearest Kalliana,</div>
                 <div className="space-y-8">
                   {selectedLetter.content.split('\n\n').map((para, i) => (
                     <p key={i} className="font-typewriter text-[#3d2b1f] text-base md:text-xl leading-relaxed first-letter:text-4xl first-letter:font-serif first-letter:text-[#8b4513] first-letter:mr-2 first-letter:float-left">
                       {para}
                     </p>
                   ))}
                 </div>
                 <div className="mt-20 pt-10 border-t-2 border-[#d2b48c]/50">
                   <p className="font-cursive text-4xl text-[#8b4513]">Always yours,</p>
                   <p className="font-serif font-bold text-xl text-[#3d2b1f] uppercase mt-4 tracking-widest">Moshi</p>
                 </div>

                 {/* Reaction Section */}
                 <div className="mt-20 p-6 bg-white/50 border border-[#d2b48c]/30 rounded shadow-inner">
                    <h4 className="font-serif text-[10px] font-bold text-[#8b4513] uppercase tracking-[0.3em] mb-4 text-center">Your Reflection</h4>
                    {isRecipient ? (
                      <div className="flex flex-col gap-4">
                        <textarea
                          value={currentReaction}
                          disabled={isSaving}
                          onChange={(e) => setCurrentReaction(e.target.value)}
                          placeholder="How did these words find you?"
                          className="w-full p-4 bg-transparent border-2 border-[#d2b48c]/40 rounded font-typewriter text-sm h-32 italic focus:outline-none focus:border-[#8b4513]"
                        />
                        <button 
                          onClick={() => saveReaction(selectedLetter.id)}
                          disabled={isSaving}
                          className="self-center px-8 py-2 bg-[#8b4513] text-white text-[10px] font-bold uppercase tracking-widest rounded hover:bg-[#5d2e0a]"
                        >
                          Seal Reflection
                        </button>
                      </div>
                    ) : (
                      <div className="text-center italic">
                         <p className="font-typewriter text-[#3d2b1f] text-sm">
                           {selectedLetter.reaction ? `"${selectedLetter.reaction}"` : "Silence... awaiting a heart's reflection."}
                         </p>
                      </div>
                    )}
                 </div>

                 {isAuthor && (
                   <div className="mt-12 flex justify-center">
                      <button 
                        onClick={() => handleDeleteLetter(selectedLetter.id)}
                        disabled={isSaving}
                        className="text-[10px] text-red-700/60 hover:text-red-700 font-bold font-typewriter uppercase tracking-widest flex items-center gap-2"
                      >
                         Strike from Record
                      </button>
                   </div>
                 )}
               </div>
            </div>
          </div>
        </div>
      )}

      <footer className="mt-24 pt-12 pb-20 text-center border-t border-[#d2b48c]/20 relative z-10">
        <p className="text-[#d2b48c] font-typewriter uppercase tracking-[0.4em] text-[9px]">A Secret Collection — Est. 2023</p>
      </footer>
    </div>
  );
};

export default App;
