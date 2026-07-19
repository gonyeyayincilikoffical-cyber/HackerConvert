import React, { useState } from 'react';
import { TranslationDict } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (name: string, nickname: string) => void;
  t: TranslationDict;
  isRtl: boolean;
}

export default function LoginModal({ isOpen, onClose, onLogin, t, isRtl }: LoginModalProps) {
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onLogin(name.trim(), nickname.trim() || 'hacker_convert');
    }
  };

  return (
    <div className="fixed inset-0 bg-[#02050d]/85 backdrop-blur-md flex items-center justify-center z-[100] transition-opacity duration-300">
      <div 
        className={`bg-[var(--color-surface)] border border-[var(--color-line)] rounded-3xl p-8 w-full max-w-md shadow-2xl relative ${isRtl ? 'rtl text-right' : 'text-left'}`}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-5 text-2xl text-slate-400 hover:text-white cursor-pointer transition-colors"
        >
          ×
        </button>
        
        <h3 className="text-2xl font-display font-bold mb-6 text-center text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">
          {t.modal_title}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">{t.lbl_name}</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.placeholder_name}
              required
              className="w-full bg-[var(--color-bg-deep)] border border-[var(--color-line)] focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]/30 text-white rounded-xl p-3 text-sm outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">{t.lbl_nick}</label>
            <input 
              type="text" 
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder={t.placeholder_nick}
              className="w-full bg-[var(--color-bg-deep)] border border-[var(--color-line)] focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]/30 text-white rounded-xl p-3 text-sm outline-none transition-all"
            />
          </div>
          
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-400 py-2">
            <input 
              type="checkbox" 
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 cursor-pointer accent-[var(--color-primary)] rounded border-[var(--color-line)]"
            />
            <span>{t.lbl_remember}</span>
          </label>

          <button 
            type="submit"
            className="w-full py-3.5 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] hover:scale-[1.01] active:scale-[0.99] text-white font-semibold rounded-xl text-sm shadow-lg hover:shadow-[var(--color-accent)]/25 transition-all cursor-pointer mt-2"
          >
            {t.btn_login_submit}
          </button>
        </form>
      </div>
    </div>
  );
}
