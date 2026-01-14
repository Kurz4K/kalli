
import { GoogleGenAI } from '@google/genai';
import React, { useState } from 'react';
import { ROMANTIC_PROMPTS } from '../constants';

const AIAssistant: React.FC<{ onSuggest: (text: string) => void }> = ({ onSuggest }) => {
  const [loading, setLoading] = useState(false);
  const [showPanel, setShowPanel] = useState(false);

  const generateIdea = async (prompt: string) => {
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Write a short, heartfelt, and slightly playful love letter for a girl named Kalliana. The author is her partner, Moshi. The tone should be similar to: "chill", "honest", "not too dramatic", and "sincere". Use a mix of English and Tagalog (Taglish). Focus on this topic: ${prompt}. Keep it under 150 words.`,
      });
      
      if (response.text) {
        onSuggest(response.text);
      }
    } catch (error) {
      console.error("AI Generation failed", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="bg-[#8b4513] hover:bg-[#5d2e0a] text-[#f2e8cf] p-4 rounded-full shadow-lg transition-transform hover:scale-110 flex items-center justify-center border-2 border-[#5d2e0a]"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      </button>

      {showPanel && (
        <div className="absolute bottom-16 right-0 w-80 bg-[#fdf5e6] rounded-xl shadow-2xl border-2 border-[#d2b48c] p-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <h3 className="text-lg font-bold text-[#5d2e0a] mb-3 font-serif">Writing Desk</h3>
          <p className="text-sm text-[#8b4513] mb-4 font-typewriter">Draft a new note for Kalliana.</p>
          <div className="space-y-2">
            {ROMANTIC_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                disabled={loading}
                onClick={() => generateIdea(prompt)}
                className="w-full text-left text-xs p-2 bg-[#f2e8cf] hover:bg-[#d2b48c] rounded-md text-[#5d2e0a] transition-colors border border-[#d2b48c] disabled:opacity-50 font-typewriter"
              >
                {prompt}
              </button>
            ))}
          </div>
          {loading && (
            <div className="mt-4 flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#8b4513]"></div>
              <span className="ml-2 text-xs text-[#8b4513] italic font-typewriter">Ink is flowing...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIAssistant;
