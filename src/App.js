import React, { useState, useEffect } from 'react';
import EcoFiDashboard from './EcoFiDashboard';
import RealTimeDataProvider from './RealTimeDataProvider';
import { verifyHardhatRunning } from './contractUtilsEnhanced';
import ErrorBoundary from './ErrorBoundary';
import './App.css';
import './ecofi.css';

function App() {
  const [hardhatRunning, setHardhatRunning] = useState(null);

  // Check if Hardhat node is running
  useEffect(() => {
    const checkHardhat = async () => {
      const isRunning = await verifyHardhatRunning();
      setHardhatRunning(isRunning);
    };
    checkHardhat();
  }, []);

  return (
    <div className="App">
      <ErrorBoundary showResetButton={true}>
        <RealTimeDataProvider>
          <EcoFiDashboard hardhatRunning={hardhatRunning} />
        </RealTimeDataProvider>
      </ErrorBoundary>
    </div>
  );
}

export default App;