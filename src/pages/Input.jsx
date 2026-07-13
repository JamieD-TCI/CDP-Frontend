import React, { useState, useRef } from 'react';
import { Upload, Loader } from 'lucide-react';
import { useApp } from '../context/AppContext';

/**
 * Input page - Accept target protein sequences via file or text input
 */
export const Input = () => {
  const { setStep, setInputData, setResultsData, state } = useApp();
  const [isDragActive, setIsDragActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);
  const [sequences, setSequences] = useState(state.inputData.sequences);

  // Validation function for sequences
  const validateSequences = (text) => {
    if (!text.trim()) return false;
    const lines = text.trim().split('\n');
    let hasSequence = false;
    for (const line of lines) {
      if (line.startsWith('>')) continue;
      if (/^[A-Z*]+$/i.test(line.trim())) {
        hasSequence = true;
        break;
      }
    }
    return hasSequence;
  };

  // Handle file drag over
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  // Handle file drag leave
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  // Handle file drop
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type === 'text/plain' || file.name.endsWith('.fasta')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target.result;
          if (validateSequences(content)) {
            setSequences(content);
            setInputData({ sequences: content, fileName: file.name });
          } else {
            alert('Invalid sequence file. Please provide a valid FASTA or sequence file.');
          }
        };
        reader.readAsText(file);
      } else {
        alert('Please drop a .txt or .fasta file');
      }
    }
  };

  // Handle file input change
  const handleFileInputChange = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target.result;
        if (validateSequences(content)) {
          setSequences(content);
          setInputData({ sequences: content, fileName: file.name });
        } else {
          alert('Invalid sequence file. Please provide a valid FASTA or sequence file.');
        }
      };
      reader.readAsText(file);
    }
  };

  // Handle text area change
  const handleTextAreaChange = (e) => {
    const text = e.target.value;
    setSequences(text);
    setInputData({ sequences: text, fileName: '' });
  };

  // Handle run prediction (simulates loading)
  const handleRunPrediction = async () => {
    if (!validateSequences(sequences)) {
      alert('Please enter valid protein sequences');
      return;
    }

    setIsLoading(true);

    // Simulate processing time
    setTimeout(() => {
      // Parse sequences to create mock results
      const proteinSeqs = sequences.split('\n').reduce((acc, line, idx) => {
        if (line.startsWith('>')) {
          acc.push({ header: line.slice(1), sequence: '' });
        } else if (acc.length > 0) {
          acc[acc.length - 1].sequence += line.trim();
        }
        return acc;
      }, []);

      const mockResults = {
        metadata: {
          model_used: state.parameters.model,
          threshold_n: state.parameters.confidenceThreshold,
        },
        results: proteinSeqs
          .filter((p) => p.sequence.length > 0)
          .map((p) => {
            const cysteinePositions = [];
            for (let i = 0; i < p.sequence.length; i++) {
              if (p.sequence[i] === 'C') {
                cysteinePositions.push(i + 1);
              }
            }

            return {
              protein_id: p.header || `Protein_${cysteinePositions.length}`,
              sequence_length: p.sequence.length,
              cysteines: cysteinePositions.map((pos) => {
                const rawScore = Math.random(); // raw model output between 0 and 1
                const detectable = rawScore >= 0.5;
                const confidence = detectable ? rawScore : (1 - rawScore);

                return {
                  position: pos,
                  peptide: `PEPT_${pos}`,
                  confidence: parseFloat(confidence.toFixed(3)),
                  detectable,
                  notes: detectable ? 'Predicted detectable region' : 'Predicted undetectable region',
                };
              }),
            };
          }),
      };

      setResultsData(mockResults);
      setIsLoading(false);
      setStep('output');
    }, 2000);
  };

  const isValid = validateSequences(sequences);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
        Input Protein Sequences
      </h2>

      {/* Drag and Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg py-6 px-8 text-center transition-all ${
          isDragActive
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-slate-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500'
        }`}
      >
        <Upload className="w-10 h-10 mx-auto mb-3 text-slate-400 dark:text-slate-500" />
        <p className="text-base font-semibold text-slate-900 dark:text-slate-50 mb-1">
          Drag and drop your file
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
          Supports .txt and .fasta files
        </p>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Upload className="w-4 h-4" />
          Browse Files
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.fasta"
          onChange={handleFileInputChange}
          className="hidden"
        />
      </div>

      {/* Text Area Alternative */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
          Or paste your sequences directly
        </label>
        <textarea
          value={sequences}
          onChange={handleTextAreaChange}
          placeholder={`Enter FASTA format or raw sequences
e.g.
sp|P12345|Example
MALWMRLLPLLALLALWGPDPAAAFVNQHLCGSHLVEA
sp|P54321|Example2
YLVCGERGFFYTPKTRREAEDLQVGQVELGGGPGAGSLQ`}
          className="w-full h-40 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
          Accepted formats: FASTA headers (starting with &gt;) or raw amino acid sequences
        </p>
      </div>



      {/* Action Buttons */}
      <div className="flex gap-3 justify-end pt-6 border-t border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setStep('parameters')}
          className="px-6 py-2 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-50 font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          Back
        </button>

        <button
          onClick={handleRunPrediction}
          disabled={!isValid || isLoading}
          className={`inline-flex items-center gap-2 px-6 py-2 font-semibold rounded-lg transition-colors bg-blue-600 text-white hover:bg-blue-700 ${
            isLoading || !isValid
              ? 'opacity-50 cursor-not-allowed'
              : 'cursor-pointer'
          }`}
        >
          {isLoading ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Processing ESM-2 Embeddings...
            </>
          ) : (
            'Run Prediction'
          )}
        </button>
      </div>
    </div>
  );
};
