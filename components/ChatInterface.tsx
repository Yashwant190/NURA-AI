import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../types';
import { Send, Cpu, Bot, Mic, MicOff } from 'lucide-react';

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  onToggleVoice: () => void;
  isProcessing: boolean;
  isListening: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, 
  onSendMessage, 
  onToggleVoice, 
  isProcessing, 
  isListening 
}) => {
  const [inputValue, setInputValue] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isProcessing) return;
    onSendMessage(inputValue);
    setInputValue('');
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/50 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden shadow-2xl relative">
      {/* Header */}
      <div className="p-4 border-b border-white/10 bg-black/20 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center border border-cyan-500/50">
            <Bot className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">NURA AI</h2>
            <p className="text-xs text-cyan-400/60 font-mono uppercase tracking-wider">Online // Agent Active</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl p-3 text-sm leading-relaxed shadow-lg ${
              msg.role === 'user' 
                ? 'bg-cyan-600/20 border border-cyan-500/30 text-white rounded-br-none' 
                : msg.isToolUse 
                  ? 'bg-purple-900/20 border border-purple-500/30 text-purple-200 font-mono text-xs w-full'
                  : 'bg-slate-800/80 border border-slate-700 text-slate-200 rounded-bl-none'
            }`}>
              {msg.isToolUse && (
                <div className="flex items-center gap-2 mb-1 text-purple-400 border-b border-purple-500/20 pb-1">
                  <Cpu className="w-3 h-3" />
                  <span>EXECUTING PROTOCOL</span>
                </div>
              )}
              {msg.text}
            </div>
          </div>
        ))}
        {isProcessing && (
          <div className="flex justify-start">
             <div className="bg-slate-800/80 border border-slate-700 px-4 py-3 rounded-2xl rounded-bl-none flex gap-1 items-center">
                <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce"></span>
             </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Listening Overlay */}
      {isListening && (
        <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-200">
           <div className="relative">
             <div className="absolute inset-0 bg-cyan-500 rounded-full animate-ping opacity-25"></div>
             <div className="w-20 h-20 bg-cyan-500/20 border border-cyan-500 rounded-full flex items-center justify-center relative z-10">
               <Mic className="w-8 h-8 text-cyan-400" />
             </div>
           </div>
           <p className="mt-6 text-cyan-400 font-mono tracking-widest text-sm animate-pulse">LISTENING...</p>
           <button 
             onClick={onToggleVoice}
             className="mt-8 px-6 py-2 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-full text-xs text-white transition-colors"
           >
             CANCEL
           </button>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-white/10 bg-black/20">
        <div className="relative flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleVoice}
            disabled={isProcessing}
            className={`p-3 rounded-xl border transition-all ${
              isListening 
              ? 'bg-red-500/20 border-red-500 text-red-400' 
              : 'bg-black/40 border-slate-700 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/50'
            }`}
            title="Toggle Voice Input"
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <div className="relative flex-1">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Describe symptoms..."
              className="w-full bg-black/40 border border-slate-700 text-white rounded-xl py-3 pl-4 pr-12 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder:text-slate-600"
              disabled={isProcessing || isListening}
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isProcessing}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:hover:bg-cyan-600 text-white rounded-lg transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
        <p className="text-[10px] text-slate-600 mt-2 text-center">
          Nura can make mistakes. Always consult a real doctor for emergencies.
        </p>
      </form>
    </div>
  );
};

export default ChatInterface;