import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { 
  Wallet, CheckCircle, AlertTriangle, RefreshCw, Lock, 
  ChevronRight, Award, Flame, BarChart3, Leaf, Globe, 
  Zap, DollarSign, TrendingUp, Users, Database
} from 'lucide-react';

// Import enhanced particle background
import EnhancedParticleBackground from './EnhancedParticleBackground';

// Import contract utilities
import { 
  initializeProvider, 
  getSigner, 
  getContracts,
  handleContractError,
  verifyHardhatRunning,
  addHardhatNetworkToMetaMask,
  formatContractData,
  pushImpactData
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

const HackathonUI = () => {
  // State for wallet connection
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [wrongNetwork, setWrongNetwork] = useState(false);
  const [hardhatRunning, setHardhatRunning] = useState(null);
  
  // State for contract data
  const [bondBalance, setBondBalance] = useState('0');
  const [impactScore, setImpactScore] = useState(0);
  const [totalRaised, setTotalRaised] = useState('0');
  const [tokenPrice, setTokenPrice] = useState('0');
  const [cumulativeKwh, setCumulativeKwh] = useState(0);
  const [isIssuer, setIsIssuer] = useState(false);

  // State for UI
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showInvestModal, setShowInvestModal] = useState(false);
  const [tokenAmount, setTokenAmount] = useState('');
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Environmental impact metrics (calculated from contract data)
  const [environmentalImpact, setEnvironmentalImpact] = useState({
    co2Reduced: 0,
    treesPlanted: 0,
    energySaved: 0
  });

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
  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Utility function to check MetaMask status
  const checkMetaMaskStatus = () => {
    if (!window.ethereum) {
      showToast('MetaMask is not installed. Please install MetaMask extension.', 'error');
      return false;
    }
    
    if (window.ethereum.isMetaMask !== true) {
      showToast('Please use MetaMask as your wallet provider.', 'error');
      return false;
    }
    
    return true;
  };

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
      
      // Fetch contract data after connecting
      fetchContractData(provider, address);
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
  const fetchContractData = async (providerInstance, address) => {
    if (!providerInstance) return;
    
    try {
      setLoading(true);
      
      // Get contract instances
      const contracts = getContracts(providerInstance);
      const { escrow, bondToken, oracle } = contracts;

      // Create batch of promises to fetch data in parallel
      const [
        price,
        bal,
        sold,
        cap,
        issuerAddr,
        kwh,
        count
      ] = await Promise.all([
        escrow.tokenPrice(),
        bondToken.balanceOf(address),
        escrow.tokensSold(),
        escrow.capTokens(),
        escrow.issuer(),
        oracle.cumulativeKwh(),
        escrow.milestoneCount()
      ]);

      // Set state with retrieved data
      setTokenPrice(ethers.formatEther(price));
      setBondBalance(ethers.formatEther(bal));
      setIsIssuer(issuerAddr.toLowerCase() === address.toLowerCase());
      setCumulativeKwh(Number(kwh));
      
      // Calculate impact score based on milestones
      if (Number(count) > 0) {
        // Fetch the last milestone to use as denominator for impact score
        const lastMilestone = await escrow.milestones(Number(count) - 1);
        const maxThreshold = Number(lastMilestone.threshold);
        const score = Math.min((Number(kwh) / maxThreshold) * 100, 100);
        setImpactScore(Math.round(score));
      }
      
      // Calculate environmental impact metrics based on kWh
      const kwhValue = Number(kwh);
      setEnvironmentalImpact({
        co2Reduced: Math.round(kwhValue * 0.4), // kg CO2 saved (0.4kg per kWh)
        treesPlanted: Math.round(kwhValue * 0.02), // trees equivalent (1 tree = ~50 kWh)
        energySaved: kwhValue // kWh saved
      });

      // If user is the issuer, fetch additional data
      if (issuerAddr.toLowerCase() === address.toLowerCase()) {
        const [raised, released] = await Promise.all([
          escrow.totalRaised(),
          escrow.totalReleased()
        ]);
        
        setTotalRaised(ethers.formatEther(raised));
      }
      
      // Calculate impact score based on kWh
      setImpactScore(Math.min(Number(kwh) / 1000 * 100, 100));

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
      const price = await escrow.tokenPrice();
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
      setTransactionHistory(prev => prev.map(t => 
        t.txHash === tx.hash ? { ...t, status: 'Success' } : t
      ));
      showToast('Purchase successful', 'success');
      setTokenAmount('');
      setShowInvestModal(false);
      
      // Refresh data
      fetchContractData(provider, walletAddress);
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

  // Push impact data (for oracle simulation)
  const pushImpact = async (deltaKwh, deltaCO2, privateKey) => {
    if (!provider || !privateKey || !deltaKwh || !deltaCO2) {
      showToast('Please provide private key, kWh, and CO2 values', 'error');
      return;
    }
    
    setLoading(true);
    
    try {
      // Create oracle wallet from private key
      const oracleSigner = new ethers.Wallet(privateKey, provider);
      
      // Use the utility function to push impact data
      const tx = await pushImpactData(oracleSigner, deltaKwh, deltaCO2);
      
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
      
      // Refresh data
      fetchContractData(provider, walletAddress);
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
                  className="w-full px-4 py-3 pl-10 bg-white bg-opacity-10 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all group-hover:border-purple-500"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-400 font-bold text-xs">BOND</div>
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
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-4 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 disabled:opacity-50 flex items-center justify-center hover:shadow-lg hover:shadow-purple-500/30"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm Investment</span>
                    <ChevronRight className="h-5 w-5 ml-2" />
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

  // Dashboard component
  const Dashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="glass-card p-6 rounded-2xl col-span-2">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center">
          <Award className="mr-2 text-yellow-400 h-5 w-5" />
          <span>Impact Dashboard</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-black bg-opacity-30 p-5 rounded-xl backdrop-blur-md border border-white border-opacity-5 flex flex-col items-center">
            <div className="bg-green-500 bg-opacity-20 p-3 rounded-full mb-3">
              <Leaf className="w-8 h-8 text-green-500" />
            </div>
            <h4 className="text-gray-300 text-sm mb-1">CO₂ Reduced</h4>
            <p className="text-2xl font-bold text-white">{Math.round(cumulativeKwh * 0.4)} kg</p>
          </div>
          
          <div className="bg-black bg-opacity-30 p-5 rounded-xl backdrop-blur-md border border-white border-opacity-5 flex flex-col items-center">
            <div className="bg-blue-500 bg-opacity-20 p-3 rounded-full mb-3">
              <Zap className="w-8 h-8 text-blue-500" />
            </div>
            <h4 className="text-gray-300 text-sm mb-1">Energy Generated</h4>
            <p className="text-2xl font-bold text-white">{cumulativeKwh} kWh</p>
          </div>
          
          <div className="bg-black bg-opacity-30 p-5 rounded-xl backdrop-blur-md border border-white border-opacity-5 flex flex-col items-center">
            <div className="bg-purple-500 bg-opacity-20 p-3 rounded-full mb-3">
              <DollarSign className="w-8 h-8 text-purple-500" />
            </div>
            <h4 className="text-gray-300 text-sm mb-1">Impact Value</h4>
            <p className="text-2xl font-bold text-white">${(cumulativeKwh * 0.12).toFixed(2)}</p>
          </div>
        </div>
        
        <div className="bg-black bg-opacity-30 p-5 rounded-xl backdrop-blur-md border border-white border-opacity-5">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-white font-medium">Impact Score</h4>
            <span className="text-white font-bold">{impactScore.toFixed(0)}%</span>
          </div>
          <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-1000"
              style={{ width: `${impactScore}%` }}
            >
              <div className="absolute top-0 left-0 right-0 bottom-0 bg-white opacity-20 animate-pulse"></div>
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-2">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>
      </div>
      
      <div className="glass-card p-6 rounded-2xl">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center">
          <Wallet className="mr-2 text-purple-400 h-5 w-5" />
          <span>My Portfolio</span>
        </h3>
        <div className="space-y-4">
          <div className="bg-black bg-opacity-30 p-5 rounded-xl backdrop-blur-md border border-white border-opacity-5">
            <div className="flex justify-between items-center mb-1">
              <span className="text-gray-300 text-sm">Bond Balance</span>
              <div className="bg-purple-900 bg-opacity-30 px-2 py-1 rounded-full text-purple-400 text-xs">BOND</div>
            </div>
            <p className="text-2xl font-bold text-white">{bondBalance}</p>
            <p className="text-sm text-gray-400">≈ {(parseFloat(bondBalance) * parseFloat(tokenPrice)).toFixed(4)} ETH</p>
          </div>
          
          <button
            onClick={() => setShowInvestModal(true)}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
          >
            <span>Buy Bonds</span>
            <ChevronRight className="h-5 w-5 ml-2" />
          </button>
          
          <div className="bg-black bg-opacity-30 p-5 rounded-xl backdrop-blur-md border border-white border-opacity-5">
            <h4 className="text-white text-sm mb-3">Price Chart</h4>
            <div className="h-24 flex items-end space-x-1">
              {Array.from({ length: 20 }).map((_, i) => (
                <div 
                  key={i} 
                  className="bg-purple-500 rounded-sm" 
                  style={{ 
                    height: `${20 + Math.sin(i / 3) * 20 + Math.random() * 30}%`,
                    width: '4px'
                  }}
                />
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-2">
              <span>1d</span>
              <span>1w</span>
              <span>1m</span>
              <span>3m</span>
              <span>1y</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Sample project data
  const projectsData = [
    {
      id: 1,
      name: "Solar Farm Alpha",
      image: "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      location: "California, USA",
      description: "Large-scale solar farm generating clean energy for over 10,000 homes.",
      impact: "15,000 tons CO2 reduction",
      progress: 75
    },
    {
      id: 2,
      name: "Wind Energy Project",
      image: "https://images.unsplash.com/photo-1548337138-e87d889cc369?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2074&q=80",
      location: "Scotland, UK",
      description: "Offshore wind farm with 50 turbines providing renewable energy.",
      impact: "20,000 tons CO2 reduction",
      progress: 60
    },
    {
      id: 3,
      name: "Hydro Power Initiative",
      image: "https://images.unsplash.com/photo-1566841911190-83ddc8f5cf3f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      location: "British Columbia, Canada",
      description: "Sustainable hydroelectric power project with minimal environmental impact.",
      impact: "12,500 tons CO2 reduction",
      progress: 90
    }
  ];

  // Projects component
  const Projects = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {projectsData.map(project => (
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
          
          <div className="flex justify-between text-sm text-gray-300 mb-2">
            <span>Funded: ${project.fundedAmount}k</span>
            <span>${project.targetAmount}k target</span>
          </div>
          <div className="w-full h-2 bg-gray-700 rounded-full mb-4">
            <div 
              className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full"
              style={{ width: `${(project.fundedAmount / project.targetAmount) * 100}%` }}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-black bg-opacity-30 p-3 rounded-lg">
              <p className="text-xs text-gray-400">Impact</p>
              <p className="text-white font-medium flex items-center">
                <Leaf className="w-3 h-3 mr-1 text-green-400" />
                {project.impact.toLocaleString()} {project.impactType}
              </p>
            </div>
            <div className="bg-black bg-opacity-30 p-3 rounded-lg">
              <p className="text-xs text-gray-400">ROI</p>
              <p className="text-white font-medium flex items-center">
                <TrendingUp className="w-3 h-3 mr-1 text-purple-400" />
                {project.roi}% Annual
              </p>
            </div>
          </div>
          
          <button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 flex items-center justify-center text-sm">
            <span>View Project</span>
            <ChevronRight className="h-4 w-4 ml-1" />
          </button>
        </div>
      ))}
    </div>
  );

  // Community component
  const Community = () => (
    <div className="glass-card p-6 rounded-2xl">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center">
        <Users className="mr-2 text-blue-400 h-5 w-5" />
        <span>Impact Community</span>
      </h3>
      
      <div className="space-y-6">
        <div className="bg-black bg-opacity-30 p-5 rounded-xl backdrop-blur-md border border-white border-opacity-5">
          <h4 className="text-white font-medium mb-3">Community Leaderboard</h4>
          <div className="space-y-3">
            {[
              { rank: 1, address: '0x7a23...4c56', score: 94, tokens: 500 },
              { rank: 2, address: '0x3f12...9d87', score: 87, tokens: 350 },
              { rank: 3, address: '0xa601...21ef', score: 82, tokens: 320 },
              { rank: 4, address: walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : '0x8b72...11ab', score: 76, tokens: 280 },
              { rank: 5, address: '0x2e09...76bc', score: 68, tokens: 220 },
            ].map((user, i) => (
              <div 
                key={i} 
                className={`flex items-center justify-between p-3 rounded-lg ${user.address.includes(walletAddress?.slice(0, 6) || '') ? 'bg-purple-900 bg-opacity-30 border border-purple-500 border-opacity-30' : 'bg-black bg-opacity-20'}`}
              >
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                    i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-gray-300' : i === 2 ? 'bg-amber-600' : 'bg-gray-700'
                  }`}>
                    {user.rank}
                  </div>
                  <span className="text-white">{user.address}</span>
                </div>
                <div className="text-right">
                  <p className="text-white font-medium">{user.score} pts</p>
                  <p className="text-xs text-gray-400">{user.tokens} BOND</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-black bg-opacity-30 p-5 rounded-xl backdrop-blur-md border border-white border-opacity-5">
          <h4 className="text-white font-medium mb-3">Upcoming Events</h4>
          <div className="space-y-3">
            {[
              { title: "Climate Impact Hackathon", date: "Oct 15-17, 2025", participants: 120 },
              { title: "Green Bond Workshop", date: "Oct 22, 2025", participants: 75 },
              { title: "DeFi for Sustainability", date: "Nov 5, 2025", participants: 90 },
            ].map((event, i) => (
              <div key={i} className="bg-black bg-opacity-20 p-3 rounded-lg">
                <h5 className="text-white font-medium">{event.title}</h5>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-400">{event.date}</span>
                  <span className="text-gray-400">{event.participants} participants</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen animated-gradient-bg">
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
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-r from-purple-600 to-blue-500 p-2 rounded-xl animate-pulse shadow-lg shadow-purple-500/20">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-500">
                EcoFi Hackathon
              </h1>
              <p className="text-gray-300 text-sm">Decentralized Green Finance</p>
            </div>
          </div>
          
          {!walletConnected ? (
            <button
              onClick={connectWallet}
              disabled={loading || connecting}
              className="bg-gradient-to-r from-green-500 to-blue-600 text-white px-6 py-2 rounded-xl font-medium hover:from-green-600 hover:to-blue-700 transition-all duration-200 flex items-center space-x-2 disabled:opacity-50 transform hover:scale-105 shadow-lg shadow-green-500/20"
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
                onClick={() => fetchContractData(provider, walletAddress)}
                className="text-gray-300 hover:text-white transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </header>

      {!walletConnected ? (
        <div className="relative z-10 flex items-center justify-center min-h-[80vh]">
          <div className="text-center max-w-lg">
            <div className="glass-card p-12 rounded-3xl border border-white border-opacity-20 shadow-2xl transform transition-all duration-500 hover:scale-105">
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 w-20 h-20 flex items-center justify-center mx-auto mb-6 rounded-2xl shadow-lg shadow-purple-500/30">
                <Wallet className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">Connect Your Wallet</h2>
              <p className="text-white mb-8">
                Connect your wallet to start investing in green bonds and track your environmental impact.
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
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-xl font-medium transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 transform hover:scale-105 shadow-lg shadow-purple-500/30"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
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
          {/* Tab Navigation */}
          <div className="mb-8 border-b border-white border-opacity-20">
            <div className="flex space-x-2">
              <button 
                onClick={() => setActiveTab('dashboard')}
                className={`px-4 py-2 font-medium rounded-t-lg transition-all duration-200 flex items-center space-x-2 
                  ${activeTab === 'dashboard' ? 'bg-white bg-opacity-10 text-white border-b-2 border-purple-500' : 'text-gray-400 hover:text-white'}`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Dashboard</span>
              </button>
              <button 
                onClick={() => setActiveTab('projects')}
                className={`px-4 py-2 font-medium rounded-t-lg transition-all duration-200 flex items-center space-x-2 
                  ${activeTab === 'projects' ? 'bg-white bg-opacity-10 text-white border-b-2 border-green-500' : 'text-gray-400 hover:text-white'}`}
              >
                <Leaf className="w-4 h-4" />
                <span>Projects</span>
              </button>
              <button 
                onClick={() => setActiveTab('community')}
                className={`px-4 py-2 font-medium rounded-t-lg transition-all duration-200 flex items-center space-x-2 
                  ${activeTab === 'community' ? 'bg-white bg-opacity-10 text-white border-b-2 border-blue-500' : 'text-gray-400 hover:text-white'}`}
              >
                <Users className="w-4 h-4" />
                <span>Community</span>
              </button>
            </div>
          </div>
          
          {/* Tab Content */}
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'projects' && <Projects />}
          {activeTab === 'community' && <Community />}
        </main>
      )}
      
      {/* Investment Modal */}
      <InvestmentModal />
    </div>
  );
};

export default HackathonUI;
