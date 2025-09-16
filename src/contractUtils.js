// src/contractUtils.js
import { ethers } from 'ethers';

// Import ABIs from artifacts
import GreenBondEscrowArtifact from './Backend/artifacts/contracts/GreenBondEscrow.sol/GreenBondEscrow.json';
import BondTokenArtifact from './Backend/artifacts/contracts/BondToken.sol/BondToken.json';
import ImpactOracleArtifact from './Backend/artifacts/contracts/ImpactOracle.sol/ImpactOracle.json';

// Environment variables (fallback to hardcoded values if needed)
const ESCROW_ADDRESS = process.env.REACT_APP_ESCROW_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3';
const BOND_TOKEN_ADDRESS = process.env.REACT_APP_BOND_TOKEN_ADDRESS; // Will be fetched from escrow
const ORACLE_ADDRESS = process.env.REACT_APP_ORACLE_ADDRESS || '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';
const UPDATER_ADDRESS = process.env.REACT_APP_UPDATER_ADDRESS || '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
const ORACLE_UPDATER_KEY = process.env.REACT_APP_ORACLE_UPDATER_KEY || '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';
const EXPECTED_CHAIN_ID = process.env.REACT_APP_CHAIN_ID ? parseInt(process.env.REACT_APP_CHAIN_ID) : 31337;

/**
 * Initialize ethers provider and check connection
 * @returns {Promise<{provider: ethers.BrowserProvider, isHardhatLocal: boolean}>}
 */
export async function initializeProvider() {
  try {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed');
    }
    
    // Check if ethereum object is accessible
    if (typeof window.ethereum.request !== 'function') {
      throw new Error('MetaMask is not accessible. Try reloading the page or check permissions.');
    }
    
    // Create provider with better error handling
    const provider = new ethers.BrowserProvider(window.ethereum);
    
    // Listen for chain changes
    window.ethereum.on('chainChanged', (_chainId) => {
      console.log('Network changed. Reloading...');
      window.location.reload();
    });
    
    // Check current network
    const network = await provider.getNetwork();
    console.log('Connected to chain ID:', network.chainId.toString());
    
    // Check if we're connected to the expected network
    const isHardhatLocal = network.chainId === ethers.getBigInt(EXPECTED_CHAIN_ID);
    
    if (!isHardhatLocal) {
      console.warn(`Connected to wrong network. Expected chain ID: ${EXPECTED_CHAIN_ID}, Got: ${network.chainId}`);
    }
    
    return { provider, isHardhatLocal };
  } catch (error) {
    console.error('Provider initialization failed:', error);
    throw new Error(`Provider initialization failed: ${error.message}`);
  }
}

/**
 * Get signer from provider
 * @param {ethers.BrowserProvider} provider - The ethers provider
 * @returns {Promise<{signer: ethers.Signer, address: string}>}
 */
export async function getSigner(provider) {
  try {
    // Check if provider is valid
    if (!provider) {
      throw new Error('Provider is not initialized');
    }
    
    // Request accounts access using window.ethereum directly
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed');
    }
    
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    
    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts found. Please check MetaMask and try again.');
    }
    
    console.log('Connected accounts:', accounts);
    
    // Get signer
    const signer = await provider.getSigner();
    if (!signer) {
      throw new Error('Failed to get signer');
    }
    
    // Get address
    const address = await signer.getAddress();
    if (!address) {
      throw new Error('Failed to get address from signer');
    }
    
    return { signer, address };
  } catch (error) {
    console.error('Failed to get signer:', error);
    throw new Error(`Failed to connect wallet: ${error.message}`);
  }
}

/**
 * Create contract instances (read-only with provider, or writable with signer)
 * @param {ethers.BrowserProvider|ethers.Signer} signerOrProvider - The signer or provider
 * @returns {Object} Contract instances
 */
export function getContracts(signerOrProvider) {
  try {
    // Create escrow contract first
    const escrow = new ethers.Contract(ESCROW_ADDRESS, GreenBondEscrowArtifact.abi, signerOrProvider);
    
    // Create oracle contract
    const oracle = new ethers.Contract(ORACLE_ADDRESS, ImpactOracleArtifact.abi, signerOrProvider);
    
    // For bond token, we need to use an async function in the component to get the address
    // But for now, use a placeholder that will be updated after fetching the token address
    const bondTokenAddress = BOND_TOKEN_ADDRESS || ESCROW_ADDRESS; // Temporary placeholder
    const bondToken = new ethers.Contract(bondTokenAddress, BondTokenArtifact.abi, signerOrProvider);
    
    return {
      escrow,
      bondToken,
      oracle
    };
  } catch (error) {
    console.error('Contract initialization failed:', error);
    throw error;
  }
}

/**
 * Get oracle signer for updates (using private key from env)
 * @param {ethers.BrowserProvider} provider - The ethers provider
 * @returns {ethers.Wallet|null} Oracle wallet or null if key not available
 */
export function getOracleWallet(provider) {
  if (!ORACLE_UPDATER_KEY) {
    console.warn('Oracle updater key not found in environment variables');
    return null;
  }
  
  try {
    return new ethers.Wallet(ORACLE_UPDATER_KEY, provider);
  } catch (error) {
    console.error('Failed to create oracle wallet:', error);
    return null;
  }
}

/**
 * Format contract data for display
 * @param {Object} data - Raw data from contracts
 * @returns {Object} Formatted data
 */
export function formatContractData(data) {
  return {
    tokenPrice: ethers.formatEther(data.tokenPrice || 0),
    bondBalance: ethers.formatEther(data.bondBalance || 0),
    tokensSold: ethers.formatEther(data.tokensSold || 0),
    capTokens: ethers.formatEther(data.capTokens || 0),
    totalRaised: ethers.formatEther(data.totalRaised || 0),
    totalReleased: ethers.formatEther(data.totalReleased || 0),
    cumulativeKwh: Number(data.cumulativeKwh || 0),
    saleEnd: Number(data.saleEnd || 0)
  };
}

/**
 * Format milestone data from contract
 * @param {Array} milestones - Raw milestone data
 * @returns {Array} Formatted milestone objects
 */
export function formatMilestones(milestones) {
  return milestones.map((mil, index) => ({
    index,
    threshold: Number(mil.threshold),
    achieved: mil.achieved,
    releaseBps: Number(mil.releaseBps)
  }));
}

/**
 * Handle transaction error with descriptive messages
 * @param {Error} error - The error object
 * @returns {string} User-friendly error message
 */
export function handleContractError(error) {
  console.error('Contract error:', error);
  
  // Extract reason from error
  if (error.reason) {
    return `Transaction failed: ${error.reason}`;
  }
  
  // Check for common error messages
  if (error.message) {
    // User rejected the transaction
    if (error.message.includes('user rejected') || error.message.includes('User denied')) {
      return 'Transaction was rejected in MetaMask';
    }
    
    // Insufficient funds
    if (error.message.includes('insufficient funds')) {
      return 'Insufficient ETH for this transaction. Please add funds to your wallet.';
    }
    
    // Execution reverted
    if (error.message.includes('execution reverted')) {
      const revertReason = error.message.match(/reverted: (.+?)(?:'|")/);
      return revertReason ? `Transaction reverted: ${revertReason[1]}` : 'Transaction reverted by the contract';
    }
    
    // Network/connection issues
    if (error.message.includes('network') || error.message.includes('connection')) {
      return 'Network connection issue. Please check your internet connection and try again.';
    }
    
    // Wrong network
    if (error.message.includes('network') && error.message.includes('chain')) {
      return `Please connect to the Hardhat localhost network (Chain ID: ${EXPECTED_CHAIN_ID})`;
    }
    
    // MetaMask not installed or locked
    if (error.message.includes('MetaMask')) {
      if (error.message.includes('locked')) {
        return 'MetaMask is locked. Please unlock your wallet and try again.';
      }
      if (error.message.includes('not installed')) {
        return 'MetaMask is not installed. Please install the MetaMask extension.';
      }
    }
    
    // Gas issues
    if (error.message.includes('gas')) {
      return 'Transaction failed due to gas estimation. The transaction might revert.';
    }
  }
  
  // Default error message
  return 'Transaction failed. Please check the console for more details.';
}

/**
 * Add Hardhat Network to MetaMask
 * @returns {Promise<boolean>} True if successful
 */
export async function addHardhatNetworkToMetaMask() {
  try {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed');
    }
    
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: '0x7A69', // 31337 in hex
        chainName: 'Hardhat Local',
        nativeCurrency: {
          name: 'Ethereum',
          symbol: 'ETH',
          decimals: 18
        },
        rpcUrls: ['http://127.0.0.1:8545/'],
        blockExplorerUrls: []
      }]
    });
    
    console.log('Hardhat network added successfully');
    return true;
  } catch (error) {
    console.error('Failed to add Hardhat network:', error);
    return false;
  }
}

// Add a function to verify Hardhat is running by pinging it
export async function verifyHardhatRunning() {
  try {
    // Try to connect to localhost:8545 which is the default Hardhat node
    const localProvider = new ethers.JsonRpcProvider('http://localhost:8545');
    
    // Simple check - try to get the block number
    const blockNumber = await localProvider.getBlockNumber();
    console.log('Hardhat node is running. Current block:', blockNumber);
    
    return {
      running: true,
      blockNumber
    };
  } catch (error) {
    console.error('Hardhat node connection failed:', error);
    return {
      running: false,
      error: error.message
    };
  }
}

/**
 * Push impact data to the oracle
 * @param {ethers.Signer} signer - The signer (must have oracle updater rights)
 * @param {number} deltaKwh - The kWh delta to add
 * @param {number} deltaCO2 - The CO2 delta to add
 * @returns {Promise<ethers.TransactionResponse>} The transaction response
 */
export async function pushImpactData(signer, deltaKwh, deltaCO2) {
  try {
    if (!signer) {
      throw new Error('Signer is required to push impact data');
    }
    
    // Get oracle contract with signer
    const { oracle } = getContracts(signer);
    
    // Send transaction
    return await oracle.pushImpact(
      ethers.getBigInt(deltaKwh), 
      ethers.getBigInt(deltaCO2)
    );
  } catch (error) {
    console.error('Push impact failed:', error);
    throw error;
  }
}

export const CONTRACT_ADDRESSES = {
  ESCROW_ADDRESS,
  BOND_TOKEN_ADDRESS,
  ORACLE_ADDRESS,
  UPDATER_ADDRESS
};

const contractUtils = {
  initializeProvider,
  getSigner,
  getContracts,
  getOracleWallet,
  formatContractData,
  formatMilestones,
  handleContractError,
  pushImpactData,
  CONTRACT_ADDRESSES
};

export default contractUtils;