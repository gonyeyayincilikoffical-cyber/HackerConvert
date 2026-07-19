import { useState, useEffect } from 'react';
import { FileQueueItem, TranslationDict } from '../types';

interface FilePreviewPanelProps {
  item: FileQueueItem | null;
  t: TranslationDict;
}

export default function FilePreviewPanel({ item, t }: FilePreviewPanelProps) {
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [textSnippet, setTextSnippet] = useState<string | null>(null);

  useEffect(() => {
    if (!item) {
      setPreviewSrc(null);
      setTextSnippet(null);
      return;
    }

    const file = item.file;
    const type = file.type;

    if (type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewSrc(url);
      setTextSnippet(null);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewSrc(null);
      // Try to read first 250 characters for text files
      if (file.size < 5 * 1024 * 1024) { // Only read files smaller than 5MB
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target?.result as string;
          setTextSnippet(text.substring(0, 320) + (text.length > 320 ? '...' : ''));
        };
        reader.readAsText(file);
      } else {
        setTextSnippet('File is too large for real-time text snippet preview.');
      }
    }
  }, [item]);

  if (!item) {
    return (
      <div className="bg-[var(--color-bg-deep)]/40 border border-[var(--color-line)] rounded-2xl p-6 text-center text-slate-500 font-sans text-sm flex flex-col items-center justify-center h-48">
        <svg className="w-10 h-10 text-slate-600 mb-2.5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span>{t.preview_no_file}</span>
      </div>
    );
  }

  const isImage = item.file.type.startsWith('image/');

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-2xl p-5 shadow-lg relative overflow-hidden transition-all duration-300">
      <div className="flex items-center justify-between border-b border-[var(--color-line)] pb-2 mb-3">
        <span className="font-display font-semibold text-xs tracking-wider text-slate-300">{t.preview_panel_title}</span>
        <span className="font-mono text-[10px] text-[var(--color-accent-two)] bg-[var(--color-accent-two)]/10 border border-[var(--color-accent-two)]/20 px-2 py-0.5 rounded-lg">
          {item.file.name.split('.').pop()?.toUpperCase()}
        </span>
      </div>

      <div className="flex flex-col gap-3 min-h-36 justify-center">
        {isImage && previewSrc && (
          <div className="flex flex-col items-center gap-2">
            <div className="border border-[var(--color-line)] rounded-xl p-1 bg-[var(--color-bg-deep)] overflow-hidden max-h-28 flex items-center justify-center shadow-md">
              <img 
                src={previewSrc} 
                alt="File preview" 
                className="max-h-24 w-auto object-contain rounded-lg"
              />
            </div>
            <div className="text-[11px] font-mono text-slate-400 text-center">
              <span>{item.file.name}</span>
              <span className="text-slate-500 block">({(item.file.size / (1024 * 1024)).toFixed(2)} MB)</span>
            </div>
          </div>
        )}

        {!isImage && textSnippet && (
          <div className="bg-[var(--color-bg-deep)]/60 border border-[var(--color-line)] rounded-xl p-3 font-mono text-[10px] text-slate-300 overflow-x-auto whitespace-pre-wrap max-h-28 overflow-y-auto leading-relaxed">
            {textSnippet}
          </div>
        )}

        {!isImage && !textSnippet && (
          <div className="flex flex-col items-center gap-2 text-center py-4">
            <svg className="w-12 h-12 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div className="text-[11px] font-mono text-slate-400">
              <span className="font-semibold block truncate max-w-[200px]">{item.file.name}</span>
              <span className="text-slate-500">{(item.file.size / (1024 * 1024)).toFixed(2)} MB • Non-Visual</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
