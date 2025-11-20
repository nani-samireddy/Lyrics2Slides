import React, { useState, useCallback } from 'react';
import { Button } from './components/Button';
import { OutputCard } from './components/OutputCard';
import { formatLyricsWithGemini } from './services/geminiService';
import { cleanLyricsDeterministically } from './utils/lyricsCleaner';
import { AppStatus } from './types';
import { DEFAULT_PLACEHOLDER } from './constants';

const App: React.FC = () => {
  const [rawInput, setRawInput] = useState<string>('');
  const [formattedOutput, setFormattedOutput] = useState<string>('');
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<'ai' | 'manual' | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setRawInput(e.target.value);
    if (status === AppStatus.SUCCESS || status === AppStatus.ERROR) {
      setStatus(AppStatus.IDLE);
      setActiveMode(null);
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

  const handleReset = () => {
    setRawInput('');
    setFormattedOutput('');
    setStatus(AppStatus.IDLE);
    setErrorMsg(null);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-white font-sans text-zinc-900 overflow-hidden">
        
      {/* Left Pane: Input */}
      <div className="flex-1 relative h-1/2 md:h-full group">
        <div className="absolute top-6 left-6 md:top-8 md:left-8 text-[10px] font-bold text-zinc-300 uppercase tracking-[0.2em] pointer-events-none select-none z-10">
          Input Source
        </div>
        <textarea
          className="w-full h-full p-8 md:p-12 pt-16 md:pt-20 text-lg md:text-xl resize-none focus:outline-none placeholder:text-zinc-200 text-zinc-900 leading-relaxed telugu-text bg-transparent custom-scrollbar"
          placeholder="Paste lyrics here..."
          value={rawInput}
          onChange={handleInputChange}
          spellCheck="false"
        />
        
        {/* Centered Placeholder / Example Loader */}
        {!rawInput && (
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center z-20">
              <p className="text-zinc-200 text-sm font-medium mb-4 pointer-events-none">Paste text or try an example</p>
              <button 
                onClick={() => setRawInput(DEFAULT_PLACEHOLDER)}
                className="px-4 py-2 bg-zinc-50 hover:bg-zinc-100 text-zinc-400 hover:text-zinc-900 text-xs font-bold uppercase tracking-wider rounded-full transition-colors"
              >
                Load Example
              </button>
           </div>
        )}
      </div>

      {/* Right Pane: Output */}
      <div className="flex-1 relative h-1/2 md:h-full bg-zinc-50/50 md:border-l border-t md:border-t-0 border-zinc-100">
        <div className="absolute top-6 left-6 md:top-8 md:left-8 text-[10px] font-bold text-zinc-300 uppercase tracking-[0.2em] pointer-events-none select-none z-10">
          Formatted Slide
        </div>
        
        {formattedOutput ? (
          <OutputCard content={formattedOutput} isVisible={true} />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
             <div className="w-1.5 h-1.5 bg-zinc-200 rounded-full"></div>
          </div>
        )}
      </div>

      {/* Floating Action Dock */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-fit px-4">
        <div className="flex items-center gap-2 p-2 bg-white/80 backdrop-blur-xl border border-zinc-200/50 rounded-full shadow-2xl shadow-zinc-200/50 transition-all hover:scale-[1.02]">
          
          {/* Reset */}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleReset}
            className="!rounded-full !w-10 !h-10 !p-0 flex items-center justify-center hover:bg-red-50 hover:!text-red-500 transition-colors"
            title="Reset All"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
            className="!font-bold !text-xs !uppercase !tracking-wider !border-transparent !bg-zinc-100 hover:!bg-zinc-200 !text-zinc-600 !px-6"
          >
            Clean
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={handleAiFormat}
            isLoading={status === AppStatus.PROCESSING && activeMode === 'ai'}
            disabled={!rawInput.trim() || status === AppStatus.PROCESSING}
            className="!font-bold !text-xs !uppercase !tracking-wider min-w-[120px]"
          >
            AI Format
          </Button>

          {/* Copy (Conditional) */}
          {formattedOutput && (
            <>
              <div className="w-px h-4 bg-zinc-200 mx-1"></div>
              <Button 
                variant={isCopied ? "secondary" : "ghost"}
                size="sm"
                onClick={handleCopy}
                className={`!rounded-full !px-5 transition-all ${isCopied ? '!bg-green-50 !text-green-600 !border-green-100' : 'hover:bg-zinc-100'}`}
              >
                 {isCopied ? (
                    <span className="text-xs font-bold uppercase tracking-wider">Copied</span>
                 ) : (
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider">Copy</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    </div>
                 )}
              </Button>
            </>
          )}

        </div>
        
        {/* Error Toast */}
        {errorMsg && (
            <div className="absolute bottom-full left-0 right-0 mb-4 flex justify-center">
                <div className="bg-red-50 text-red-600 px-4 py-2 rounded-full text-xs font-medium shadow-sm border border-red-100 animate-fade-in-up">
                    {errorMsg}
                </div>
            </div>
        )}
      </div>

    </div>
  );
};

export default App;