import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { 
  Wallet, CheckCircle, AlertTriangle, RefreshCw, Lock, 
  Award, Flame, BarChart3, Leaf, Globe, 
  Zap, DollarSign, TrendingUp, Database,
  CheckCircle2, Sparkles, Wind, Lightbulb,
  Info, ChevronRight, ChevronLeft, X,
  Boxes, Activity, CreditCard, Waves
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
  pushImpactData
} from './contractUtils';

// Enhanced Toast notification component
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const getIcon = () => {
    switch (type) {
      case 'error': return <AlertTriangle className="h-5 w-5 mr-2" />;
      case 'success': return <CheckCircle className="h-5 w-5 mr-2" />;
      case 'info': return <Database className="h-5 w-5 mr-2" />;
      default: return <Database className="h-5 w-5 mr-2" />;
    }
  };

  const bgGradient = type === 'error' 
    ? 'from-red-500 to-red-600' 
    : type === 'success' 
    ? 'from-green-500 to-green-600' 
    : 'from-blue-500 to-blue-600';
  
  return (
    <div className={`fixed top-4 right-4 bg-gradient-to-r ${bgGradient} text-white px-6 py-4 rounded-lg shadow-xl z-50 flex items-center min-w-[300px] backdrop-blur-sm border border-white/10 animate-fade-in`}>
      {getIcon()}
      <span className="font-inter">{message}</span>
    </div>
  );
};

// Glass Card component for premium UI
const GlassCard = ({ children, className, animated = false, accent = false }) => {
  return (
    <div className={`relative bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6 shadow-xl overflow-hidden ${className}`}>
      {animated && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -inset-[10px] opacity-20 bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 animate-gradient-shift"></div>
        </div>
      )}
      {accent && (
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-blue-500"></div>
      )}
      {children}
    </div>
  );
};

// Section Title component
const SectionTitle = ({ icon, title, subtitle }) => {
  return (
    <div className="mb-6">
      <div className="flex items-center space-x-3 mb-2">
        {icon && <span className="text-green-400">{icon}</span>}
        <h2 className="text-2xl font-montserrat font-bold text-white">{title}</h2>
      </div>
      {subtitle && <p className="text-white/60 font-inter ml-9">{subtitle}</p>}
    </div>
  );
};

// Enhanced Button component
const Button = ({ 
  children, 
  onClick, 
  className, 
  variant = 'primary', 
  size = 'md',
  icon,
  loading = false,
  disabled = false 
}) => {
  const baseClasses = "flex items-center justify-center font-montserrat font-semibold rounded-lg transition-all duration-300";
  
  const variantClasses = {
    primary: "bg-gradient-to-r from-green-500 to-blue-500 text-white hover:shadow-lg hover:shadow-green-500/20",
    secondary: "bg-white/10 text-white hover:bg-white/15",
    outline: "border border-white/20 text-white hover:bg-white/5",
    danger: "bg-gradient-to-r from-red-500 to-red-600 text-white hover:shadow-lg hover:shadow-red-500/20"
  };
  
  const sizeClasses = {
    sm: "text-sm px-3 py-1.5",
    md: "px-4 py-2",
    lg: "text-lg px-5 py-3"
  };
  
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${baseClasses} 
        ${variantClasses[variant]} 
        ${sizeClasses[size]} 
        ${loading || disabled ? 'opacity-70 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      {loading ? (
        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
      ) : icon ? (
        <span className="mr-2">{icon}</span>
      ) : null}
      {children}
    </button>
  );
};

// Onboarding Component
const Onboarding = ({ onComplete, isOpen = true }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [visible, setVisible] = useState(isOpen);
  
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('ecofi_hasSeenOnboarding');
    if (hasSeenOnboarding) {
      setVisible(false);
    }
  }, []);
  
  const completeOnboarding = () => {
    localStorage.setItem('ecofi_hasSeenOnboarding', 'true');
    setVisible(false);
    if (onComplete) onComplete();
  };
  
  const steps = [
    {
      title: 'Welcome to EcoFi Green Bonds',
      content: (
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="h-24 w-24 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center">
              <Leaf className="h-12 w-12 text-white" />
            </div>
          </div>
          <p className="text-white/80 font-inter mb-4">
            EcoFi is a tokenized green bond platform that allows you to invest in sustainable energy projects while earning returns based on real environmental impact.
          </p>
          <p className="text-white/80 font-inter">
            This quick tour will help you understand how to use the platform and get the most out of your green investments.
          </p>
        </div>
      ),
      icon: <Info />
    },
    {
      title: 'Connect Your Wallet',
      content: (
        <div>
          <div className="flex justify-center mb-6">
            <div className="h-20 w-20 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center">
              <Wallet className="h-10 w-10 text-white" />
            </div>
          </div>
          <p className="text-white/80 font-inter mb-4">
            You'll need a Web3 wallet like MetaMask to interact with the platform. Click the "Connect Wallet" button to get started.
          </p>
          <div className="bg-black/20 p-4 rounded-lg mb-4">
            <h4 className="font-montserrat font-semibold text-white mb-2">Quick Tips:</h4>
            <ul className="list-disc list-inside text-white/80 font-inter text-sm space-y-2">
              <li>Make sure you're connected to the correct network (Localhost:31337 for testing)</li>
              <li>Keep your private keys secure at all times</li>
              <li>Never share your seed phrase with anyone</li>
            </ul>
          </div>
        </div>
      ),
      icon: <Wallet />
    }
  ];
  
  if (!visible) return null;
  
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center px-4">
      <div className="w-full max-w-2xl bg-gradient-to-br from-slate-900 to-slate-900/90 rounded-xl shadow-2xl border border-white/10 overflow-hidden">
        <div className="h-1.5 bg-white/10 w-full">
          <div 
            className="h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          ></div>
        </div>
        
        <div className="flex justify-between items-center p-6 border-b border-white/10">
          <h2 className="text-xl font-montserrat font-bold text-white flex items-center">
            {steps[currentStep].icon && (
              <span className="mr-2 text-green-400">{steps[currentStep].icon}</span>
            )}
            {steps[currentStep].title}
          </h2>
          
          <button
            onClick={completeOnboarding}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-8">
          {steps[currentStep].content}
        </div>
        
        <div className="px-8 py-4 bg-black/20 flex justify-between">
          <button
            onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
            disabled={currentStep === 0}
            className={`flex items-center text-white font-montserrat font-semibold py-2 px-4 rounded-lg transition-all ${
              currentStep === 0 
                ? 'opacity-50 cursor-not-allowed bg-white/10' 
                : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back
          </button>
          
          <div className="flex space-x-1 items-center">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={`w-2 h-2 rounded-full ${
                  idx === currentStep ? 'bg-green-400' : 'bg-white/20'
                }`}
              ></div>
            ))}
          </div>
          
          <button
            onClick={() => {
              if (currentStep === steps.length - 1) {
                completeOnboarding();
              } else {
                setCurrentStep(prev => Math.min(steps.length - 1, prev + 1));
              }
            }}
            className="flex items-center bg-gradient-to-r from-green-500 to-blue-500 text-white font-montserrat font-semibold py-2 px-4 rounded-lg hover:opacity-90 transition-all"
          >
            {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
            <ChevronRight className="ml-1 h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Dashboard Component
const UltimateEcoFiDashboard = () => {
  // State for wallet connection
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [wrongNetwork, setWrongNetwork] = useState(false);
  const [hardhatRunning, setHardhatRunning] = useState(null);
  
  // State for contract data
  const [contracts, setContracts] = useState(null);
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

  // State for investment
  const [investAmount, setInvestAmount] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('0');
  const [isInvesting, setIsInvesting] = useState(false);

  // State for impact data
  const [deltaKwh, setDeltaKwh] = useState('');
  const [deltaCO2, setDeltaCO2] = useState('');
  const [oracleKey, setOracleKey] = useState('');
  const [isUpdatingOracle, setIsUpdatingOracle] = useState(false);
  
  // UI state
  const [activeTab, setActiveTab] = useState('investor');
  const [toasts, setToasts] = useState([]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  
  // Environmental impact metrics
  const [environmentalImpact, setEnvironmentalImpact] = useState({
    co2Reduced: 0,
    treesPlanted: 0,
    energySaved: 0,
    waterConserved: 0
  });

  // Toast notification helper
  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 3000);
  }, []);

  // Check if Hardhat is running
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

  // Connect wallet
  const connectWallet = async () => {
    try {
      setLoadingData(true);
      const initProvider = await initializeProvider();
      setProvider(initProvider);
      
      const sig = await getSigner(initProvider);
      setSigner(sig);
      
      const address = await sig.getAddress();
      setWalletAddress(address);
      setWalletConnected(true);
      
      // Check network
      const network = await initProvider.getNetwork();
      if (network.chainId !== 31337n) {
        setWrongNetwork(true);
        showToast('Wrong network detected. Please connect to Localhost:31337', 'error');
      } else {
        setWrongNetwork(false);
        
        // Initialize contracts
        const contractsData = await getContracts(sig);
        setContracts(contractsData);
        
        // Load data
        await loadContractData(contractsData, address);
      }
      
      showToast('Wallet connected successfully!', 'success');
    } catch (error) {
      console.error('Error connecting wallet:', error);
      showToast('Failed to connect wallet. ' + error.message, 'error');
    } finally {
      setLoadingData(false);
    }
  };

  // Switch to Hardhat network
  const switchToHardhat = async () => {
    try {
      await addHardhatNetworkToMetaMask();
      showToast('Please reload the page after switching networks', 'info');
    } catch (error) {
      console.error('Error switching network:', error);
      showToast('Failed to switch network. ' + error.message, 'error');
    }
  };

  // Load contract data
  const loadContractData = async (contractsData, address) => {
    if (!contractsData) return;
    
    try {
      setLoadingData(true);
      const { escrow, token, oracle } = contractsData;
      
      // Get token balance
      const balance = await token.balanceOf(address);
      setBondBalance(ethers.formatEther(balance));
      
      // Get escrow data
      const [
        price,
        sold,
        cap,
        raised,
        released,
        end,
        issuer
      ] = await Promise.all([
        escrow.tokenPrice(),
        escrow.tokensSold(),
        escrow.capTokens(),
        escrow.totalRaised(),
        escrow.totalReleased(),
        escrow.saleEnd(),
        escrow.issuer()
      ]);
      
      setTokenPrice(ethers.formatEther(price));
      setTokensSold(ethers.formatEther(sold));
      setCapTokens(ethers.formatEther(cap));
      setTotalRaised(ethers.formatEther(raised));
      setTotalReleased(ethers.formatEther(released));
      setSaleEnd(Number(end));
      setIsIssuer(issuer.toLowerCase() === address.toLowerCase());
      
      // Get oracle data
      const kwh = await oracle.cumulativeKwh();
      setCumulativeKwh(Number(kwh));
      
      // Calculate environmental impact
      const co2PerKwh = 0.4;
      const treesPerTonCO2 = 50;
      const co2Reduced = Number(kwh) * co2PerKwh / 1000;
      
      setEnvironmentalImpact({
        co2Reduced,
        treesPlanted: Math.round(co2Reduced * treesPerTonCO2),
        energySaved: Number(kwh),
        waterConserved: Number(kwh) * 100
      });
      
      // Get milestones
      const milestonesData = [];
      let i = 0;
      while (true) {
        try {
          const milestone = await escrow.milestones(i);
          milestonesData.push({
            id: i,
            threshold: Number(milestone.threshold),
            achieved: milestone.achieved,
            releaseBps: Number(milestone.releaseBps)
          });
          i++;
        } catch (error) {
          break;
        }
      }
      setMilestones(milestonesData);
      
    } catch (error) {
      console.error('Error loading contract data:', error);
      showToast('Failed to load contract data. ' + error.message, 'error');
    } finally {
      setLoadingData(false);
    }
  };

  // Calculate investment cost
  useEffect(() => {
    const calculateCost = async () => {
      if (!contracts || !investAmount || isNaN(parseFloat(investAmount))) {
        setEstimatedCost('0');
        return;
      }
      
      try {
        const { escrow } = contracts;
        const price = await escrow.tokenPrice();
        const cost = ethers.parseEther(investAmount) * price / ethers.parseEther('1');
        setEstimatedCost(ethers.formatEther(cost));
      } catch (error) {
        console.error('Error calculating cost:', error);
      }
    };
    
    calculateCost();
  }, [investAmount, contracts]);

  // Invest in bonds
  const invest = async () => {
    if (!contracts || !investAmount || isNaN(parseFloat(investAmount))) {
      showToast('Please enter a valid amount', 'error');
      return;
    }
    
    try {
      setIsInvesting(true);
      const { escrow } = contracts;
      
      const tokens = ethers.parseEther(investAmount);
      const value = ethers.parseEther(estimatedCost);
      
      const tx = await escrow.invest(tokens, { value });
      showToast('Investment transaction submitted. Please wait for confirmation.', 'info');
      
      await tx.wait();
      showToast('Investment successful!', 'success');
      
      await loadContractData(contracts, walletAddress);
      setInvestAmount('');
    } catch (error) {
      console.error('Error investing:', error);
      showToast('Investment failed. ' + error.message, 'error');
    } finally {
      setIsInvesting(false);
    }
  };

  // Push impact data to oracle
  const pushImpact = async () => {
    if (!contracts || !deltaKwh || !deltaCO2) {
      showToast('Please enter valid impact data', 'error');
      return;
    }
    
    try {
      setIsUpdatingOracle(true);
      await pushImpactData(
        contracts.oracle,
        Number(deltaKwh),
        Number(deltaCO2),
        oracleKey
      );
      
      showToast('Impact data updated successfully!', 'success');
      
      await loadContractData(contracts, walletAddress);
      
      setDeltaKwh('');
      setDeltaCO2('');
    } catch (error) {
      console.error('Error pushing impact data:', error);
      showToast('Failed to update impact data. ' + error.message, 'error');
    } finally {
      setIsUpdatingOracle(false);
    }
  };

  // Check if first visit
  useEffect(() => {
    const hasVisitedBefore = localStorage.getItem('ecofi_hasVisitedBefore');
    if (!hasVisitedBefore) {
      setShowOnboarding(true);
      localStorage.setItem('ecofi_hasVisitedBefore', 'true');
    }
  }, []);

  // Register for events
  useEffect(() => {
    if (!contracts) return;
    
    const { escrow, oracle } = contracts;
    
    const milestoneFilter = escrow.filters.MilestoneAchieved();
    const milestoneListener = (milestoneId, threshold, releaseBps, event) => {
      showToast(`Milestone ${milestoneId} achieved! ${releaseBps/100}% of funds released.`, 'success');
      loadContractData(contracts, walletAddress);
    };
    escrow.on(milestoneFilter, milestoneListener);
    
    const impactFilter = oracle.filters.ImpactUpdate();
    const impactListener = (cumulativeKwh, deltaCO2, event) => {
      showToast(`New impact data: +${deltaCO2} kg CO₂ offset`, 'info');
      loadContractData(contracts, walletAddress);
    };
    oracle.on(impactFilter, impactListener);
    
    return () => {
      escrow.off(milestoneFilter, milestoneListener);
      oracle.off(impactFilter, impactListener);
    };
  }, [contracts, walletAddress]);

  // Render investor dashboard
  const renderInvestorDashboard = () => {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Investment Card */}
        <GlassCard className="lg:col-span-1" animated={true} accent={true}>
          <SectionTitle 
            icon={<DollarSign className="h-6 w-6" />} 
            title="Invest in Green Bonds" 
          />
          
          <div className="space-y-4">
            <div>
              <label className="block text-white/80 font-inter text-sm mb-2">
                Number of Bond Tokens
              </label>
              <input
                type="number"
                value={investAmount}
                onChange={(e) => setInvestAmount(e.target.value)}
                className="w-full bg-black/20 border border-white/10 text-white font-mono px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50"
                placeholder="Enter amount (whole tokens)"
                disabled={!walletConnected || wrongNetwork}
              />
            </div>
            
            <div className="bg-black/20 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-white/60 font-inter">Estimated Cost:</span>
                <span className="text-white font-mono">
                  {estimatedCost} ETH
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/60 font-inter">Token Price:</span>
                <span className="text-white font-mono">
                  {tokenPrice} ETH
                </span>
              </div>
            </div>
            
            <Button
              onClick={invest}
              variant="primary"
              size="lg"
              className="w-full"
              loading={isInvesting}
              disabled={!walletConnected || wrongNetwork || isNaN(parseFloat(investAmount)) || parseFloat(investAmount) <= 0}
              icon={<CreditCard className="h-5 w-5" />}
            >
              Purchase Bonds
            </Button>
          </div>
        </GlassCard>
        
        {/* Holdings Card */}
        <GlassCard className="lg:col-span-2" animated={false} accent={true}>
          <SectionTitle 
            icon={<Award className="h-6 w-6" />} 
            title="Your Green Bond Holdings" 
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-black/20 p-4 rounded-lg">
              <div className="text-white/60 text-sm mb-1">Your Balance</div>
              <div className="text-2xl font-mono text-white">{bondBalance} Tokens</div>
              <div className="text-green-400 text-sm mt-1">
                ≈ {(parseFloat(bondBalance) * parseFloat(tokenPrice)).toFixed(4)} ETH
              </div>
            </div>
            
            <div className="bg-black/20 p-4 rounded-lg">
              <div className="text-white/60 text-sm mb-1">Bond Sale Progress</div>
              <div className="text-2xl font-mono text-white">
                {tokensSold}/{capTokens} Tokens
              </div>
              <div className="mt-2 bg-white/10 h-2 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 to-blue-500"
                  style={{width: `${Math.min(100, (parseFloat(tokensSold) / parseFloat(capTokens)) * 100)}%`}}
                ></div>
              </div>
            </div>
          </div>
          
          <div className="bg-black/20 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-montserrat font-semibold text-white mb-3">Impact Metrics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <div className="bg-green-500/20 p-2 rounded-full">
                    <Leaf className="h-5 w-5 text-green-400" />
                  </div>
                </div>
                <div className="text-xl font-mono text-white">
                  {environmentalImpact.co2Reduced.toFixed(2)}
                </div>
                <div className="text-white/60 text-xs">Tons CO₂ Reduced</div>
              </div>
              
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <div className="bg-blue-500/20 p-2 rounded-full">
                    <Wind className="h-5 w-5 text-blue-400" />
                  </div>
                </div>
                <div className="text-xl font-mono text-white">
                  {cumulativeKwh.toLocaleString()}
                </div>
                <div className="text-white/60 text-xs">kWh Generated</div>
              </div>
              
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <div className="bg-indigo-500/20 p-2 rounded-full">
                    <Globe className="h-5 w-5 text-indigo-400" />
                  </div>
                </div>
                <div className="text-xl font-mono text-white">
                  {environmentalImpact.treesPlanted.toLocaleString()}
                </div>
                <div className="text-white/60 text-xs">Trees Equivalent</div>
              </div>
              
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <div className="bg-purple-500/20 p-2 rounded-full">
                    <Waves className="h-5 w-5 text-purple-400" />
                  </div>
                </div>
                <div className="text-xl font-mono text-white">
                  {environmentalImpact.waterConserved.toLocaleString()}
                </div>
                <div className="text-white/60 text-xs">Liters Water Saved</div>
              </div>
            </div>
          </div>
        </GlassCard>
        
        {/* Milestones Card */}
        <GlassCard className="lg:col-span-3" animated={false} accent={true}>
          <SectionTitle 
            icon={<TrendingUp className="h-6 w-6" />} 
            title="Project Milestones" 
            subtitle="Funds are released as clean energy production milestones are achieved"
          />
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-white/80 font-montserrat font-semibold">Milestone</th>
                  <th className="text-left py-3 px-4 text-white/80 font-montserrat font-semibold">Energy Threshold</th>
                  <th className="text-left py-3 px-4 text-white/80 font-montserrat font-semibold">Release %</th>
                  <th className="text-left py-3 px-4 text-white/80 font-montserrat font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {milestones.length > 0 ? (
                  milestones.map((milestone) => (
                    <tr key={milestone.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-4 px-4 text-white font-inter">Milestone {milestone.id + 1}</td>
                      <td className="py-4 px-4 text-white font-mono">{milestone.threshold.toLocaleString()} kWh</td>
                      <td className="py-4 px-4 text-white font-mono">{milestone.releaseBps / 100}%</td>
                      <td className="py-4 px-4">
                        {milestone.achieved ? (
                          <div className="flex items-center text-green-400">
                            <CheckCircle2 className="h-5 w-5 mr-2" />
                            <span className="font-inter">Verified & Released</span>
                          </div>
                        ) : (
                          <div className="flex items-center text-white/60">
                            <Lock className="h-5 w-5 mr-2" />
                            <span className="font-inter">
                              {cumulativeKwh >= milestone.threshold ? 'Pending Verification' : 'Locked'}
                            </span>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="py-6 text-center text-white/60">
                      {loadingData ? 'Loading milestones...' : 'No milestones found.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>
    );
  };

  // Render issuer dashboard
  const renderIssuerDashboard = () => {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard className="lg:col-span-3" animated={true} accent={true}>
          <SectionTitle 
            icon={<Boxes className="h-6 w-6" />} 
            title="Issuer Dashboard" 
            subtitle="Manage your green bond project"
          />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-black/20 p-4 rounded-lg">
              <div className="text-white/60 text-sm mb-1">Total Funds Raised</div>
              <div className="text-2xl font-mono text-white">{totalRaised} ETH</div>
            </div>
            
            <div className="bg-black/20 p-4 rounded-lg">
              <div className="text-white/60 text-sm mb-1">Total Released</div>
              <div className="text-2xl font-mono text-white">{totalReleased} ETH</div>
              <div className="text-green-400 text-sm mt-1">
                {totalRaised > 0 ? `${((parseFloat(totalReleased) / parseFloat(totalRaised)) * 100).toFixed(2)}%` : '0%'}
              </div>
            </div>
            
            <div className="bg-black/20 p-4 rounded-lg">
              <div className="text-white/60 text-sm mb-1">Unreleased Funds</div>
              <div className="text-2xl font-mono text-white">
                {(parseFloat(totalRaised) - parseFloat(totalReleased)).toFixed(4)} ETH
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    );
  };

  // Render oracle simulation
  const renderOracleSimulation = () => {
    return (
      <div className="grid grid-cols-1 gap-6">
        <GlassCard animated={true} accent={true}>
          <SectionTitle 
            icon={<Activity className="h-6 w-6" />} 
            title="Oracle Simulation" 
            subtitle="Simulate IoT data updates for testing"
          />
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-white/80 font-inter text-sm mb-2">
                  Energy Produced (kWh)
                </label>
                <input
                  type="number"
                  value={deltaKwh}
                  onChange={(e) => setDeltaKwh(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 text-white font-mono px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50"
                  placeholder="Enter energy delta in kWh"
                  disabled={!walletConnected || wrongNetwork}
                />
              </div>
              
              <div>
                <label className="block text-white/80 font-inter text-sm mb-2">
                  CO₂ Offset (kg)
                </label>
                <input
                  type="number"
                  value={deltaCO2}
                  onChange={(e) => setDeltaCO2(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 text-white font-mono px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50"
                  placeholder="Enter CO₂ offset in kg"
                  disabled={!walletConnected || wrongNetwork}
                />
              </div>
            </div>
            
            <Button
              onClick={pushImpact}
              variant="primary"
              size="lg"
              className="w-full"
              loading={isUpdatingOracle}
              disabled={!walletConnected || wrongNetwork || !deltaKwh || !deltaCO2}
              icon={<Zap className="h-5 w-5" />}
            >
              Simulate Energy Production Update
            </Button>
            
            <div className="bg-amber-500/20 border border-amber-500/30 rounded-lg p-4">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-amber-500 mr-3 mt-0.5 flex-shrink-0" />
                <div className="text-white/80 text-sm">
                  <p className="mb-1 font-semibold">Demo Purpose Only</p>
                  <p>This interface simulates IoT data updates that would normally come from physical sensors.</p>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Enhanced Particle Background */}
      <EnhancedParticleBackground />
      
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-sm sticky top-0 z-30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="bg-gradient-to-r from-green-500 to-blue-500 p-2 rounded-lg mr-3">
                <Leaf className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-montserrat font-bold text-white">EcoFi <span className="text-green-400">Green Bonds</span></h1>
            </div>
            
            <div className="flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-4 w-full md:w-auto">
              {walletConnected ? (
                <>
                  <div className={`flex items-center px-4 py-2 rounded-lg ${wrongNetwork ? 'bg-red-500/20' : 'bg-white/5'}`}>
                    <Wallet className={`h-4 w-4 mr-2 ${wrongNetwork ? 'text-red-400' : 'text-green-400'}`} />
                    <span className="font-mono text-sm truncate max-w-[150px]">
                      {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                    </span>
                  </div>
                  
                  {wrongNetwork && (
                    <Button
                      onClick={switchToHardhat}
                      variant="danger"
                      size="sm"
                      icon={<AlertTriangle className="h-4 w-4" />}
                    >
                      Switch to Hardhat
                    </Button>
                  )}
                </>
              ) : (
                <Button
                  onClick={connectWallet}
                  variant="primary"
                  size="md"
                  loading={loadingData}
                  disabled={hardhatRunning === false}
                  icon={<Wallet className="h-5 w-5" />}
                >
                  Connect Wallet
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {hardhatRunning === false && (
          <div className="mb-8 bg-red-500/20 border border-red-500/30 rounded-lg p-4">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
              <div className="text-white/80 text-sm">
                <p className="font-semibold mb-1">Hardhat Node Not Running</p>
                <p>Please start the Hardhat node by running <code className="bg-black/30 px-2 py-1 rounded text-white font-mono">npx hardhat node</code> in your terminal.</p>
              </div>
            </div>
          </div>
        )}
        
        {walletConnected && !wrongNetwork && (
          <div className="flex flex-wrap gap-2 mb-6">
            <Button
              onClick={() => setActiveTab('investor')}
              variant={activeTab === 'investor' ? 'primary' : 'secondary'}
              size="sm"
              icon={<Award className="h-4 w-4" />}
            >
              Investor Dashboard
            </Button>
            
            {isIssuer && (
              <Button
                onClick={() => setActiveTab('issuer')}
                variant={activeTab === 'issuer' ? 'primary' : 'secondary'}
                size="sm"
                icon={<Boxes className="h-4 w-4" />}
              >
                Issuer Dashboard
              </Button>
            )}
            
            <Button
              onClick={() => setActiveTab('oracle')}
              variant={activeTab === 'oracle' ? 'primary' : 'secondary'}
              size="sm"
              icon={<Activity className="h-4 w-4" />}
            >
              Oracle Simulation
            </Button>
          </div>
        )}
        
        {/* Loading Overlay */}
        {loadingData && (
          <div className="flex justify-center my-12">
            <div className="flex flex-col items-center">
              <RefreshCw className="h-12 w-12 text-green-400 animate-spin mb-4" />
              <p className="text-white/80 font-inter">Loading data from blockchain...</p>
            </div>
          </div>
        )}
        
        {!walletConnected && !loadingData ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="mb-8 text-center">
              <div className="flex justify-center mb-6">
                <div className="h-24 w-24 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                  <Leaf className="h-12 w-12 text-white" />
                </div>
              </div>
              <h2 className="text-3xl font-montserrat font-bold text-white mb-4">
                Welcome to EcoFi Green Bonds
              </h2>
              <p className="text-white/70 font-inter max-w-xl mx-auto">
                Invest in sustainable energy projects with transparency and impact tracking.
                Connect your wallet to get started.
              </p>
            </div>
            
            <Button
              onClick={connectWallet}
              variant="primary"
              size="lg"
              loading={loadingData}
              disabled={hardhatRunning === false}
              icon={<Wallet className="h-5 w-5" />}
            >
              Connect Wallet to Begin
            </Button>
          </div>
        ) : walletConnected && !wrongNetwork && !loadingData ? (
          <div>
            {activeTab === 'investor' && renderInvestorDashboard()}
            {activeTab === 'issuer' && renderIssuerDashboard()}
            {activeTab === 'oracle' && renderOracleSimulation()}
          </div>
        ) : null}
      </main>
      
      {/* Footer */}
      <footer className="border-t border-white/10 py-6 mt-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-white/60 text-sm mb-4 md:mb-0">
              &copy; 2025 EcoFi Green Bonds. All rights reserved.
            </div>
            
            <div className="flex space-x-4">
              <Button
                onClick={() => setShowOnboarding(true)}
                variant="secondary"
                size="sm"
                icon={<Info className="h-4 w-4" />}
              >
                How It Works
              </Button>
            </div>
          </div>
        </div>
      </footer>
      
      {/* Onboarding Modal */}
      {showOnboarding && (
        <Onboarding 
          isOpen={showOnboarding} 
          onComplete={() => setShowOnboarding(false)} 
        />
      )}
      
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 flex flex-col space-y-2">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
          />
        ))}
      </div>
    </div>
  );
};

export default UltimateEcoFiDashboard;