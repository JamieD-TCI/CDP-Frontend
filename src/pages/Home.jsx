import React from 'react';
import { Play, Zap } from 'lucide-react';
import { useApp } from '../context/AppContext';

/**
 * Home page - Introduction and quick start
 */
export const Home = () => {
  const { setStep, loadSampleData } = useApp();

  return (
    <div className="flex flex-col items-center justify-center min-h-150 text-center">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-5xl font-bold text-slate-900 dark:text-slate-50 mb-6">
          Protein Cysteine Analysis
        </h1>

        <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
          Enter one or more protein sequences (raw text or FASTA) containing cysteine residues.
          Our pre-trained models predict whether each cysteine can be detected in chemoproteomics screening.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {/* Start New Analysis Button */}
          <button
            onClick={() => setStep('parameters')}
            className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Play className="w-5 h-5" />
            Start New Analysis
          </button>

          {/* Load Sample Data Button */}
          <button
            onClick={loadSampleData}
            className="inline-flex items-center justify-center gap-2 px-8 py-3 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-50 font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Zap className="w-5 h-5" />
            Load Sample Data
          </button>
        </div>

        <div className="mt-16 pt-12 border-t border-slate-200 dark:border-slate-700">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
            How it works
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
            <div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                1
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Configure ESM-2 model parameters and embedding options
              </p>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                2
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Input your protein sequences in FASTA or raw format
              </p>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                3
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Review detailed predictions with confidence scores
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
