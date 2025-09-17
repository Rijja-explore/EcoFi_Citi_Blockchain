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
  getContracts,
  handleContractError,
  verifyHardhatRunning,
  addHardhatNetworkToMetaMask,
  pushImpactData
} from './contractUtils';
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
  const [totalReleased, setTotalReleased] = useState('0');
  const [tokenPrice, setTokenPrice] = useState('0');
  const [tokensSold, setTokensSold] = useState('0');
  const [capTokens, setCapTokens] = useState('0');
  const [cumulativeKwh, setCumulativeKwh] = useState(0);
  const [isIssuer, setIsIssuer] = useState(false);
  const [milestones, setMilestones] = useState([]);
  const [saleEnd, setSaleEnd] = useState(0);

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

  // Environmental impact metrics (calculated from contract data)
  const [environmentalImpact, setEnvironmentalImpact] = useState({
    co2Reduced: 0,
    treesPlanted: 0,
    energySaved: 0,
    waterConserved: 0
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
      
      setTransactionHistory(prev => [...prev, { 
        type: 'Wallet Connected', 
        status: 'Success', 
        time: new Date().toLocaleTimeString() 
      }]);
      showToast('Wallet connected successfully', 'success');
      
      // Fetch contract data after connecting
      fetchContractData(ethersProvider, address);
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
        const kwhValue = Number(kwh);
        setCumulativeKwh(kwhValue);
        console.log("Fetched cumulative kWh:", kwhValue);
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
      
      // Calculate environmental impact metrics based on kWh using configurable multipliers
      try {
        const kwhValue = cumulativeKwh; // Use state variable
        console.log("Calculating environmental impact with kWh:", kwhValue);
        
        // Get environmental multipliers from environment variables with sensible defaults
        const co2PerKwh = parseFloat(process.env.REACT_APP_CO2_PER_KWH) || 0.4;
        const treesPerKwh = parseFloat(process.env.REACT_APP_TREES_PER_KWH) || 0.02;
        const waterPerKwh = parseFloat(process.env.REACT_APP_WATER_PER_KWH) || 0.5;
        
        // If no real data from oracle, show demo data for better UX
        const showDemoData = process.env.REACT_APP_SHOW_DEMO_DATA === 'true' && kwhValue === 0;
        const displayKwh = showDemoData ? 250000 : kwhValue; // Demo: 250k kWh
        
        const impactData = {
          co2Reduced: Math.round(displayKwh * co2PerKwh), // kg CO2 saved
          treesPlanted: Math.round(displayKwh * treesPerKwh), // trees equivalent
          energySaved: displayKwh, // kWh saved
          waterConserved: Math.round(displayKwh * waterPerKwh) // liters of water conserved
        };
        
        console.log("Environmental impact calculated:", impactData);
        setEnvironmentalImpact(impactData);
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
        signer,
        deltaKwh,
        deltaCO2
      );
      
      if (!tx) {
        throw new Error('Failed to push impact data');
      }
      
      setTransactionHistory(prev => [...prev, { 
        type: 'Push Impact Data', 
        status: 'Pending', 
        time: new Date().toLocaleTimeString(), 
        txHash: tx.hash 
      }]);
      
      showToast('Impact data transaction pending...', 'info');
      
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
      
      showToast('Impact data updated successfully', 'success');
      
      // Reset form and refresh data
      setDeltaKwh('');
      setDeltaCO2('');
      fetchContractData(provider, walletAddress);
    } catch (error) {
      console.error('Push impact data failed:', error);
      setTransactionHistory(prev => [...prev, { 
        type: 'Push Impact Data', 
        status: 'Failed', 
        time: new Date().toLocaleTimeString() 
      }]);
      showToast(handleContractError(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  // Download impact certificate as PDF
  const handleDownloadCertificate = () => {
    const certificateData = {
      certificateId: `ECO-${walletAddress.substring(2, 8).toUpperCase()}`,
      bondBalance: bondBalance,
      impactContribution: `${environmentalImpact.co2Reduced} kg CO₂`,
      energyGenerated: `${environmentalImpact.energySaved} kWh`,
      treesEquivalent: environmentalImpact.treesPlanted,
      waterConserved: `${environmentalImpact.waterConserved} L`,
      issueDate: new Date().toLocaleDateString(),
      walletAddress: walletAddress
    };

    // Create HTML content for PDF
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>EcoFi Impact Certificate</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f0f9ff; }
        .certificate { background: white; padding: 40px; border-radius: 15px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); max-width: 800px; margin: 0 auto; }
        .header { text-align: center; border-bottom: 3px solid #8b5cf6; padding-bottom: 20px; margin-bottom: 30px; }
        .title { color: #8b5cf6; font-size: 28px; font-weight: bold; margin-bottom: 10px; }
        .subtitle { color: #6b7280; font-size: 16px; }
        .section { margin: 25px 0; }
        .section-title { color: #374151; font-size: 18px; font-weight: bold; margin-bottom: 15px; border-left: 4px solid #8b5cf6; padding-left: 15px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .info-item { background: #f8fafc; padding: 15px; border-radius: 8px; border-left: 3px solid #10b981; }
        .info-label { color: #6b7280; font-size: 12px; margin-bottom: 5px; text-transform: uppercase; }
        .info-value { color: #1f2937; font-size: 16px; font-weight: bold; }
        .impact-highlight { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 20px; border-radius: 10px; text-align: center; }
        .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; }
    </style>
</head>
<body>
    <div class="certificate">
        <div class="header">
            <div class="title">🌱 EcoFi Green Bond Impact Certificate</div>
            <div class="subtitle">Environmental Sustainability Validation</div>
        </div>
        
        <div class="section">
            <div class="section-title">Certificate Details</div>
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Certificate ID</div>
                    <div class="info-value">${certificateData.certificateId}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Issue Date</div>
                    <div class="info-value">${certificateData.issueDate}</div>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Investor Information</div>
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Wallet Address</div>
                    <div class="info-value">${certificateData.walletAddress}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Bond Balance</div>
                    <div class="info-value">${certificateData.bondBalance} GBOND</div>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Environmental Impact Contribution</div>
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">🌍 CO₂ Reduced</div>
                    <div class="info-value">${certificateData.impactContribution}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">⚡ Energy Generated</div>
                    <div class="info-value">${certificateData.energyGenerated}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">🌳 Trees Equivalent</div>
                    <div class="info-value">${certificateData.treesEquivalent} trees</div>
                </div>
                <div class="info-item">
                    <div class="info-label">💧 Water Conserved</div>
                    <div class="info-value">${certificateData.waterConserved}</div>
                </div>
            </div>
        </div>

        <div class="impact-highlight">
            <strong>This certificate validates your contribution to environmental sustainability through green bond investments.</strong>
        </div>

        <div class="footer">
            Generated by EcoFi Platform • ${new Date().toISOString()}<br>
            Blockchain-verified environmental impact tracking
        </div>
    </div>
</body>
</html>`;

    // Create a new window to print as PDF
    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Wait for content to load then trigger print dialog
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
    
    showToast('Certificate ready for download as PDF!', 'success');
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
            </div>
            <div className="text-gray-400 truncate text-xs mt-0.5">{walletAddress}</div>
          </div>
        )}
      </div>
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
      
      // Calculate impact using configurable multiplier
      const impactMultiplier = parseFloat(process.env.REACT_APP_IMPACT_MULTIPLIER) || 1000; // kWh per ETH invested
      const impact = Math.round((amount * impactMultiplier) / price);
      
      // Calculate potential returns using configurable rate
      const returnRate = parseFloat(process.env.REACT_APP_EXPECTED_RETURN_RATE) || 0.12;
      const returns = (amount * returnRate).toFixed(4);
      
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
            <div className="text-gray-400 text-xs">≈ {Math.round(simResults.impact * (parseFloat(process.env.REACT_APP_CO2_PER_KWH) || 0.4))} kg CO₂ reduced</div>
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

  // Enhanced Oracle Simulator (for issuer only)
  const OracleSimulator = () => (
    <div className="glass-card p-6 rounded-xl border border-purple-500/20">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-gradient-to-r from-custom-purple to-bright-purple rounded-lg">
          <Database className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-white text-lg font-semibold">Submit Environmental Impact Data</h3>
          <p className="text-gray-400 text-sm">Report your project's environmental achievements to unlock milestone funding</p>
        </div>
      </div>
      
      {/* Current Progress Display */}
      <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-300 text-sm">Current Progress</span>
          <span className="text-green-400 text-sm font-semibold">{cumulativeKwh.toLocaleString()} kWh Total</span>
        </div>
        <div className="flex gap-4 text-xs text-gray-400">
          <span>Next Milestone: {milestones.find(m => !m.achieved)?.threshold?.toLocaleString() || 'All Complete'} kWh</span>
          <span>•</span>
          <span>Remaining: {milestones.find(m => !m.achieved) ? (milestones.find(m => !m.achieved).threshold - cumulativeKwh).toLocaleString() : 0} kWh</span>
        </div>
      </div>
      
      <div className="space-y-4 mb-6">
        {/* Energy Generation Input */}
        <div>
          <label className="block text-white text-sm font-medium mb-2">
            Energy Generated (kWh)
          </label>
          <input
            type="text"
            value={deltaKwh}
            onChange={(e) => setDeltaKwh(e.target.value)}
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
            placeholder="Enter kWh generated (e.g., 25000)"
          />
        </div>
        
        {/* CO2 Offset Input */}
        <div>
          <label className="block text-white text-sm font-medium mb-2">
            CO₂ Offset (kg)
          </label>
          <input
            type="text"
            value={deltaCO2}
            onChange={(e) => setDeltaCO2(e.target.value)}
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
            placeholder="Enter CO₂ offset (e.g., 10000)"
          />
        </div>
      </div>
      
      {/* Quick Fill Buttons */}
      <div className="mb-6">
        <div className="text-white text-sm font-medium mb-2">Quick Fill Options:</div>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "Small Update", kwh: 100000, co2: 40000 },
            { label: "Medium Update", kwh: 300000, co2: 120000 },
            { label: "Large Update", kwh: 600000, co2: 240000 },
            { label: "Milestone Push", kwh: 1000000, co2: 400000 }
          ].map((preset) => (
            <button
              key={preset.label}
              onClick={() => {
                setDeltaKwh(preset.kwh.toString());
                setDeltaCO2(preset.co2.toString());
              }}
              className="px-3 py-1 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 text-xs rounded-lg transition-colors"
            >
              {preset.label} ({preset.kwh.toLocaleString()} kWh)
            </button>
          ))}
        </div>
      </div>
      
      {/* Impact Preview */}
      {deltaKwh && deltaCO2 && (
        <div className="bg-gradient-to-r from-purple-900/30 to-green-900/30 rounded-lg p-4 mb-6 border border-purple-500/20">
          <div className="text-white text-sm font-medium mb-2">Impact Preview:</div>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-gray-400">New Total: </span>
              <span className="text-white font-semibold">{(cumulativeKwh + parseInt(deltaKwh || 0)).toLocaleString()} kWh</span>
            </div>
            <div>
              <span className="text-gray-400">Trees Equivalent: </span>
              <span className="text-green-400 font-semibold">
                +{Math.round(parseFloat(deltaKwh) * (parseFloat(process.env.REACT_APP_TREES_PER_KWH) || 0.02))} trees
              </span>
            </div>
          </div>
        </div>
      )}
      
      {/* Oracle Key (Collapsible Advanced Section) */}
      <details className="mb-6">
        <summary className="text-gray-400 text-sm cursor-pointer hover:text-white transition-colors">
          ⚙️ Advanced: Custom Oracle Key
        </summary>
        <div className="mt-3 space-y-2">
          <input
            type="password"
            value={oracleKey}
            onChange={(e) => setOracleKey(e.target.value)}
            className="w-full bg-gray-900/70 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
            placeholder="Leave empty to use environment key"
          />
          <p className="text-gray-500 text-xs">
            🔐 Only use custom keys for testing. Production uses secure environment variables.
          </p>
        </div>
      </details>
      
      {/* Submit Button */}
      <button
        onClick={handlePushImpactData}
        disabled={loading || !deltaKwh || !deltaCO2}
        className="w-full bg-gradient-to-r from-custom-purple to-bright-purple hover:from-purple-600 hover:to-purple-700 text-white px-6 py-4 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-3">
            <RefreshCw className="w-5 h-5 animate-spin" />
            Submitting Impact Data...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-3">
            <CheckCircle2 className="w-5 h-5" />
            Submit Environmental Impact Data
          </span>
        )}
      </button>
      
      {/* Form Validation Messages */}
      {(!deltaKwh || !deltaCO2) && (
        <div className="mt-3 text-center">
          <span className="text-amber-400 text-xs">
            ⚠️ Please enter both energy generation and CO₂ offset values
          </span>
        </div>
      )}
    </div>
  );

  // Transaction History Component
  const TransactionHistoryComponent = () => (
    <div className="glass-card p-4 rounded-xl">
      <h3 className="text-white text-lg font-semibold mb-3">Transaction History</h3>
      
      {transactionHistory.length === 0 ? (
        <div className="text-gray-400 text-center py-4">No transactions yet</div>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
          {transactionHistory.map((tx, index) => (
            <div key={index} className="flex items-center justify-between bg-gray-800/50 p-2 rounded-lg">
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

  // Get projects data from environment variables or use dynamic placeholders
  const getProjectsData = () => {
    // Try to get projects from environment variables
    const projectsConfig = process.env.REACT_APP_PROJECTS_CONFIG;
    
    if (projectsConfig) {
      try {
        return JSON.parse(projectsConfig);
      } catch (error) {
        console.warn('Failed to parse REACT_APP_PROJECTS_CONFIG:', error);
      }
    }
    
    // Fallback to dynamic project data based on contract info
    return [
      {
        id: 1,
        name: process.env.REACT_APP_PROJECT_1_NAME || "Green Bond Project",
        image: process.env.REACT_APP_PROJECT_1_IMAGE || "/placeholder-project.jpg",
        location: process.env.REACT_APP_PROJECT_1_LOCATION || "Location TBD",
        description: process.env.REACT_APP_PROJECT_1_DESCRIPTION || "Renewable energy project generating clean energy.",
        impact: `${Math.floor(cumulativeKwh * (parseFloat(process.env.REACT_APP_CO2_PER_KWH) || 0.4))} kg CO2 reduction`,
        progress: Math.min(100, Math.floor((parseFloat(totalRaised) / parseFloat(capTokens) * parseFloat(tokenPrice)) * 100))
      }
    ];
  };

  const projectsData = getProjectsData();

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
    </div>
  );

  // Tab navigation
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'projects', label: 'Projects', icon: Globe },
    { id: 'impact', label: 'Impact', icon: Leaf },
    { id: 'transactions', label: 'Transactions', icon: Database }
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
                    
                    <button 
                      onClick={handleDownloadCertificate}
                      className="w-full bg-gradient-to-r from-custom-purple to-bright-purple hover:from-purple-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-semibold transition-all"
                    >
                      Download Impact Certificate
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Transactions tab */}
            {activeTab === 'transactions' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white mb-4">Transaction History</h2>
                <TransactionHistoryComponent />
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