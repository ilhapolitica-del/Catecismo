
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { HashRouter, Routes, Route, useParams, useNavigate, useLocation } from 'react-router-dom';
import { Search, Info, Book, Menu, X, Sparkles, Loader2 } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { CATECHISM_DATA } from './data';
import { CatechismParagraph, SectionType } from './types';
import { SECTION_RANGES } from './constants';
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

// --- Main Search View ---
const SearchView: React.FC<{ onOpenAbout: () => void }> = ({ onOpenAbout }) => {
  const [query, setQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState<SectionType>(SectionType.ALL);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // AI Search States
  const [aiResults, setAiResults] = useState<CatechismParagraph[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  
  const { id } = useParams(); // For direct paragraph linking
  const navigate = useNavigate();
  const location = useLocation();
  const debounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize Gemini
  const ai = useMemo(() => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }), []);

  // Handle initial load from URL param if exists
  useEffect(() => {
    if (location.pathname.includes('/paragraph/') && id) {
      setQuery(id);
    }
  }, [id, location.pathname]);

  // Local Filter Logic
  const localFiltered = useMemo(() => {
    const normalizedQuery = normalizeText(query.trim());
    const [minId, maxId] = SECTION_RANGES[selectedSection];

    return CATECHISM_DATA.filter((p) => {
      if (p.id < minId || p.id > maxId) return false;
      if (!normalizedQuery) return true;
      
      const isIdMatch = p.id.toString().includes(normalizedQuery);
      const normalizedBody = normalizeText(p.text);
      const isTextMatch = normalizedBody.includes(normalizedQuery);

      return isIdMatch || isTextMatch;
    }).map(p => ({ ...p, source: 'local' as const }));
  }, [query, selectedSection]);

  // AI Search Logic
  useEffect(() => {
    const searchTerm = query.trim();
    
    // Reset AI results if query is empty
    if (!searchTerm) {
      setAiResults([]);
      setAiError(null);
      setIsAiLoading(false);
      return;
    }

    // If query is a simple number (ID search), local logic is usually enough, 
    // but we can still ask AI if local is missing it.
    // Only trigger AI search if:
    // 1. It's not just a number (unless we really want deep search)
    // 2. It has at least 3 characters
    if (searchTerm.length < 3) return;

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    setIsAiLoading(true);
    setAiError(null);

    debounceTimeout.current = setTimeout(async () => {
      try {
        // We ask Gemini to find relevant paragraphs
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `Você é um especialista no Catecismo da Igreja Católica. 
          O usuário está pesquisando por: "${searchTerm}".
          
          Tarefas:
          1. Encontre até 6 parágrafos do Catecismo que sejam mais relevantes para este termo.
          2. Retorne o texto EXATO e o número do parágrafo.
          3. Se o termo for um número (ex: "250"), retorne esse parágrafo específico e os adjacentes relevantes.
          4. Para a seção, use uma das seguintes: "Profissão de Fé", "Sacramentos", "A Vida em Cristo", "Oração Cristã".
          
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
                },
                required: ["id", "text", "section"],
              },
            },
          },
        });

        const generatedText = response.text;
        if (generatedText) {
          const data = JSON.parse(generatedText) as CatechismParagraph[];
          // Tag them as AI source
          const labeledData = data.map(p => ({ ...p, source: 'ai' as const }));
          setAiResults(labeledData);
        }
      } catch (err) {
        console.error("Erro na busca AI:", err);
        setAiError("Não foi possível conectar à base de conhecimento online.");
      } finally {
        setIsAiLoading(false);
      }
    }, 800); // 800ms debounce to avoid spamming API

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [query, ai]);

  // Merge Results
  // We prefer local results first, then AI results. Deduplicate by ID.
  const mergedResults = useMemo(() => {
    const localIds = new Set(localFiltered.map(p => p.id));
    // Filter AI results that are already in local
    const newAiResults = aiResults.filter(p => !localIds.has(p.id));
    
    // If section filter is active, also filter AI results
    const [minId, maxId] = SECTION_RANGES[selectedSection];
    const filteredAi = newAiResults.filter(p => p.id >= minId && p.id <= maxId);

    return [...localFiltered, ...filteredAi].sort((a, b) => a.id - b.id);
  }, [localFiltered, aiResults, selectedSection]);

  const handleSectionChange = (section: SectionType) => {
    setSelectedSection(section);
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo / Title */}
            <div 
              className="flex items-center space-x-2 cursor-pointer" 
              onClick={() => {
                setQuery('');
                setSelectedSection(SectionType.ALL);
                navigate('/');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              <div className="bg-amber-500 p-1.5 rounded text-white">
                <Book size={20} />
              </div>
              <h1 className="hidden md:block font-serif font-bold text-lg text-slate-800 dark:text-slate-100 tracking-tight">
                Catecismo <span className="text-amber-600 dark:text-amber-500">Busca</span>
              </h1>
            </div>

            {/* Search Input */}
            <div className="flex-1 max-w-md mx-4 relative">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors group-focus-within:text-amber-500">
                  <Search size={18} className="text-slate-400" />
                </div>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Pesquisar (ex: Batismo, pecado, §27)..."
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-full leading-5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent sm:text-sm transition-all"
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
            </div>

            {/* Right Actions */}
            <div className="flex items-center space-x-2">
              <ThemeToggle />
              <button 
                onClick={onOpenAbout} 
                className="p-2 text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                title="Sobre"
              >
                <Info size={20} />
              </button>
              <button
                className="md:hidden p-2 text-slate-500"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>

          {/* Desktop Navigation (Filters) */}
          <nav className="hidden md:flex space-x-1 pb-0 overflow-x-auto">
            {Object.values(SectionType).map((section) => (
              <button
                key={section}
                onClick={() => handleSectionChange(section)}
                className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  selectedSection === section
                    ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                {section}
              </button>
            ))}
          </nav>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {Object.values(SectionType).map((section) => (
                <button
                  key={section}
                  onClick={() => handleSectionChange(section)}
                  className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${
                    selectedSection === section
                      ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-300'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  {section}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats / Loading State */}
        <div className="mb-6 flex items-center justify-between h-6">
          <span className="text-sm text-slate-500 dark:text-slate-400 flex items-center">
            {mergedResults.length > 0 && (
              <span className="mr-2">{mergedResults.length} resultado(s)</span>
            )}
            {isAiLoading && (
              <span className="flex items-center text-amber-600 dark:text-amber-400 animate-pulse text-xs font-medium">
                <Loader2 size={12} className="animate-spin mr-1.5" />
                Buscando na base de conhecimento...
              </span>
            )}
          </span>
        </div>

        {mergedResults.length > 0 ? (
          <div className="space-y-6">
            {mergedResults.map((p) => (
              <CatechismCard key={p.id} paragraph={p} searchQuery={query} />
            ))}
            
            {/* Bottom hint if only AI results are showing or if list is short */}
            {!isAiLoading && query.length > 2 && (
              <div className="text-center pt-8 pb-4 text-slate-400 text-xs italic">
                Fim dos resultados. Pesquise por outro termo para explorar mais.
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-20 px-4">
            {query.length > 0 ? (
              isAiLoading ? (
                 <div className="flex flex-col items-center">
                   <div className="relative w-16 h-16 mb-4">
                     <div className="absolute inset-0 border-4 border-slate-200 dark:border-slate-700 rounded-full"></div>
                     <div className="absolute inset-0 border-4 border-amber-500 rounded-full border-t-transparent animate-spin"></div>
                   </div>
                   <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">Pesquisando...</h3>
                   <p className="mt-2 text-slate-500 text-sm">Consultando a biblioteca completa do Catecismo.</p>
                 </div>
              ) : (
                <>
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                    <Search size={32} className="text-slate-400" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">Nenhum resultado encontrado</h3>
                  <p className="mt-2 text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                    Tente outros termos. O sistema de busca inteligente tentou encontrar referências, mas não obteve sucesso para "{query}".
                  </p>
                  <button 
                    onClick={() => {
                      setQuery('');
                      setSelectedSection(SectionType.ALL);
                    }}
                    className="mt-6 text-amber-600 dark:text-amber-400 hover:underline font-medium"
                  >
                    Limpar busca
                  </button>
                </>
              )
            ) : (
              <div className="opacity-60">
                 <Sparkles className="w-12 h-12 text-amber-400 mx-auto mb-4" />
                 <h3 className="text-xl font-serif text-slate-700 dark:text-slate-300 mb-2">Bem-vindo ao Catecismo Busca</h3>
                 <p className="text-slate-500 max-w-sm mx-auto">
                   Digite qualquer tema (ex: "Eucaristia", "Pecado", "Maria") ou número de parágrafo para pesquisar instantaneamente em todo o Catecismo.
                 </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-8 mt-auto">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-slate-500 text-sm">
            Ad Maiorem Dei Gloriam
          </p>
          <p className="text-slate-400 text-xs mt-2">
            © {new Date().getFullYear()} Catecismo Search. Conteúdo baseado no Catecismo da Igreja Católica.
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
