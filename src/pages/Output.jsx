import React, { useState, useMemo, useEffect } from 'react';
import { ChevronUp, ChevronDown, Search, Download, ArrowLeft, Copy, Check, X } from 'lucide-react';
import { useApp, formatConfidence } from '../context/AppContext';

const EMPTY_ARRAY = [];

/**
 * Output page - Review and compare predictions with Master-Detail interface
 */
export const Output = () => {
  const { state, setResultsData, updateParameters } = useApp();
  const [selectedProtein, setSelectedProtein] = useState(null);
  const [summarySort, setSummarySort] = useState({ field: 'protein_id', asc: true });
  const [detailSort, setDetailSort] = useState({ field: 'position', asc: true });
  const [summarySearch, setSummarySearch] = useState('');
  const [detailSearch, setDetailSearch] = useState('');
  const [sequenceModal, setSequenceModal] = useState(null);
  const [modalCopied, setModalCopied] = useState(false);
  const [confidenceFilter, setConfidenceFilter] = useState(null); // null, 'detectable_high', 'detectable_low', 'undetectable_high', 'undetectable_low'
  const [replacementModal, setReplacementModal] = useState(null);

  const { resultsData } = state;
  const metadata = resultsData ? resultsData.metadata : null;
  const results = resultsData ? resultsData.results : EMPTY_ARRAY;
  const threshold = metadata ? metadata.threshold_n : 0.75;

  const [tempThreshold, setTempThreshold] = useState(threshold);

  // Sync tempThreshold when threshold updates
  useEffect(() => {
    if (threshold !== undefined) {
      setTempThreshold(threshold);
    }
  }, [threshold]);

  const handleUpdateThreshold = (newVal) => {
    if (!resultsData) return;
    updateParameters({ confidenceThreshold: newVal });
    setResultsData({
      ...resultsData,
      metadata: {
        ...resultsData.metadata,
        threshold_n: newVal,
      },
    });
  };

  // Process summary data
  const summaryData = useMemo(() => {
    return results.map((protein) => {
      const det_high = protein.cysteines.filter(
        (c) => c.detectable && c.confidence > threshold
      ).length;
      const det_low = protein.cysteines.filter(
        (c) => c.detectable && c.confidence <= threshold
      ).length;
      const undet_high = protein.cysteines.filter(
        (c) => !c.detectable && c.confidence > threshold
      ).length;
      const undet_low = protein.cysteines.filter(
        (c) => !c.detectable && c.confidence <= threshold
      ).length;
      return {
        ...protein,
        total_cysteines: protein.cysteines.length,
        detectable_high_cysteines: det_high,
        detectable_low_cysteines: det_low,
        undetectable_high_cysteines: undet_high,
        undetectable_low_cysteines: undet_low,
      };
    });
  }, [results, threshold]);

  // Filter and sort summary
  const filteredSummary = useMemo(() => {
    let filtered = summaryData.filter((p) =>
      p.protein_id.toLowerCase().includes(summarySearch.toLowerCase())
    );

    filtered.sort((a, b) => {
      const aVal = a[summarySort.field];
      const bVal = b[summarySort.field];
      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return summarySort.asc ? comparison : -comparison;
    });

    return filtered;
  }, [summaryData, summarySearch, summarySort]);

  // Get detail data for selected protein
  const detailData = useMemo(() => {
    if (!selectedProtein) return [];

    const protein = results.find((p) => p.protein_id === selectedProtein);
    if (!protein) return [];

    const mapped = protein.cysteines;

    if (confidenceFilter === 'detectable_high') {
      return mapped.filter((c) => c.detectable && c.confidence > threshold);
    }
    if (confidenceFilter === 'detectable_low') {
      return mapped.filter((c) => c.detectable && c.confidence <= threshold);
    }
    if (confidenceFilter === 'undetectable_high') {
      return mapped.filter((c) => !c.detectable && c.confidence > threshold);
    }
    if (confidenceFilter === 'undetectable_low') {
      return mapped.filter((c) => !c.detectable && c.confidence <= threshold);
    }
    return mapped;
  }, [selectedProtein, results, threshold, confidenceFilter]);

  // Filter and sort detail
  const filteredDetail = useMemo(() => {
    let filtered = detailData.filter(
      (c) =>
        c.position.toString().includes(detailSearch) ||
        c.peptide.toLowerCase().includes(detailSearch.toLowerCase())
    );

    filtered.sort((a, b) => {
      let aVal, bVal;
      if (detailSort.field === 'detectable') {
        aVal = a.detectable ? a.confidence : (1 - a.confidence);
        bVal = b.detectable ? b.confidence : (1 - b.confidence);
      } else {
        aVal = a[detailSort.field];
        bVal = b[detailSort.field];
      }
      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return detailSort.asc ? comparison : -comparison;
    });

    return filtered;
  }, [detailData, detailSearch, detailSort]);

  // Handle column sort
  const handleSummarySort = (field) => {
    setSummarySort((prev) => {
      if (prev.field === field) {
        return { field, asc: !prev.asc };
      } else {
        const descFields = [
          'sequence_length',
          'total_cysteines',
          'detectable_high_cysteines',
          'detectable_low_cysteines',
          'undetectable_high_cysteines',
          'undetectable_low_cysteines'
        ];
        const defaultAsc = !descFields.includes(field);
        return { field, asc: defaultAsc };
      }
    });
  };

  const handleDetailSort = (field) => {
    setDetailSort((prev) => {
      if (prev.field === field) {
        return { field, asc: !prev.asc };
      } else {
        const defaultAsc = !(field === 'confidence' || field === 'detectable');
        return { field, asc: defaultAsc };
      }
    });
  };

  if (!resultsData) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600 dark:text-slate-400">No results available</p>
      </div>
    );
  }

  // Export functions
  /**
   * Export summary table (all proteins)
   */
  const exportSummaryCSV = () => {
    const headers = [
      'Protein ID',
      'Sequence',
      'Sequence Length',
      'Total Cysteines',
      'Detectable High Cysteines',
      'Detectable Low Cysteines',
      'Undetectable Low Cysteines',
      'Undetectable High Cysteines',
      'Replacements',
    ];
    const rows = filteredSummary.map((p) => [
      p.protein_id,
      p.sequence || 'N/A',
      p.sequence_length,
      p.total_cysteines,
      p.detectable_high_cysteines,
      p.detectable_low_cysteines,
      p.undetectable_low_cysteines,
      p.undetectable_high_cysteines,
      p.replacements && p.replacements.length > 0 ? 'Yes' : 'No',
    ]);

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'cysteine_summary.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  /**
   * Export all cysteines across all proteins
   */
  const exportAllCysteinesCSV = () => {
    const headers = ['Protein ID', 'Position', 'Peptide', 'Confidence', 'Detectable', 'Notes'];
    const rows = [];

    results.forEach((protein) => {
      protein.cysteines.forEach((cys) => {
        rows.push([
          protein.protein_id,
          `Cys${cys.position}`,
          cys.peptide,
          formatConfidence(cys.confidence, 3),
          cys.detectable ? 'Yes' : 'No',
          cys.notes,
        ]);
      });
    });

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'all_cysteines.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportProteinCSV = (exportType) => {
    if (!selectedProtein) return;

    const protein = results.find((p) => p.protein_id === selectedProtein);
    if (!protein) return;

    // Filter by search text
    let list = protein.cysteines.filter(
      (c) =>
        c.position.toString().includes(detailSearch) ||
        c.peptide.toLowerCase().includes(detailSearch.toLowerCase())
    );

    // Filter by type
    if (exportType === 'high') {
      list = list.filter((c) => c.detectable && c.confidence > threshold);
    } else if (exportType === 'detectable') {
      list = list.filter((c) => c.detectable);
    }

    const headers = ['Position', 'Peptide', 'Confidence', 'Detectable', 'Notes'];
    const rows = list.map((c) => [
      `Cys${c.position}`,
      c.peptide,
      formatConfidence(c.confidence, 3),
      c.detectable ? 'Yes' : 'No',
      c.notes,
    ]);

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedProtein}_${exportType}_cysteines.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const SortHeader = ({ field, label, onSort }) => (
    <button
      onClick={() => onSort(field)}
      className="flex items-center gap-1 font-semibold hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
    >
      {label}
      {field === (selectedProtein ? detailSort.field : summarySort.field) && (
        <span>
          {(selectedProtein ? detailSort.asc : summarySort.asc) ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </span>
      )}
    </button>
  );

  const renderThresholdSlider = () => {
    return (
      <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-0.5">
            Confidence Threshold
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Separate cysteines into high & low confidence categories.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-1 max-w-md w-full">
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">0.5</span>
          <input
            type="range"
            min="0.5"
            max="1.0"
            step="0.01"
            value={tempThreshold}
            onChange={(e) => setTempThreshold(parseFloat(e.target.value))}
            className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600 animate-pulse-slow"
          />
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">1.0</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-md w-14 text-center text-slate-800 dark:text-slate-200 shadow-sm animate-pulse-slow">
              {tempThreshold.toFixed(2)}
            </span>
            <button
              onClick={() => handleUpdateThreshold(tempThreshold)}
              disabled={tempThreshold === threshold}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${tempThreshold === threshold
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-650 cursor-not-allowed border border-transparent'
                : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-sm cursor-pointer'
                }`}
            >
              Update
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderSequenceModal = () => {
    if (!sequenceModal) return null;
    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-2xl w-full shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200">
          <button
            onClick={() => setSequenceModal(null)}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-2">
            Protein Sequence
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 font-semibold font-mono">
            ID: {sequenceModal.id}
          </p>

          <div className="font-mono text-xs break-all bg-slate-50 dark:bg-slate-950 p-4 rounded-lg border border-slate-200 dark:border-slate-800 max-h-60 overflow-y-auto select-all text-slate-800 dark:text-slate-200 mb-6 leading-relaxed">
            {sequenceModal.sequence}
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(sequenceModal.sequence);
                  setModalCopied(true);
                  setTimeout(() => setModalCopied(false), 2000);
                } catch (err) {
                  console.error('Failed to copy text: ', err);
                }
              }}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer ${modalCopied
                ? 'bg-green-600 text-white shadow-sm'
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                }`}
            >
              {modalCopied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy to Clipboard
                </>
              )}
            </button>
            <button
              onClick={() => setSequenceModal(null)}
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderReplacementModal = () => {
    if (!replacementModal) return null;
    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-2xl w-full shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200">
          <button
            onClick={() => setReplacementModal(null)}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-2">
            Sequence Replacements Report
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 font-semibold font-mono">
            Protein ID: {replacementModal.id}
          </p>

          <div className="mb-6">
            <div className="border border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden overflow-x-auto max-h-60">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-600">
                    <th className="px-4 py-3 text-left text-sm font-semibold">Position</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Original Residue</th>
                  </tr>
                </thead>
                <tbody>
                  {replacementModal.replacements.map((rep, idx) => (
                    <tr
                      key={idx}
                      className={`border-b border-slate-200 dark:border-slate-700 ${idx % 2 === 0
                        ? 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        : 'bg-slate-50/50 dark:bg-slate-800/20 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                    >
                      <td className="px-4 py-3 text-sm font-semibold text-slate-900 dark:text-slate-50 font-mono">
                        {rep.position}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400 font-mono">
                        {rep.original_residue}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setReplacementModal(null)}
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // MASTER VIEW
  if (!selectedProtein) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
          Summary Results
        </h2>

        {renderThresholdSlider()}

        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search proteins..."
              value={summarySearch}
              onChange={(e) => setSummarySearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={exportSummaryCSV}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Export Summary
            </button>

            <button
              onClick={exportAllCysteinesCSV}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-white border border-slate-200 dark:border-transparent font-semibold rounded-lg transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Export All Cysteines
            </button>
          </div>
        </div>

        {/* Summary Table */}
        <div className="border border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-600">
                <th className="px-4 py-3 text-left text-sm">
                  <SortHeader field="protein_id" label="Protein ID" onSort={handleSummarySort} />
                </th>
                <th className="px-4 py-3 text-left text-sm">
                  <SortHeader
                    field="sequence"
                    label="Sequence"
                    onSort={handleSummarySort}
                  />
                </th>
                <th className="px-4 py-3 text-center text-sm">
                  <SortHeader
                    field="sequence_length"
                    label="Length"
                    onSort={handleSummarySort}
                  />
                </th>
                <th className="px-4 py-3 text-center text-sm">
                  <SortHeader
                    field="total_cysteines"
                    label="Total Cysteines"
                    onSort={handleSummarySort}
                  />
                </th>
                <th className="px-4 py-3 text-center text-sm bg-green-50 dark:bg-green-950/10">
                  <SortHeader
                    field="detectable_high_cysteines"
                    label="Det. Hi Conf."
                    onSort={handleSummarySort}
                  />
                </th>
                <th className="px-4 py-3 text-center text-sm bg-amber-50 dark:bg-amber-950/10">
                  <SortHeader
                    field="detectable_low_cysteines"
                    label="Det. Lo Conf."
                    onSort={handleSummarySort}
                  />
                </th>
                <th className="px-4 py-3 text-center text-sm bg-red-50 dark:bg-red-950/10">
                  <SortHeader
                    field="undetectable_low_cysteines"
                    label="Undet. Lo Conf."
                    onSort={handleSummarySort}
                  />
                </th>
                <th className="px-4 py-3 text-center text-sm bg-slate-50 dark:bg-slate-900/40">
                  <SortHeader
                    field="undetectable_high_cysteines"
                    label="Undet. Hi Conf."
                    onSort={handleSummarySort}
                  />
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Replacements
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredSummary.map((protein, idx) => {
                const displaySequence = protein.sequence ? protein.sequence.substring(0, 20) : 'N/A';

                return (
                  <React.Fragment key={protein.protein_id}>
                    <tr
                      className={`border-b border-slate-200 dark:border-slate-700 transition-colors ${idx % 2 === 0
                        ? 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        : 'bg-slate-50/50 dark:bg-slate-800/20 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                    >
                      <td className="px-4 py-3 text-sm text-slate-900 dark:text-slate-50 font-medium">
                        <button
                          onClick={() => {
                            setSelectedProtein(protein.protein_id);
                            setConfidenceFilter(null);
                          }}
                          className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left cursor-pointer"
                        >
                          {protein.protein_id}
                        </button>
                      </td>
                      <td
                        className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400 font-mono cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                        onClick={() =>
                          setSequenceModal({ id: protein.protein_id, sequence: protein.sequence })
                        }
                      >
                        {displaySequence}
                        {protein.sequence && protein.sequence.length > 20 && '...'}
                      </td>
                      <td
                        className="px-4 py-3 text-sm text-center text-slate-600 dark:text-slate-400 cursor-pointer"
                        onClick={() => {
                          setSelectedProtein(protein.protein_id);
                          setConfidenceFilter(null);
                        }}
                      >
                        {protein.sequence_length}
                      </td>
                      <td
                        className="px-4 py-3 text-sm text-center text-slate-600 dark:text-slate-400 cursor-pointer"
                        onClick={() => {
                          setSelectedProtein(protein.protein_id);
                          setConfidenceFilter(null);
                        }}
                      >
                        {protein.total_cysteines}
                      </td>
                      <td
                        className="px-4 py-3 text-sm text-center bg-green-50 dark:bg-green-950/10 font-semibold text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/20 transition-colors cursor-pointer"
                        onClick={() => {
                          setSelectedProtein(protein.protein_id);
                          setConfidenceFilter('detectable_high');
                        }}
                      >
                        {protein.detectable_high_cysteines}
                      </td>
                      <td
                        className="px-4 py-3 text-sm text-center bg-amber-50 dark:bg-amber-950/10 font-semibold text-amber-600 dark:text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900/20 transition-colors cursor-pointer"
                        onClick={() => {
                          setSelectedProtein(protein.protein_id);
                          setConfidenceFilter('detectable_low');
                        }}
                      >
                        {protein.detectable_low_cysteines}
                      </td>
                      <td
                        className="px-4 py-3 text-sm text-center bg-red-50 dark:bg-red-950/10 font-semibold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
                        onClick={() => {
                          setSelectedProtein(protein.protein_id);
                          setConfidenceFilter('undetectable_low');
                        }}
                      >
                        {protein.undetectable_low_cysteines}
                      </td>
                      <td
                        className="px-4 py-3 text-sm text-center bg-slate-50/50 dark:bg-slate-900/10 text-slate-500 dark:text-slate-400 font-semibold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900/20 transition-colors"
                        onClick={() => {
                          setSelectedProtein(protein.protein_id);
                          setConfidenceFilter('undetectable_high');
                        }}
                      >
                        {protein.undetectable_high_cysteines}
                      </td>
                      <td
                        className={`px-4 py-3 text-sm text-center font-semibold transition-colors ${protein.replacements && protein.replacements.length > 0
                          ? 'text-red-600 dark:text-red-400 hover:underline cursor-pointer bg-red-50/10 dark:bg-red-950/5'
                          : 'text-slate-500 dark:text-slate-400 bg-slate-50/10 dark:bg-slate-900/5'
                          }`}
                        onClick={() => {
                          if (protein.replacements && protein.replacements.length > 0) {
                            setReplacementModal({
                              id: protein.protein_id,
                              replacements: protein.replacements,
                            });
                          }
                        }}
                      >
                        {protein.replacements && protein.replacements.length > 0 ? 'Yes' : 'No'}
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredSummary.length === 0 && (
          <div className="text-center py-8 text-slate-600 dark:text-slate-400">
            No proteins match your search
          </div>
        )}

        <div className="text-xs text-slate-500 dark:text-slate-400 pt-4">
          Threshold (n): {formatConfidence(threshold, 3)} | Model: {metadata.model_used}
        </div>

        {renderSequenceModal()}
        {renderReplacementModal()}
      </div>
    );
  }

  // DETAIL VIEW
  const protein = results.find((p) => p.protein_id === selectedProtein);
  const totalCount = protein ? protein.cysteines.length : 0;
  const detHighCount = protein ? protein.cysteines.filter(c => c.detectable && c.confidence > threshold).length : 0;
  const detLowCount = protein ? protein.cysteines.filter(c => c.detectable && c.confidence <= threshold).length : 0;
  const undetHighCount = protein ? protein.cysteines.filter(c => !c.detectable && c.confidence > threshold).length : 0;
  const undetLowCount = protein ? protein.cysteines.filter(c => !c.detectable && c.confidence <= threshold).length : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => setSelectedProtein(null)}
            className="inline-flex items-center gap-2 px-4 py-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Summary
          </button>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
            {selectedProtein}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 font-medium">
            Sequence length: {protein.sequence_length} | Total cysteines:{' '}
            {protein.cysteines.length} |{' '}
            <button
              onClick={() => setSequenceModal({ id: protein.protein_id, sequence: protein.sequence })}
              className="text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
            >
              View Full Sequence
            </button>
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => exportProteinCSV('all')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer shadow-sm animate-fade-in"
          >
            <Download className="w-3.5 h-3.5" />
            Export All Cys
          </button>

          <button
            onClick={() => exportProteinCSV('high')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer shadow-sm animate-fade-in"
          >
            <Download className="w-3.5 h-3.5" />
            Export High Confidence
          </button>

          <button
            onClick={() => exportProteinCSV('detectable')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white rounded-lg transition-colors cursor-pointer shadow-sm animate-fade-in"
          >
            <Download className="w-3.5 h-3.5" />
            Export All Detectable
          </button>
        </div>
      </div>

      {renderThresholdSlider()}

      {/* Filter and Detail Search row */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {/* Filter Tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg self-start border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setConfidenceFilter(null)}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${confidenceFilter === null
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/10 font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
          >
            All Cysteines ({totalCount})
          </button>
          <button
            onClick={() => setConfidenceFilter('detectable_high')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${confidenceFilter === 'detectable_high'
              ? 'bg-green-600 text-white shadow-sm shadow-green-600/10 font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
          >
            Detectable High ({detHighCount})
          </button>
          <button
            onClick={() => setConfidenceFilter('detectable_low')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${confidenceFilter === 'detectable_low'
              ? 'bg-amber-600 dark:bg-amber-500 text-white shadow-sm shadow-amber-600/10 dark:shadow-amber-500/10 font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
          >
            Detectable Low ({detLowCount})
          </button>
          <button
            onClick={() => setConfidenceFilter('undetectable_low')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${confidenceFilter === 'undetectable_low'
              ? 'text-white shadow-sm font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            style={confidenceFilter === 'undetectable_low' ? { backgroundColor: '#d11720' } : {}}
          >
            Undetectable Low ({undetLowCount})
          </button>
          <button
            onClick={() => setConfidenceFilter('undetectable_high')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${confidenceFilter === 'undetectable_high'
              ? 'bg-slate-500 text-white shadow-sm shadow-slate-500/10 font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
          >
            Undetectable High ({undetHighCount})
          </button>
        </div>

        {/* Detail Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search cysteines..."
            value={detailSearch}
            onChange={(e) => setDetailSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Detail Table */}
      <div className="border border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-600">
              <th className="px-4 py-3 text-left text-sm">
                <SortHeader field="position" label="Position" onSort={handleDetailSort} />
              </th>
              <th className="px-4 py-3 text-left text-sm">
                <SortHeader field="peptide" label="Tryptic Peptide" onSort={handleDetailSort} />
              </th>
              <th className="px-4 py-3 text-center text-sm">
                <SortHeader field="confidence" label="Confidence" onSort={handleDetailSort} />
              </th>
              <th className="px-4 py-3 text-center text-sm">
                <SortHeader field="detectable" label="Detectable?" onSort={handleDetailSort} />
              </th>
              <th className="px-4 py-3 text-left text-sm">
                <SortHeader field="notes" label="Notes" onSort={handleDetailSort} />
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredDetail.map((cys, idx) => {
              const isHighConfidence = cys.confidence > threshold;

              let confidenceColor = 'text-slate-600 dark:text-slate-400';
              if (cys.detectable) {
                confidenceColor = isHighConfidence
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-amber-600 dark:text-amber-500';
              } else {
                confidenceColor = isHighConfidence
                  ? 'text-slate-600 dark:text-slate-400'
                  : 'text-red-600 dark:text-red-500';
              }

              let badgeClass = 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300';
              if (cys.detectable) {
                badgeClass = isHighConfidence
                  ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300'
                  : 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300';
              } else {
                badgeClass = isHighConfidence
                  ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  : 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300';
              }

              return (
                <tr
                  key={cys.position}
                  className={`border-b border-slate-200 dark:border-slate-700 ${idx % 2 === 0
                    ? 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    : 'bg-slate-50/50 dark:bg-slate-800/20 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                >
                  <td className="px-4 py-3 text-sm font-semibold text-slate-900 dark:text-slate-50">
                    Cys{cys.position}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400 font-mono">
                    {cys.peptide}
                  </td>
                  <td className="px-4 py-3 text-sm text-center">
                    <span className={`font-semibold ${confidenceColor}`}>
                      {formatConfidence(cys.confidence, 3)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-center">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${badgeClass}`}>
                      {cys.detectable ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                    {cys.notes}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {filteredDetail.length === 0 && (
        <div className="text-center py-8 text-slate-600 dark:text-slate-400">
          No cysteines match your search
        </div>
      )}

      <div className="text-xs text-slate-500 dark:text-slate-400 pt-4">
        Threshold (n): {formatConfidence(threshold, 3)} | Model: {metadata.model_used}
      </div>

      {renderSequenceModal()}
      {renderReplacementModal()}
    </div>
  );
};
