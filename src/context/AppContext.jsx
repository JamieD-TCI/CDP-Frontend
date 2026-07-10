import React, { createContext, useContext, useReducer, useCallback } from 'react';

const MOCK_DATA = {
  metadata: {
    model_used: 'esm2_t36_3B_UR50D',
    threshold_n: 0.75,
  },
  results: [
    {
      protein_id: 'sp|P12345|EXAMPLE_HUMAN',
      sequence: 'MALWMRLLPLLALLALWGPDPAAAFVNQHLCGSHLVEALYLVCGERGFFYTPKTRREAEDLQVGQVELGGGPGAGSLQPLALEGSLQKRGIVEQCCTSICSLYQLENYCNATGCYSTPLCYSTPLKMYSTPKC',
      sequence_length: 532,
      cysteines: [
        {
          position: 42,
          peptide: 'ATGCYSTPL',
          confidence: 0.92,
          detectable: true,
          notes: 'High probability detectable',
        },
        {
          position: 68,
          peptide: 'GIVEQCCTS',
          confidence: 0.62,
          detectable: true,
          notes: 'Low probability detectable',
        },
        {
          position: 115,
          peptide: 'CYSTPLK',
          confidence: 0.88,
          detectable: false,
          notes: 'High confidence undetectable',
        },
        {
          position: 205,
          peptide: 'MYSTPKC',
          confidence: 0.55,
          detectable: false,
          notes: 'Low confidence undetectable',
        },
        {
          position: 280,
          peptide: 'LYQLENYCN',
          confidence: 0.78,
          detectable: true,
          notes: 'High probability detectable',
        },
      ],
    },
    {
      protein_id: 'sp|P54321|SECONDARY_HUMAN',
      sequence: 'YLVCGERGFFYTPKTRREAEDLQVGQVELGGGPGAGSLQPLALEGSLQKRGIVEQCCTSICSLYQLENYCNATGCYSTPL',
      sequence_length: 624,
      cysteines: [
        {
          position: 88,
          peptide: 'CPLKMYST',
          confidence: 0.95,
          detectable: true,
          notes: 'High probability detectable',
        },
        {
          position: 142,
          peptide: 'FGCYSTLK',
          confidence: 0.58,
          detectable: true,
          notes: 'Low probability detectable',
        },
        {
          position: 234,
          peptide: 'YLVCGERG',
          confidence: 0.74,
          detectable: false,
          notes: 'High confidence undetectable',
        },
        {
          position: 310,
          peptide: 'QCCTSICS',
          confidence: 0.91,
          detectable: true,
          notes: 'High probability detectable',
        },
      ],
    },
  ],
};

const AppContext = createContext();

/**
 * Initial state for the application
 */
const initialState = {
  currentStep: 'home', // home, parameters, input, output
  isDarkMode: false,
  parameters: {
    mode: 'simple', // simple or advanced
    model: 'esm2_t8_25M_UR50D', // default for simple mode
    embeddings: {
      peptide: true,
      protein: true,
      residue: false,
    },
    mergeMethod: 'average', // average, concatenate
    minPeptideLength: 7,
    maxPeptideLength: 52,
    confidenceThreshold: 0.75,
  },
  inputData: {
    sequences: '',
    fileName: '',
  },
  resultsData: null,
};

/**
 * Reducer function for state management
 */
const appReducer = (state, action) => {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, currentStep: action.payload };

    case 'TOGGLE_DARK_MODE':
      const newDarkMode = !state.isDarkMode;
      // Persist to localStorage and apply to document
      localStorage.setItem('darkMode', newDarkMode.toString());
      if (newDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return { ...state, isDarkMode: newDarkMode };

    case 'UPDATE_PARAMETERS':
      return {
        ...state,
        parameters: { ...state.parameters, ...action.payload },
      };

    case 'RESET_PARAMETERS':
      return { ...state, parameters: initialState.parameters };

    case 'SET_EMBEDDINGS':
      return {
        ...state,
        parameters: {
          ...state.parameters,
          embeddings: action.payload,
        },
      };

    case 'SET_MERGE_METHOD':
      return {
        ...state,
        parameters: {
          ...state.parameters,
          mergeMethod: action.payload,
        },
      };

    case 'SET_INPUT_DATA':
      return { ...state, inputData: action.payload };

    case 'SET_RESULTS_DATA':
      return { ...state, resultsData: action.payload };

    case 'LOAD_PARAMETERS':
      return {
        ...state,
        parameters: action.payload,
      };

    case 'LOAD_SAMPLE_DATA':
      return {
        ...state,
        currentStep: 'output',
        resultsData: MOCK_DATA,
      };

    default:
      return state;
  }
};

/**
 * AppProvider component that wraps the application with context
 */
export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState, (initial) => {
    // Initialize dark mode based on system preference or localStorage
    const savedDarkMode = localStorage.getItem('darkMode');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    const isDarkMode = savedDarkMode !== null ? savedDarkMode === 'true' : prefersDark;
    
    // Apply to document immediately
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    return { ...initial, isDarkMode };
  });

  const setStep = useCallback((step) => {
    dispatch({ type: 'SET_STEP', payload: step });
  }, []);

  const toggleDarkMode = useCallback(() => {
    dispatch({ type: 'TOGGLE_DARK_MODE' });
  }, []);

  const updateParameters = useCallback((params) => {
    dispatch({ type: 'UPDATE_PARAMETERS', payload: params });
  }, []);

  const resetParameters = useCallback(() => {
    dispatch({ type: 'RESET_PARAMETERS' });
  }, []);

  const setEmbeddings = useCallback((embeddings) => {
    dispatch({ type: 'SET_EMBEDDINGS', payload: embeddings });
  }, []);

  const setMergeMethod = useCallback((method) => {
    dispatch({ type: 'SET_MERGE_METHOD', payload: method });
  }, []);

  const setInputData = useCallback((data) => {
    dispatch({ type: 'SET_INPUT_DATA', payload: data });
  }, []);

  const setResultsData = useCallback((data) => {
    dispatch({ type: 'SET_RESULTS_DATA', payload: data });
  }, []);

  const loadParameters = useCallback((params) => {
    dispatch({ type: 'LOAD_PARAMETERS', payload: params });
  }, []);

  const loadSampleData = useCallback(() => {
    dispatch({ type: 'LOAD_SAMPLE_DATA' });
  }, []);

  const value = {
    state,
    setStep,
    toggleDarkMode,
    updateParameters,
    resetParameters,
    setEmbeddings,
    setMergeMethod,
    setInputData,
    setResultsData,
    loadParameters,
    loadSampleData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

/**
 * Custom hook to use the AppContext
 */
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

/**
 * Helper function to format confidence scores or thresholds.
 */
export const formatConfidence = (value, decimals = 2) => {
  if (value === undefined || value === null || isNaN(value)) {
    return '';
  }
  return value.toFixed(decimals);
};

