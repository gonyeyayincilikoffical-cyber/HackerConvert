import { useState, useEffect } from 'react';
import { Language } from '../types';

interface SplashIntroProps {
  onComplete: () => void;
  lang: Language;
}

export default function SplashIntro({ onComplete, lang }: SplashIntroProps) {
  const [dots, setDots] = useState('');
  const [bootStep, setBootStep] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const [soundUnlocked, setSoundUnlocked] = useState(false);

  // Simulated system logs
  const getLogs = () => {
    switch (lang) {
      case 'tr':
        return [
          { text: 'SYSTEM: HACkerConvert siber-deck çekirdeği yükleniyor...', type: 'info' },
          { text: 'SANDBOX: Tarayıcı içi yerel bellek sandbox alanı ayrıldı.', type: 'success' },
          { text: 'SECURITY: SSL/TLS uçtan uca şifreleme tüneli doğrulandı.', type: 'success' },
          { text: 'DECODERS: PNG, WEBP, PDF, TXT, CSV, JSON, ZIP kod çözücüler kuruldu.', type: 'success' },
          { text: 'CORES: Sunucusuz sıfır-veri-sızıntısı motoru aktif.', type: 'success' },
          { text: 'STATUS: HACkerConvert bağlantısı güvenli şekilde sağlandı.', type: 'highlight' },
        ];
      case 'en':
        return [
          { text: 'SYSTEM: Booting HACkerConvert cyber-deck kernel...', type: 'info' },
          { text: 'SANDBOX: Allocated in-browser local filesystem sandbox.', type: 'success' },
          { text: 'SECURITY: SSL/TLS end-to-end encryption pipeline verified.', type: 'success' },
          { text: 'DECODERS: PNG, WEBP, PDF, TXT, CSV, JSON, ZIP engines loaded.', type: 'success' },
          { text: 'CORES: Serverless zero-telemetry conversion engine active.', type: 'success' },
          { text: 'STATUS: HACkerConvert securely decrypted and ready.', type: 'highlight' },
        ];
      case 'fr':
        return [
          { text: 'SYSTEM: Chargement du noyau siber-deck HACkerConvert...', type: 'info' },
          { text: 'SANDBOX: Sandbox du système de fichiers local allouée.', type: 'success' },
          { text: 'SECURITY: Pipeline de chiffrement de bout en bout vérifié.', type: 'success' },
          { text: 'DECODERS: Moteurs PNG, WEBP, PDF, TXT, CSV, JSON, ZIP chargés.', type: 'success' },
          { text: 'CORES: Moteur de conversion sans serveur actif.', type: 'success' },
          { text: 'STATUS: HACkerConvert décrypté en toute sécurité.', type: 'highlight' },
        ];
      case 'ar':
        return [
          { text: 'النظام: جاري تشغيل نواة HACkerConvert السيبرانية...', type: 'info' },
          { text: 'البيئة المحلية: تم تخصيص مساحة تخزين آمنة داخل المتصفح.', type: 'success' },
          { text: 'الأمان: تم التحقق من سلامة تشفير البيانات من الطرف إلى الطرف.', type: 'success' },
          { text: 'المحركات: تم تحميل مكتبات معالجة الصور والمستندات والبيانات.', type: 'success' },
          { text: 'الخوادم: محرك تحويل محلي بالكامل دون إرسال أي بيانات نشط.', type: 'success' },
          { text: 'الحالة: تم فك تشفير HACkerConvert بنجاح وجاهز للعمل.', type: 'highlight' },
        ];
    }
  };

  const logLines = getLogs();

  useEffect(() => {
    // Elegant pulsing dots effect
    const dotsInterval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 450);

    return () => clearInterval(dotsInterval);
  }, []);

  useEffect(() => {
    // Sequentially print terminal logs
    if (bootStep < logLines.length) {
      const timer = setTimeout(() => {
        setBootStep((prev) => prev + 1);
        // Play subtle high-frequency terminal click
        playBootClick();
      }, 350 + Math.random() * 250);
      return () => clearTimeout(timer);
    }
  }, [bootStep, logLines.length]);

  // Play retro chime when boot is complete
  const playBootChime = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const audioCtx = new AudioContextClass();
      
      const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 cyber-chord
      freqs.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.06, audioCtx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + idx * 0.08 + 0.4);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + idx * 0.08);
        osc.stop(audioCtx.currentTime + idx * 0.08 + 0.4);
      });
    } catch (e) {
      // Audio context block guard
    }
  };

  const playBootClick = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const audioCtx = new AudioContextClass();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = 1200 + Math.random() * 400;
      gain.gain.setValueAtTime(0.015, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.03);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.03);
    } catch (e) {
      // ignore
    }
  };

  const handleEnter = () => {
    playBootChime();
    setIsFading(true);
    setTimeout(() => {
      onComplete();
    }, 600); // Wait for fade-out animation to finish
  };

  // Auto enter after print is complete
  useEffect(() => {
    if (bootStep === logLines.length) {
      const autoTimer = setTimeout(() => {
        handleEnter();
      }, 1500);
      return () => clearTimeout(autoTimer);
    }
  }, [bootStep, logLines.length]);

  return (
    <div 
      className={`fixed inset-0 bg-[#02050d] text-slate-100 z-[99999] flex flex-col items-center justify-center p-6 font-mono transition-opacity duration-500 select-none ${
        isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        backgroundImage: 'radial-gradient(circle at center, rgba(30, 41, 59, 0.45) 0%, rgba(2, 5, 13, 1) 85%)',
      }}
    >
      {/* Dynamic scanlines for cyber deck feel */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,6px_100%] z-50"></div>
      
      {/* Glitchy visual layout frame */}
      <div className="w-full max-w-2xl border border-blue-500/10 rounded-3xl bg-[#030712]/85 p-8 relative overflow-hidden shadow-2xl shadow-blue-950/20">
        
        {/* Subtle decorative corners */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-blue-500/30 rounded-tl-3xl"></div>
        <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-blue-500/30 rounded-tr-3xl"></div>
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-blue-500/30 rounded-bl-3xl"></div>
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-blue-500/30 rounded-br-3xl"></div>

        {/* Matrix Rain Decoration inside Splash Screen */}
        <div className="absolute top-2 right-6 flex items-center gap-1.5 text-[10px] text-emerald-400/60 tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
          <span>ONLINE DECK v4.0.2</span>
        </div>

        {/* Centered Logo Title with pulsing text-shadow */}
        <div className="text-center my-8 relative">
          <h1 
            className="text-4xl md:text-5xl font-display font-extrabold tracking-tight text-white drop-shadow-[0_0_20px_rgba(37,99,235,0.65)] select-none animate-pulse"
            style={{
              fontFamily: '"Space Grotesk", sans-serif',
            }}
          >
            HACkerConvert<span className="text-blue-500">.</span>
          </h1>
          <p className="text-xs text-slate-400 mt-2 tracking-widest uppercase">
            {lang === 'tr' ? 'Yeni Nesil Çevrimdışı Dosya Dönüştürücü' :
             lang === 'en' ? 'Next-Gen Offline File Transformer' :
             lang === 'fr' ? 'Transformateur de Fichiers Hors Ligne' : 'محول ملفات محلي متطور'}
          </p>
        </div>

        {/* Terminal Print log area */}
        <div className="border border-slate-800 bg-[#02050d]/90 rounded-2xl p-5 min-h-[160px] text-left text-xs leading-relaxed space-y-2 select-text overflow-y-auto">
          {logLines.slice(0, bootStep).map((log, index) => (
            <div 
              key={index}
              className={`flex items-start gap-2 animate-fadeIn ${
                log.type === 'highlight' ? 'text-blue-400 font-semibold' :
                log.type === 'success' ? 'text-slate-300' : 'text-slate-400'
              }`}
            >
              <span className="text-blue-500/70 select-none">&gt;&gt;</span>
              <span>{log.text}</span>
            </div>
          ))}

          {bootStep < logLines.length && (
            <div className="flex items-center gap-1.5 text-blue-400/80">
              <span className="text-blue-500/70 animate-pulse">&gt;&gt;</span>
              <span className="animate-pulse">{lang === 'tr' ? 'Yükleniyor' : 'Initializing'}{dots}</span>
            </div>
          )}
        </div>

        {/* Action Button & Loader Indicator */}
        <div className="mt-8 flex flex-col items-center justify-center gap-3">
          {bootStep === logLines.length ? (
            <button 
              onClick={handleEnter}
              className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-widest rounded-2xl cursor-pointer hover:shadow-lg hover:shadow-blue-500/25 active:scale-95 transition-all w-full sm:w-auto text-center"
              style={{
                fontFamily: '"JetBrains Mono", monospace'
              }}
            >
              {lang === 'tr' ? 'SİSTEME BAĞLAN' :
               lang === 'en' ? 'CONNECT TO DECK' :
               lang === 'fr' ? 'CONNEXION DECK' : 'الاتصال بالنظام'}
            </button>
          ) : (
            <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono select-none">
              <svg className="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>{lang === 'tr' ? 'Siber modüller yükleniyor' : 'Loading secure modules'}{dots}</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
