// src/contractUtilsEnhanced.js
import { ethers } from 'ethers';

// Import ABIs from artifacts
import GreenBondEscrowArtifact from './Backend/artifacts/contracts/GreenBondEscrow.sol/GreenBondEscrow.json';
import BondTokenArtifact from './Backend/artifacts/contracts/BondToken.sol/BondToken.json';
import ImpactOracleArtifact from './Backend/artifacts/contracts/ImpactOracle.sol/ImpactOracle.json';

// Environment variables with properly configured fallbacks based on Hardhat deployment
const ESCROW_ADDRESS = process.env.REACT_APP_ESCROW_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3';
const ORACLE_ADDRESS = process.env.REACT_APP_ORACLE_ADDRESS || '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';
const UPDATER_ADDRESS = process.env.REACT_APP_UPDATER_ADDRESS || '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
const ISSUER_ADDRESS = process.env.REACT_APP_ISSUER_ADDRESS || '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
const EXPECTED_CHAIN_ID = process.env.REACT_APP_CHAIN_ID ? parseInt(process.env.REACT_APP_CHAIN_ID) : 31337;
const RPC_URL = process.env.REACT_APP_RPC_URL || 'http://127.0.0.1:8545';

/**
 * Verify if Hardhat node is running
 * @returns {Promise<boolean>} True if Hardhat node is running
 */
export async function verifyHardhatRunning() {
  try {
    const response = await fetch(RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        params: [],
        id: 1
      })
    });
    
    const data = await response.json();
    const blockNumber = parseInt(data.result, 16);
    
    console.log(`Hardhat node is running. Current block: ${blockNumber}`);
    return true;
  } catch (error) {
    console.error('Hardhat node is not running:', error);
    return false;
  }
}

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
 * @param {ethers.BrowserProvider} provider - Ethers provider
 * @returns {Promise<{signer: ethers.JsonRpcSigner, address: string}>}
 */
export async function getSigner(provider) {
  try {
    // Request accounts from MetaMask
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    
    // Get signer
    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    
    console.log('Connected accounts:', [address]);
    
    return { signer, address };
  } catch (error) {
    console.error('Failed to get signer:', error);
    throw new Error(`Failed to get signer: ${error.message}`);
  }
}

/**
 * Get initialized contract instances
 * @param {ethers.Signer|ethers.Provider} signerOrProvider - Signer or provider to connect contracts
 * @returns {Object} Contract instances
 */
export async function getContracts(signerOrProvider) {
  try {
    console.log('Creating contracts with addresses:', {
      escrow: ESCROW_ADDRESS,
      oracle: ORACLE_ADDRESS,
    });
    
    // Create escrow contract
    const escrow = new ethers.Contract(
      ESCROW_ADDRESS, 
      GreenBondEscrowArtifact.abi, 
      signerOrProvider
    );
    
    // Create oracle contract
    const oracle = new ethers.Contract(
      ORACLE_ADDRESS,
      ImpactOracleArtifact.abi,
      signerOrProvider
    );
    
    // Get token address from escrow
    let bondToken;
    try {
      const tokenAddress = await escrow.token();
      console.log('Bond token address from escrow:', tokenAddress);
      
      // Create bond token contract with the actual address
      bondToken = new ethers.Contract(
        tokenAddress,
        BondTokenArtifact.abi,
        signerOrProvider
      );
    } catch (error) {
      console.warn('Failed to get token address from escrow, using placeholder:', error);
      // Use a placeholder address
      bondToken = new ethers.Contract(
        '0x0000000000000000000000000000000000000000',
        BondTokenArtifact.abi,
        signerOrProvider
      );
    }
    
    return {
      escrow,
      bondToken,
      oracle
    };
  } catch (error) {
    console.error('Contract initialization failed:', error);
    throw new Error(`Contract initialization failed: ${error.message}`);
  }
}

/**
 * Handle contract error and return user-friendly message
 * @param {Error} error - Contract error
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
      if (revertReason && revertReason[1]) {
        return `Transaction reverted: ${revertReason[1]}`;
      }
    }
    
    // ABI decoding error (likely wrong contract address)
    if (error.message.includes('could not decode result data')) {
      return 'Could not decode contract data. Make sure contracts are properly deployed and addresses are correct.';
    }
  }
  
  // Default error message
  return `Transaction failed: ${error.message || 'Unknown error'}`;
}

/**
 * Add Hardhat network to MetaMask
 */
export async function addHardhatNetworkToMetaMask() {
  try {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: '0x7A69', // 31337 in hex
        chainName: 'Hardhat Local',
        nativeCurrency: {
          name: 'Ether',
          symbol: 'ETH',
          decimals: 18
        },
        rpcUrls: [RPC_URL],
        blockExplorerUrls: []
      }]
    });
    return true;
  } catch (error) {
    console.error('Failed to add Hardhat network to MetaMask:', error);
    return false;
  }
}

/**
 * Push impact data to oracle (for oracle updater)
 * @param {ethers.Signer} signer - Signer for transaction
 * @param {number} kwhValue - Impact value in kWh
 * @returns {Promise<{success: boolean, txHash: string}>}
 */
export async function pushImpactData(signer, kwhValue) {
  try {
    const contracts = await getContracts(signer);
    const oracle = contracts.oracle;
    
    // Check if signer is authorized updater
    const updater = await oracle.authorizedUpdater();
    const signerAddress = await signer.getAddress();
    
    if (updater.toLowerCase() !== signerAddress.toLowerCase()) {
      throw new Error('Not authorized to update impact data');
    }
    
    // Execute transaction
    const tx = await oracle.updateImpactData(
      ethers.parseUnits(kwhValue.toString(), 0),
      Math.floor(Date.now() / 1000)
    );
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    
    return {
      success: true,
      txHash: receipt.hash
    };
  } catch (error) {
    console.error('Push impact data failed:', error);
    throw error;
  }
}

/**
 * Fetch contract data from blockchain
 * @param {ethers.Signer|ethers.Provider} signerOrProvider - Signer or provider to connect contracts
 * @returns {Promise<Object>} Contract data
 */
export async function fetchContractData(signerOrProvider) {
  try {
    const contracts = await getContracts(signerOrProvider);
    const { escrow, bondToken, oracle } = contracts;
    
    // Get wallet address if signer is provided
    let walletAddress = '';
    let isIssuer = false;
    let isUpdater = false;
    
    if ('getAddress' in signerOrProvider) {
      walletAddress = await signerOrProvider.getAddress();
    }
    
    // Fetch basic token data
    const tokenAddress = await escrow.token();
    const priceWeiPerToken = await escrow.priceWeiPerToken();
    const capTokens = await escrow.capTokens();
    const tokensSold = await escrow.tokensSold();
    const issuer = await escrow.issuer();
    const saleEnd = await escrow.saleEnd();
    
    // Check if wallet is issuer
    if (walletAddress) {
      isIssuer = issuer.toLowerCase() === walletAddress.toLowerCase();
      isUpdater = (await oracle.authorizedUpdater()).toLowerCase() === walletAddress.toLowerCase();
    }
    
    // Get user balance if wallet is connected
    let balanceOf = ethers.parseUnits('0', 18);
    if (walletAddress) {
      balanceOf = await bondToken.balanceOf(walletAddress);
    }
    
    // Get impact data
    const cumulativeKwh = await oracle.cumulativeKwh();
    
    // Get milestone data
    const milestonesCount = await escrow.getMilestonesCount();
    const milestones = [];
    
    for (let i = 0; i < milestonesCount; i++) {
      const milestone = await escrow.milestones(i);
      milestones.push({
        threshold: milestone.threshold,
        releaseAmount: milestone.releaseAmount,
        released: milestone.released
      });
    }
    
    // Calculate impact metrics
    const co2Reduced = Number(cumulativeKwh) * 0.6; // Example conversion factor
    const treesEquivalent = co2Reduced / 30; // Example conversion factor
    
    // Return formatted data
    return {
      tokenAddress,
      priceWeiPerToken,
      priceEthPerToken: ethers.formatEther(priceWeiPerToken),
      balanceOf,
      bondBalance: ethers.formatUnits(balanceOf, 18),
      tokensSold,
      tokensSoldFormatted: ethers.formatUnits(tokensSold, 18),
      capTokens,
      capTokensFormatted: ethers.formatUnits(capTokens, 18),
      issuer,
      isIssuer,
      isUpdater,
      saleEnd: Number(saleEnd),
      cumulativeKwh: Number(cumulativeKwh),
      milestonesCount: Number(milestonesCount),
      milestones,
      environmentalImpact: {
        co2Reduced,
        treesEquivalent,
        energySaved: Number(cumulativeKwh)
      },
      progressPercentage: (Number(tokensSold) * 100) / Number(capTokens)
    };
  } catch (error) {
    console.error('Error fetching contract data:', error);
    throw error;
  }
}

// Export all functions
export default {
  verifyHardhatRunning,
  initializeProvider,
  getSigner,
  getContracts,
  handleContractError,
  addHardhatNetworkToMetaMask,
  pushImpactData,
  fetchContractData
};