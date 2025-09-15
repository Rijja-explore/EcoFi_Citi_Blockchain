import React, { useState, useEffect } from 'react';
import MergedEcoFiDashboard from './MergedEcoFiDashboard';
import Onboarding from './components/Onboarding';
import PerformanceOptimizer from './components/PerformanceOptimizer';
import './App.css';

function App() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  useEffect(() => {
    // Check if this is first time use
    const hasVisitedBefore = localStorage.getItem('ecofi_hasVisitedBefore');
    if (!hasVisitedBefore) {
      setShowOnboarding(true);
      localStorage.setItem('ecofi_hasVisitedBefore', 'true');
    }
  }, []);

  return (
    <div className="App">
      <MergedEcoFiDashboard />
      {showOnboarding && (
        <Onboarding 
          isOpen={showOnboarding} 
          onComplete={() => setShowOnboarding(false)} 
        />
      )}
      <PerformanceOptimizer />
    </div>
  );
}

export default App;