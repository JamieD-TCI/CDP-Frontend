import { AppProvider, useApp } from './context/AppContext';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Parameters } from './pages/Parameters';
import { Input } from './pages/Input';
import { Output } from './pages/Output';
import './index.css';

/**
 * Main application content component
 */
function AppContent() {
  const { state } = useApp();

  const renderPage = () => {
    switch (state.currentStep) {
      case 'home':
        return <Home />;
      case 'parameters':
        return <Parameters />;
      case 'input':
        return <Input />;
      case 'output':
        return <Output />;
      default:
        return <Home />;
    }
  };

  return <Layout>{renderPage()}</Layout>;
}

/**
 * Main App component with provider
 */
function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
