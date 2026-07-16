import React from 'react';
import { Code } from 'lucide-react';

/**
 * Footer component with links and credits
 */
export const Footer = () => {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-700 bg-blue-50 dark:bg-slate-800 mt-auto">
      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
          <p>
            The Francis Crick Institute 2026?
          </p>
          <a
            href="https://github.com/FrancisCrickInstitute/chemoproteomics-interpretability"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
          >
            <Code className="w-3 h-3" />
            GitHub Docs
          </a>
        </div>
      </div>
    </footer>
  );
};
