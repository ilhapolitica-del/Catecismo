import React, { useState, useMemo, useEffect } from 'react';
import { HashRouter, Routes, Route, useParams, useNavigate, useLocation } from 'react-router-dom';
import { Search, Info, Book, X, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { CATECHISM_DATA } from './data';
import { CatechismParagraph } from './types';
import { ThemeToggle } from './components/ThemeToggle';
import { CatechismCard } from './components/CatechismCard';
import { AboutModal } from './components/AboutModal';

// Helper to normalize text (remove accents, lower case)
const normalizeText = (text: string) => {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
};

const SearchView: React.FC<{ onOpenAbout: () => void }> = ({ onOpenAbout }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CatechismParagraph[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Initialize Gemini
  const ai = useMemo(() => new GoogleGenAI({ apiKey: process.env.API_KEY }), []);

  // Handle search execution
  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    setHasSearched(true);
    
    const normalizedQuery = normalizeText(searchQuery.trim());

    // 1. Local Search (Instant) - Check local sample data first
    const localMatches = CATECHISM_DATA.filter((p) => {
      const isIdMatch = p.id.toString().includes(normalizedQuery);
      const normalizedBody = normalizeText(p.text);
      const isTextMatch = normalizedBody.includes(normalizedQuery);
      return isIdMatch || isTextMatch;
    }).map(p => ({ ...p, source: 'local' as const }));

    // Optimistically show local results immediately
    setResults(localMatches);

    try {
      // 2. AI Search (Comprehensive) - Checks the entire Catechism
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Contexto: Catecismo da Igreja Católica.
        Busca: "${searchQuery}".
        
        Objetivo: Encontrar os 4 a 8 parágrafos mais relevantes em TODO o livro.
        
        Regras:
        1. Retorne o texto EXATO e o número do parágrafo.
        2. Se a busca for um número (ex: "123"), retorne exatamente esse parágrafo.
        3. Categorize a seção (ex: "Profissão de Fé", "Sacramentos", "A Vida em Cristo", "Oração Cristã").
        4. Identifique referências bíblicas diretas ou de rodapé associadas a este parágrafo (Use o cânon católico, ex: Jerusalém/Ave Maria).
        
        Retorne APENAS um JSON array.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.INTEGER },
                text: { type: Type.STRING },
                section: { type: Type.STRING },
                bibleReferences: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Lista de citações bíblicas (Livro Cap:Ver) relacionadas, canônicas católicas."
                }
              },
              required: ["id", "text", "section"],
            },
          },
        },
      });

      const generatedText = response.text;
      if (generatedText) {
        const aiData = JSON.parse(generatedText) as CatechismParagraph[];
        const labeledAiData = aiData.map(p => ({ ...p, source: 'ai' as const }));
        
        // Merge: Remove duplicates from AI that exist locally
        const localIds = new Set(localMatches.map(p => p.id));
        const newAiResults = labeledAiData.filter(p => !localIds.has(p.id));
        
        const finalResults = [...localMatches, ...newAiResults].sort((a, b) => a.id - b.id);
        setResults(finalResults);
      }
    } catch (err) {
      console.error("Erro na busca AI:", err);
      // If AI fails, we still have local results displayed
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger search on button click or Enter
  const onSearchSubmit = () => {
    if (query.trim()) {
      handleSearch(query);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearchSubmit();
    }
  };

  // Handle initial URL param
  useEffect(() => {
    if (location.pathname.includes('/paragraph/') && id) {
      setQuery(id);
      handleSearch(id);
    }
  }, [id, location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Logo */}
            <div 
              className="flex items-center space-x-2 cursor-pointer flex-shrink-0" 
              onClick={() => {
                setQuery('');
                setHasSearched(false);
                setResults([]);
                navigate('/');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              <div className="bg-amber-500 p-1.5 rounded text-white shadow-sm">
                <Book size={24} />
              </div>
              <h1 className="hidden md:block font-serif font-bold text-xl text-slate-800 dark:text-slate-100 tracking-tight">
                Catecismo <span className="text-amber-600 dark:text-amber-500">Busca</span>
              </h1>
            </div>

            {/* Search Area */}
            <div className="flex-1 max-w-2xl flex items-center gap-2">
              <div className="relative flex-1 group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={18} className="text-slate-400 group-focus-within:text-amber-500 transition-colors" />
                </div>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Pesquisar (ex: Pecado, Batismo, §123)..."
                  className="block w-full pl-10 pr-10 py-2.5 border border-slate-300 dark:border-slate-600 rounded-l-lg md:rounded-lg leading-5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent shadow-sm transition-all"
                />
                {query && (
                  <button 
                    onClick={() => setQuery('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              <button
                onClick={onSearchSubmit}
                disabled={!query.trim() || isLoading}
                className="hidden md:flex items-center px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? <Loader2 size={18} className="animate-spin mr-2" /> : <Search size={18} className="mr-2" />}
                Buscar
              </button>
              {/* Mobile Search Button (Icon only) */}
              <button
                 onClick={onSearchSubmit}
                disabled={!query.trim() || isLoading}
                className="md:hidden flex items-center justify-center p-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors shadow-sm disabled:opacity-50"
              >
                 {isLoading ? <Loader2 size={20} className="animate-spin" /> : <ArrowRight size={20} />}
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-1 flex-shrink-0">
              <ThemeToggle />
              <button 
                onClick={onOpenAbout} 
                className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                title="Sobre"
              >
                <Info size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {!hasSearched ? (
          // Welcome State
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 animate-fade-in-up">
            <div className="bg-amber-100 dark:bg-amber-900/30 p-6 rounded-full mb-4">
              <Sparkles className="w-12 h-12 text-amber-500" />
            </div>
            <h2 className="text-3xl font-serif font-bold text-slate-800 dark:text-slate-100">
              O Catecismo da Igreja Católica
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed">
              Ferramenta de busca rápida e abrangente. Digite um tema ou número de parágrafo para explorar todo o conteúdo do Catecismo.
            </p>
            
            <div className="flex flex-wrap justify-center gap-3 mt-8">
              {['Eucaristia', 'Oração', 'Pecado', 'Maria', 'Batismo', 'Fé'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    setQuery(tag);
                    handleSearch(tag);
                  }}
                  className="px-4 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-sm text-slate-600 dark:text-slate-300 hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-400 transition-all shadow-sm"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        ) : (
          // Results State
          <div className="space-y-6">
            <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-4">
              <span>
                {isLoading && results.length === 0 
                  ? "Iniciando busca..." 
                  : `${results.length} resultado(s) encontrado(s)`}
              </span>
              {isLoading && (
                <span className="flex items-center text-amber-600 dark:text-amber-400 animate-pulse font-medium">
                  <Loader2 size={14} className="animate-spin mr-2" />
                  Consultando base completa...
                </span>
              )}
            </div>

            {results.map((p) => (
              <CatechismCard key={p.id} paragraph={p} searchQuery={query} />
            ))}

            {!isLoading && results.length === 0 && (
               <div className="text-center py-16">
                 <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                   <Search size={32} className="text-slate-400" />
                 </div>
                 <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">Nenhum resultado encontrado</h3>
                 <p className="mt-2 text-slate-500 dark:text-slate-400">
                   Não encontramos referências exatas para "{query}". Tente usar termos mais gerais ou sinônimos.
                 </p>
                 <button 
                    onClick={() => {
                      setQuery('');
                      setHasSearched(false);
                    }}
                    className="mt-6 text-amber-600 dark:text-amber-400 hover:underline font-medium"
                  >
                    Voltar ao início
                  </button>
               </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-8 mt-auto">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="font-serif italic text-slate-600 dark:text-slate-400 mb-2">Ad Maiorem Dei Gloriam</p>
          <p className="text-slate-400 text-xs">
            © {new Date().getFullYear()} Catecismo Search. Baseado no texto oficial do Catecismo da Igreja Católica.
          </p>
        </div>
      </footer>
    </div>
  );
};

const App: React.FC = () => {
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<SearchView onOpenAbout={() => setIsAboutOpen(true)} />} />
        <Route path="/paragraph/:id" element={<SearchView onOpenAbout={() => setIsAboutOpen(true)} />} />
      </Routes>
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
    </HashRouter>
  );
};

export default App;