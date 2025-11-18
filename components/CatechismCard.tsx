import React, { useState } from 'react';
import { Copy, Link as LinkIcon, Check, Sparkles, BookOpen, ChevronDown, ChevronUp, Maximize2, X, Minus, Plus } from 'lucide-react';
import { CatechismParagraph } from '../types';
import { HighlightText } from './HighlightText';

interface CatechismCardProps {
  paragraph: CatechismParagraph;
  searchQuery: string;
}

export const CatechismCard: React.FC<CatechismCardProps> = ({ paragraph, searchQuery }) => {
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showRefs, setShowRefs] = useState(false);
  
  // Reader Mode States
  const [isReaderOpen, setIsReaderOpen] = useState(false);
  const [fontSizeLevel, setFontSizeLevel] = useState(1); // 0 to 3

  const fontSizes = {
    0: 'text-lg leading-relaxed',
    1: 'text-xl leading-relaxed',
    2: 'text-2xl leading-loose',
    3: 'text-3xl leading-loose'
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`Catecismo da Igreja Católica, §${paragraph.id}\n\n"${paragraph.text}"`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}${window.location.pathname}#/paragraph/${paragraph.id}`;
    navigator.clipboard.writeText(url);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const hasBibleRefs = paragraph.bibleReferences && paragraph.bibleReferences.length > 0;

  // Reader Modal Component
  const ReaderModal = () => {
    if (!isReaderOpen) return null;

    return (
      <div className="fixed inset-0 z-50 bg-white dark:bg-slate-900 flex flex-col animate-fade-in-up">
        {/* Reader Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setFontSizeLevel(prev => Math.max(0, prev - 1))}
              className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors disabled:opacity-30"
              disabled={fontSizeLevel === 0}
              aria-label="Diminuir letra"
            >
              <Minus size={20} />
            </button>
            <span className="text-sm font-medium text-slate-400 w-8 text-center">
              {['A', 'A+', 'A++', 'A+++'][fontSizeLevel]}
            </span>
            <button 
              onClick={() => setFontSizeLevel(prev => Math.min(3, prev + 1))}
              className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors disabled:opacity-30"
              disabled={fontSizeLevel === 3}
              aria-label="Aumentar letra"
            >
              <Plus size={20} />
            </button>
          </div>
          
          <button 
            onClick={() => setIsReaderOpen(false)}
            className="p-2 text-slate-500 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Reader Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-2xl mx-auto pb-20">
            <div className="flex items-center justify-between mb-6">
              <span className="text-amber-600 dark:text-amber-500 font-bold text-2xl font-serif">
                §{paragraph.id}
              </span>
              {paragraph.section && (
                <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold border border-slate-200 dark:border-slate-700 px-2 py-1 rounded">
                  {paragraph.section}
                </span>
              )}
            </div>

            <div className={`font-serif text-slate-800 dark:text-slate-200 transition-all duration-300 ${fontSizes[fontSizeLevel as keyof typeof fontSizes]}`}>
              <HighlightText text={paragraph.text} highlight={searchQuery} />
            </div>

            {hasBibleRefs && (
              <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Referências Bíblicas</h4>
                <div className="flex flex-wrap gap-3">
                  {paragraph.bibleReferences?.map((ref, idx) => (
                    <span 
                      key={idx} 
                      className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-400"
                    >
                      <BookOpen size={14} className="mr-2" />
                      {ref}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <ReaderModal />
      <div 
        id={`p-${paragraph.id}`}
        className={`rounded-lg shadow-sm border transition-all hover:shadow-md ${
          paragraph.source === 'ai' 
            ? 'bg-white dark:bg-slate-800 border-amber-200 dark:border-amber-900/50' 
            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
        }`}
      >
        <div className="p-6">
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
            
            <div className="flex space-x-1 md:space-x-2">
              {/* Read Mode Button - Highlighted for Mobile */}
              <button
                onClick={() => setIsReaderOpen(true)}
                className="flex items-center px-2 py-1.5 text-amber-600 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/40 rounded-md transition-colors mr-1"
                title="Modo Leitura (Aumentar Fonte)"
              >
                <Maximize2 size={16} className="mr-1.5" />
                <span className="text-xs font-bold">Ler</span>
              </button>

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

          <div className="prose prose-slate dark:prose-invert max-w-none font-serif leading-relaxed text-lg text-slate-700 dark:text-slate-300 cursor-pointer" onClick={() => setIsReaderOpen(true)}>
            <HighlightText text={paragraph.text} highlight={searchQuery} />
          </div>
        </div>

        {hasBibleRefs && (
          <div className="bg-amber-50/50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-700 px-6 py-3 rounded-b-lg">
            <button 
              onClick={() => setShowRefs(!showRefs)}
              className="flex items-center w-full text-left text-sm font-medium text-amber-700 dark:text-amber-500 hover:text-amber-800 dark:hover:text-amber-400 transition-colors focus:outline-none group"
            >
              <BookOpen size={16} className="mr-2" />
              <span className="flex-1">Referências Bíblicas</span>
              {showRefs ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            
            {showRefs && (
              <div className="mt-3 flex flex-wrap gap-2 animate-fade-in-up">
                {paragraph.bibleReferences?.map((ref, idx) => (
                  <span 
                    key={idx} 
                    className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-900/50 text-slate-600 dark:text-slate-300 shadow-sm"
                  >
                    {ref}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};