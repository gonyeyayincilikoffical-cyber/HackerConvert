import { useState, useEffect, useRef, DragEvent, ChangeEvent, MouseEvent } from 'react';
import { 
  Language, 
  AppTheme, 
  FileQueueItem, 
  TerminalLog 
} from './types';
import { translations } from './translations';
import { convertFileInBrowser } from './utils/converter';

import MatrixBackground from './components/MatrixBackground';
import LoginModal from './components/LoginModal';
import TerminalConsole from './components/TerminalConsole';
import FilePreviewPanel from './components/FilePreviewPanel';
import SplashIntro from './components/SplashIntro';

export default function App() {
  // Intro splash loader state
  const [isIntroActive, setIsIntroActive] = useState(true);

  // Localization & Themes
  const [lang, setLang] = useState<Language>('tr');
  const [theme, setTheme] = useState<AppTheme>('matrix');
  const [isMatrixActive, setIsMatrixActive] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [synthVolume, setSynthVolume] = useState<number>(0.04);
  const [synthWaveform, setSynthWaveform] = useState<'sine' | 'square' | 'triangle' | 'sawtooth'>('sine');

  // User auth state
  const [user, setUser] = useState<{ name: string; nickname: string } | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Conversion queue state
  const [queue, setQueue] = useState<FileQueueItem[]>([]);
  const [selectedQueueId, setSelectedQueueId] = useState<string | null>(null);
  const [globalTargetFormat, setGlobalTargetFormat] = useState<string>('');

  // Diagnostic Logs for the Console
  const [logs, setLogs] = useState<TerminalLog[]>([]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isRtl = lang === 'ar';
  const t = translations[lang];

  // Initialize Auth from localstorage if present
  useEffect(() => {
    const savedUser = localStorage.getItem('hacker_convert_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        // ignore
      }
    }
    addLog('info', 'HACkerConvert system initialized securely.');
  }, []);

  const addLog = (type: 'info' | 'success' | 'warn' | 'error', message: string) => {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    const newLog: TerminalLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: timeStr,
      type,
      message
    };
    setLogs((prev) => [...prev, newLog]);
  };

  // Synthesizer Web Audio Playback
  const playSynthSound = (freq: number, type: typeof synthWaveform, duration: number) => {
    if (isMuted) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const audioCtx = new AudioContextClass();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = type;
      oscillator.frequency.value = freq;

      gainNode.gain.setValueAtTime(synthVolume, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + duration);

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + duration);
    } catch (e) {
      // Audio context may be blocked by browser autoplay policy initially
    }
  };

  const playClick = () => playSynthSound(800, 'sine', 0.08);
  const playUpload = () => playSynthSound(380, 'triangle', 0.15);
  const playSuccess = () => {
    playSynthSound(523.25, synthWaveform, 0.15);
    setTimeout(() => {
      playSynthSound(659.25, synthWaveform, 0.25);
    }, 110);
  };
  const playError = () => {
    playSynthSound(220, 'sawtooth', 0.3);
  };

  const handleLanguageChange = (newLang: Language) => {
    playClick();
    setLang(newLang);
    addLog('info', `Language updated to: ${newLang.toUpperCase()}`);
  };

  const handleThemeChange = (newTheme: AppTheme) => {
    playClick();
    setTheme(newTheme);
    addLog('info', `Active siber-deck UI theme changed to: ${newTheme.toUpperCase()}`);
  };

  const handleLogin = (name: string, nickname: string) => {
    playSuccess();
    const newUser = { name, nickname };
    setUser(newUser);
    localStorage.setItem('hacker_convert_user', JSON.stringify(newUser));
    setIsLoginModalOpen(false);
    addLog('success', `User logged in securely: ${name} (@${nickname})`);
  };

  const handleLogout = () => {
    playClick();
    setUser(null);
    localStorage.removeItem('hacker_convert_user');
    addLog('info', 'Secure user session cleared.');
  };

  // Drag & drop file management
  const onDragOver = (e: DragEvent) => {
    e.preventDefault();
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFilesToQueue(e.dataTransfer.files);
    }
  };

  const triggerFileSelect = () => {
    playClick();
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFilesToQueue(e.target.files);
    }
  };

  const addFilesToQueue = (files: FileList) => {
    playUpload();
    const newItems: FileQueueItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      
      // Determine default logical target formats
      let defaultTarget = 'pdf';
      if (['png', 'jpg', 'jpeg', 'webp'].includes(ext)) {
        defaultTarget = 'webp';
      } else if (['csv', 'json', 'xlsx'].includes(ext)) {
        defaultTarget = 'json';
      } else if (['docx', 'pdf', 'txt'].includes(ext)) {
        defaultTarget = 'pdf';
      }

      const item: FileQueueItem = {
        id: Math.random().toString(36).substr(2, 9),
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        progress: 0,
        status: 'idle',
        targetFormat: defaultTarget,
      };
      newItems.push(item);
      addLog('info', `File added to sandbox queue: ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`);
    }

    setQueue((prev) => {
      const updated = [...prev, ...newItems];
      if (!selectedQueueId && updated.length > 0) {
        setSelectedQueueId(updated[0].id);
      }
      return updated;
    });
  };

  const removeQueueItem = (id: string, e: MouseEvent) => {
    e.stopPropagation();
    playClick();
    setQueue((prev) => {
      const filtered = prev.filter(item => item.id !== id);
      if (selectedQueueId === id) {
        setSelectedQueueId(filtered.length > 0 ? filtered[0].id : null);
      }
      return filtered;
    });
    addLog('warn', `Removed file from processing queue.`);
  };

  const clearQueue = () => {
    playClick();
    setQueue([]);
    setSelectedQueueId(null);
    addLog('info', 'Sandbox queue cleared.');
  };

  const updateItemTargetFormat = (id: string, format: string) => {
    setQueue((prev) => prev.map(item => {
      if (item.id === id) {
        return { ...item, targetFormat: format };
      }
      return item;
    }));
  };

  // Convert files locally
  const startConversion = async (id: string) => {
    const item = queue.find(q => q.id === id);
    if (!item || item.status === 'converting') return;

    // Update status to converting
    setQueue((prev) => prev.map(q => q.id === id ? { ...q, status: 'converting', progress: 0 } : q));
    addLog('info', `Local transformation sequence engaged for ${item.name} to ${item.targetFormat.toUpperCase()}`);

    try {
      const result = await convertFileInBrowser(item.file, item.targetFormat, (progress) => {
        setQueue((prev) => prev.map(q => q.id === id ? { ...q, progress } : q));
      });

      const downloadUrl = URL.createObjectURL(result.blob);
      setQueue((prev) => prev.map(q => q.id === id ? { 
        ...q, 
        status: 'success', 
        downloadUrl, 
        convertedName: result.convertedName 
      } : q));
      
      playSuccess();
      addLog('success', `Success! Saved local transformation stream as ${result.convertedName}`);
    } catch (err) {
      playError();
      const errorMsg = (err as Error).message || 'Conversion failed';
      setQueue((prev) => prev.map(q => q.id === id ? { ...q, status: 'error', error: errorMsg } : q));
      addLog('error', `Sandbox exception during conversion of ${item.name}: ${errorMsg}`);
    }
  };

  const convertAll = async () => {
    const idleItems = queue.filter(item => item.status === 'idle' || item.status === 'error');
    if (idleItems.length === 0) return;
    
    addLog('info', `Batch conversion launched for ${idleItems.length} items...`);
    for (const item of idleItems) {
      await startConversion(item.id);
    }
  };

  const selectedItem = queue.find(item => item.id === selectedQueueId) || null;

  // Render format choices based on selected file extension
  const getFormatOptions = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    if (['png', 'jpg', 'jpeg', 'webp'].includes(ext)) {
      return [
        { val: 'webp', label: 'WEBP (Lossless Web)' },
        { val: 'png', label: 'PNG (Transparent Vector)' },
        { val: 'jpg', label: 'JPG (Compressed)' }
      ];
    }
    if (['csv', 'json', 'xlsx'].includes(ext)) {
      return [
        { val: 'json', label: 'JSON (Data Array)' },
        { val: 'csv', label: 'CSV (Comma Separated)' },
        { val: 'xlsx', label: 'XLSX (Excel Workbook)' }
      ];
    }
    if (['docx', 'pdf', 'txt'].includes(ext)) {
      return [
        { val: 'pdf', label: 'PDF (Secure Document)' },
        { val: 'txt', label: 'TXT (Plain Text)' },
        { val: 'docx', label: 'DOCX (Office Document)' }
      ];
    }
    return [
      { val: 'pdf', label: 'PDF (Secure Document)' },
      { val: 'zip', label: 'ZIP (Archive Compression)' }
    ];
  };

  // Keyboard shortcut Ctrl+Enter to convert selected
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (selectedItem && selectedItem.status !== 'converting') {
          e.preventDefault();
          startConversion(selectedItem.id);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItem, queue]);

  const getThemeClass = () => {
    switch (theme) {
      case 'synthwave': return 'theme-synthwave bg-[#0d001a] text-pink-100';
      case 'cyberpunk': return 'theme-cyberpunk bg-[#0e0c02] text-yellow-100';
      case 'glacier': return 'theme-glacier bg-[#020d14] text-cyan-100';
      case 'matrix':
      default: return 'theme-matrix bg-[#0f172a] text-slate-100';
    }
  };

  const getThemeGlowClass = () => {
    switch (theme) {
      case 'synthwave': return 'text-[#ff007f] drop-shadow-[0_0_12px_rgba(255,0,127,0.7)]';
      case 'cyberpunk': return 'text-[#ffb700] drop-shadow-[0_0_12px_rgba(255,183,0,0.7)]';
      case 'glacier': return 'text-[#00f2fe] drop-shadow-[0_0_12px_rgba(0,242,254,0.7)]';
      case 'matrix':
      default: return 'text-blue-500 drop-shadow-[0_0_12px_rgba(37,99,235,0.7)]';
    }
  };

  const getThemeButtonClass = () => {
    switch (theme) {
      case 'synthwave': return 'bg-gradient-to-r from-[#8a2be2] to-[#ff007f] hover:shadow-[#ff007f]/40';
      case 'cyberpunk': return 'bg-gradient-to-r from-[#ffb700] to-[#ff0055] hover:shadow-[#ff0055]/40 text-black';
      case 'glacier': return 'bg-gradient-to-r from-[#0099ff] to-[#00f2fe] hover:shadow-[#00f2fe]/40 text-black';
      case 'matrix':
      default: return 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 hover:shadow-blue-500/35 text-white';
    }
  };

  const getThemeLineClass = () => {
    switch (theme) {
      case 'synthwave': return 'border-[#ff007f]/25';
      case 'cyberpunk': return 'border-[#ffb700]/30';
      case 'glacier': return 'border-[#00f2fe]/25';
      case 'matrix':
      default: return 'border-slate-700/50';
    }
  };

  const getThemeGlowBackgrounds = () => {
    switch (theme) {
      case 'synthwave':
        return {
          top: 'bg-pink-600/10',
          bottom: 'bg-purple-600/10'
        };
      case 'cyberpunk':
        return {
          top: 'bg-yellow-600/10',
          bottom: 'bg-red-600/10'
        };
      case 'glacier':
        return {
          top: 'bg-cyan-600/10',
          bottom: 'bg-blue-600/10'
        };
      case 'matrix':
      default:
        return {
          top: 'bg-blue-600/10',
          bottom: 'bg-indigo-600/10'
        };
    }
  };

  const glows = getThemeGlowBackgrounds();

  return (
    <div className={`min-h-screen ${getThemeClass()} font-sans relative transition-colors duration-500 overflow-x-hidden pb-12`}>
      {isIntroActive && (
        <SplashIntro onComplete={() => setIsIntroActive(false)} lang={lang} />
      )}

      {/* Sleek Atmospheric Radial Glows */}
      <div className={`absolute top-[-10%] right-[-5%] w-[400px] h-[400px] ${glows.top} rounded-full blur-[120px] pointer-events-none z-0`} />
      <div className={`absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] ${glows.bottom} rounded-full blur-[120px] pointer-events-none z-0`} />

      {/* Matrix digital falling rain canvas component */}
      <MatrixBackground theme={theme} isActive={isMatrixActive} />

      {/* Decorative cyber grid line background mask */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none z-0 opacity-40 grid-mask"></div>

      {/* Login modal dialog */}
      <LoginModal 
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLogin={handleLogin}
        t={t}
        isRtl={isRtl}
      />

      {/* HEADER SECTION */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[var(--color-bg)]/80 border-b border-[var(--color-line)]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <svg className="w-8 h-8 text-[var(--color-primary)] animate-pulse" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M46 24.5c-1.4-7-7.6-12.3-15-12.3-6.7 0-12.4 4.3-14.4 10.3C10.2 23.6 6 28.1 6 33.5 6 39.9 11.2 45 17.6 45h28.8C52.9 45 58 39.9 58 33.7 58 27.9 53.5 23.2 47.7 22.9c-.6 0-1.2.5-1.7 1.6z" fill="currentColor"/>
              <path d="M24 26v18M24 35h9M33 26v18" stroke="var(--color-bg)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div className="brand-name font-display font-bold text-lg tracking-tight">
              HACkerConvert<span className={getThemeGlowClass()}>.</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#donusturucu" className="hover:text-white transition-colors">{t.nav_converter}</a>
            <a href="#kategoriler" className="hover:text-white transition-colors">{t.nav_formats}</a>
            <a href="#nasil-calisir" className="hover:text-white transition-colors">{t.nav_how}</a>
          </nav>

          <div className="flex items-center gap-3">
            {/* Action buttons: Screen, Sound, Language */}
            <button 
              onClick={() => { playClick(); setIsMatrixActive(!isMatrixActive); }}
              title="Toggle Matrix Canvas background animation"
              className="p-2 text-base rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] hover:border-[var(--color-accent)] text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              {isMatrixActive ? '🎬' : '❌'}
            </button>

            <button 
              onClick={() => { setIsMuted(!isMuted); playSynthSound(800, 'sine', 0.08); }}
              title="Mute Synthesizer click sound effects"
              className="p-2 text-base rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] hover:border-[var(--color-accent)] text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              {isMuted ? '🔇' : '🔊'}
            </button>

            <select 
              value={lang} 
              onChange={(e) => handleLanguageChange(e.target.value as Language)}
              className="bg-[var(--color-bg-deep)] border border-[var(--color-line)] text-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] cursor-pointer"
            >
              <option value="tr">Türkçe</option>
              <option value="en">English</option>
              <option value="fr">Français</option>
              <option value="ar">العربية</option>
            </select>

            {user ? (
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-block text-xs font-mono text-[var(--color-accent-two)] bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 px-2 py-1 rounded-lg">
                  @{user.nickname}
                </span>
                <button 
                  onClick={handleLogout}
                  className="px-3 py-1.5 border border-[var(--color-line)] rounded-xl text-xs font-medium hover:border-[var(--color-accent)] transition-all cursor-pointer"
                >
                  {t.btn_logout}
                </button>
              </div>
            ) : (
              <button 
                onClick={() => { playClick(); setIsLoginModalOpen(true); }}
                className="px-3.5 py-1.5 border border-[var(--color-line)] rounded-xl text-xs font-medium hover:border-[var(--color-accent)] hover:bg-[var(--color-surface)] transition-all cursor-pointer text-slate-200"
              >
                {t.btn_login}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* HERO HERO SECTION */}
      <section className="relative overflow-hidden pt-16 pb-12 z-10 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--color-accent-two)] bg-[var(--color-accent-two)]/10 border border-[var(--color-accent-two)]/20 px-3.5 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              {t.hero_eyebrow}
            </div>

            <h1 className="text-4.5xl sm:text-5xl font-display font-bold leading-[1.1] tracking-tight text-white">
              {t.hero_title_left} <br className="hidden sm:inline" />
              <span className={`${getThemeGlowClass()} font-extrabold block sm:inline`}>{t.hero_title_highlight}</span> {t.hero_title_right}
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-lg">
              {t.hero_lead}
            </p>

            {/* Siber Deck Controls Drawer */}
            <div className={`p-5 rounded-3xl border border-[var(--color-line)] bg-[var(--color-surface)] backdrop-blur-md space-y-3.5 max-w-md shadow-lg`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-400">{t.theme_selector_lbl}</span>
                  <div className="flex gap-1.5">
                    {(['matrix', 'synthwave', 'cyberpunk', 'glacier'] as AppTheme[]).map((thm) => (
                      <button
                        key={thm}
                        onClick={() => handleThemeChange(thm)}
                        className={`w-5 h-5 rounded-full border cursor-pointer transition-all ${
                          theme === thm ? 'border-white scale-110 ring-2 ring-white/25' : 'border-white/10'
                        }`}
                        style={{
                          background: thm === 'matrix' ? '#0f172a' : 
                                      thm === 'synthwave' ? '#0d001a' : 
                                      thm === 'cyberpunk' ? '#0e0c02' : '#020d14'
                        }}
                        title={thm.toUpperCase()}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-mono text-slate-500">Vol:</span>
                  <input 
                    type="range" 
                    min="0" 
                    max="0.15" 
                    step="0.01" 
                    value={synthVolume}
                    onChange={(e) => setSynthVolume(parseFloat(e.target.value))}
                    className="w-16 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[var(--color-primary)]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-[var(--color-line)] pt-2.5">
                <span className="text-[11px] font-mono text-slate-400">{t.audio_effects_lbl}</span>
                <div className="flex gap-1">
                  {(['sine', 'square', 'triangle', 'sawtooth'] as const).map((wv) => (
                    <button
                      key={wv}
                      onClick={() => { playSynthSound(440, wv, 0.15); setSynthWaveform(wv); }}
                      className={`px-2 py-0.5 text-[10px] rounded-lg border font-mono transition-all ${
                        synthWaveform === wv ? 'bg-[var(--color-primary)]/20 border-[var(--color-accent)] text-white' : 'border-[var(--color-line)] text-slate-500 hover:text-white'
                      }`}
                    >
                      {wv.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4 max-w-md">
              <div className="text-left border-l-2 border-[var(--color-accent-two)] pl-3">
                <span className="block font-display font-bold text-xl text-[var(--color-accent-two)] drop-shadow-[0_0_8px_rgba(0,242,254,0.4)]">{t.stat_cats_val}</span>
                <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">{t.stat_cats_lbl}</span>
              </div>
              <div className="text-left border-l-2 border-[var(--color-accent)] pl-3">
                <span className="block font-display font-bold text-xl text-[var(--color-accent)] drop-shadow-[0_0_8px_rgba(255,0,230,0.4)]">{t.stat_formats_val}</span>
                <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">{t.stat_formats_lbl}</span>
              </div>
              <div className="text-left border-l-2 border-[var(--color-primary)] pl-3">
                <span className="block font-display font-bold text-xl text-slate-200">{t.stat_server_val}</span>
                <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">{t.stat_server_lbl}</span>
              </div>
            </div>
          </div>

          {/* MAIN INTERACTIVE WIDGET COMPONENT */}
          <div className="lg:col-span-6" id="donusturucu">
            <div className="bg-[var(--color-surface)] backdrop-blur-md border border-[var(--color-line)] rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
              
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs uppercase font-mono font-bold tracking-wider text-slate-400">{t.widget_title}</h3>
                <span className="text-[10px] font-mono text-[var(--color-accent-two)] tracking-widest bg-[var(--color-accent-two)]/10 px-2.5 py-1 rounded-xl border border-[var(--color-accent-two)]/20">
                  {queue.length > 0 ? `QUEUE: ${queue.length} FILE(S)` : 'IDLE ENGINE'}
                </span>
              </div>

              {/* Upload Drag zone */}
              <div 
                onDragOver={onDragOver}
                onDrop={onDrop}
                onClick={triggerFileSelect}
                className="border-2 border-dashed border-[var(--color-line)] rounded-2xl p-8 text-center cursor-pointer hover:bg-white/[0.01] hover:border-[var(--color-accent)] transition-all duration-300 relative group"
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  multiple
                  className="hidden" 
                />
                
                <svg className="w-12 h-12 text-[var(--color-accent-two)] mx-auto mb-3 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>

                <p className="text-sm text-slate-200">
                  <b className="text-white hover:underline">{t.dropzone_title}</b> {t.dropzone_bold}
                </p>
                <span className="block text-[11px] text-slate-500 mt-2">{t.dropzone_sub}</span>
              </div>

              {/* Queue List of Items */}
              {queue.length > 0 && (
                <div className="mt-5 space-y-2 max-h-48 overflow-y-auto pr-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pb-1 border-b border-[var(--color-line)]">
                    <span>PROCESSING SANDBOX QUEUE</span>
                    <button 
                      onClick={clearQueue}
                      className="text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                    >
                      [{t.clear_queue_btn}]
                    </button>
                  </div>
                  
                  {queue.map((item) => {
                    const isSelected = item.id === selectedQueueId;
                    const isImg = item.file.type.startsWith('image/');
                    return (
                      <div 
                        key={item.id}
                        onClick={() => setSelectedQueueId(item.id)}
                        className={`p-3 rounded-2xl border text-left flex items-center justify-between gap-3 cursor-pointer transition-all ${
                          isSelected ? 'bg-white/5 border-[var(--color-accent)] shadow-inner' : 'bg-[var(--color-bg-deep)]/40 border-[var(--color-line)] hover:border-[var(--color-accent-two)]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[10px] flex-shrink-0 ${
                            isImg ? 'bg-cyan-500/20 text-cyan-400' : 'bg-purple-500/20 text-purple-400'
                          }`}>
                            {item.file.name.split('.').pop()?.toUpperCase()}
                          </div>
                          
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-white truncate max-w-[150px] sm:max-w-[220px]">
                              {item.name}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {(item.size / (1024 * 1024)).toFixed(2)} MB • {item.status.toUpperCase()}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          {/* Individual dropdown target format selector */}
                          <select
                            value={item.targetFormat}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => updateItemTargetFormat(item.id, e.target.value)}
                            className="bg-[var(--color-bg-deep)] border border-[var(--color-line)] text-slate-200 rounded-lg px-1.5 py-0.5 text-[10px] font-mono focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                          >
                            {getFormatOptions(item.name).map(opt => (
                              <option key={opt.val} value={opt.val}>{opt.val.toUpperCase()}</option>
                            ))}
                          </select>

                          {item.status === 'success' && item.downloadUrl && (
                            <a 
                              href={item.downloadUrl}
                              download={item.convertedName}
                              onClick={(e) => e.stopPropagation()}
                              className="px-2.5 py-1 bg-emerald-500 text-white rounded-lg text-[10px] font-semibold hover:bg-emerald-400 transition-colors"
                            >
                              {t.btn_download}
                            </a>
                          )}

                          {item.status === 'idle' && (
                            <button
                              onClick={(e) => { e.stopPropagation(); startConversion(item.id); }}
                              className="p-1 hover:text-[var(--color-accent-two)] transition-colors cursor-pointer"
                              title="Convert this item"
                            >
                              ⚡
                            </button>
                          )}

                          <button 
                            onClick={(e) => removeQueueItem(item.id, e)}
                            className="text-slate-500 hover:text-white text-sm px-1 cursor-pointer"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* File Preview and Individual conversion row */}
              {selectedItem && (
                <div className="mt-5 pt-4 border-t border-[var(--color-line)] space-y-4">
                  
                  {/* Embedded File Preview Panel */}
                  <FilePreviewPanel item={selectedItem} t={t} />

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--color-bg-deep)]/40 p-3 rounded-2xl border border-[var(--color-line)]">
                    <div className="text-left">
                      <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-mono">{t.target_format_lbl}</span>
                      <span className="text-sm font-semibold text-slate-200">
                        {selectedItem.file.name.split('.').pop()?.toUpperCase()} &rarr; {selectedItem.targetFormat.toUpperCase()}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button 
                        onClick={() => startConversion(selectedItem.id)}
                        disabled={selectedItem.status === 'converting'}
                        className={`px-5 py-2.5 rounded-xl text-xs font-semibold shadow-lg transition-all cursor-pointer ${getThemeButtonClass()} disabled:opacity-50`}
                      >
                        {selectedItem.status === 'converting' ? t.progress_loading : t.btn_convert}
                      </button>
                      
                      {queue.length > 1 && (
                        <button 
                          onClick={convertAll}
                          className="px-4 py-2.5 border border-[var(--color-line)] rounded-xl text-xs font-medium hover:border-[var(--color-accent)] hover:bg-white/5 transition-all text-slate-300"
                        >
                          {t.btn_convert_all}
                        </button>
                      )}
                    </div>
                  </div>

                  {selectedItem.status === 'converting' && (
                    <div className="bg-[var(--color-bg-deep)] p-3.5 rounded-2xl border border-[var(--color-line)] text-left">
                      <div className="flex justify-between items-center text-[11px] font-mono mb-2">
                        <span className="text-slate-400 animate-pulse">{t.progress_loading}</span>
                        <span className="text-[var(--color-accent-two)] font-bold">{selectedItem.progress}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] transition-all duration-150"
                          style={{ width: `${selectedItem.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {selectedItem.status === 'success' && selectedItem.downloadUrl && (
                    <div className="bg-[var(--color-accent-two)]/10 p-3.5 rounded-2xl border border-[var(--color-accent-two)]/20 text-left flex items-center justify-between">
                      <div>
                        <span className="block text-[10px] uppercase font-mono text-slate-400">{t.result_ready}</span>
                        <span className="text-xs font-bold text-white font-mono">{selectedItem.convertedName}</span>
                      </div>
                      <a 
                        href={selectedItem.downloadUrl}
                        download={selectedItem.convertedName}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold shadow-md cursor-pointer ${getThemeButtonClass()}`}
                      >
                        {t.btn_download}
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Shortcut info */}
              {selectedItem && selectedItem.status !== 'converting' && (
                <div className="mt-3 text-[10px] text-slate-400 text-center font-mono">
                  ⚡ Ctrl + Enter (veya Cmd + Enter) ile dönüştürmeyi başlatabilirsin.
                </div>
              )}

              {/* Diagnostics scrolling logger console */}
              <TerminalConsole logs={logs} t={t} theme={theme} />

              <p className="text-[10px] text-slate-500 leading-relaxed text-center mt-4">
                {t.disclaimer_text}
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* SUPPORTED FORMATS GRID SECTION */}
      <section className="max-w-6xl mx-auto px-6 py-16 z-10 relative" id="kategoriler">
        <div className="max-w-xl text-left space-y-3 mb-12">
          <div className="inline-block text-xs font-semibold text-[var(--color-accent)] bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 px-3.5 py-1.5 rounded-full">
            {t.cat_eyebrow}
          </div>
          <h2 className="text-3xl font-display font-bold text-white">{t.cat_title}</h2>
          <p className="text-sm text-slate-300">{t.cat_desc}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Format Category 1 */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-3xl p-6 relative overflow-hidden group hover:border-[var(--color-accent)]/60 hover:-translate-y-1 transition-all duration-300">
            <span className="absolute top-5 right-5 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 rounded-lg">
              {t.badge_live}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-[var(--color-accent-two)]/10 border border-[var(--color-accent-two)]/20 flex items-center justify-center font-bold text-xs text-[var(--color-accent-two)] mb-5">
              IMG
            </div>
            <h3 className="text-lg font-display font-bold text-white mb-2">{t.cat_img_t}</h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">{t.cat_img_d}</p>
            <div className="flex gap-1.5">
              <span className="text-[9px] font-mono text-slate-400 bg-white/5 px-2.5 py-1 rounded-lg">WEBP</span>
              <span className="text-[9px] font-mono text-slate-400 bg-white/5 px-2.5 py-1 rounded-lg">PNG</span>
              <span className="text-[9px] font-mono text-slate-400 bg-white/5 px-2.5 py-1 rounded-lg">JPG</span>
            </div>
          </div>

          {/* Format Category 2 */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-3xl p-6 relative overflow-hidden group hover:border-[var(--color-accent)]/60 hover:-translate-y-1 transition-all duration-300">
            <span className="absolute top-5 right-5 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 rounded-lg">
              {t.badge_live}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 flex items-center justify-center font-bold text-xs text-[var(--color-primary)] mb-5">
              PDF
            </div>
            <h3 className="text-lg font-display font-bold text-white mb-2">{t.cat_pdf_t}</h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">{t.cat_pdf_d}</p>
            <div className="flex gap-1.5">
              <span className="text-[9px] font-mono text-slate-400 bg-white/5 px-2.5 py-1 rounded-lg">PDF</span>
              <span className="text-[9px] font-mono text-slate-400 bg-white/5 px-2.5 py-1 rounded-lg">DOCX</span>
              <span className="text-[9px] font-mono text-slate-400 bg-white/5 px-2.5 py-1 rounded-lg">TXT</span>
            </div>
          </div>

          {/* Format Category 3 */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-3xl p-6 relative overflow-hidden group hover:border-[var(--color-accent)]/60 hover:-translate-y-1 transition-all duration-300">
            <span className="absolute top-5 right-5 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 rounded-lg">
              {t.badge_live}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 flex items-center justify-center font-bold text-xs text-[var(--color-accent)] mb-5">
              DATA
            </div>
            <h3 className="text-lg font-display font-bold text-white mb-2">{t.cat_data_t}</h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">{t.cat_data_d}</p>
            <div className="flex gap-1.5">
              <span className="text-[9px] font-mono text-slate-400 bg-white/5 px-2.5 py-1 rounded-lg">CSV</span>
              <span className="text-[9px] font-mono text-slate-400 bg-white/5 px-2.5 py-1 rounded-lg">JSON</span>
              <span className="text-[9px] font-mono text-slate-400 bg-white/5 px-2.5 py-1 rounded-lg">XLSX</span>
            </div>
          </div>

          {/* Format Category 4 */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-3xl p-6 relative overflow-hidden opacity-60">
            <span className="absolute top-5 right-5 text-[9px] font-bold text-slate-500 bg-white/5 px-2.5 py-1 rounded-lg">
              {t.badge_soon}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-[var(--color-bg-deep)] border border-[var(--color-line)] flex items-center justify-center font-bold text-xs text-slate-500 mb-5">
              AUD
            </div>
            <h3 className="text-lg font-display font-bold text-slate-400 mb-2">{t.cat_aud_t}</h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">{t.cat_aud_d}</p>
            <div className="flex gap-1.5">
              <span className="text-[9px] font-mono text-slate-600 bg-white/5 px-2.5 py-1 rounded-lg">MP3</span>
              <span className="text-[9px] font-mono text-slate-600 bg-white/5 px-2.5 py-1 rounded-lg">WAV</span>
            </div>
          </div>

          {/* Format Category 5 */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-3xl p-6 relative overflow-hidden opacity-60">
            <span className="absolute top-5 right-5 text-[9px] font-bold text-slate-500 bg-white/5 px-2.5 py-1 rounded-lg">
              {t.badge_soon}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-[var(--color-bg-deep)] border border-[var(--color-line)] flex items-center justify-center font-bold text-xs text-slate-500 mb-5">
              BOOK
            </div>
            <h3 className="text-lg font-display font-bold text-slate-400 mb-2">{t.cat_book_t}</h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">{t.cat_book_d}</p>
            <div className="flex gap-1.5">
              <span className="text-[9px] font-mono text-slate-600 bg-white/5 px-2.5 py-1 rounded-lg">EPUB</span>
              <span className="text-[9px] font-mono text-slate-600 bg-white/5 px-2.5 py-1 rounded-lg">MOBI</span>
            </div>
          </div>

          {/* Format Category 6 */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-3xl p-6 relative overflow-hidden group hover:border-[var(--color-accent)]/60 hover:-translate-y-1 transition-all duration-300">
            <span className="absolute top-5 right-5 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 rounded-lg">
              {t.badge_live}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 flex items-center justify-center font-bold text-xs text-[var(--color-primary)] mb-5">
              ZIP
            </div>
            <h3 className="text-lg font-display font-bold text-white mb-2">{t.cat_zip_t}</h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">{t.cat_zip_d}</p>
            <div className="flex gap-1.5">
              <span className="text-[9px] font-mono text-slate-400 bg-white/5 px-2.5 py-1 rounded-lg">ZIP</span>
              <span className="text-[9px] font-mono text-slate-400 bg-white/5 px-2.5 py-1 rounded-lg">TAR.GZ</span>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS STEPS PANEL */}
      <section className="max-w-6xl mx-auto px-6 py-16 z-10 relative border-t border-[var(--color-line)]" id="nasil-calisir">
        <h2 className="text-3xl font-display font-bold text-white mb-12 text-center">{t.how_title}</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          <div className="space-y-4 relative">
            <div className="w-12 h-12 rounded-full bg-[var(--color-bg)] border border-[var(--color-accent)] flex items-center justify-center font-display font-bold text-[var(--color-accent)] shadow-[0_0_15px_rgba(99,102,241,0.25)]">
              01
            </div>
            <h3 className="text-lg font-display font-bold text-white">{t.step1_t}</h3>
            <p className="text-xs text-slate-300 leading-relaxed">{t.step1_d}</p>
          </div>

          <div className="space-y-4 relative">
            <div className="w-12 h-12 rounded-full bg-[var(--color-bg)] border border-[var(--color-accent)] flex items-center justify-center font-display font-bold text-[var(--color-accent)] shadow-[0_0_15px_rgba(99,102,241,0.25)]">
              02
            </div>
            <h3 className="text-lg font-display font-bold text-white">{t.step2_t}</h3>
            <p className="text-xs text-slate-300 leading-relaxed">{t.step2_d}</p>
          </div>

          <div className="space-y-4 relative">
            <div className="w-12 h-12 rounded-full bg-[var(--color-bg)] border border-[var(--color-accent)] flex items-center justify-center font-display font-bold text-[var(--color-accent)] shadow-[0_0_15px_rgba(99,102,241,0.25)]">
              03
            </div>
            <h3 className="text-lg font-display font-bold text-white">{t.step3_t}</h3>
            <p className="text-xs text-slate-300 leading-relaxed">{t.step3_d}</p>
          </div>
        </div>
      </section>

      {/* FOOTER FOOTER */}
      <footer className="max-w-6xl mx-auto px-6 mt-16 pt-12 border-t border-[var(--color-line)] z-10 relative">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="space-y-4">
            <div className="brand-name font-display font-bold text-lg text-white">
              HACkerConvert<span className="text-[var(--color-accent)] font-extrabold">.</span>
            </div>
            <p className="text-xs text-slate-400 max-w-xs leading-relaxed">{t.foot_desc}</p>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">{t.foot_h_prod}</h4>
            <a href="#donusturucu" className="block text-xs text-slate-400 hover:text-white transition-colors">{t.nav_converter}</a>
            <a href="#kategoriler" className="block text-xs text-slate-400 hover:text-white transition-colors">{t.nav_formats}</a>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">{t.foot_h_sec}</h4>
            <a href="#" onClick={(e) => e.preventDefault()} className="block text-xs text-slate-400 hover:text-white transition-colors">{t.foot_privacy}</a>
            <a href="#" onClick={(e) => e.preventDefault()} className="block text-xs text-slate-400 hover:text-white transition-colors">{t.foot_terms}</a>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">SYSTEM SPEED</h4>
            <div className="font-mono text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 rounded-xl inline-block">
              SANDBOX LOCAL OK (100% Client)
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-[var(--color-line)] pt-6 text-[11px] text-slate-500 font-mono">
          <span>© 2026 HACkerConvert. Tüm hakları saklıdır.</span>
          <span>{t.foot_author}</span>
        </div>
      </footer>
    </div>
  );
}
