import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { 
  Wallet, CheckCircle, AlertTriangle, RefreshCw, Lock, 
  Award, Flame, BarChart3, Leaf, Globe, 
  Zap, DollarSign, TrendingUp, Database,
  CheckCircle2, Sparkles, Wind, Lightbulb
} from 'lucide-react';

// Import enhanced particle background
import EnhancedParticleBackground from './EnhancedParticleBackground';

// Import contract utilities and artifacts
import { 
  initializeProvider, 
  getSigner, 
  handleContractError,
  verifyHardhatRunning,
  addHardhatNetworkToMetaMask,
  getContracts
} from './contractUtilsEnhanced';

// Import RealTimeDataContext
import { useRealTimeData } from './RealTimeDataProvider';
import BondTokenArtifact from './Backend/artifacts/contracts/BondToken.sol/BondToken.json';

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
  // Get data from our context
  const { 
    loading: dataLoading, 
    error: dataError, 
    contractData, 
    refreshData, 
    buyBonds: contextBuyBonds, 
    submitImpactData 
  } = useRealTimeData();

  // State for wallet and network
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [wrongNetwork, setWrongNetwork] = useState(false);
  const [hardhatRunning, setHardhatRunning] = useState(null);

  // State for impact data submission
  const [deltaKwh, setDeltaKwh] = useState('');
  const [deltaCO2, setDeltaCO2] = useState('');
  const [oracleKey, setOracleKey] = useState('');

  // State for contract data
  const [tokenPrice, setTokenPrice] = useState('0');
  const [bondBalance, setBondBalance] = useState('0');
  const [tokensSold, setTokensSold] = useState('0');
  const [capTokens, setCapTokens] = useState('0');
  const [isIssuer, setIsIssuer] = useState(false);
  const [cumulativeKwh, setCumulativeKwh] = useState('0');
  const [impactScore, setImpactScore] = useState(0);
  const [saleEnd, setSaleEnd] = useState(0);
  const [environmentalImpact, setEnvironmentalImpact] = useState({
    co2Reduced: 0,
    energyGenerated: 0,
    trees: 0,
    plasticRecycled: 0
  });
  const [milestones, setMilestones] = useState([]);
  const [totalRaised, setTotalRaised] = useState('0');
  const [totalReleased, setTotalReleased] = useState('0');

  // State for UI
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showInvestModal, setShowInvestModal] = useState(false);
  const [tokenAmount, setTokenAmount] = useState('');
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [impactMetrics, setImpactMetrics] = useState({
    treesPlanted: 0,
    energySaved: 0,
    waterConserved: 0
  });

  // Check if Hardhat is running when component mounts
  useEffect(() => {
    const checkHardhatRunning = async () => {
      const running = await verifyHardhatRunning();
      setHardhatRunning(running);
    };

    checkHardhatRunning();
  }, []);

  // Update local state from context data
  useEffect(() => {
    if (contractData) {
      setTokenPrice(contractData.tokenPrice || '0');
      setBondBalance(contractData.bondBalance || '0');
      setTokensSold(contractData.tokensSold || '0');
      setCapTokens(contractData.capTokens || '0');
      setIsIssuer(contractData.isIssuer || false);
      setCumulativeKwh(contractData.cumulativeKwh || '0');
      setImpactScore(contractData.impactScore || 0);
      setSaleEnd(contractData.saleEnd || 0);
      
      // Update environmental impact
      setEnvironmentalImpact({
        co2Reduced: contractData.co2Reduced || 0,
        energyGenerated: contractData.energyGenerated || 0,
        trees: contractData.trees || 0,
        plasticRecycled: contractData.plasticRecycled || 0
      });
      
      // Update milestones
      if (contractData.milestones && contractData.milestones.length > 0) {
        setMilestones(contractData.milestones);
      }
      
      // Update escrow data
      if (contractData.escrowData) {
        setTotalRaised(contractData.escrowData.totalRaised || '0');
        setTotalReleased(contractData.escrowData.totalReleased || '0');
      }

      // Calculate impact metrics based on the blockchain data
      const trees = parseFloat(contractData.cumulativeKwh) * 0.012;
      const energy = parseFloat(contractData.cumulativeKwh);
      const water = parseFloat(contractData.cumulativeKwh) * 2.3;
      
      setImpactMetrics({
        treesPlanted: Math.round(trees),
        energySaved: energy.toFixed(2),
        waterConserved: Math.round(water)
      });
    }
  }, [contractData]);

  // Show a toast notification
  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts([...toasts, { id, message, type }]);
    setTimeout(() => {
      setToasts(currentToasts => currentToasts.filter(toast => toast.id !== id));
    }, 3000);
  };

  // Connect wallet
  const connectWallet = async () => {
    try {
      setConnecting(true);
      
      // First check if Hardhat node is running
      const running = await verifyHardhatRunning();
      setHardhatRunning(running);
      
      if (!running) {
        showToast('Hardhat node is not running. Please start it first.', 'error');
        setConnecting(false);
        return;
      }
      
      // Initialize provider
      const { provider: ethProvider, chainId } = await initializeProvider();
      setProvider(ethProvider);
      
      // Check if we're on Hardhat network
      if (chainId !== 31337) {
        setWrongNetwork(true);
        setConnecting(false);
        showToast('Please connect to Hardhat network', 'error');
        return;
      }
      
      setWrongNetwork(false);
      
      // Get signer and address
      const ethSigner = await getSigner(ethProvider);
      setSigner(ethSigner);
      
      if (ethSigner) {
        const address = await ethSigner.getAddress();
        setWalletAddress(address);
        setWalletConnected(true);
        showToast('Wallet connected successfully!', 'success');
        
        // Refresh data now that we're connected
        if (refreshData) {
          refreshData(ethSigner);
        }
      }
    } catch (error) {
      console.error("Connection error:", error);
      showToast(handleContractError(error), 'error');
    } finally {
      setConnecting(false);
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setWalletConnected(false);
    setWalletAddress('');
    setSigner(null);
    showToast('Wallet disconnected', 'info');
  };

  // Switch to Hardhat network
  const switchToHardhat = async () => {
    try {
      await addHardhatNetworkToMetaMask();
      showToast('Please approve adding Hardhat network in MetaMask', 'info');
    } catch (error) {
      console.error("Network switch error:", error);
      showToast(handleContractError(error), 'error');
    }
  };

  // Format large numbers for display
  const formatNumber = (num, decimals = 2) => {
    if (!num) return '0';
    const value = parseFloat(num);
    if (isNaN(value)) return '0';
    
    return value.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  // Format eth values
  const formatEth = (wei) => {
    if (!wei) return '0';
    try {
      return parseFloat(ethers.formatEther(wei)).toFixed(4);
    } catch (e) {
      console.error("Format error:", e);
      return '0';
    }
  };

  // Format timestamp to readable date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };
  
  // Time remaining until sale end
  const getTimeRemaining = () => {
    if (!saleEnd) return 'N/A';
    
    const now = Math.floor(Date.now() / 1000);
    const timeLeft = Number(saleEnd) - now;
    
    if (timeLeft <= 0) return 'Sale Ended';
    
    const days = Math.floor(timeLeft / (24 * 60 * 60));
    const hours = Math.floor((timeLeft % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((timeLeft % (60 * 60)) / 60);
    
    return `${days}d ${hours}h ${minutes}m`;
  };

  // Calculate percentage of tokens sold
  const getPercentageSold = () => {
    if (!tokensSold || !capTokens || capTokens === '0') return 0;
    try {
      return (parseFloat(tokensSold) / parseFloat(capTokens) * 100).toFixed(1);
    } catch (e) {
      return 0;
    }
  };

  // Calculate percentage of funds released
  const getPercentageReleased = () => {
    if (!totalReleased || !totalRaised || totalRaised === '0') return 0;
    try {
      const released = parseFloat(ethers.formatEther(totalReleased));
      const raised = parseFloat(ethers.formatEther(totalRaised));
      return (released / raised * 100).toFixed(1);
    } catch (e) {
      return 0;
    }
  };

  // Function to handle buying bonds through our real-time data context
  const buyBonds = async () => {
    if (!signer || !tokenAmount || parseFloat(tokenAmount) <= 0) {
      showToast('Please enter a valid amount', 'error');
      return;
    }
    
    setLoading(true);
    
    try {
      // Calculate the cost in ETH based on token price and amount
      const cost = (parseFloat(tokenAmount) * parseFloat(ethers.formatEther(tokenPrice))).toString();
      const ethAmount = ethers.parseEther(cost);
      
      // Call the buy bonds function from our context
      await contextBuyBonds(tokenAmount, ethAmount);
      
      // Update transaction history
      setTransactionHistory(prev => [...prev, {
        type: 'Buy Bonds',
        status: 'Success',
        amount: `${tokenAmount} GREEN`,
        cost: `${cost} ETH`,
        time: new Date().toLocaleTimeString()
      }]);
      
      showToast(`Successfully purchased ${tokenAmount} GREEN bonds!`, 'success');
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
  const pushImpactData = async () => {
    if (!signer || !deltaKwh || !deltaCO2 || !oracleKey) {
      showToast('Please fill all fields', 'error');
      return;
    }
    
    setLoading(true);
    
    try {
      await submitImpactData(deltaKwh, deltaCO2, oracleKey);
      
      // Update transaction history
      setTransactionHistory(prev => [...prev, {
        type: 'Submit Impact',
        status: 'Success',
        amount: `${deltaKwh} kWh, ${deltaCO2} CO2`,
        time: new Date().toLocaleTimeString()
      }]);
      
      showToast('Impact data submitted successfully!', 'success');
      
      // Clear form
      setDeltaKwh('');
      setDeltaCO2('');
      setOracleKey('');
    } catch (error) {
      console.error('Impact submission failed:', error);
      setTransactionHistory(prev => [...prev, {
        type: 'Submit Impact',
        status: 'Failed',
        time: new Date().toLocaleTimeString()
      }]);
      showToast(handleContractError(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  // Dashboard cards with enhanced visuals
  const DashboardCard = ({ icon, title, value, subtext, color }) => {
    const Icon = icon;
    return (
      <div className={`bg-gradient-to-br from-${color}-50 to-${color}-100 p-6 rounded-xl shadow-lg border border-${color}-200 relative overflow-hidden transition-all duration-300 hover:shadow-xl`}>
        <div className="absolute -right-4 -top-4 opacity-10">
          <Icon size={80} className={`text-${color}-900`} />
        </div>
        <div className="flex items-center mb-4">
          <Icon size={24} className={`text-${color}-600 mr-3`} />
          <h3 className="text-gray-700 font-medium">{title}</h3>
        </div>
        <p className="text-2xl font-bold text-gray-800 mb-1">{value}</p>
        <p className="text-sm text-gray-600">{subtext}</p>
      </div>
    );
  };
  
  // Chart component placeholder
  const Chart = ({ data, title, type }) => {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 h-full">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
        <div className="h-48 bg-gray-100 rounded-lg flex items-center justify-center">
          <BarChart3 size={36} className="text-indigo-400" />
          <p className="ml-2 text-gray-500">Interactive {type} chart would appear here</p>
        </div>
      </div>
    );
  };
  
  // Transaction table component
  const TransactionTable = ({ transactions }) => {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Transactions</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {transactions.length > 0 ? (
                transactions.map((tx, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3 text-sm text-gray-800">{tx.type}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        tx.status === 'Success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {tx.status === 'Success' ? <CheckCircle size={12} className="mr-1" /> : <AlertTriangle size={12} className="mr-1" />}
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800">{tx.amount || 'N/A'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{tx.time}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-4 py-3 text-sm text-gray-500 text-center">No transactions yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };
  
  // Enhanced milestone component
  const MilestoneCard = ({ milestone, index }) => {
    const colors = ['emerald', 'blue', 'indigo', 'purple', 'pink'];
    const color = colors[index % colors.length];
    const achieved = milestone.achieved || false;
    
    return (
      <div className={`bg-white rounded-xl shadow-md p-6 border-l-4 border-${color}-500 relative ${
        achieved ? 'bg-gradient-to-br from-white to-green-50' : ''
      }`}>
        {achieved && (
          <div className="absolute top-3 right-3">
            <CheckCircle2 size={20} className="text-green-500" />
          </div>
        )}
        <h4 className="text-lg font-semibold text-gray-800 mb-2">{milestone.title}</h4>
        <p className="text-sm text-gray-600 mb-3">{milestone.description}</p>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Target: {milestone.target} kWh</span>
          <span className={`text-sm font-medium ${achieved ? 'text-green-600' : 'text-gray-500'}`}>
            {achieved ? 'Achieved' : 'In Progress'}
          </span>
        </div>
      </div>
    );
  };
  
  // Environmental impact card with icon
  const ImpactCard = ({ icon, title, value, unit, color }) => {
    const Icon = icon;
    
    return (
      <div className={`flex items-center p-4 bg-${color}-50 rounded-lg shadow-sm border border-${color}-100`}>
        <div className={`p-3 rounded-full bg-${color}-100 mr-4`}>
          <Icon size={24} className={`text-${color}-600`} />
        </div>
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-xl font-bold text-gray-800">
            {value} <span className="text-sm font-normal text-gray-600">{unit}</span>
          </p>
        </div>
      </div>
    );
  };

  // Main content component based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-8">
            {/* Status banner */}
            <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 shadow-sm">
              <div className="flex flex-wrap items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Database size={20} className="text-blue-500" />
                  <span className="font-medium text-gray-800">
                    Blockchain Status: 
                    {hardhatRunning === null ? (
                      <span className="ml-2 text-gray-500">Checking...</span>
                    ) : hardhatRunning ? (
                      <span className="ml-2 text-green-600">Hardhat Running</span>
                    ) : (
                      <span className="ml-2 text-red-600">Hardhat Not Running</span>
                    )}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                  <Wallet size={20} className="text-indigo-500" />
                  <span className="font-medium text-gray-800">Wallet: {walletConnected ? (
                    <span className="text-green-600">Connected</span>
                  ) : (
                    <span className="text-red-600">Not Connected</span>
                  )}</span>
                </div>
                
                {wrongNetwork && (
                  <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                    <AlertTriangle size={20} className="text-amber-500" />
                    <span className="text-amber-600 font-medium">Wrong Network</span>
                    <button 
                      onClick={switchToHardhat}
                      className="ml-2 px-3 py-1 text-xs bg-amber-500 text-white rounded hover:bg-amber-600 transition"
                    >
                      Switch
                    </button>
                  </div>
                )}
                
                <div className="w-full sm:w-auto mt-3 sm:mt-0">
                  {!walletConnected ? (
                    <button
                      onClick={connectWallet}
                      disabled={connecting || !hardhatRunning}
                      className={`px-4 py-2 rounded-lg font-medium flex items-center ${
                        connecting || !hardhatRunning ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                      }`}
                    >
                      {connecting ? <RefreshCw size={16} className="mr-2 animate-spin" /> : <Wallet size={16} className="mr-2" />}
                      {connecting ? 'Connecting...' : 'Connect Wallet'}
                    </button>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-600 text-sm truncate max-w-[120px] sm:max-w-xs">
                        {walletAddress}
                      </span>
                      <button
                        onClick={disconnectWallet}
                        className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
                      >
                        Disconnect
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Main dashboard cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <DashboardCard 
                icon={Leaf} 
                title="Bond Balance" 
                value={`${formatNumber(bondBalance)} GREEN`} 
                subtext="Your green bond tokens" 
                color="emerald"
              />
              <DashboardCard 
                icon={DollarSign} 
                title="Token Price" 
                value={`${formatEth(tokenPrice)} ETH`} 
                subtext="Current bond token price" 
                color="blue"
              />
              <DashboardCard 
                icon={Globe} 
                title="Impact Score" 
                value={impactScore.toFixed(2)} 
                subtext="Current environmental impact" 
                color="indigo"
              />
              <DashboardCard 
                icon={TrendingUp} 
                title="Time Remaining" 
                value={getTimeRemaining()} 
                subtext="Until sale ends" 
                color="purple"
              />
            </div>
            
            {/* Sale progress and charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Sale Progress</h3>
                  <span className="text-sm text-gray-500">
                    {formatNumber(tokensSold)} / {formatNumber(capTokens)} GREEN
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2.5 rounded-full" 
                    style={{ width: `${getPercentageSold()}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>{getPercentageSold()}% Sold</span>
                  <span>{formatEth(totalRaised)} ETH Raised</span>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Funds Released</h3>
                  <span className="text-sm text-gray-500">
                    {formatEth(totalReleased)} / {formatEth(totalRaised)} ETH
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-emerald-600 h-2.5 rounded-full" 
                    style={{ width: `${getPercentageReleased()}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>{getPercentageReleased()}% Released</span>
                  <span>Based on impact metrics</span>
                </div>
              </div>
            </div>
            
            {/* Environmental impact metrics */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Environmental Impact</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <ImpactCard
                  icon={Leaf}
                  title="CO₂ Reduced"
                  value={formatNumber(environmentalImpact.co2Reduced)}
                  unit="tons"
                  color="emerald"
                />
                <ImpactCard
                  icon={Zap}
                  title="Clean Energy"
                  value={formatNumber(cumulativeKwh)}
                  unit="kWh"
                  color="amber"
                />
                <ImpactCard
                  icon={Sparkles}
                  title="Trees Equivalent"
                  value={formatNumber(impactMetrics.treesPlanted, 0)}
                  unit="trees"
                  color="green"
                />
                <ImpactCard
                  icon={Wind}
                  title="Water Conserved"
                  value={formatNumber(impactMetrics.waterConserved, 0)}
                  unit="gallons"
                  color="blue"
                />
              </div>
            </div>
            
            {/* Charts and analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Chart 
                title="Energy Production Over Time" 
                type="line"
                data={[]} // This would be real data in a production app
              />
              <Chart 
                title="Impact Metrics Breakdown" 
                type="pie"
                data={[]} // This would be real data in a production app
              />
            </div>
            
            {/* Project milestones */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Project Milestones</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {milestones.length > 0 ? (
                  milestones.map((milestone, index) => (
                    <MilestoneCard key={index} milestone={milestone} index={index} />
                  ))
                ) : (
                  <div className="col-span-full text-center py-8 text-gray-500">
                    <Lightbulb size={32} className="mx-auto mb-2 text-gray-400" />
                    <p>No milestones have been defined yet.</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Transactions */}
            <TransactionTable transactions={transactionHistory} />
            
            {/* Action buttons */}
            <div className="flex flex-wrap gap-4 justify-center sm:justify-start">
              <button
                onClick={() => setShowInvestModal(true)}
                disabled={!walletConnected || loading}
                className={`px-6 py-3 rounded-lg font-medium flex items-center shadow-md ${
                  !walletConnected || loading ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700'
                }`}
              >
                <DollarSign size={18} className="mr-2" />
                Invest in Green Bonds
              </button>
              
              {isIssuer && (
                <button
                  onClick={() => setActiveTab('oracle')}
                  disabled={!walletConnected || loading}
                  className={`px-6 py-3 rounded-lg font-medium flex items-center shadow-md ${
                    !walletConnected || loading ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700'
                  }`}
                >
                  <Database size={18} className="mr-2" />
                  Submit Impact Data
                </button>
              )}
              
              <button
                onClick={() => refreshData && refreshData(signer)}
                disabled={!walletConnected || dataLoading}
                className={`px-6 py-3 rounded-lg font-medium flex items-center shadow-md ${
                  !walletConnected || dataLoading ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                <RefreshCw size={18} className={`mr-2 ${dataLoading ? 'animate-spin' : ''}`} />
                Refresh Data
              </button>
            </div>
          </div>
        );
        
      case 'oracle':
        return (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">Oracle Data Submission</h3>
            <p className="text-gray-600 mb-6">
              As a project issuer, you can submit verified impact data that will trigger fund releases based on achieved milestones.
            </p>
            
            <div className="space-y-4 max-w-md mx-auto">
              <div>
                <label htmlFor="deltaKwh" className="block text-sm font-medium text-gray-700 mb-1">
                  Energy Generated (kWh)
                </label>
                <input
                  id="deltaKwh"
                  type="number"
                  value={deltaKwh}
                  onChange={(e) => setDeltaKwh(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter kWh generated"
                />
              </div>
              
              <div>
                <label htmlFor="deltaCO2" className="block text-sm font-medium text-gray-700 mb-1">
                  CO₂ Reduced (tons)
                </label>
                <input
                  id="deltaCO2"
                  type="number"
                  value={deltaCO2}
                  onChange={(e) => setDeltaCO2(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter CO₂ reduced"
                />
              </div>
              
              <div>
                <label htmlFor="oracleKey" className="block text-sm font-medium text-gray-700 mb-1">
                  Oracle Verification Key
                </label>
                <input
                  id="oracleKey"
                  type="text"
                  value={oracleKey}
                  onChange={(e) => setOracleKey(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter verification key"
                />
              </div>
              
              <div className="pt-4">
                <button
                  onClick={pushImpactData}
                  disabled={!walletConnected || loading || !isIssuer}
                  className={`w-full px-6 py-3 rounded-lg font-medium flex items-center justify-center ${
                    !walletConnected || loading || !isIssuer 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700'
                  }`}
                >
                  {loading ? <RefreshCw size={18} className="mr-2 animate-spin" /> : <Database size={18} className="mr-2" />}
                  {loading ? 'Submitting...' : 'Submit Impact Data'}
                </button>
              </div>
              
              <div className="pt-2 text-center">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          </div>
        );
        
      default:
        return <div>Page not found</div>;
    }
  };

  // Investment modal
  const renderInvestModal = () => {
    if (!showInvestModal) return null;
    
    const calculateCost = () => {
      if (!tokenAmount || !tokenPrice) return '0';
      return (parseFloat(tokenAmount) * parseFloat(ethers.formatEther(tokenPrice))).toFixed(6);
    };
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative">
          <button
            onClick={() => setShowInvestModal(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
          
          <h3 className="text-xl font-semibold text-gray-800 mb-6">Invest in Green Bonds</h3>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="tokenAmount" className="block text-sm font-medium text-gray-700 mb-1">
                Amount of GREEN Tokens
              </label>
              <input
                id="tokenAmount"
                type="number"
                value={tokenAmount}
                onChange={(e) => setTokenAmount(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter amount to purchase"
              />
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Price per token:</span>
                <span className="text-sm font-medium">{formatEth(tokenPrice)} ETH</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Tokens to purchase:</span>
                <span className="text-sm font-medium">{tokenAmount || '0'} GREEN</span>
              </div>
              <div className="border-t border-gray-200 pt-2 mt-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-800">Total cost:</span>
                  <span className="text-sm font-bold">{calculateCost()} ETH</span>
                </div>
              </div>
            </div>
            
            <button
              onClick={buyBonds}
              disabled={loading || !tokenAmount || parseFloat(tokenAmount) <= 0}
              className={`w-full px-6 py-3 rounded-lg font-medium flex items-center justify-center mt-2 ${
                loading || !tokenAmount || parseFloat(tokenAmount) <= 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700'
              }`}
            >
              {loading ? <RefreshCw size={18} className="mr-2 animate-spin" /> : <DollarSign size={18} className="mr-2" />}
              {loading ? 'Processing...' : 'Confirm Purchase'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      {/* Enhanced particle background */}
      <div className="absolute inset-0 z-0">
        <EnhancedParticleBackground />
      </div>
      
      {/* Toast notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => setToasts(toasts.filter(t => t.id !== toast.id))}
          />
        ))}
      </div>
      
      {/* Main content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="bg-white shadow-md py-4">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-indigo-800 flex items-center">
                <Leaf size={24} className="mr-2 text-green-500" />
                EcoFi Green Bonds
              </h1>
              
              <nav className="hidden md:flex space-x-1">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`px-4 py-2 rounded-lg ${
                    activeTab === 'dashboard' 
                      ? 'bg-indigo-100 text-indigo-800 font-medium' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Dashboard
                </button>
                
                {isIssuer && (
                  <button
                    onClick={() => setActiveTab('oracle')}
                    className={`px-4 py-2 rounded-lg ${
                      activeTab === 'oracle' 
                        ? 'bg-indigo-100 text-indigo-800 font-medium' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Oracle
                  </button>
                )}
              </nav>
              
              <div className="flex items-center space-x-2">
                {walletConnected ? (
                  <div className="hidden sm:flex items-center bg-gray-100 rounded-full px-4 py-1">
                    <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                    <span className="text-sm text-gray-700 font-medium truncate max-w-[100px] md:max-w-[140px]">
                      {walletAddress}
                    </span>
                  </div>
                ) : (
                  <div className="hidden sm:flex items-center">
                    <Lock size={16} className="text-gray-400 mr-1" />
                    <span className="text-sm text-gray-500">Not Connected</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
        
        {/* Main content area */}
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {dataError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-start">
              <AlertTriangle size={20} className="mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Error loading data</p>
                <p className="text-sm">{dataError}</p>
              </div>
            </div>
          )}
          
          {renderContent()}
        </main>
        
        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 py-6 mt-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="mb-4 md:mb-0">
                <p className="text-gray-600 text-sm">
                  © 2023 EcoFi Green Bonds Platform
                </p>
              </div>
              
              <div className="flex space-x-6">
                <a href="#" className="text-gray-500 hover:text-indigo-600">
                  About
                </a>
                <a href="#" className="text-gray-500 hover:text-indigo-600">
                  Documentation
                </a>
                <a href="#" className="text-gray-500 hover:text-indigo-600">
                  GitHub
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
      
      {/* Investment modal */}
      {renderInvestModal()}
    </div>
  );
};

export default EcoFiDashboard;