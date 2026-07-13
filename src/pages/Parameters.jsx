import React, { useState, useEffect, useRef } from 'react';
import { Download, Upload, RotateCcw, ChevronDown } from 'lucide-react';
import { useApp, formatConfidence } from '../context/AppContext';

// ESM model definitions for advanced mode
const esmModels = [
  { id: 'esm2_t36_3B_UR50D', name: 'ESM-2 (3B)', layers: 36, params: '3B', dataset: 'UR50D' },
  { id: 'esm2_t48_15B_UR50D', name: 'ESM-2 (15B)', layers: 48, params: '15B', dataset: 'UR50D' },
  { id: 'esm2_t33_650M_UR50D', name: 'ESM-2 (650M)', layers: 33, params: '650M', dataset: 'UR50D' },
  { id: 'esm2_t30_150M_UR50D', name: 'ESM-2 (150M)', layers: 30, params: '150M', dataset: 'UR50D' },
  { id: 'esm2_t12_35M_UR50D', name: 'ESM-2 (35M)', layers: 12, params: '35M', dataset: 'UR50D' },
  { id: 'esm2_t6_8M_UR50D', name: 'ESM-2 (8M)', layers: 6, params: '8M', dataset: 'UR50D' },
  { id: 'esm_msa1b_t12_100M_UR50S', name: 'ESM-MSA (100M)', layers: 12, params: '100M', dataset: 'UR50S' },
];

const simpleModels = [
  { id: 'esm2_t6_8M_UR50D', label: 'Fast', value: 'fast' },
  { id: 'esm2_t33_650M_UR50D', label: 'Balanced', value: 'balanced' },
  { id: 'esm2_t36_3B_UR50D', label: 'Large', value: 'large' },
];

export const Parameters = () => {
  const { state, setStep, updateParameters, resetParameters } = useApp();
  const { parameters } = state;
  const [expandedAccordion, setExpandedAccordion] = useState(false);
  const [sliderValue, setSliderValue] = useState(1); // 0=Fast, 1=Balanced, 2=Large
  const [activeThumb, setActiveThumb] = useState('min');
  const [thresholdInputVal, setThresholdInputVal] = useState('');
  const isAnimatingSlider = useRef(false);

  useEffect(() => {
    if (isAnimatingSlider.current) return;
    const modelIndex = simpleModels.findIndex((m) => m.id === parameters.model);
    if (modelIndex !== -1) {
      setSliderValue(modelIndex);
    }
  }, [parameters.model]);

  useEffect(() => {
    setThresholdInputVal(parameters.confidenceThreshold.toString());
  }, [parameters.confidenceThreshold]);

  const selectedModel = esmModels.find((m) => m.id === parameters.model);


  const handleModeChange = (newMode) => {
    updateParameters({ mode: newMode });
  };

  const handleModelChange = (modelId) => {
    updateParameters({ model: modelId });
  };

  const handleSimpleModelChange = (value) => {
    const model = simpleModels.find((m) => m.value === value);
    updateParameters({ model: model.id });
  };

  const animateSliderTo = (targetValue) => {
    if (isAnimatingSlider.current) return;
    isAnimatingSlider.current = true;
    const startValue = sliderValue;
    const startTime = performance.now();
    const duration = 250; // ms

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Quadratic ease-in-out
      const ease = progress < 0.5 
        ? 2 * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      
      const current = startValue + (targetValue - startValue) * ease;
      setSliderValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        const model = simpleModels[targetValue];
        if (model) {
          handleSimpleModelChange(model.value);
        }
        setTimeout(() => {
          isAnimatingSlider.current = false;
        }, 50);
      }
    };

    requestAnimationFrame(animate);
  };

  // Handle smooth slider with snap-to-closest
  const handleSliderChange = (e) => {
    const value = parseFloat(e.target.value);
    setSliderValue(value);
  };

  const handleSliderRelease = () => {
    // Snap to nearest step (0, 1, or 2)
    const rounded = Math.round(sliderValue);
    setSliderValue(rounded);
    const model = simpleModels[rounded];
    if (model) {
      handleSimpleModelChange(model.value);
    }
  };

  const handleEmbeddingToggle = (type) => {
    const newEmbeddings = {
      ...parameters.embeddings,
      [type]: !parameters.embeddings[type],
    };
    updateParameters({ embeddings: newEmbeddings });
  };

  const handleMergeMethodChange = (method) => {
    updateParameters({ mergeMethod: method });
  };

  const handleParameterChange = (key, value) => {
    updateParameters({ [key]: value });
  };

  const handleDownloadConfig = () => {
    const config = { parameters };
    const dataStr = JSON.stringify(config, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'config.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleUploadConfig = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const config = JSON.parse(event.target.result);
            updateParameters(config.parameters);
          } catch (error) {
            alert('Invalid configuration file');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const embeddingCount = Object.values(parameters.embeddings).filter(Boolean).length;
  const isMergeMethodDisabled = embeddingCount <= 1;

  const currentSimpleValue = simpleModels.find((m) => m.id === parameters.model)?.value || 'balanced';

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Model Selection */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
            Model Selection
          </h2>

          {/* Mode Toggle */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
              Analysis Mode
            </label>
            <div className="flex gap-3">
              {['simple', 'advanced'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => handleModeChange(mode)}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors capitalize ${
                    parameters.mode === mode
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-50 hover:bg-slate-300 dark:hover:bg-slate-600'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Simple Mode: 3-Point Slider */}
          {parameters.mode === 'simple' && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                Model Size
              </label>
              <div className="space-y-2">
                <input
                  type="range"
                  min="0"
                  max="200"
                  step="1"
                  value={sliderValue * 100}
                  onChange={(e) => setSliderValue(parseFloat(e.target.value) / 100)}
                  onMouseUp={handleSliderRelease}
                  onTouchEnd={handleSliderRelease}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 font-medium">
                  {simpleModels.map((m, idx) => (
                    <button
                      key={m.value}
                      onClick={() => animateSliderTo(idx)}
                      className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors focus:outline-none"
                    >
                      {m.label === 'Fast'
                        ? 'Fast (8M)'
                        : m.label === 'Balanced'
                        ? 'Balanced (650M)'
                        : 'Large (3B)'}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                Selected: <span className="font-semibold">{simpleModels[Math.round(sliderValue)]?.label}</span>
              </p>
            </div>
          )}

          {/* Advanced Mode: Dropdown */}
          {parameters.mode === 'advanced' && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                Select ESM-2 Model
              </label>
              <select
                value={parameters.model}
                onChange={(e) => handleModelChange(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50"
              >
                {esmModels.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>

              {/* Model Info Accordion */}
              <div className="mt-4 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedAccordion(!expandedAccordion)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <span className="font-semibold text-slate-900 dark:text-slate-50 text-sm">
                    Model Information
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      expandedAccordion ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {expandedAccordion && (
                  <div className="px-4 py-4 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                      Nomenclature: <code>esm2_t[layers]_[params]_[dataset]</code>
                    </p>
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-700">
                          <th className="text-left py-2 font-semibold text-slate-700 dark:text-slate-300">
                            Model
                          </th>
                          <th className="text-left py-2 font-semibold text-slate-700 dark:text-slate-300">
                            Layers
                          </th>
                          <th className="text-left py-2 font-semibold text-slate-700 dark:text-slate-300">
                            Parameters
                          </th>
                          <th className="text-left py-2 font-semibold text-slate-700 dark:text-slate-300">
                            Dataset
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {esmModels.map((model) => (
                          <tr
                            key={model.id}
                            className="border-b border-slate-100 dark:border-slate-700"
                          >
                            <td className="py-2 text-slate-600 dark:text-slate-400">
                              {model.name}
                            </td>
                            <td className="py-2 text-slate-600 dark:text-slate-400">{model.layers}</td>
                            <td className="py-2 text-slate-600 dark:text-slate-400">{model.params}</td>
                            <td className="py-2 text-slate-600 dark:text-slate-400">{model.dataset}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Embeddings & Features */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
            Embeddings & Features
          </h2>

          {/* Embedding Toggles */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
              Embedding Types
            </label>
            <div className="space-y-3">
              {['peptide', 'protein', 'residue'].map((type) => (
                <div key={type} className="flex items-center gap-3">
                  <button
                    onClick={() => handleEmbeddingToggle(type)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      parameters.embeddings[type] ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                        parameters.embeddings[type] ? 'translate-x-6' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 capitalize cursor-pointer">
                    {type}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Merge Method */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Merge Method
              </label>
              {embeddingCount <= 1 && (
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  (Select 2+ embeddings to enable)
                </span>
              )}
            </div>
            <div className="flex gap-2">
              {['average', 'concatenate'].map((method) => (
                <button
                  key={method}
                  onClick={() => handleMergeMethodChange(method)}
                  disabled={isMergeMethodDisabled}
                  className={`flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-colors capitalize ${
                    isMergeMethodDisabled
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                      : parameters.mergeMethod === method
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-50 hover:bg-slate-300 dark:hover:bg-slate-600'
                  }`}
                  style={{
                    opacity: isMergeMethodDisabled ? 0.5 : 1,
                  }}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          {/* Confidence Threshold */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Confidence Threshold (n)
            </label>
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <input
                  type="range"
                  min="0.5"
                  max="1.0"
                  step="0.01"
                  value={parameters.confidenceThreshold}
                  onChange={(e) =>
                    handleParameterChange('confidenceThreshold', parseFloat(e.target.value))
                  }
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-1 px-1">
                  <span>0.5</span>
                  <span>1.0</span>
                </div>
              </div>
              <input
                type="number"
                value={thresholdInputVal}
                onChange={(e) => {
                  const val = e.target.value;
                  setThresholdInputVal(val);
                  const parsed = parseFloat(val);
                  if (!isNaN(parsed)) {
                    if (parsed >= 0.5 && parsed <= 1.0) {
                      handleParameterChange('confidenceThreshold', parsed);
                    }
                  }
                }}
                onBlur={() => {
                  const parsed = parseFloat(thresholdInputVal);
                  let finalVal = 0.75;
                  if (isNaN(parsed)) {
                    finalVal = 0.5;
                  } else if (parsed > 1.0) {
                    finalVal = 1.0;
                  } else if (parsed < 0.5) {
                    finalVal = 0.5;
                  } else {
                    finalVal = parsed;
                  }
                  handleParameterChange('confidenceThreshold', finalVal);
                  setThresholdInputVal(finalVal.toString());
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.target.blur();
                  }
                }}
                step="0.01"
                className="w-24 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 text-center"
              />
            </div>
          </div>

          {/* Tryptic Peptide Digestion - Double Ended Slider */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
              Tryptic Peptide Digestion
            </label>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Min: {parameters.minPeptideLength}
                  </span>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Max: {parameters.maxPeptideLength}
                  </span>
                </div>
                <div className="relative w-full h-6 flex items-center double-slider-container">
                  {/* Track */}
                  <div className="w-full relative">
                    <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                    <div
                      className="absolute h-2 bg-blue-600 rounded-lg top-0"
                      style={{
                        left: `${((parameters.minPeptideLength - 4) / 76) * 100}%`,
                        right: `${100 - ((parameters.maxPeptideLength - 4) / 76) * 100}%`,
                      }}
                    ></div>
                  </div>
                  {/* Inputs */}
                  <input
                    type="range"
                    min="4"
                    max="80"
                    step="1"
                    value={parameters.minPeptideLength}
                    onChange={(e) => {
                      const newMin = Math.min(parseInt(e.target.value), parameters.maxPeptideLength);
                      handleParameterChange('minPeptideLength', newMin);
                    }}
                    className="absolute w-full pointer-events-none appearance-none bg-transparent"
                    style={{
                      zIndex: activeThumb === 'min' ? 30 : 20,
                    }}
                    onMouseDown={() => setActiveThumb('min')}
                    onTouchStart={() => setActiveThumb('min')}
                  />
                  <input
                    type="range"
                    min="4"
                    max="80"
                    step="1"
                    value={parameters.maxPeptideLength}
                    onChange={(e) => {
                      const newMax = Math.max(parseInt(e.target.value), parameters.minPeptideLength);
                      handleParameterChange('maxPeptideLength', newMax);
                    }}
                    className="absolute w-full pointer-events-none appearance-none bg-transparent"
                    style={{
                      zIndex: activeThumb === 'max' ? 30 : 20,
                    }}
                    onMouseDown={() => setActiveThumb('max')}
                    onTouchStart={() => setActiveThumb('max')}
                  />
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Range: {parameters.minPeptideLength}-{parameters.maxPeptideLength}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="flex flex-wrap gap-3 pt-6 border-t border-slate-200 dark:border-slate-700">
        <button
          onClick={resetParameters}
          className="inline-flex items-center gap-2 px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Reset to Defaults
        </button>

        <button
          onClick={handleDownloadConfig}
          className="inline-flex items-center gap-2 px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <Download className="w-4 h-4" />
          Save Parameters
        </button>

        <button
          onClick={handleUploadConfig}
          className="inline-flex items-center gap-2 px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <Upload className="w-4 h-4" />
          Load Parameters
        </button>

        <div className="flex-1" />

        <button
          onClick={() => setStep('input')}
          className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
};
