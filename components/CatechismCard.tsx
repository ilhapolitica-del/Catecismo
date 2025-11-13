
import React, { useState } from 'react';
import { Copy, Link as LinkIcon, Check, Sparkles, Database } from 'lucide-react';
import { CatechismParagraph } from '../types';
import { HighlightText } from './HighlightText';

interface CatechismCardProps {
  paragraph: CatechismParagraph;
  searchQuery: string;
}

export const CatechismCard: React.FC<CatechismCardProps> = ({ paragraph, searchQuery }) => {
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(`Catecismo da Igreja Católica, §${paragraph.id}\n\n"${paragraph.text}"`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
    // Create a hash link
    const url = `${window.location.origin}${window.location.pathname}#/paragraph/${paragraph.id}`;
    navigator.clipboard.writeText(url);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  return (
    <div 
      id={`p-${paragraph.id}`}
      className={`rounded-lg shadow-sm border p-6 my-4 transition-all hover:shadow-md ${
        paragraph.source === 'ai' 
          ? 'bg-white dark:bg-slate-800 border-amber-200 dark:border-amber-900/50' 
          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
      }`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center flex-wrap gap-2">
          <span className="text-amber-600 dark:text-amber-400 font-bold text-xl font-serif">
            §{paragraph.id}
          </span>
          {paragraph.section && (
            <span className="text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500 font-semibold border border-slate-100 dark:border-slate-700 px-2 py-0.5 rounded">
              {paragraph.section}
            </span>
          )}
          {paragraph.source === 'ai' && (
            <span className="flex items-center text-[10px] font-medium bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 px-1.5 py-0.5 rounded ml-1" title="Resultado obtido via Inteligência Artificial">
              <Sparkles size={10} className="mr-1" />
              IA
            </span>
          )}
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={handleLink}
            className="p-1.5 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
            title="Copiar Link Permanente"
          >
            {linkCopied ? <Check size={18} className="text-green-500" /> : <LinkIcon size={18} />}
          </button>
          <button
            onClick={handleCopy}
            className="p-1.5 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
            title="Copiar Texto"
          >
            {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
          </button>
        </div>
      </div>

      <div className="prose prose-slate dark:prose-invert max-w-none font-serif leading-relaxed text-lg text-slate-700 dark:text-slate-300">
        <HighlightText text={paragraph.text} highlight={searchQuery} />
      </div>
    </div>
  );
};
