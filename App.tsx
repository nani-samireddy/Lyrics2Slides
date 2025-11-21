import React, { useState, useCallback } from 'react';
import { Button } from './components/Button';
import { OutputCard } from './components/OutputCard';
import { formatLyricsWithGemini } from './services/geminiService';
import { cleanLyricsDeterministically } from './utils/lyricsCleaner';
import { generateAndDownloadPPT } from './utils/pptGenerator';
import { AppStatus } from './types';
import { DEFAULT_PLACEHOLDER } from './constants';

const App: React.FC = () => {
  const [rawInput, setRawInput] = useState<string>('');
  const [formattedOutput, setFormattedOutput] = useState<string>('');
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<'ai' | 'manual' | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isGeneratingPPT, setIsGeneratingPPT] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setRawInput(e.target.value);
    if (status === AppStatus.SUCCESS || status === AppStatus.ERROR) {
      setStatus(AppStatus.IDLE);
      setActiveMode(null);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setRawInput(text);
      // Reset status if we paste new content
      if (status === AppStatus.SUCCESS) {
        setStatus(AppStatus.IDLE);
        setActiveMode(null);
      }
    } catch (err: any) {
      console.error('Failed to read clipboard:', err);
      // If blocked by policy or user denial, suggest manual shortcut
      if (err.name === 'NotAllowedError' || err.message.includes('permissions policy')) {
         setErrorMsg("Clipboard access blocked. Use Ctrl+V to paste.");
      } else {
         setErrorMsg("Failed to paste from clipboard.");
      }
      setTimeout(() => setErrorMsg(null), 4000);
    }
  };

  const handleAiFormat = useCallback(async () => {
    if (!rawInput.trim()) return;
    setActiveMode('ai');
    setStatus(AppStatus.PROCESSING);
    setErrorMsg(null);
    try {
      const formatted = await formatLyricsWithGemini(rawInput);
      setFormattedOutput(formatted);
      setStatus(AppStatus.SUCCESS);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Formatting failed.");
      setStatus(AppStatus.ERROR);
    }
  }, [rawInput]);

  const handleManualFormat = useCallback(() => {
    if (!rawInput.trim()) return;
    setActiveMode('manual');
    setStatus(AppStatus.PROCESSING);
    setErrorMsg(null);
    try {
      setTimeout(() => {
        const formatted = cleanLyricsDeterministically(rawInput);
        setFormattedOutput(formatted);
        setStatus(AppStatus.SUCCESS);
      }, 300);
    } catch (err: any) {
      setErrorMsg("Manual formatting failed.");
      setStatus(AppStatus.ERROR);
    }
  }, [rawInput]);

  const handleCopy = async () => {
    if (!formattedOutput) return;
    try {
      await navigator.clipboard.writeText(formattedOutput);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleDownloadPPT = async () => {
    if (!formattedOutput) return;
    setIsGeneratingPPT(true);
    try {
      await generateAndDownloadPPT(formattedOutput);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to generate PPT.");
      setTimeout(() => setErrorMsg(null), 3000);
    } finally {
      setIsGeneratingPPT(false);
    }
  };

  const handleReset = () => {
    setRawInput('');
    setFormattedOutput('');
    setStatus(AppStatus.IDLE);
    setErrorMsg(null);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-white font-sans text-zinc-900 overflow-hidden selection:bg-zinc-900 selection:text-white">
        
      {/* Left Pane: Input */}
      <div className="flex-1 relative h-1/2 md:h-full">
        <div className="absolute top-6 left-6 md:top-8 md:left-8 flex items-center gap-3 z-10">
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] pointer-events-none select-none">
                Input Source
            </div>
        </div>
        
        <textarea
          className="w-full h-full p-8 md:p-12 pt-16 md:pt-20 text-lg md:text-xl resize-none focus:outline-none placeholder:text-transparent text-zinc-900 leading-relaxed telugu-text bg-transparent custom-scrollbar"
          placeholder="Paste lyrics here..."
          value={rawInput}
          onChange={handleInputChange}
          spellCheck="false"
        />
        
        {/* Centered Placeholder / Example Loader */}
        {!rawInput && (
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center z-20 w-full px-4">
              <p className="text-zinc-300 text-sm font-medium mb-6 pointer-events-none">Paste your raw lyrics here</p>
              <button 
                onClick={() => setRawInput(DEFAULT_PLACEHOLDER)}
                className="group flex items-center justify-center mx-auto px-4 py-2 bg-zinc-50 hover:bg-zinc-100 border border-zinc-100 hover:border-zinc-200 text-zinc-400 hover:text-zinc-900 text-[10px] font-bold uppercase tracking-[0.15em] rounded-full transition-all duration-300"
              >
                <span>Try Example</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-2 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
           </div>
        )}
      </div>

      {/* Right Pane: Output */}
      <div className="flex-1 relative h-1/2 md:h-full bg-zinc-50/30 md:border-l border-t md:border-t-0 border-zinc-100">
        <div className="absolute top-6 left-6 md:top-8 md:left-8 text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] pointer-events-none select-none z-10">
          Formatted Slide
        </div>
        
        {formattedOutput ? (
          <OutputCard content={formattedOutput} isVisible={true} />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
             <div className="flex gap-1">
                <div className="w-1 h-1 bg-zinc-200 rounded-full animate-pulse"></div>
                <div className="w-1 h-1 bg-zinc-200 rounded-full animate-pulse delay-75"></div>
                <div className="w-1 h-1 bg-zinc-200 rounded-full animate-pulse delay-150"></div>
             </div>
          </div>
        )}
      </div>

      {/* Floating Action Dock */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 w-auto max-w-[90vw]">
        <div className="flex items-center gap-2 p-2 bg-white/90 backdrop-blur-xl border border-zinc-200/60 rounded-full shadow-2xl shadow-zinc-200/40 transition-all hover:scale-[1.01] ring-1 ring-black/5">
          
          {/* Reset */}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleReset}
            className="!rounded-full !w-10 !h-10 !p-0 flex items-center justify-center hover:bg-zinc-100 hover:!text-zinc-900 transition-colors"
            title="Reset All"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </Button>

          {/* Paste Button */}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handlePaste}
            className="!rounded-full !w-10 !h-10 !p-0 flex items-center justify-center hover:bg-zinc-100 hover:!text-zinc-900 transition-colors"
            title="Paste from Clipboard"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </Button>

          <div className="w-px h-4 bg-zinc-200 mx-1"></div>

          {/* Actions */}
          <Button
            variant="secondary"
            size="md"
            onClick={handleManualFormat}
            isLoading={status === AppStatus.PROCESSING && activeMode === 'manual'}
            disabled={!rawInput.trim() || status === AppStatus.PROCESSING}
            className="!font-bold !text-[10px] !uppercase !tracking-[0.1em] !border-transparent !bg-zinc-100 hover:!bg-zinc-200 !text-zinc-600 !px-6 shadow-none"
          >
            Clean
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={handleAiFormat}
            isLoading={status === AppStatus.PROCESSING && activeMode === 'ai'}
            disabled={!rawInput.trim() || status === AppStatus.PROCESSING}
            className="!font-bold !text-[10px] !uppercase !tracking-[0.1em] min-w-[110px] shadow-none"
          >
            AI Format
          </Button>

          {/* Copy & PPT (Conditional) */}
          {formattedOutput && (
            <>
              <div className="w-px h-4 bg-zinc-200 mx-1"></div>
              
              {/* Copy */}
              <Button 
                variant={isCopied ? "secondary" : "ghost"}
                size="sm"
                onClick={handleCopy}
                title="Copy to Clipboard"
                className={`!rounded-full !px-4 transition-all ${isCopied ? '!bg-emerald-50 !text-emerald-600 !border-emerald-100' : 'hover:bg-zinc-100'}`}
              >
                 {isCopied ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                 ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                 )}
              </Button>

              {/* PPT Download */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownloadPPT}
                isLoading={isGeneratingPPT}
                title="Download PowerPoint"
                className="!rounded-full !px-4 hover:bg-zinc-100"
              >
                <div className="flex items-center gap-2">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                   </svg>
                   <span className="text-[10px] font-bold uppercase tracking-widest">PPT</span>
                </div>
              </Button>
            </>
          )}

        </div>
        
        {/* Error Toast */}
        {errorMsg && (
            <div className="absolute bottom-full left-0 right-0 mb-4 flex justify-center">
                <div className="bg-zinc-900 text-white px-6 py-3 rounded-full text-xs font-medium shadow-xl animate-fade-in-up flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {errorMsg}
                </div>
            </div>
        )}
      </div>

    </div>
  );
};

export default App;