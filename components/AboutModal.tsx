import React from 'react';
import { X, BookOpen } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full p-6 relative animate-fade-in-up">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <X size={24} />
        </button>

        <div className="flex items-center space-x-3 mb-4 text-amber-600 dark:text-amber-400">
          <BookOpen size={32} />
          <h2 className="text-2xl font-bold font-serif">Sobre</h2>
        </div>

        <div className="space-y-4 text-slate-600 dark:text-slate-300">
          <p>
            Este aplicativo foi desenvolvido para facilitar o estudo e a consulta rápida ao 
            <strong> Catecismo da Igreja Católica</strong>.
          </p>
          <p>
            <strong>Funcionalidades:</strong>
            <ul className="list-disc list-inside ml-2 mt-2 space-y-1">
              <li>Busca instantânea por palavras ou números de parágrafo.</li>
              <li>Navegação por seções teológicas.</li>
              <li>Links permanentes para compartilhamento.</li>
              <li>Modo escuro para leitura noturna.</li>
            </ul>
          </p>
          <p className="text-sm italic border-t pt-4 border-slate-200 dark:border-slate-700">
            Nota: As buscas são realizadas localmente no seu navegador. Nenhum dado de pesquisa é enviado para servidores externos. 
            Esta versão contém uma amostra representativa dos parágrafos para demonstração.
          </p>
        </div>
        
        <button
          onClick={onClose}
          className="mt-6 w-full bg-amber-500 hover:bg-amber-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          Entendi
        </button>
      </div>
    </div>
  );
};