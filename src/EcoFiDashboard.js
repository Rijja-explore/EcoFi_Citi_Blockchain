import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { 
  Wallet, CheckCircle, AlertTriangle, RefreshCw, Lock, 
  Award, Flame, BarChart3, Leaf, Globe, 
  Zap, DollarSign, TrendingUp, Database,
  CheckCircle2, Sparkles, Wind, Lightbulb, LogOut, PlusCircle, Clock
} from 'lucide-react';

// Import enhanced particle background
import EnhancedParticleBackground from './EnhancedParticleBackground';

// Import login timeline
import LoginTimeline from './LoginTimeline';

// Import contract utilities and artifacts
import { 
  initializeProvider, 
  getSigner, 
  getContracts,
  handleContractError,
  verifyHardhatRunning,
  addHardhatNetworkToMetaMask,
  pushImpactData
} from './contractUtils';
import BondTokenArtifact from './Backend/artifacts/contracts/BondToken.sol/BondToken.json';

// Import Firebase config and functions
import { 
  addTransaction, getTransactionsForWallet, 
  addProject, getProjects, 
  getLatestImpactData, addImpactData,
  logUserLogin, logUserLogout, getWalletLoginTimeline,
  db
} from './firebaseConfig';

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
  // State for wallet connection
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [wrongNetwork, setWrongNetwork] = useState(false);
  const [hardhatRunning, setHardhatRunning] = useState(null);
  
  // Load impact data from Firestore
  useEffect(() => {
    const fetchImpactData = async () => {
      try {
        const data = await getLatestImpactData();
        if (data) {
          setEnvironmentalImpact(data);
        }
      } catch (error) {
        console.error("Failed to fetch impact data:", error);
      }
    };
    
    fetchImpactData();
  }, []);
  
  // State for contract data
  const [bondBalance, setBondBalance] = useState('0');
  const [impactScore, setImpactScore] = useState(0);
  const [totalRaised, setTotalRaised] = useState('0');
  const [totalReleased, setTotalReleased] = useState('0');
  const [tokenPrice, setTokenPrice] = useState('0');
  const [tokensSold, setTokensSold] = useState('0');
  const [capTokens, setCapTokens] = useState('0');
  const [cumulativeKwh, setCumulativeKwh] = useState(0);
  const [isIssuer, setIsIssuer] = useState(false);
  const [milestones, setMilestones] = useState([]);
  const [saleEnd, setSaleEnd] = useState(0);
  const [refreshInterval, setRefreshInterval] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // State for impact data entry
  const [deltaKwh, setDeltaKwh] = useState('');
  const [deltaCO2, setDeltaCO2] = useState('');
  const [oracleKey, setOracleKey] = useState('');

  // State for UI
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showInvestModal, setShowInvestModal] = useState(false);
  const [tokenAmount, setTokenAmount] = useState('');
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  // Environmental impact metrics (calculated from contract data)
  const [environmentalImpact, setEnvironmentalImpact] = useState({
    co2Reduced: 0,
    treesPlanted: 0,
    energySaved: 0,
    waterConserved: 0
  });

  // Toast helper functions
  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // Function to fetch transaction history from database
  const fetchTransactionHistory = useCallback(async () => {
    if (!walletAddress) return;
    
    try {
      setLoadingTransactions(true);
      const transactions = await getTransactionsForWallet(walletAddress);
      setTransactionHistory(transactions);
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      showToast('Failed to load transaction history', 'error');
    } finally {
      setLoadingTransactions(false);
    }
  }, [walletAddress, showToast]);

  // Disconnect wallet function
  const disconnectWallet = useCallback(async () => {
    try {
      // Log the logout event if wallet is connected
      if (walletConnected && walletAddress) {
        await logUserLogout(walletAddress);
      }
      
      // Clear connection state
      setWalletConnected(false);
      setWalletAddress('');
      setProvider(null);
      setSigner(null);
      
      // Clear contract data
      setBondBalance('0');
      setImpactScore(0);
      setTotalRaised('0');
      setTotalReleased('0');
      setTokenPrice('0');
      setTokensSold('0');
      setCapTokens('0');
      setCumulativeKwh(0);
      setIsIssuer(false);
      setMilestones([]);
      
      // Stop refresh interval
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
      
      // Show success message
      showToast('Wallet disconnected successfully', 'success');
    } catch (error) {
      console.error('Error logging disconnect event:', error);
    }
    setProvider(null);
    setSigner(null);
    
    // Clear any active data refresh intervals
    if (refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }
    
    // Reset all data states to defaults
    setBondBalance('0');
    setImpactScore(0);
    setTotalRaised('0');
    setTotalReleased('0');
    setTokenPrice('0');
    setTokensSold('0');
    setCapTokens('0');
    setCumulativeKwh(0);
    setIsIssuer(false);
    setMilestones([]);
    setSaleEnd(0);
    
    // Add disconnect transaction to database
    addTransaction({ 
      type: 'Wallet Disconnected', 
      status: 'Success', 
      time: new Date().toLocaleTimeString(),
      walletAddress: walletAddress
    });
    
    showToast('Wallet disconnected', 'info');
  }, [refreshInterval, showToast]);

  // Load transaction history when wallet is connected
  useEffect(() => {
    if (walletConnected && walletAddress) {
      fetchTransactionHistory();
    }
  }, [walletConnected, walletAddress, fetchTransactionHistory]);

  // Set up real-time data refresh
  useEffect(() => {
    const setupRealTimeRefresh = () => {
      if (walletConnected && provider && walletAddress) {
        // Clear any existing interval first
        if (refreshInterval) {
          clearInterval(refreshInterval);
        }
        
        // Set up a new interval to refresh data every 10 seconds
        const interval = setInterval(() => {
          setIsRefreshing(true);
          fetchContractData(provider, walletAddress)
            .finally(() => setIsRefreshing(false));
        }, 10000); // 10 seconds refresh
        
        setRefreshInterval(interval);
        
        // Return cleanup function
        return () => {
          clearInterval(interval);
          setRefreshInterval(null);
        };
      }
    };
    
    const cleanup = setupRealTimeRefresh();
    return cleanup;
  }, [walletConnected, provider, walletAddress, refreshInterval]);

  // Utility function to check MetaMask status
  const checkMetaMaskStatus = useCallback(() => {
    if (!window.ethereum) {
      showToast('MetaMask is not installed. Please install MetaMask extension.', 'error');
      return false;
    }
    return true;
  }, [showToast]);

  // Function to connect wallet
  const connectWallet = async () => {
    if (connecting) return;
    setConnecting(true);
    setLoading(true);
    
    try {
      // Check MetaMask status
      if (!checkMetaMaskStatus()) {
        setConnecting(false);
        setLoading(false);
        return;
      }
      
      // Initialize provider and check network
      const { provider: ethersProvider, isHardhatLocal } = await initializeProvider();
      
      if (!isHardhatLocal) {
        setWrongNetwork(true);
        showToast('Connected to wrong network. Please switch to Hardhat local network.', 'error');
        
        // Add Hardhat network to MetaMask if not already present
        const networkAdded = await addHardhatNetworkToMetaMask();
        if (networkAdded) {
          showToast('Hardhat network added to MetaMask. Please switch networks.', 'info');
        }
        
        setConnecting(false);
        setLoading(false);
        return;
      }
      
      // Get signer and address with additional validation
      const { signer, address } = await getSigner(ethersProvider);
      
      if (!signer || !address) {
        throw new Error('Failed to get signer or address');
      }
      
      setProvider(ethersProvider);
      setSigner(signer);
      setWalletAddress(address);
      setWalletConnected(true);
      setWrongNetwork(false);
      
      // Log the login event
      await logUserLogin(address);
      
      // Add connection to database
      await addTransaction({ 
        type: 'Wallet Connected', 
        status: 'Success', 
        time: new Date().toLocaleTimeString(),
        walletAddress: address
      });
      
      showToast('Wallet connected successfully', 'success');
      
      // Fetch contract data after connecting
      fetchContractData(ethersProvider, address);
    } catch (error) {
      console.error('Wallet connection failed:', error);
      
      // Log error to database
      await addTransaction({ 
        type: 'Wallet Connect', 
        status: 'Failed', 
        time: new Date().toLocaleTimeString(),
        walletAddress: 'unknown',
        error: error.message || 'Unknown error'
      });
      
      showToast(error.message || 'Failed to connect wallet', 'error');
    } finally {
      setLoading(false);
      setConnecting(false);
    }
  };

  // Fetch contract data
  const fetchContractData = async (providerInstance, address) => {
    if (!providerInstance) return;
    
    try {
      setLoading(true);
      
      // Get contract instances
      const contracts = getContracts(providerInstance);
      const { escrow, bondToken, oracle } = contracts;

      // Get token address from escrow
      try {
        const tokenAddress = await escrow.token();
        console.log("Bond token address:", tokenAddress);
        // Re-initialize bond token with the correct address
        const updatedBondToken = new ethers.Contract(tokenAddress, BondTokenArtifact.abi, providerInstance);
        contracts.bondToken = updatedBondToken;
      } catch (error) {
        console.error("Failed to fetch token address from escrow:", error);
      }

      // Create batch of promises to fetch data in parallel
      try {
        const price = await escrow.priceWeiPerToken();
        setTokenPrice(ethers.formatEther(price));
      } catch (error) {
        console.error("Failed to fetch priceWeiPerToken:", error);
      }
      
      try {
        const bal = await bondToken.balanceOf(address);
        setBondBalance(ethers.formatEther(bal));
      } catch (error) {
        console.error("Failed to fetch balanceOf:", error);
      }
      
      try {
        const sold = await escrow.tokensSold();
        setTokensSold(ethers.formatEther(sold));
      } catch (error) {
        console.error("Failed to fetch tokensSold:", error);
      }
      
      try {
        const cap = await escrow.capTokens();
        setCapTokens(ethers.formatEther(cap));
      } catch (error) {
        console.error("Failed to fetch capTokens:", error);
      }
      
      try {
        const issuerAddr = await escrow.issuer();
        setIsIssuer(issuerAddr.toLowerCase() === address.toLowerCase());
      } catch (error) {
        console.error("Failed to fetch issuer:", error);
      }
      
      try {
        const kwh = await oracle.cumulativeKwh();
        setCumulativeKwh(Number(kwh));
      } catch (error) {
        console.error("Failed to fetch cumulativeKwh:", error);
      }
      
      try {
        const count = await escrow.milestonesCount();
        
        // Fetch milestones
        if (Number(count) > 0) {
          const milestonesArray = [];
          for (let i = 0; i < Number(count); i++) {
            const milestone = await escrow.milestones(i);
            milestonesArray.push({
              index: i,
              threshold: Number(milestone.threshold),
              releaseBps: Number(milestone.releaseBps),
              achieved: milestone.achieved
            });
          }
          setMilestones(milestonesArray);
          
          // Calculate impact score based on last milestone and current cumulative kWh
          const lastMilestone = milestonesArray[milestonesArray.length - 1];
          const maxThreshold = lastMilestone.threshold;
          const currentKwh = cumulativeKwh; // Use state variable instead of local variable
          const score = Math.min((Number(currentKwh || 0) / maxThreshold) * 100, 100);
          setImpactScore(Math.round(score));
        }
      } catch (error) {
        console.error("Failed to fetch milestonesCount:", error);
      }
      
      try {
        const end = await escrow.saleEnd();
        setSaleEnd(Number(end));
      } catch (error) {
        console.error("Failed to fetch saleEnd:", error);
      }
      
      // Calculate environmental impact metrics based on kWh and store in Firestore
      try {
        // First try to get latest impact data from Firestore
        const existingImpact = await getLatestImpactData();
        
        // Calculate new impact data based on current kWh
        const kwhValue = cumulativeKwh; 
        const impactData = {
          co2Reduced: Math.round(kwhValue * 0.4), // kg CO2 saved (0.4kg per kWh)
          treesPlanted: Math.round(kwhValue * 0.02), // trees equivalent (1 tree = ~50 kWh)
          energySaved: kwhValue, // kWh saved
          waterConserved: Math.round(kwhValue * 0.5) // liters of water conserved
        };
        
        // Only update Firestore if there's a change
        if (!existingImpact || 
            existingImpact.co2Reduced !== impactData.co2Reduced ||
            existingImpact.energySaved !== impactData.energySaved) {
          
          // Update state
          setEnvironmentalImpact(impactData);
          
          // Store in Firestore
          await addImpactData(impactData);
        }
      } catch (error) {
        console.error("Failed to calculate environmental impact:", error);
      }

      // If user is the issuer, fetch additional data
      try {
        // Get current issuer address
        const currentIssuerAddr = await escrow.issuer();
        setIsIssuer(currentIssuerAddr.toLowerCase() === address.toLowerCase());
        
        if (currentIssuerAddr.toLowerCase() === address.toLowerCase()) {
          const [raised, released] = await Promise.all([
            escrow.totalRaised(),
            escrow.totalReleased()
          ]);
          
          setTotalRaised(ethers.formatEther(raised));
          setTotalReleased(ethers.formatEther(released));
        }
      } catch (error) {
        console.error("Failed to check issuer status or fetch issuer data:", error);
      }

      showToast('Contract data updated', 'success');
    } catch (error) {
      console.error('Error fetching contract data:', error);
      showToast(handleContractError(error), 'error');
    } finally {
      setLoading(false);
    }
  };

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
      const price = await escrow.priceWeiPerToken();
      const cost = (amount * price) / (10n**18n);
      
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
      
      // Update transaction history
      setTransactionHistory(prev => 
        prev.map(item => 
          item.txHash === tx.hash 
            ? { ...item, status: 'Success' } 
            : item
        )
      );
      
      showToast('Bonds purchased successfully', 'success');
      
      // Refresh data
      fetchContractData(provider, walletAddress);
      setShowInvestModal(false);
      setTokenAmount('');
    } catch (error) {
      console.error('Buy bonds failed:', error);
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

  // Push impact data
  const handlePushImpactData = async () => {
    if (!signer || !deltaKwh || !deltaCO2) {
      showToast('Please enter valid impact data', 'error');
      return;
    }
    
    setLoading(true);
    
    try {
      const tx = await pushImpactData(
        provider,
        oracleKey || null, // Use provided key or null to use the key from env
        deltaKwh,
        deltaCO2
      );
      
      if (!tx) {
        throw new Error('Failed to push impact data');
      }
      
      // Add transaction to database
      await addTransaction({ 
        type: 'Push Impact Data', 
        status: 'Pending', 
        time: new Date().toLocaleTimeString(),
        walletAddress: walletAddress,
        txHash: tx.hash 
      });
      
      showToast('Impact data transaction pending...', 'info');
      
      // Wait for confirmation
      await tx.wait();
      
      // Update transaction in database with success status
      await addTransaction({
        type: 'Push Impact Data',
        status: 'Success',
        time: new Date().toLocaleTimeString(),
        walletAddress: walletAddress,
        txHash: tx.hash,
        updatedTx: true
      });
      
      showToast('Impact data updated successfully', 'success');
      
      // Reset form and refresh data
      setDeltaKwh('');
      setDeltaCO2('');
      fetchContractData(provider, walletAddress);
    } catch (error) {
      console.error('Push impact data failed:', error);
      
      // Log error to database
      await addTransaction({ 
        type: 'Push Impact Data', 
        status: 'Failed', 
        time: new Date().toLocaleTimeString(),
        walletAddress: walletAddress,
        error: error.message || 'Unknown error'
      });
      showToast(handleContractError(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  // UI Components

  // Network Status indicator
  const NetworkStatus = () => (
    <div className="flex items-center justify-center gap-2 p-2 text-sm rounded-lg text-white">
      {hardhatRunning === null ? (
        <div className="flex items-center gap-1">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Checking network status...</span>
        </div>
      ) : hardhatRunning ? (
        <div className="flex items-center gap-1 text-green-400">
          <CheckCircle className="w-4 h-4" />
          <span>Hardhat node running</span>
        </div>
      ) : (
        <div className="flex items-center gap-1 text-red-400">
          <AlertTriangle className="w-4 h-4" />
          <span>Hardhat node not detected</span>
        </div>
      )}
      
      <button 
        onClick={() => {
          setIsRefreshing(true);
          fetchContractData(provider, walletAddress)
            .finally(() => setIsRefreshing(false));
        }}
        className="ml-2 bg-gray-700/50 hover:bg-gray-700 rounded-full p-1 transition-colors"
        title="Refresh Data"
      >
        <RefreshCw className="w-4 h-4" />
      </button>
    </div>
  );

  // Connect Wallet Button
  const ConnectWalletButton = () => (
    <button
      onClick={connectWallet}
      disabled={connecting || loading}
      className="flex items-center gap-2 bg-gradient-to-r from-custom-purple to-bright-purple text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-purple-500/30 transition-all duration-300 disabled:opacity-50"
    >
      {connecting ? (
        <>
          <RefreshCw className="w-5 h-5 animate-spin" />
          Connecting...
        </>
      ) : (
        <>
          <Wallet className="w-5 h-5" />
          Connect Wallet
        </>
      )}
    </button>
  );

  // Wallet Status
  const WalletStatus = () => (
    <div className={`glass-card p-4 rounded-xl flex items-center gap-3 ${wrongNetwork ? 'border-red-500' : 'border-green-500'}`}>
      <div className="bg-purple-900/50 p-2 rounded-lg">
        <Wallet className="w-6 h-6 text-white" />
      </div>
      <div className="flex-1">
        {wrongNetwork ? (
          <div className="text-red-400 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>Wrong Network - Switch to Hardhat Local</span>
          </div>
        ) : (
          <div className="text-white text-sm flex flex-col">
            <div className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-green-400" />
              <span>Connected to Hardhat Local</span>
              {isRefreshing && (
                <div className="flex items-center text-xs text-gray-400 ml-2">
                  <RefreshCw className="w-3 h-3 animate-spin mr-1" />
                  Refreshing...
                </div>
              )}
            </div>
            <div className="text-gray-400 truncate text-xs mt-0.5">{walletAddress}</div>
          </div>
        )}
      </div>
      
      <button 
        onClick={disconnectWallet}
        className="bg-red-500/20 hover:bg-red-500/30 text-white rounded-full p-2 transition-colors"
        title="Disconnect Wallet"
      >
        <LogOut className="w-4 h-4" />
      </button>
    </div>
  );

  // Dashboard Metrics Card
  const MetricsCard = ({ title, value, unit, icon: Icon, color }) => (
    <div className="glass-card p-4 rounded-xl flex items-center gap-3 group hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300">
      <div className={`${color} p-2 rounded-lg group-hover:scale-105 transition-transform duration-300`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <div className="text-gray-400 text-xs uppercase tracking-wider">{title}</div>
        <div className="flex items-end gap-1">
          <div className="text-white text-xl font-bold">{value}</div>
          {unit && <div className="text-gray-400 text-xs">{unit}</div>}
        </div>
      </div>
    </div>
  );

  // Investment Calculator Component
  const InvestmentCalculator = () => {
    const [simAmount, setSimAmount] = useState('1');
    const [simResults, setSimResults] = useState({
      tokens: '0',
      impact: 0,
      returns: 0
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const calculateInvestment = useCallback(() => {
      if (!simAmount) return;
      
      const amount = parseFloat(simAmount);
      const price = parseFloat(tokenPrice || '0.1');
      
      // Calculate tokens
      const tokens = (amount / price).toFixed(2);
      
      // Calculate impact (simplified)
      const impact = Math.round((amount * 10) / price); // kWh per ETH invested
      
      // Calculate potential returns (simplified)
      const returns = (amount * 0.12).toFixed(4); // 12% return
      
      setSimResults({
        tokens,
        impact,
        returns
      });
    }, [simAmount]);

    useEffect(() => {
      calculateInvestment();
    }, [calculateInvestment]);

    return (
      <div className="glass-card p-4 rounded-xl">
        <h3 className="text-white text-lg font-semibold mb-3">Investment Simulator</h3>
        <div className="mb-4">
          <label className="block text-gray-400 text-sm mb-1">Investment Amount (ETH)</label>
          <input
            type="number"
            value={simAmount}
            onChange={(e) => setSimAmount(e.target.value)}
            onBlur={calculateInvestment}
            className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2 text-white"
            min="0.01"
            step="0.01"
          />
        </div>
        
        <div className="grid grid-cols-1 gap-3">
          <div className="bg-gray-800/50 p-3 rounded-lg">
            <div className="text-gray-400 text-xs">Tokens Received</div>
            <div className="text-white text-lg font-semibold">{simResults.tokens} GBOND</div>
          </div>
          
          <div className="bg-gray-800/50 p-3 rounded-lg">
            <div className="text-gray-400 text-xs">Est. Environmental Impact</div>
            <div className="text-white text-lg font-semibold">{simResults.impact} kWh</div>
            <div className="text-gray-400 text-xs">≈ {Math.round(simResults.impact * 0.4)} kg CO₂ reduced</div>
          </div>
          
          <div className="bg-gray-800/50 p-3 rounded-lg">
            <div className="text-gray-400 text-xs">Potential Returns</div>
            <div className="text-white text-lg font-semibold">{simResults.returns} ETH</div>
            <div className="text-gray-400 text-xs">Based on milestone achievements</div>
          </div>
        </div>
        
        <button 
          onClick={() => {
            setTokenAmount(simAmount);
            setShowInvestModal(true);
          }}
          className="w-full mt-4 bg-gradient-to-r from-green-600 to-green-500 text-white px-4 py-2 rounded-lg font-semibold"
        >
          Invest Now
        </button>
      </div>
    );
  };

  // Milestone Progress Component
  const MilestoneProgress = () => (
    <div className="glass-card p-4 rounded-xl">
      <h3 className="text-white text-lg font-semibold mb-3">Project Milestones</h3>
      
      {milestones.length === 0 ? (
        <div className="text-gray-400 text-center py-4">No milestones defined</div>
      ) : (
        <div className="space-y-4">
          {milestones.map((milestone, index) => (
            <div key={index} className="relative">
              <div className="flex items-center mb-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${milestone.achieved ? 'bg-green-500' : 'bg-gray-700'}`}>
                  {milestone.achieved ? <CheckCircle className="w-4 h-4 text-white" /> : <span className="text-white text-xs">{index + 1}</span>}
                </div>
                <div className="ml-2 text-white font-medium">
                  Milestone {index + 1}: {milestone.threshold.toLocaleString()} kWh
                </div>
                {milestone.achieved && (
                  <div className="ml-auto text-green-400 text-sm flex items-center">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Released
                  </div>
                )}
              </div>
              
              <div className="ml-3 pl-6 border-l border-gray-700 pb-4">
                <div className="text-gray-400 text-sm">Release Amount: {milestone.releaseBps/100}% of funds</div>
                
                <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${milestone.achieved ? 'bg-green-500' : 'bg-purple-600'}`}
                    style={{ 
                      width: `${Math.min(100, (cumulativeKwh / milestone.threshold) * 100)}%`
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>
                    {Math.min(cumulativeKwh, milestone.threshold).toLocaleString()} / {milestone.threshold.toLocaleString()} kWh
                  </span>
                  <span>
                    {Math.min(100, Math.round((cumulativeKwh / milestone.threshold) * 100))}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Impact Metrics Component
  const ImpactMetrics = () => (
    <div className="glass-card p-4 rounded-xl">
      <h3 className="text-white text-lg font-semibold mb-3">Environmental Impact</h3>
      
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-800/50 p-3 rounded-lg">
          <div className="flex items-center gap-2 text-green-400 mb-1">
            <Leaf className="w-4 h-4" />
            <span className="text-sm font-medium">CO₂ Reduced</span>
          </div>
          <div className="text-white text-lg font-semibold">{environmentalImpact.co2Reduced.toLocaleString()} kg</div>
        </div>
        
        <div className="bg-gray-800/50 p-3 rounded-lg">
          <div className="flex items-center gap-2 text-green-400 mb-1">
            <Wind className="w-4 h-4" />
            <span className="text-sm font-medium">Trees Equivalent</span>
          </div>
          <div className="text-white text-lg font-semibold">{environmentalImpact.treesPlanted.toLocaleString()}</div>
        </div>
        
        <div className="bg-gray-800/50 p-3 rounded-lg">
          <div className="flex items-center gap-2 text-blue-400 mb-1">
            <Zap className="w-4 h-4" />
            <span className="text-sm font-medium">Energy Generated</span>
          </div>
          <div className="text-white text-lg font-semibold">{environmentalImpact.energySaved.toLocaleString()} kWh</div>
        </div>
        
        <div className="bg-gray-800/50 p-3 rounded-lg">
          <div className="flex items-center gap-2 text-blue-400 mb-1">
            <Lightbulb className="w-4 h-4" />
            <span className="text-sm font-medium">Water Conserved</span>
          </div>
          <div className="text-white text-lg font-semibold">{environmentalImpact.waterConserved.toLocaleString()} L</div>
        </div>
      </div>
      
      <div className="mt-4">
        <h4 className="text-white text-sm font-medium mb-2">Overall Impact Score</h4>
        <div className="h-4 bg-gray-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-green-500 to-custom-green"
            style={{ width: `${impactScore}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>Min</span>
          <span>{impactScore}%</span>
          <span>Max</span>
        </div>
      </div>
    </div>
  );

  // Oracle Simulator (for issuer only)
  const OracleSimulator = () => (
    <div className="glass-card p-4 rounded-xl">
      <h3 className="text-white text-lg font-semibold mb-3">Impact Data Simulator</h3>
      <p className="text-gray-400 text-sm mb-4">
        Push new impact data to the oracle to simulate project progress. This will trigger milestone releases when thresholds are met.
      </p>
      
      <div className="space-y-3">
        <div>
          <label className="block text-gray-400 text-sm mb-1">New kWh Generated</label>
          <input
            type="number"
            value={deltaKwh}
            onChange={(e) => setDeltaKwh(e.target.value)}
            className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2 text-white"
            placeholder="e.g. 1000"
          />
        </div>
        
        <div>
          <label className="block text-gray-400 text-sm mb-1">CO₂ Offset (kg)</label>
          <input
            type="number"
            value={deltaCO2}
            onChange={(e) => setDeltaCO2(e.target.value)}
            className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2 text-white"
            placeholder="e.g. 400"
          />
        </div>
        
        <div>
          <label className="block text-gray-400 text-sm mb-1">Oracle Private Key (optional)</label>
          <input
            type="password"
            value={oracleKey}
            onChange={(e) => setOracleKey(e.target.value)}
            className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2 text-white"
            placeholder="Using default key if empty"
          />
          <p className="text-gray-500 text-xs mt-1">
            Leave empty to use the key from environment variables
          </p>
        </div>
        
        <button
          onClick={handlePushImpactData}
          disabled={loading || !deltaKwh || !deltaCO2}
          className="w-full bg-gradient-to-r from-custom-purple to-bright-purple text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Processing...
            </span>
          ) : (
            'Push Impact Data'
          )}
        </button>
      </div>
    </div>
  );

  // Transaction History Component
  const TransactionHistoryComponent = () => (
    <div className="glass-card p-4 rounded-xl">
      <h3 className="text-white text-lg font-semibold mb-3">
        Transaction History
        <button 
          onClick={fetchTransactionHistory}
          className="ml-2 bg-gray-700/50 hover:bg-gray-700 rounded-full p-1 transition-colors"
          title="Refresh Transaction History"
        >
          <RefreshCw className={`w-3 h-3 ${loadingTransactions ? 'animate-spin' : ''}`} />
        </button>
      </h3>
      
      {loadingTransactions ? (
        <div className="text-gray-400 text-center py-4 flex items-center justify-center">
          <RefreshCw className="w-4 h-4 animate-spin mr-2" />
          Loading transactions...
        </div>
      ) : transactionHistory.length === 0 ? (
        <div className="text-gray-400 text-center py-4">No transactions yet</div>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
          {transactionHistory.map((tx, index) => (
            <div key={tx.id || index} className="flex items-center justify-between bg-gray-800/50 p-2 rounded-lg">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  tx.status === 'Success' ? 'bg-green-500' : 
                  tx.status === 'Failed' ? 'bg-red-500' : 'bg-yellow-500'
                }`} />
                <span className="text-white text-sm">{tx.type}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-gray-400 text-xs">{tx.time}</span>
                <span className={`text-xs ${
                  tx.status === 'Success' ? 'text-green-400' : 
                  tx.status === 'Failed' ? 'text-red-400' : 'text-yellow-400'
                }`}>{tx.status}</span>
                {tx.txHash && (
                  <a 
                    href={`https://etherscan.io/tx/${tx.txHash}`} 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 text-xs"
                  >
                    View
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Investment Modal

  // Investment Modal
  const InvestModal = () => (
    <div className="fixed inset-0 flex items-center justify-center bg-black/80 z-50">
      <div className="glass-card p-6 rounded-xl w-full max-w-md animate-scale-in">
        <h3 className="text-white text-xl font-semibold mb-4">Invest in Green Bond</h3>
        
        <div className="mb-6">
          <label className="block text-gray-400 text-sm mb-2">Amount to Invest (ETH)</label>
          <input
            type="number"
            value={tokenAmount}
            onChange={(e) => setTokenAmount(e.target.value)}
            className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 text-white text-lg"
            placeholder="0.0"
            min="0.01"
            step="0.01"
          />
          
          <div className="flex justify-between mt-2 text-sm">
            <span className="text-gray-400">Price per token:</span>
            <span className="text-white">{tokenPrice} ETH</span>
          </div>
          
          <div className="flex justify-between mt-1 text-sm">
            <span className="text-gray-400">Tokens to receive:</span>
            <span className="text-white">
              {tokenAmount && tokenPrice && tokenPrice !== '0' 
                ? (parseFloat(tokenAmount) / parseFloat(tokenPrice)).toFixed(2) 
                : '0'} GBOND
            </span>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={() => setShowInvestModal(false)}
            className="flex-1 bg-gray-700 text-white px-4 py-3 rounded-lg font-semibold"
          >
            Cancel
          </button>
          
          <button
            onClick={buyBonds}
            disabled={loading || !tokenAmount}
            className="flex-1 bg-gradient-to-r from-green-600 to-green-500 text-white px-4 py-3 rounded-lg font-semibold disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Processing...
              </span>
            ) : (
              'Confirm Investment'
            )}
          </button>
        </div>
      </div>
    </div>
  );

  // Function to add a new project to Firestore
  const addSampleProject = async () => {
    try {
      // Get latest impact data
      const latestImpactData = await getLatestImpactData();
      
      // Create project with dynamic data
      await addProject({
        name: "Green Bond Project",
        image: "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
        location: "Global",
        description: "Tokenized green bonds funding renewable energy and sustainable development projects.",
        impact: `${latestImpactData.co2Reduced.toLocaleString()} kg CO₂ reduction`,
        progress: impactScore,
        createdAt: new Date()
      });
      showToast("Project added successfully", "success");
    } catch (error) {
      showToast("Failed to add project: " + error.message, "error");
    }
  };

  // Projects component
  const Projects = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Fetch projects from Firestore
    useEffect(() => {
      const fetchProjects = async () => {
        try {
          setLoading(true);
          const projectsData = await getProjects();
          
          // Set projects from Firestore data
          setProjects(projectsData);
          
          // No more hardcoded fallback data
          setLoading(false);
        } catch (err) {
          console.error("Error fetching projects:", err);
          setError("Failed to load projects");
          setLoading(false);
        }
      };
      
      fetchProjects();
    }, []);
    
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="text-red-500 text-center p-4">
          {error}
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {projects.map(project => (
          <div key={project.id} className="glass-card p-6 rounded-2xl hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300">
            <div 
              className="h-40 rounded-xl mb-4 bg-cover bg-center" 
              style={{ backgroundImage: `url(${project.image})` }}
            />
            <h3 className="text-xl font-bold text-white mb-1">{project.name}</h3>
            <p className="text-gray-400 text-sm mb-3 flex items-center">
              <Globe className="w-3 h-3 mr-1" />
              {project.location}
            </p>
            <p className="text-gray-300 text-sm mb-4">{project.description}</p>
            
            <div className="mb-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Progress</span>
                <span className="text-white">{project.progress}%</span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 to-green-400"
                  style={{ width: `${project.progress}%` }}
                />
              </div>
            </div>
            
            <div className="flex items-center text-green-400 text-sm">
              <Leaf className="w-4 h-4 mr-1" />
              {project.impact}
            </div>
          </div>
        ))}
        
        {/* Add Project Button (only for admins in a real app) */}
        {isIssuer && (
          <div 
            onClick={addSampleProject}
            className="glass-card p-6 rounded-2xl flex flex-col justify-center items-center cursor-pointer hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 border-2 border-dashed border-gray-700"
          >
            <PlusCircle className="w-12 h-12 mb-4 text-gray-400" />
            <p className="text-gray-400">Add New Project</p>
          </div>
        )}
      </div>
    );
  };

  // Tab navigation
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'projects', label: 'Projects', icon: Globe },
    { id: 'impact', label: 'Impact', icon: Leaf },
    { id: 'transactions', label: 'Transactions', icon: Database },
    { id: 'timeline', label: 'Login Timeline', icon: Clock }
  ];

  // Conditionally add issuer tab
  if (isIssuer) {
    tabs.push({ id: 'issuer', label: 'Issuer Controls', icon: Lock });
  }

  // Main component render
  return (
    <div className="min-h-screen bg-gray-900 text-white overflow-hidden relative">
      {/* Enhanced particle background */}
      <EnhancedParticleBackground />
      
      {/* Main container */}
      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <div className="mb-4 md:mb-0">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-custom-purple bg-clip-text text-transparent">
              EcoFi Green Bond Platform
            </h1>
            <p className="text-gray-400">Tokenized Green Bonds with Impact-Linked Returns</p>
          </div>
          
          <div className="flex items-center gap-4">
            <NetworkStatus />
            
            {walletConnected ? (
              <WalletStatus />
            ) : (
              <ConnectWalletButton />
            )}
          </div>
        </div>

        {/* Content based on wallet connection */}
        {!walletConnected ? (
          // Not connected state
          <div className="glass-card-3d p-8 rounded-2xl text-center max-w-2xl mx-auto">
            <Sparkles className="w-16 h-16 text-custom-purple mx-auto mb-4" />
            
            <h2 className="text-2xl font-bold mb-2">Welcome to EcoFi Green Bond Platform</h2>
            <p className="text-gray-400 mb-6">
              Connect your wallet to invest in tokenized green bonds and track their environmental impact in real-time.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-800/50 p-4 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-400 mx-auto mb-2" />
                <h3 className="text-white font-semibold">Invest</h3>
                <p className="text-gray-400 text-sm">Purchase tokenized green bonds</p>
              </div>
              
              <div className="bg-gray-800/50 p-4 rounded-lg">
                <Leaf className="w-6 h-6 text-green-400 mx-auto mb-2" />
                <h3 className="text-white font-semibold">Impact</h3>
                <p className="text-gray-400 text-sm">Track environmental metrics</p>
              </div>
              
              <div className="bg-gray-800/50 p-4 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-400 mx-auto mb-2" />
                <h3 className="text-white font-semibold">Returns</h3>
                <p className="text-gray-400 text-sm">Earn milestone-based rewards</p>
              </div>
            </div>
            
            <ConnectWalletButton />
          </div>
        ) : (
          // Connected state
          <div>
            {/* Tab navigation */}
            <div className="glass-card mb-6 p-1 rounded-xl flex overflow-x-auto custom-scrollbar">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium min-w-max ${
                    activeTab === tab.id 
                      ? 'bg-gradient-to-r from-custom-purple to-bright-purple text-white' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
            
            {/* Dashboard tab */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                {/* Top metrics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <MetricsCard 
                    title="Bond Balance" 
                    value={bondBalance} 
                    unit="GBOND" 
                    icon={Award} 
                    color="bg-purple-900/50" 
                  />
                  
                  <MetricsCard 
                    title="Token Price" 
                    value={tokenPrice} 
                    unit="ETH" 
                    icon={DollarSign} 
                    color="bg-green-900/50" 
                  />
                  
                  <MetricsCard 
                    title="Impact Score" 
                    value={impactScore} 
                    unit="%" 
                    icon={Zap} 
                    color="bg-blue-900/50" 
                  />
                  
                  <MetricsCard 
                    title="Energy Generated" 
                    value={cumulativeKwh.toLocaleString()} 
                    unit="kWh" 
                    icon={Flame} 
                    color="bg-orange-900/50" 
                  />
                </div>
                
                {/* Main dashboard content */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-6">
                    <MilestoneProgress />
                    <ImpactMetrics />
                  </div>
                  
                  <div className="space-y-6">
                    <InvestmentCalculator />
                    <TransactionHistoryComponent />
                  </div>
                </div>
              </div>
            )}
            
            {/* Projects tab */}
            {activeTab === 'projects' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white mb-4">Funded Projects</h2>
                <Projects />
              </div>
            )}
            
            {/* Impact tab */}
            {activeTab === 'impact' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white mb-4">Environmental Impact</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ImpactMetrics />
                  
                  <div className="glass-card p-4 rounded-xl">
                    <h3 className="text-white text-lg font-semibold mb-3">Impact Certificates</h3>
                    <p className="text-gray-400 text-sm mb-4">
                      Generate a personalized certificate showing your contribution to environmental impact.
                    </p>
                    
                    <div className="bg-gray-800/50 p-4 rounded-lg mb-4">
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-400">Your Bond Balance:</span>
                        <span className="text-white font-semibold">{bondBalance} GBOND</span>
                      </div>
                      
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-400">Your Impact Contribution:</span>
                        <span className="text-white font-semibold">
                          {Math.round(parseFloat(bondBalance) / (parseFloat(tokensSold) || 1) * environmentalImpact.co2Reduced).toLocaleString()} kg CO₂
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-400">Certificate ID:</span>
                        <span className="text-white font-semibold">
                          ECO-{walletAddress.substring(2, 8).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    
                    <button className="w-full bg-gradient-to-r from-custom-purple to-bright-purple text-white px-4 py-2 rounded-lg font-semibold">
                      Download Impact Certificate
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Transactions tab */}
            {activeTab === 'transactions' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-white mb-4">Transaction History</h2>
                </div>
                
                {/* Transaction History */}
                <TransactionHistoryComponent />
              </div>
            )}
            
            {/* Login Timeline tab */}
            {activeTab === 'timeline' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-white mb-4">Login Timeline</h2>
                </div>
                
                <div className="glass-card p-6 rounded-2xl">
                  <p className="text-gray-300 mb-6">
                    Track when your wallet connects and disconnects from the platform. This timeline shows your historical login activity.
                  </p>
                  <LoginTimeline walletAddress={walletAddress} />
                </div>
              </div>
            )}
            
            {/* Issuer Controls tab (only for issuer) */}
            {activeTab === 'issuer' && isIssuer && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white mb-4">Issuer Controls</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="glass-card p-4 rounded-xl">
                    <h3 className="text-white text-lg font-semibold mb-3">Project Statistics</h3>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-800/50 p-3 rounded-lg">
                        <div className="text-gray-400 text-xs">Total Raised</div>
                        <div className="text-white text-lg font-semibold">{totalRaised} ETH</div>
                      </div>
                      
                      <div className="bg-gray-800/50 p-3 rounded-lg">
                        <div className="text-gray-400 text-xs">Total Released</div>
                        <div className="text-white text-lg font-semibold">{totalReleased} ETH</div>
                      </div>
                      
                      <div className="bg-gray-800/50 p-3 rounded-lg">
                        <div className="text-gray-400 text-xs">Tokens Sold</div>
                        <div className="text-white text-lg font-semibold">{tokensSold} / {capTokens} GBOND</div>
                      </div>
                      
                      <div className="bg-gray-800/50 p-3 rounded-lg">
                        <div className="text-gray-400 text-xs">Investors</div>
                        <div className="text-white text-lg font-semibold">
                          {/* This would need to be tracked on the contract */}
                          {Math.floor(Math.random() * 20) + 1}
                        </div>
                      </div>
                      
                      <div className="bg-gray-800/50 p-3 rounded-lg">
                        <div className="text-gray-400 text-xs">Sale Ends In</div>
                        <div className="text-white text-lg font-semibold">
                          {saleEnd > Date.now() / 1000 
                            ? `${Math.floor((saleEnd - Date.now() / 1000) / 86400)} days` 
                            : 'Ended'}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <OracleSimulator />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Investment modal */}
      {showInvestModal && <InvestModal />}
      
      {/* Toast notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default EcoFiDashboard;