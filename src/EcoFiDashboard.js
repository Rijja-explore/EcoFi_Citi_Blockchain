
import React, { useState, useEffect, useCallback } from 'react';
import { Wallet, CheckCircle, AlertTriangle, RefreshCw, Lock, CheckCircle2, BarChart3, Database, Sparkles, Flame, Trophy, Leaf, Zap, Wind, ChevronRight, Lightbulb } from 'lucide-react';

// Import enhanced particle background for modern look
import EnhancedParticleBackground from './EnhancedParticleBackground';

// Import ethers
import { ethers } from 'ethers';

// Import our contract utilities
import { 
  initializeProvider, 
  getSigner, 
  getContracts,
  handleContractError,
  verifyHardhatRunning,
  addHardhatNetworkToMetaMask
} from './contractUtils';

// Toast notification component
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'error' ? 'bg-red-500' : type === 'success' ? 'bg-green-500' : 'bg-blue-500';
  
  return (
    <div className={`fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in`}>
      {message}
    </div>
  );
};

const EcoFiDashboard = () => {
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [isIssuer, setIsIssuer] = useState(false);
  const [wrongNetwork, setWrongNetwork] = useState(false);
  const [tokenAmount, setTokenAmount] = useState('');
  const [bondBalance, setBondBalance] = useState('0');
  const [tokensSold, setTokensSold] = useState('0');
  const [capTokens, setCapTokens] = useState('0');
  const [milestones, setMilestones] = useState([]);
  const [cumulativeKwh, setCumulativeKwh] = useState(0);
  const [totalRaised, setTotalRaised] = useState('0');
  const [totalReleased, setTotalReleased] = useState('0');
  const [saleEnd, setSaleEnd] = useState(0);
  const [tokenPrice, setTokenPrice] = useState('0');
  const [deltaKwh, setDeltaKwh] = useState('');
  const [deltaCO2, setDeltaCO2] = useState('');
  const [oracleKey, setOracleKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [showInvestModal, setShowInvestModal] = useState(false);
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [connecting, setConnecting] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [hardhatRunning, setHardhatRunning] = useState(null);
  
  // New state for enhanced UI features
  const [carbonCredits, setCarbonCredits] = useState(0);
  const [investmentReturns, setInvestmentReturns] = useState(0);
  const [impactMetrics, setImpactMetrics] = useState({
    co2Reduced: 0,
    treesPlanted: 0,
    energySaved: 0,
    waterConserved: 0
  });
  const [selectedTab, setSelectedTab] = useState('dashboard');

  // Check if Hardhat is running when component mounts
  useEffect(() => {
    async function checkHardhatStatus() {
      const status = await verifyHardhatRunning();
      setHardhatRunning(status.running);
      
      if (!status.running) {
        console.error('Hardhat node is not running:', status.error);
      }
    }
    
    checkHardhatStatus();
  }, []);

  // Toast helper functions
  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // Utility function to check MetaMask status
  const checkMetaMaskStatus = useCallback(() => {
    if (!window.ethereum) {
      showToast('MetaMask is not installed. Please install MetaMask extension.', 'error');
      return false;
    }
    
    if (window.ethereum.isMetaMask !== true) {
      showToast('Please use MetaMask as your wallet provider.', 'error');
      return false;
    }
    
    return true;
  }, [showToast]);

  // Connect wallet via MetaMask
  const connectWallet = async () => {
    // Clear any previous connection errors
    setWrongNetwork(false);
    
    // Check if MetaMask is installed and ready
    if (!checkMetaMaskStatus()) {
      return;
    }
    
    if (connecting) {
      showToast('Already connecting, please wait...', 'error');
      return;
    }
    
    setConnecting(true);
    setLoading(true);
    
    try {
      // Request account access if needed
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      // Initialize provider with more robust error handling
      const { provider, isHardhatLocal } = await initializeProvider();
      
      if (!provider) {
        throw new Error('Failed to initialize provider');
      }
      
      if (!isHardhatLocal) {
        setWrongNetwork(true);
        // Give more specific network switching instructions
        showToast('Please switch to Hardhat localhost network (chainId 31337) in MetaMask', 'error');
        console.log('Expected network: Hardhat Localhost (31337)');
        setLoading(false);
        setConnecting(false);
        return;
      }
      
      // Get signer and address with additional validation
      const { signer, address } = await getSigner(provider);
      
      if (!signer || !address) {
        throw new Error('Failed to get signer or address');
      }
      
      setProvider(provider);
      setSigner(signer);
      setWalletAddress(address);
      setWalletConnected(true);
      setWrongNetwork(false);
      
      setTransactionHistory(prev => [...prev, { 
        type: 'Wallet Connected', 
        status: 'Success', 
        time: new Date().toLocaleTimeString() 
      }]);
      showToast('Wallet connected successfully', 'success');
    } catch (error) {
      console.error('Wallet connection failed:', error);
      setTransactionHistory(prev => [...prev, { 
        type: 'Wallet Connect', 
        status: 'Failed', 
        time: new Date().toLocaleTimeString() 
      }]);
      showToast(error.message || 'Failed to connect wallet', 'error');
    } finally {
      setLoading(false);
      setConnecting(false);
    }
  };

  // Fetch contract data
  const fetchData = useCallback(async () => {
    if (!provider || !walletConnected) return;
    try {
      // Get contract instances
      const contracts = getContracts(provider);
      const { escrow, bondToken, oracle } = contracts;

      // Fetch data from all contracts
      const price = await escrow.tokenPrice();
      setTokenPrice(ethers.formatEther(price));

      const bal = await bondToken.balanceOf(walletAddress);
      setBondBalance(ethers.formatEther(bal));

      const sold = await escrow.tokensSold();
      setTokensSold(ethers.formatEther(sold));

      const cap = await escrow.capTokens();
      setCapTokens(ethers.formatEther(cap));

      const issuerAddr = await escrow.issuer();
      setIsIssuer(issuerAddr.toLowerCase() === walletAddress.toLowerCase());

      // Fetch and format milestones
      const count = await escrow.milestoneCount();
      const mils = [];
      for (let i = 0; i < Number(count); i++) {
        const mil = await escrow.milestones(i);
        mils.push({
          index: i,
          threshold: Number(mil.threshold),
          achieved: mil.achieved,
          releaseBps: Number(mil.releaseBps)
        });
      }
      setMilestones(mils);

      const kwh = await oracle.cumulativeKwh();
      setCumulativeKwh(Number(kwh));

      // Update enhanced metrics
      setCarbonCredits(Number(kwh) * 0.05); // Simulate carbon credits based on kWh
      setInvestmentReturns(parseFloat(totalRaised) * 0.08); // Simulate 8% returns
      
      // Update impact metrics
      setImpactMetrics({
        co2Reduced: Math.round(Number(kwh) * 0.4), // kg CO2 saved
        treesPlanted: Math.round(Number(kwh) * 0.02), // trees equivalent
        energySaved: Number(kwh), // kWh saved
        waterConserved: Number(kwh) * 1.5 // liters water conserved (simulation)
      });

      if (issuerAddr.toLowerCase() === walletAddress.toLowerCase()) {
        const raised = await escrow.totalRaised();
        setTotalRaised(ethers.formatEther(raised));

        const released = await escrow.totalReleased();
        setTotalReleased(ethers.formatEther(released));

        const end = await escrow.saleEnd();
        setSaleEnd(Number(end));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      showToast(handleContractError(error), 'error');
    }
  }, [provider, walletConnected, walletAddress, showToast]);

  // Refresh data on wallet connection and MilestoneAchieved event
  useEffect(() => {
    if (walletConnected && provider) {
      fetchData();
      
      // Get escrow contract and listen for events
      const { escrow } = getContracts(provider);
      
      // Set up event listener for milestone achieved
      escrow.on('MilestoneAchieved', (index) => {
        fetchData();
        setTransactionHistory(prev => [...prev, { 
          type: 'Milestone Achieved', 
          status: 'Success', 
          time: new Date().toLocaleTimeString(), 
          index: Number(index) 
        }]);
        showToast(`Milestone ${Number(index)} achieved!`, 'success');
      });
      
      return () => {
        // Clean up event listeners
        escrow.removeAllListeners('MilestoneAchieved');
      };
    }
  }, [walletConnected, provider, fetchData, showToast]);

  // Buy bonds
  const buyBonds = async () => {
    if (!signer || !tokenAmount) {
      showToast('Please enter a valid token amount', 'error');
      return;
    }
    setLoading(true);
    try {
      // Get escrow contract with signer
      const { escrow } = getContracts(signer);
      
      // Parse token amount and calculate cost
      const amount = ethers.parseUnits(tokenAmount, 18);
      const price = await escrow.tokenPrice();
      const cost = amount * price / ethers.parseUnits("1", 18) * ethers.parseUnits("1", 18);  // Using parseUnits instead of BigInt

      // Send transaction
      const tx = await escrow.invest(amount, { value: cost });
      setTransactionHistory(prev => [...prev, { 
        type: 'Buy Bonds', 
        status: 'Pending', 
        time: new Date().toLocaleTimeString(), 
        txHash: tx.hash 
      }]);
      showToast('Transaction pending...', 'info');
      
      // Wait for confirmation
      await tx.wait();
      setTransactionHistory(prev => prev.map(t => 
        t.txHash === tx.hash ? { ...t, status: 'Success' } : t
      ));
      showToast('Purchase successful', 'success');
      setTokenAmount('');
      setShowInvestModal(false);
      fetchData();
    } catch (error) {
      console.error('Buy failed:', error);
      setTransactionHistory(prev => [...prev, { 
        type: 'Buy Bonds', 
        status: 'Failed', 
        time: new Date().toLocaleTimeString() 
      }]);
      showToast(handleContractError(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  // Close sale (issuer only)
  const closeSale = async () => {
    if (!signer) return;
    setLoading(true);
    try {
      // Get escrow contract with signer
      const { escrow } = getContracts(signer);
      
      // Send transaction
      const tx = await escrow.closeSale();
      setTransactionHistory(prev => [...prev, { 
        type: 'Close Sale', 
        status: 'Pending', 
        time: new Date().toLocaleTimeString(), 
        txHash: tx.hash 
      }]);
      showToast('Transaction pending...', 'info');
      
      // Wait for confirmation
      await tx.wait();
      setTransactionHistory(prev => prev.map(t => 
        t.txHash === tx.hash ? { ...t, status: 'Success' } : t
      ));
      showToast('Sale closed successfully', 'success');
      fetchData();
    } catch (error) {
      console.error('Close sale failed:', error);
      setTransactionHistory(prev => [...prev, { 
        type: 'Close Sale', 
        status: 'Failed', 
        time: new Date().toLocaleTimeString() 
      }]);
      showToast(handleContractError(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  // Withdraw remainder (issuer only)
  const withdrawRemainder = async () => {
    if (!signer) return;
    setLoading(true);
    try {
      // Get escrow contract with signer
      const { escrow } = getContracts(signer);
      
      // Send transaction
      const tx = await escrow.withdrawRemainder();
      setTransactionHistory(prev => [...prev, { 
        type: 'Withdraw Remainder', 
        status: 'Pending', 
        time: new Date().toLocaleTimeString(), 
        txHash: tx.hash 
      }]);
      showToast('Transaction pending...', 'info');
      
      // Wait for confirmation
      await tx.wait();
      setTransactionHistory(prev => prev.map(t => 
        t.txHash === tx.hash ? { ...t, status: 'Success' } : t
      ));
      showToast('Remainder withdrawn successfully', 'success');
      fetchData();
    } catch (error) {
      console.error('Withdraw failed:', error);
      setTransactionHistory(prev => [...prev, { 
        type: 'Withdraw Remainder', 
        status: 'Failed', 
        time: new Date().toLocaleTimeString() 
      }]);
      showToast(handleContractError(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  // Push impact data (oracle simulation)
  const pushImpact = async () => {
    if (!provider || !oracleKey || !deltaKwh || !deltaCO2) {
      showToast('Please provide private key, kWh, and CO2 values', 'error');
      return;
    }
    setLoading(true);
    try {
      // Create oracle wallet from private key
      const oracleSigner = new ethers.Wallet(oracleKey, provider);
      
      // Get oracle contract with signer
      const oracle = getContracts(oracleSigner).oracle;
      
      // Send transaction using ethers.js utilities for BigInt conversion
      const tx = await oracle.pushImpact(
        ethers.getBigInt(deltaKwh), 
        ethers.getBigInt(deltaCO2)
      );
      setTransactionHistory(prev => [...prev, { 
        type: 'Push Impact', 
        status: 'Pending', 
        time: new Date().toLocaleTimeString(), 
        txHash: tx.hash 
      }]);
      showToast('Transaction pending...', 'info');
      
      // Wait for confirmation
      await tx.wait();
      setTransactionHistory(prev => prev.map(t => 
        t.txHash === tx.hash ? { ...t, status: 'Success' } : t
      ));
      showToast('Impact data pushed successfully', 'success');
      setDeltaKwh('');
      setDeltaCO2('');
      setOracleKey('');
      fetchData();
    } catch (error) {
      console.error('Push impact failed:', error);
      setTransactionHistory(prev => [...prev, { 
        type: 'Push Impact', 
        status: 'Failed', 
        time: new Date().toLocaleTimeString() 
      }]);
      showToast(handleContractError(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  const allMilestonesAchieved = milestones.every(m => m.achieved);
  const saleEnded = Math.floor(Date.now() / 1000) > saleEnd;
  const remainingFunds = parseFloat(totalRaised) - parseFloat(totalReleased);
  const progress = (parseFloat(tokensSold) / parseFloat(capTokens)) * 100 || 0;

  // Investment Modal
  const InvestmentModal = () => {
    if (!showInvestModal) return null;
    
    // Calculate estimated cost
    const estimatedCost = (parseFloat(tokenAmount || '0') * parseFloat(tokenPrice)).toFixed(4);
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
        <div className="glass-card rounded-2xl p-8 max-w-md w-full shadow-2xl transform transition-transform duration-300 purple-glow">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-gradient">Invest in Green Bond</h2>
            <button 
              onClick={() => setShowInvestModal(false)}
              className="text-gray-400 hover:text-white transition-colors transform hover:rotate-90 duration-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Investment Amount</label>
              <div className="relative group">
                <input
                  type="number"
                  value={tokenAmount}
                  onChange={(e) => setTokenAmount(e.target.value)}
                  placeholder="Enter amount in tokens"
                  className="w-full px-4 py-3 pl-10 bg-white bg-opacity-10 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-custom-purple focus:border-transparent transition-all group-hover:border-custom-purple"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-custom-green font-bold text-xs">BOND</div>
              </div>
            </div>
            
            <div className="bg-black bg-opacity-30 p-5 rounded-xl backdrop-blur-md border border-white border-opacity-5">
              <div className="flex justify-between text-gray-300 mb-2">
                <span>Price per Token:</span>
                <span className="font-mono">{tokenPrice} ETH</span>
              </div>
              <div className="flex justify-between text-gray-300 mb-2">
                <span>Quantity:</span>
                <span className="font-mono">{tokenAmount || '0'} BOND</span>
              </div>
              <div className="h-px bg-gray-700 my-3"></div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Total Cost:</span>
                <span className="text-xl font-bold text-gradient font-mono">{estimatedCost} ETH</span>
              </div>
            </div>
            
            <div className="flex flex-col space-y-3">
              <button
                onClick={buyBonds}
                disabled={loading || !tokenAmount || parseFloat(tokenAmount) <= 0}
                className="bg-gradient-to-r from-custom-purple to-blue-600 text-white py-3 px-4 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 disabled:opacity-50 flex items-center justify-center hover:shadow-lg hover:shadow-custom-purple/30"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm Investment</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>
              
              <button
                onClick={() => setShowInvestModal(false)}
                className="py-3 px-4 rounded-xl font-medium border border-gray-600 text-gray-300 hover:bg-white hover:bg-opacity-10 transition-all duration-300 hover:border-white hover:border-opacity-30"
              >
                Cancel
              </button>
            </div>
            
            <div className="text-xs text-gray-400 text-center">
              You will be asked to confirm this transaction in your wallet
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Progress Panel
  const ProgressPanel = () => (
    <div className="bg-white bg-opacity-5 backdrop-blur-md p-6 rounded-2xl border border-white border-opacity-20 mb-8 hover:shadow-glow transition-all duration-300">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-white bg-clip-text text-transparent bg-gradient-to-r from-custom-purple to-blue-500">Connection Status</h3>
        <button 
          onClick={async () => {
            const hardhatStatus = await verifyHardhatRunning();
            setHardhatRunning(hardhatStatus.running);
            showToast('Connection status updated', 'info');
          }}
          className="bg-white bg-opacity-10 p-2 rounded-full hover:bg-opacity-20 transition-all duration-200"
        >
          <RefreshCw className="w-4 h-4 text-custom-purple" />
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-black bg-opacity-30 rounded-xl p-4 border border-white border-opacity-10">
          <div className="flex items-center space-x-3 mb-2">
            <div className={`w-3 h-3 rounded-full ${walletConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <p className="text-gray-300 font-medium">Wallet Connection</p>
          </div>
          <p className="text-sm text-gray-400 pl-6">
            {walletConnected 
              ? `Connected: ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` 
              : 'Not Connected'}
          </p>
        </div>
        
        <div className="bg-black bg-opacity-30 rounded-xl p-4 border border-white border-opacity-10">
          <div className="flex items-center space-x-3 mb-2">
            <div className={`w-3 h-3 rounded-full ${wrongNetwork ? 'bg-red-500' : 'bg-green-500 animate-pulse'}`}></div>
            <p className="text-gray-300 font-medium">Network</p>
          </div>
          <p className="text-sm text-gray-400 pl-6">
            {wrongNetwork ? 'Switch to Hardhat (31337)' : 'Hardhat Localhost'}
          </p>
        </div>
        
        <div className="bg-black bg-opacity-30 rounded-xl p-4 border border-white border-opacity-10">
          <div className="flex items-center space-x-3 mb-2">
            <div className={`w-3 h-3 rounded-full ${hardhatRunning ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <p className="text-gray-300 font-medium">Hardhat Node</p>
          </div>
          <p className="text-sm text-gray-400 pl-6">
            {hardhatRunning === null ? 'Checking...' : 
             hardhatRunning ? 'Running' : 'Not Running'}
          </p>
        </div>
      </div>
        
      <div className="bg-black bg-opacity-30 rounded-xl p-4 border border-white border-opacity-10">
        <h4 className="text-md font-medium text-white mb-3 flex items-center">
          <div className="bg-custom-purple bg-opacity-30 p-1 rounded mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-custom-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          Transaction History
        </h4>
        <div className="max-h-40 overflow-y-auto pr-2 custom-scrollbar">
          {transactionHistory.length === 0 ? (
            <p className="text-gray-400 text-sm italic">No transactions yet</p>
          ) : (
            <div className="space-y-2">
              {transactionHistory.map((tx, index) => (
                <div key={index} className="flex justify-between text-sm bg-black bg-opacity-30 p-2 rounded">
                  <span className={`${tx.status === 'Success' ? 'text-green-400' : tx.status === 'Pending' ? 'text-yellow-400' : 'text-red-400'}`}>
                    {tx.type} {tx.index !== undefined ? `(Milestone ${tx.index})` : ''}
                  </span>
                  <div className="flex items-center">
                    <span className="text-gray-400 text-xs">{tx.time}</span>
                    <div className={`ml-2 w-2 h-2 rounded-full ${
                      tx.status === 'Success' ? 'bg-green-500' : 
                      tx.status === 'Pending' ? 'bg-yellow-500 animate-ping-slow' : 
                      'bg-red-500'
                    }`}></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="mt-4 pt-4 border-t border-white border-opacity-10">
          <div className="flex justify-between items-center">
            <p className="text-gray-300">Milestones Achieved:</p>
            <div className="flex items-center">
              <span className="text-custom-green font-semibold">{milestones.filter(m => m.achieved).length}</span>
              <span className="text-gray-400 mx-1">/</span>
              <span className="text-gray-300">{milestones.length}</span>
            </div>
          </div>
          
          <div className="w-full h-2 bg-gray-700 rounded-full mt-2 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-custom-purple to-custom-green rounded-full transition-all duration-1000 relative"
              style={{ width: `${milestones.length > 0 ? (milestones.filter(m => m.achieved).length / milestones.length) * 100 : 0}%` }}
            >
              <div className="absolute top-0 left-0 right-0 bottom-0 bg-white opacity-20 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen animated-gradient-bg custom-scrollbar">
      {/* Enhanced particle background for modern look */}
      <EnhancedParticleBackground />
      
      {/* Toast notifications */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-4">
        {toasts.map(toast => (
          <Toast 
            key={toast.id} 
            message={toast.message} 
            type={toast.type} 
            onClose={() => removeToast(toast.id)} 
          />
        ))}
      </div>
      
      <header className="relative z-10 bg-black bg-opacity-50 backdrop-blur-md border-b border-white border-opacity-20 sticky top-0">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-custom-purple to-blue-500 p-2 rounded-xl animate-purple-glow">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gradient">EcoFiDashboard</h1>
                <p className="text-gray-300 text-sm">Decentralized Impact Investing</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {!walletConnected ? (
                <button
                  onClick={connectWallet}
                  disabled={loading || connecting}
                  className="bg-gradient-to-r from-green-500 to-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:from-green-600 hover:to-blue-700 transition-all duration-200 flex items-center space-x-2 disabled:opacity-50 transform hover:scale-105"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <>
                      <Wallet className="w-4 h-4" />
                      <span>Connect Wallet</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="flex items-center space-x-3">
                  <div className="bg-white bg-opacity-10 px-4 py-2 rounded-lg">
                    <p className="text-white text-sm">{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</p>
                  </div>
                  <button
                    onClick={fetchData}
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {!walletConnected ? (
        <div className="relative z-10 flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <div className="glass-card-3d p-12 rounded-3xl border border-white border-opacity-20 max-w-md mx-auto shadow-2xl transform transition-all duration-500 hover:scale-105">
              <div className="bg-gradient-to-r from-custom-purple to-blue-600 p-4 w-20 h-20 flex items-center justify-center mx-auto mb-6 rounded-2xl">
                <Wallet className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">Connect Your Wallet</h2>
              <p className="text-white mb-8">
                Connect your wallet to start investing in EcoFiDashboard bonds and track environmental impact.
              </p>
              
              {hardhatRunning === false && (
                <div className="mb-6 p-4 bg-red-500 bg-opacity-20 rounded-lg backdrop-blur-md border border-red-500 border-opacity-20">
                  <AlertTriangle className="w-6 h-6 text-red-400 mx-auto mb-2 animate-pulse" />
                  <p className="text-red-300 text-sm">
                    Hardhat node is not running. Please start the local blockchain by running:
                    <code className="block mt-2 p-2 bg-black bg-opacity-50 rounded text-xs font-mono">
                      npx hardhat node
                    </code>
                    in your project's Backend directory.
                  </p>
                </div>
              )}
              
              <div className="flex flex-col space-y-4">
                <button
                  onClick={connectWallet}
                  disabled={loading || connecting || hardhatRunning === false}
                  className="w-full btn-glow bg-gradient-to-r from-custom-purple to-blue-600 text-white px-8 py-4 rounded-xl font-medium transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 transform hover:scale-105"
                >
                  {loading ? (
                    <>
                      <div className="loader-pulse mr-2"></div>
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <>
                      <Wallet className="w-5 h-5" />
                      <span>Connect Wallet</span>
                    </>
                  )}
                </button>
                
                <button
                  onClick={async () => {
                    try {
                      const success = await addHardhatNetworkToMetaMask();
                      if (success) {
                        showToast('Hardhat network configuration added to MetaMask', 'success');
                      } else {
                        showToast('Failed to add Hardhat network to MetaMask', 'error');
                      }
                    } catch (error) {
                      showToast(error.message || 'Failed to add network', 'error');
                    }
                  }}
                  className="w-full border border-white border-opacity-30 text-white px-4 py-3 rounded-xl font-medium hover:bg-white hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  <span>Add Hardhat Network to MetaMask</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : wrongNetwork ? (
        <div className="relative z-10 flex items-center justify-center min-h-[80vh] text-red-400">
          <div className="text-center">
            <AlertTriangle className="mx-auto h-16 w-16 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Wrong Network</h2>
            <p>Please switch to Hardhat localhost network (chainId 31337)</p>
          </div>
        </div>
      ) : (
        <main className="relative z-10 max-w-7xl mx-auto px-6 py-8">
          <ProgressPanel />
          {!isIssuer ? (
            // Investor Dashboard
            <div>
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <CheckCircle className="w-6 h-6 mr-2 text-green-400" />
                Investor Dashboard
              </h2>
              
              {/* Tab Navigation */}
              <div className="mb-6 border-b border-white border-opacity-20">
                <div className="flex space-x-2">
                  <button 
                    onClick={() => setSelectedTab('dashboard')}
                    className={`px-4 py-2 font-medium rounded-t-lg transition-all duration-200 flex items-center space-x-2 
                      ${selectedTab === 'dashboard' ? 'bg-white bg-opacity-10 text-white border-b-2 border-custom-purple' : 'text-gray-400 hover:text-white'}`}
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>Dashboard</span>
                  </button>
                  <button 
                    onClick={() => setSelectedTab('impact')}
                    className={`px-4 py-2 font-medium rounded-t-lg transition-all duration-200 flex items-center space-x-2 
                      ${selectedTab === 'impact' ? 'bg-white bg-opacity-10 text-white border-b-2 border-custom-green' : 'text-gray-400 hover:text-white'}`}
                  >
                    <Leaf className="w-4 h-4" />
                    <span>Impact</span>
                  </button>
                  <button 
                    onClick={() => setSelectedTab('portfolio')}
                    className={`px-4 py-2 font-medium rounded-t-lg transition-all duration-200 flex items-center space-x-2 
                      ${selectedTab === 'portfolio' ? 'bg-white bg-opacity-10 text-white border-b-2 border-blue-500' : 'text-gray-400 hover:text-white'}`}
                  >
                    <Database className="w-4 h-4" />
                    <span>Portfolio</span>
                  </button>
                </div>
              </div>
              
              {/* Debug section - will only show in development */}
              {process.env.NODE_ENV === 'development' && (
                <div className="bg-white bg-opacity-10 backdrop-blur-md p-4 rounded-2xl border border-white border-opacity-20 mb-6">
                  <h3 className="text-lg font-semibold text-white mb-2">Connection Debug Info:</h3>
                  <div className="text-sm text-gray-300 space-y-1">
                    <p>Wallet Address: {walletAddress || 'Not connected'}</p>
                    <p>MetaMask Detected: {window.ethereum ? 'Yes' : 'No'}</p>
                    <p>Provider Initialized: {provider ? 'Yes' : 'No'}</p>
                    <p>Signer Available: {signer ? 'Yes' : 'No'}</p>
                    <p>Chain ID: {provider ? 'Loading...' : 'Unknown'}</p>
                    <p>Hardhat Running: {hardhatRunning === null ? 'Checking...' : hardhatRunning ? 'Yes' : 'No'}</p>
                    <button
                      onClick={async () => {
                        const hardhatStatus = await verifyHardhatRunning();
                        setHardhatRunning(hardhatStatus.running);
                        console.log('Debug info:', { 
                          provider, signer, walletAddress, ethereum: window.ethereum,
                          hardhatStatus
                        });
                        showToast('Debug info logged to console', 'info');
                      }}
                      className="mt-2 px-3 py-1 bg-blue-500 text-white rounded-md text-xs"
                    >
                      Log Debug Info
                    </button>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {selectedTab === 'dashboard' && (
                  <>
                    <div className="glass-card-3d p-6 rounded-2xl transition-all duration-300 group">
                      <h3 className="text-xl font-bold text-white mb-4">Buy Bonds</h3>
                      <p className="text-gray-200 mb-4">Token Price: <span className="font-mono font-medium text-white">{tokenPrice} ETH</span></p>
                      <button
                        onClick={() => setShowInvestModal(true)}
                        className="w-full btn-glow bg-gradient-to-r from-custom-purple to-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
                      >
                        <span>Invest Now</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </button>
                    </div>
                    <div className="glass-card-3d p-6 rounded-2xl transition-all duration-300 group">
                      <h3 className="text-xl font-bold text-white mb-4">Portfolio</h3>
                      <div className="flex flex-col space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-200">Bonds Owned:</span>
                          <span className="font-mono font-medium text-white">{bondBalance}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-200">Current Value:</span>
                          <span className="font-mono font-medium text-white">{totalRaised} ETH</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-200">Impact Score:</span>
                          <div className="flex items-center">
                            <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-custom-green to-green-500" 
                                style={{ width: `${Math.min((cumulativeKwh / (milestones.length > 0 ? milestones[milestones.length - 1].threshold : 100)) * 100, 100)}%` }}
                              ></div>
                            </div>
                            <span className="ml-2 font-mono font-medium text-white">{Math.min((cumulativeKwh / (milestones.length > 0 ? milestones[milestones.length - 1].threshold : 100)) * 100, 100).toFixed(0)}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
                
                {selectedTab === 'impact' && (
                  <>
                    <div className="glass-card-3d p-6 rounded-2xl transition-all duration-300 group col-span-2">
                      <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                        <Sparkles className="w-5 h-5 mr-2 text-custom-green" />
                        Environmental Impact Dashboard
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-black bg-opacity-30 p-5 rounded-xl backdrop-blur-md border border-white border-opacity-5 flex flex-col items-center">
                          <div className="bg-custom-green bg-opacity-20 p-3 rounded-full mb-3">
                            <Leaf className="w-8 h-8 text-custom-green" />
                          </div>
                          <h4 className="text-gray-300 text-sm mb-1">CO₂ Reduced</h4>
                          <p className="text-2xl font-bold text-white">{impactMetrics.co2Reduced} kg</p>
                        </div>
                        
                        <div className="bg-black bg-opacity-30 p-5 rounded-xl backdrop-blur-md border border-white border-opacity-5 flex flex-col items-center">
                          <div className="bg-blue-500 bg-opacity-20 p-3 rounded-full mb-3">
                            <Wind className="w-8 h-8 text-blue-500" />
                          </div>
                          <h4 className="text-gray-300 text-sm mb-1">Trees Planted</h4>
                          <p className="text-2xl font-bold text-white">{impactMetrics.treesPlanted}</p>
                        </div>
                        
                        <div className="bg-black bg-opacity-30 p-5 rounded-xl backdrop-blur-md border border-white border-opacity-5 flex flex-col items-center">
                          <div className="bg-yellow-500 bg-opacity-20 p-3 rounded-full mb-3">
                            <Zap className="w-8 h-8 text-yellow-500" />
                          </div>
                          <h4 className="text-gray-300 text-sm mb-1">Energy Saved</h4>
                          <p className="text-2xl font-bold text-white">{impactMetrics.energySaved} kWh</p>
                        </div>
                        
                        <div className="bg-black bg-opacity-30 p-5 rounded-xl backdrop-blur-md border border-white border-opacity-5 flex flex-col items-center">
                          <div className="bg-blue-400 bg-opacity-20 p-3 rounded-full mb-3">
                            <Database className="w-8 h-8 text-blue-400" />
                          </div>
                          <h4 className="text-gray-300 text-sm mb-1">Water Conserved</h4>
                          <p className="text-2xl font-bold text-white">{impactMetrics.waterConserved} L</p>
                        </div>
                      </div>
                      
                      <div className="bg-black bg-opacity-30 p-6 rounded-xl backdrop-blur-md border border-white border-opacity-5 mt-4">
                        <h4 className="text-lg font-medium text-white mb-3 flex items-center">
                          <Lightbulb className="w-5 h-5 mr-2 text-yellow-400" />
                          Carbon Credit Status
                        </h4>
                        <div className="flex items-center mb-4">
                          <div className="flex-1">
                            <div className="flex justify-between mb-1">
                              <span className="text-gray-300">Carbon Credits Earned:</span>
                              <span className="text-white font-medium">{carbonCredits.toFixed(2)}</span>
                            </div>
                            <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full" 
                                style={{ width: `${Math.min((carbonCredits / 100) * 100, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                          <div className="ml-4 bg-green-900 bg-opacity-30 px-3 py-1 rounded-full text-green-400 text-sm font-medium">
                            + {(carbonCredits / 10).toFixed(2)} this month
                          </div>
                        </div>
                        <p className="text-sm text-gray-400">
                          Your investment has helped generate these carbon credits through renewable energy production.
                          These credits represent the reduction of carbon dioxide emissions.
                        </p>
                      </div>
                    </div>
                  </>
                )}
                
                {selectedTab === 'portfolio' && (
                  <>
                    <div className="glass-card-3d p-6 rounded-2xl transition-all duration-300 group col-span-2">
                      <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                        <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
                        Investment Performance
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="bg-black bg-opacity-30 p-6 rounded-xl backdrop-blur-md border border-white border-opacity-5">
                          <h4 className="text-lg font-medium text-white mb-4">Bond Holdings</h4>
                          
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-gray-300">Total Bonds:</span>
                              <span className="text-white font-mono">{bondBalance} BOND</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-300">Purchase Price:</span>
                              <span className="text-white font-mono">{(parseFloat(bondBalance) * parseFloat(tokenPrice)).toFixed(4)} ETH</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-300">Current Value:</span>
                              <span className="text-white font-mono">{(parseFloat(bondBalance) * parseFloat(tokenPrice) * 1.05).toFixed(4)} ETH</span>
                            </div>
                            
                            <div className="h-px bg-gray-700 my-3"></div>
                            
                            <div className="flex justify-between">
                              <span className="text-gray-300">Return:</span>
                              <span className="text-green-400 font-mono">+5.00%</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-black bg-opacity-30 p-6 rounded-xl backdrop-blur-md border border-white border-opacity-5">
                          <h4 className="text-lg font-medium text-white mb-4">Expected Returns</h4>
                          
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-gray-300 text-sm">Annual Yield</p>
                                <p className="text-xl font-bold text-white">8.0%</p>
                              </div>
                              <div className="bg-green-900 bg-opacity-30 px-3 py-1 rounded-full text-green-400 text-sm font-medium">
                                Projected
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-300">1 Year Return:</span>
                                <span className="text-white font-mono">+{investmentReturns.toFixed(4)} ETH</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-300">5 Year Return:</span>
                                <span className="text-white font-mono">+{(investmentReturns * 5 * 1.02).toFixed(4)} ETH</span>
                              </div>
                            </div>
                            
                            <div className="bg-custom-purple bg-opacity-20 p-4 rounded-lg mt-2">
                              <p className="text-white text-sm flex items-center">
                                <Flame className="w-4 h-4 mr-2 text-custom-purple" />
                                <span>Returns are tied to sustainability milestones achievement</span>
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div className="glass-card-3d p-6 rounded-2xl mb-8 transition-all duration-300">
                <h3 className="text-xl font-bold text-white mb-4">Milestones</h3>
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-black bg-opacity-20">
                        <th className="p-3 text-left text-white">Index</th>
                        <th className="p-3 text-left text-white">Threshold (kWh)</th>
                        <th className="p-3 text-left text-white">Achieved</th>
                        <th className="p-3 text-left text-white">Release BPS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {milestones.map((mil) => (
                        <tr key={mil.index} className="hover:bg-white hover:bg-opacity-10 transition-colors">
                          <td className="p-3 text-white">{mil.index}</td>
                          <td className="p-3 text-white">{mil.threshold}</td>
                          <td className="p-3 text-white">
                            {mil.achieved ? (
                              <div className="flex items-center">
                                <CheckCircle2 className="text-green-400 h-5 w-5 mr-2 animate-pulse" />
                                <span className="text-green-400 font-medium">Achieved</span>
                              </div>
                            ) : (
                              <div className="flex items-center">
                                <div className="w-2 h-2 rounded-full bg-yellow-400 mr-2 animate-ping"></div>
                                <span className="text-yellow-300">Pending</span>
                              </div>
                            )}
                          </td>
                          <td className="p-3 text-white">{mil.releaseBps}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="glass-card-3d p-6 rounded-2xl border border-white border-opacity-20 hover:shadow-xl hover:shadow-custom-purple/20 transition-all">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                  <div className="bg-gradient-to-r from-custom-green to-blue-500 p-2 rounded-xl mr-2">
                    <RefreshCw className="w-5 h-5 text-white" />
                  </div>
                  Live Impact
                </h3>
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1 bg-black bg-opacity-20 p-4 rounded-xl transform transition-all duration-300 hover:scale-105">
                    <p className="text-white text-sm mb-1">Cumulative Energy Generated</p>
                    <div className="flex items-baseline">
                      <p className="text-3xl font-bold text-custom-green">{cumulativeKwh}</p>
                      <p className="text-gray-200 ml-2">kWh</p>
                    </div>
                    <div className="h-2 w-full bg-gray-700 rounded-full mt-4 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-custom-green to-blue-500 rounded-full"
                        style={{ width: `${Math.min((cumulativeKwh / (milestones.length > 0 ? milestones[milestones.length - 1].threshold : 100)) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="flex-1 bg-black bg-opacity-20 p-4 rounded-xl transform transition-all duration-300 hover:scale-105">
                    <p className="text-white text-sm mb-1">Environmental Impact</p>
                    <div className="flex items-baseline">
                      <p className="text-3xl font-bold text-custom-green">{Math.round(cumulativeKwh * 0.4)}</p>
                      <p className="text-gray-200 ml-2">kg CO₂ saved</p>
                    </div>
                    <p className="text-white text-sm mt-2">Equivalent to planting ~{Math.round(cumulativeKwh * 0.02)} trees</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Issuer Dashboard
            <div>
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <CheckCircle className="w-6 h-6 mr-2 text-green-400" />
                Issuer Dashboard
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="glass-card-3d p-6 rounded-2xl transition-all duration-300 group">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white text-sm group-hover:text-white transition-colors">Total Funds Raised</p>
                      <p className="text-2xl font-bold text-white">{totalRaised} ETH</p>
                    </div>
                    <div className="bg-gradient-to-r from-custom-green to-custom-purple p-3 rounded-xl transform group-hover:scale-110 transition-all">
                      <Lock className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </div>
                <div className="glass-card-3d p-6 rounded-2xl transition-all duration-300 group">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white text-sm group-hover:text-white transition-colors">Remaining Unreleased Funds</p>
                      <p className="text-2xl font-bold text-white">{remainingFunds.toFixed(4)} ETH</p>
                    </div>
                    <div className="bg-gradient-to-r from-blue-400 to-custom-purple p-3 rounded-xl transform group-hover:scale-110 transition-all">
                      <Lock className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-4 mb-8">
                {saleEnded && (
                  <button
                    onClick={closeSale}
                    disabled={loading}
                    className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white px-6 py-3 rounded-lg font-medium hover:from-yellow-600 hover:to-orange-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50"
                  >
                    Close Sale
                  </button>
                )}
                {allMilestonesAchieved && (
                  <button
                    onClick={withdrawRemainder}
                    disabled={loading}
                    className="bg-gradient-to-r from-custom-purple to-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:from-deep-purple hover:to-indigo-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50"
                  >
                    Withdraw Remainder
                  </button>
                )}
              </div>
              <div className="glass-card-3d p-6 rounded-2xl transition-all duration-300">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                  <div className="bg-gradient-to-r from-custom-purple to-pink-500 p-2 rounded-xl mr-2">
                    <RefreshCw className="w-5 h-5 text-white" />
                  </div>
                  Oracle Simulation (Demo Only)
                </h3>
                <div className="space-y-4">
                  <div className="relative">
                    <input
                      type="password"
                      value={oracleKey}
                      onChange={(e) => setOracleKey(e.target.value)}
                      placeholder="Oracle Updater Private Key"
                      className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-custom-purple focus:border-transparent transition-all bg-white bg-opacity-10 text-white placeholder-gray-400"
                    />
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                      <input
                        type="number"
                        value={deltaKwh}
                        onChange={(e) => setDeltaKwh(e.target.value)}
                        placeholder="Delta kWh"
                        className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-custom-green focus:border-transparent transition-all bg-white bg-opacity-10 text-white placeholder-gray-400"
                      />
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-custom-green font-bold text-xs">kWh</div>
                    </div>
                    
                    <div className="relative">
                      <input
                        type="number"
                        value={deltaCO2}
                        onChange={(e) => setDeltaCO2(e.target.value)}
                        placeholder="Delta CO2"
                        className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-custom-green focus:border-transparent transition-all bg-white bg-opacity-10 text-white placeholder-gray-400"
                      />
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-custom-green font-bold text-xs">CO₂</div>
                    </div>
                  </div>
                  
                  <button
                    onClick={pushImpact}
                    disabled={loading}
                    className="w-full btn-glow bg-gradient-to-r from-custom-purple to-pink-600 text-white px-4 py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 disabled:opacity-50 flex items-center justify-center"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-5 h-5 mr-2" />
                        <span>Push Impact Data</span>
                      </>
                    )}
                  </button>
                  
                  <div className="bg-black bg-opacity-20 p-4 rounded-lg mt-2">
                    <p className="text-white text-sm">
                      <span className="text-custom-green font-semibold">How it works:</span> This simulates IoT data updates that would 
                      normally come from solar panels or other green energy sources. The kWh values trigger milestone achievements when thresholds are reached.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      )}
      <InvestmentModal />
    </div>
  );
};

export default EcoFiDashboard;