import { useEffect, useRef } from 'react';
import { TerminalLog, AppTheme } from '../types';

interface TerminalConsoleProps {
  logs: TerminalLog[];
  t: any;
  theme: AppTheme;
}

export default function TerminalConsole({ logs, t, theme }: TerminalConsoleProps) {
  const terminalEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const getThemeTextClass = () => {
    switch (theme) {
      case 'synthwave':
        return 'text-[#ff007f]';
      case 'cyberpunk':
        return 'text-[#ffb700]';
      case 'glacier':
        return 'text-[#00f2fe]';
      case 'matrix':
      default:
        return 'text-[#00ffb7]';
    }
  };

  const getThemeBorderClass = () => {
    switch (theme) {
      case 'synthwave':
        return 'border-[#ff007f]/25';
      case 'cyberpunk':
        return 'border-[#ffb700]/25';
      case 'glacier':
        return 'border-[#00f2fe]/25';
      case 'matrix':
      default:
        return 'border-[#ff00e6]/25';
    }
  };

  return (
    <div className="mt-8 bg-[var(--color-bg-deep)]/90 border border-[var(--color-line)] rounded-2xl p-4 font-mono text-xs shadow-inner overflow-hidden transition-all">
      <div className="flex items-center justify-between border-b border-[var(--color-line)] pb-2 mb-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/80"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-green-500/80"></span>
          <span className="ml-2 font-semibold text-[10px] tracking-wider text-slate-400">{t.terminal_header}</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-slate-500">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-ping"></span>
          <span>SANDBOX SECURE</span>
        </div>
      </div>

      <div className="h-36 overflow-y-auto space-y-1.5 pr-2 select-text">
        {logs.length === 0 ? (
          <div className="text-slate-500 italic flex items-center gap-1">
            <span>&gt;</span>
            <span>{t.terminal_placeholder}</span>
            <span className={`inline-block w-1.5 h-3 bg-current ${getThemeTextClass()} animate-pulse`}></span>
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="flex items-start gap-2 leading-relaxed">
              <span className="text-slate-500 select-none">[{log.timestamp}]</span>
              
              {log.type === 'info' && (
                <span className="text-blue-400 font-bold select-none">[INFO]</span>
              )}
              {log.type === 'success' && (
                <span className="text-emerald-400 font-bold select-none">[OK]</span>
              )}
              {log.type === 'warn' && (
                <span className="text-amber-400 font-bold select-none">[WARN]</span>
              )}
              {log.type === 'error' && (
                <span className="text-rose-500 font-bold select-none">[ERR]</span>
              )}

              <span className="text-slate-200">{log.message}</span>
            </div>
          ))
        )}
        <div ref={terminalEndRef} />
      </div>
    </div>
  );
}
