// src/RealTimeDataProvider.js
import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { ethers } from 'ethers';
import ContractEventMonitor from './ContractEventMonitor';
import { 
  initializeProvider, 
  getSigner,
  handleContractError,
  verifyHardhatRunning,
  getContracts
} from './contractUtilsEnhanced';

// Create context for real-time data
export const RealTimeDataContext = createContext({
  loading: true,
  error: null,
  contractData: {},
  transactions: [],
  impactUpdates: [],
  milestoneEvents: [],
  fundReleaseEvents: [],
  refreshData: () => {},
  buyBonds: async () => {},
  pushImpactData: async () => {},
  releaseFunds: async () => {}
});

// Custom hook to use the real-time data context
export const useRealTimeData = () => useContext(RealTimeDataContext);

// Provider component
export const RealTimeDataProvider = ({ children }) => {
  // Blockchain connection state
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contracts, setContracts] = useState(null);
  const [walletAddress, setWalletAddress] = useState('');
  
  // Data state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [contractData, setContractData] = useState({});
  
  // Event tracking
  const [transactions, setTransactions] = useState([]);
  const [impactUpdates, setImpactUpdates] = useState([]);
  const [milestoneEvents, setMilestoneEvents] = useState([]);
  const [fundReleaseEvents, setFundReleaseEvents] = useState([]);
  
  // Fetch contract data function (previously imported from dataProvider)
  const fetchContractData = useCallback(async () => {
    if (!signer) {
      throw new Error('Wallet not connected');
    }
    
    try {
      // Get contract instances
      const contractInstances = getContracts(signer);
      setContracts(contractInstances);
      
      // Get signer address
      const address = await signer.getAddress();
      
      // Fetch data from contracts
      return await fetchDataFromContracts(contractInstances, address);
    } catch (error) {
      console.error('Error fetching contract data:', error);
      handleContractError(error);
      throw error;
    }
  }, [signer]);
  
  // Initialize provider and contracts
  const initialize = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if Hardhat node is running
      const isHardhatRunning = await verifyHardhatRunning();
      if (!isHardhatRunning) {
        console.warn('Hardhat node is not running. Using mock data.');
        // We'll continue anyway but will use mock data
      }
      
      // Initialize provider
      const { provider: ethersProvider } = await initializeProvider();
      setProvider(ethersProvider);
      
      // Get signer and address
      const { signer: ethersSigner, address } = await getSigner(ethersProvider);
      setSigner(ethersSigner);
      setWalletAddress(address);
      
      // Get contract instances
      const contractInstances = getContracts(ethersSigner);
      setContracts(contractInstances);
      
      // Fetch data from contracts
      await fetchDataFromContracts(contractInstances, address);
      
      setLoading(false);
    } catch (error) {
      console.error('Initialization error:', error);
      setError(error.message);
      setLoading(false);
    }
  }, []);
  
  // Fetch all contract data
  const fetchDataFromContracts = useCallback(async (contractInstances, address) => {
    if (!contractInstances || !contractInstances.escrow) {
      return {};
    }
    
    try {
      const data = {};
      const escrow = contractInstances.escrow;
      const oracle = contractInstances.oracle;
      
      // Get token address from escrow
      try {
        data.tokenAddress = await escrow.token();
      } catch (error) {
        console.error('Failed to fetch token address from escrow:', error);
      }
      
      // Get token price
      try {
        data.priceWeiPerToken = await escrow.priceWeiPerToken();
        data.priceEthPerToken = ethers.formatEther(data.priceWeiPerToken);
      } catch (error) {
        console.error('Failed to fetch priceWeiPerToken:', error);
      }
      
      // Get user balance
      try {
        data.balanceOf = await escrow.balanceOf(address);
        data.bondBalance = ethers.formatUnits(data.balanceOf, 18);
      } catch (error) {
        console.error('Failed to fetch balanceOf:', error);
      }
      
      // Get tokens sold
      try {
        data.tokensSold = await escrow.tokensSold();
        data.tokensSoldFormatted = ethers.formatUnits(data.tokensSold, 18);
      } catch (error) {
        console.error('Failed to fetch tokensSold:', error);
      }
      
      // Get cap tokens
      try {
        data.capTokens = await escrow.capTokens();
        data.capTokensFormatted = ethers.formatUnits(data.capTokens, 18);
      } catch (error) {
        console.error('Failed to fetch capTokens:', error);
      }
      
      // Get issuer
      try {
        data.issuer = await escrow.issuer();
        data.isIssuer = address.toLowerCase() === data.issuer.toLowerCase();
      } catch (error) {
        console.error('Failed to fetch issuer:', error);
      }
      
      // Get impact data
      try {
        if (oracle) {
          data.cumulativeKwh = await oracle.cumulativeKwh();
          data.cumulativeKwhFormatted = ethers.formatUnits(data.cumulativeKwh, 0);
        }
      } catch (error) {
        console.error('Failed to fetch cumulativeKwh:', error);
      }
      
      // Get milestones data
      try {
        data.milestonesCount = await escrow.milestonesCount();
        data.milestonesCountFormatted = ethers.formatUnits(data.milestonesCount, 0);
        
        // Fetch individual milestone data
        data.milestones = [];
        for (let i = 0; i < data.milestonesCount; i++) {
          const milestone = await escrow.milestones(i);
          data.milestones.push({
            threshold: ethers.formatUnits(milestone.threshold, 0),
            releaseAmount: ethers.formatUnits(milestone.releaseAmount, 18),
            released: milestone.released
          });
        }
      } catch (error) {
        console.error('Failed to fetch milestonesCount:', error);
      }
      
      // Get sale end time
      try {
        data.saleEnd = await escrow.saleEnd();
        data.saleEndFormatted = new Date(Number(data.saleEnd) * 1000).toISOString();
      } catch (error) {
        console.error('Failed to fetch saleEnd:', error);
      }
      
      // Calculate progress
      if (data.capTokens && data.tokensSold) {
        data.progressPercentage = Number(data.tokensSold) * 100 / Number(data.capTokens);
      }
      
      // Calculate environmental impact metrics
      if (data.cumulativeKwh) {
        const kwhValue = Number(data.cumulativeKwhFormatted);
        data.environmentalImpact = {
          co2Reduced: Math.round(kwhValue * 0.6),
          treesEquivalent: Math.round(kwhValue * 0.02),
          homesSupplied: Math.round(kwhValue / 10850 * 100) / 100
        };
      }
      
      // Update state with fetched data
      setContractData(data);
      
      // Return the data for further use
      return data;
    } catch (error) {
      console.error('Error fetching contract data:', error);
      handleContractError(error);
      return {};
    }
  }, []);
  
  // Buy bonds function
  const buyBondsFunc = useCallback(async (amount, ethAmount) => {
    if (!signer || !contracts || !contracts.escrow) {
      throw new Error('Wallet not connected or contracts not initialized');
    }
    
    try {
      const escrow = contracts.escrow;
      
      // Execute transaction
      const tx = await escrow.buyTokens({
        value: ethAmount
      });
      
      // Wait for transaction to be mined
      await tx.wait();
      
      // Return result
      const result = {
        success: true,
        txHash: tx.hash,
        amount: amount,
        cost: ethers.formatEther(ethAmount)
      };
      
      // Add to transactions
      const transaction = {
        buyer: walletAddress,
        amount: amount,
        totalCost: result.cost,
        timestamp: new Date().toISOString()
      };
      setTransactions(prev => [transaction, ...prev]);
      
      // Refresh data
      await fetchContractData();
      
      return result;
    } catch (error) {
      console.error('Buy bonds failed:', error);
      handleContractError(error);
      throw error;
    }
  }, [contracts, signer, walletAddress, fetchContractData]);
  
  // Push impact data (for oracle updater only)
  const pushImpactDataFunc = useCallback(async (deltaKwh, deltaCO2, oracleKey) => {
    if (!contracts || !contracts.oracle || !signer) {
      throw new Error('Contracts not initialized');
    }
    
    try {
      const oracle = contracts.oracle;
      
      // Execute transaction (implementation may vary based on contract)
      const tx = await oracle.pushImpact(
        ethers.parseUnits(deltaKwh.toString(), 0),
        ethers.parseUnits(deltaCO2.toString(), 0)
      );
      
      // Wait for transaction to be mined
      await tx.wait();
      
      // Refresh data
      await fetchContractData();
      
      return {
        success: true,
        txHash: tx.hash,
        deltaKwh: deltaKwh,
        deltaCO2: deltaCO2
      };
    } catch (error) {
      console.error('Push impact data failed:', error);
      handleContractError(error);
      throw error;
    }
  }, [contracts, signer, fetchContractData]);
  
  // Release funds (for issuer only)
  const releaseFundsFunc = useCallback(async () => {
    if (!contracts || !contracts.escrow || !signer) {
      throw new Error('Contracts not initialized');
    }
    
    try {
      const escrow = contracts.escrow;
      
      // Check if user is issuer
      const issuer = await escrow.issuer();
      const signerAddress = await signer.getAddress();
      
      if (issuer.toLowerCase() !== signerAddress.toLowerCase()) {
        throw new Error('Not authorized to release funds');
      }
      
      // Execute transaction
      const tx = await escrow.releaseFunds();
      
      // Wait for transaction to be mined
      await tx.wait();
      
      // Refresh data
      await fetchContractData();
      
      return {
        success: true,
        txHash: tx.hash
      };
    } catch (error) {
      console.error('Release funds failed:', error);
      handleContractError(error);
      throw error;
    }
  }, [contracts, signer, fetchContractData]);
  
  // Event handlers
  const handleTokenPurchased = useCallback((event) => {
    setTransactions(prev => [event, ...prev]);
  }, []);
  
  const handleImpactUpdated = useCallback((event) => {
    setImpactUpdates(prev => [event, ...prev]);
    // Refresh contract data to reflect new impact values
    if (contracts && walletAddress) {
      fetchDataFromContracts(contracts, walletAddress);
    }
  }, [contracts, walletAddress]);
  
  const handleMilestoneReached = useCallback((event) => {
    setMilestoneEvents(prev => [event, ...prev]);
  }, []);
  
  const handleFundsReleased = useCallback((event) => {
    setFundReleaseEvents(prev => [event, ...prev]);
  }, []);
  
  // Initialize on mount
  useEffect(() => {
    initialize();
    
    // Set up account change listener
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', () => {
        // Reinitialize on account change
        initialize();
      });
    }
    
    return () => {
      // Clean up listeners
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', initialize);
      }
    };
  }, [initialize]);
  
  // Context value
  const contextValue = {
    loading,
    error,
    contractData,
    transactions,
    impactUpdates,
    milestoneEvents,
    fundReleaseEvents,
    refreshData: useCallback(async () => {
      try {
        await fetchContractData();
        return true;
      } catch (error) {
        console.error('Error refreshing data:', error);
        return false;
      }
    }, [fetchContractData]),
    buyBonds: buyBondsFunc,
    pushImpactData: async (deltaKwh, deltaCO2, oracleKey) => {
      try {
        const result = await pushImpactDataFunc(deltaKwh, deltaCO2, oracleKey);
        if (result.success) {
          // Add to impact updates
          const update = {
            deltaKwh: deltaKwh,
            deltaCO2: deltaCO2,
            timestamp: new Date().toISOString()
          };
          setImpactUpdates(prev => [update, ...prev]);
        }
        return result;
      } catch (error) {
        console.error('Push impact data failed:', error);
        handleContractError(error);
        throw error;
      }
    },
    releaseFunds: async () => {
      try {
        const result = await releaseFundsFunc();
        return result;
      } catch (error) {
        console.error('Release funds failed:', error);
        handleContractError(error);
        throw error;
      }
    }
  };
  
  return (
    <RealTimeDataContext.Provider value={contextValue}>
      {/* Add ContractEventMonitor to listen for contract events */}
      {contracts && provider && (
        <ContractEventMonitor
          contracts={contracts}
          provider={provider}
          onTokenPurchased={handleTokenPurchased}
          onImpactUpdated={handleImpactUpdated}
          onMilestoneReached={handleMilestoneReached}
          onFundsReleased={handleFundsReleased}
        />
      )}
      {children}
    </RealTimeDataContext.Provider>
  );
};

export default RealTimeDataProvider;