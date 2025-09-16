// src/mockContractData.js
import { ethers } from 'ethers';

// Mock contract data with initial values
let mockData = {
  // Bond token data
  tokenPrice: ethers.parseEther('0.01'), // 0.01 ETH per token
  bondBalance: ethers.parseEther('100'), // 100 tokens
  tokensSold: ethers.parseEther('5000'), // 5,000 tokens sold
  capTokens: ethers.parseEther('1000000'), // 1M tokens cap
  
  // Financial data
  totalRaised: ethers.parseEther('50'), // 50 ETH raised
  totalReleased: ethers.parseEther('12.5'), // 12.5 ETH released
  
  // Impact data
  cumulativeKwh: 7500, // 7,500 kWh produced
  cumulativeCO2: 5250, // 5,250 kg CO2 reduced
  
  // Sale timeline
  saleStart: Math.floor(Date.now() / 1000) - 86400, // 1 day ago
  saleEnd: Math.floor(Date.now() / 1000) + 604800, // 7 days from now
  
  // Issuer data
  issuerAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', // First hardhat account
  
  // Milestone data
  milestonesCount: 4,
  milestones: [
    {
      threshold: 1000,
      releaseBps: 2500, // 25%
      achieved: true,
      achievedAt: Math.floor(Date.now() / 1000) - 86400 * 2
    },
    {
      threshold: 5000,
      releaseBps: 2500, // 25%
      achieved: true, 
      achievedAt: Math.floor(Date.now() / 1000) - 86400
    },
    {
      threshold: 10000,
      releaseBps: 2500, // 25%
      achieved: false,
      achievedAt: 0
    },
    {
      threshold: 20000,
      releaseBps: 2500, // 25%
      achieved: false,
      achievedAt: 0
    }
  ],
  
  // Transaction history
  transactionHistory: [
    {
      type: 'purchase',
      amount: ethers.parseEther('25'),
      tokens: ethers.parseEther('2500'),
      timestamp: Math.floor(Date.now() / 1000) - 86400 * 3,
      txHash: '0x' + '1'.repeat(64)
    },
    {
      type: 'purchase',
      amount: ethers.parseEther('25'),
      tokens: ethers.parseEther('2500'),
      timestamp: Math.floor(Date.now() / 1000) - 86400 * 2,
      txHash: '0x' + '2'.repeat(64)
    },
    {
      type: 'milestone',
      milestone: 0,
      amount: ethers.parseEther('12.5'),
      timestamp: Math.floor(Date.now() / 1000) - 86400 * 2,
      txHash: '0x' + '3'.repeat(64)
    }
  ]
};

// Simulated real-time growth rates
const GROWTH_RATES = {
  kwhPerHour: 20, // 20 kWh per hour
  co2PerKwh: 0.7, // 0.7 kg CO2 per kWh
  purchaseChance: 0.2, // 20% chance of a purchase per update
  maxPurchaseTokens: 1000, // Max tokens per purchase
};

// Last update timestamp
let lastUpdateTime = Date.now();

// Simulates time-based changes to the data
function updateMockData() {
  const now = Date.now();
  const hoursPassed = (now - lastUpdateTime) / (1000 * 60 * 60);
  lastUpdateTime = now;
  
  if (hoursPassed <= 0) return mockData;
  
  // Update impact metrics based on time
  const deltaKwh = Math.round(GROWTH_RATES.kwhPerHour * hoursPassed);
  const deltaCO2 = Math.round(deltaKwh * GROWTH_RATES.co2PerKwh);
  
  mockData.cumulativeKwh += deltaKwh;
  mockData.cumulativeCO2 += deltaCO2;
  
  // Check for milestone achievements
  mockData.milestones.forEach((milestone, index) => {
    if (!milestone.achieved && mockData.cumulativeKwh >= milestone.threshold) {
      milestone.achieved = true;
      milestone.achievedAt = Math.floor(now / 1000);
      
      // Calculate release amount
      const releaseAmount = ethers.parseEther(
        (Number(ethers.formatEther(mockData.totalRaised)) * (milestone.releaseBps / 10000)).toFixed(18)
      );
      
      // Update released funds
      mockData.totalReleased = mockData.totalReleased + releaseAmount;
      
      // Add to transaction history
      mockData.transactionHistory.push({
        type: 'milestone',
        milestone: index,
        amount: releaseAmount,
        timestamp: Math.floor(now / 1000),
        txHash: '0x' + Math.random().toString(16).substring(2, 10).repeat(8)
      });
    }
  });
  
  // Random purchases (chance-based)
  if (Math.random() < GROWTH_RATES.purchaseChance * hoursPassed) {
    const tokenAmount = ethers.parseEther(
      (Math.random() * GROWTH_RATES.maxPurchaseTokens).toFixed(2)
    );
    const ethAmount = tokenAmount * mockData.tokenPrice / ethers.parseEther('1');
    
    mockData.tokensSold = mockData.tokensSold + tokenAmount;
    mockData.totalRaised = mockData.totalRaised + ethAmount;
    
    // Add to transaction history
    mockData.transactionHistory.push({
      type: 'purchase',
      amount: ethAmount,
      tokens: tokenAmount,
      timestamp: Math.floor(now / 1000),
      txHash: '0x' + Math.random().toString(16).substring(2, 10).repeat(8)
    });
  }
  
  return mockData;
}

// Get the current mock data (including time-based updates)
export function getMockData() {
  return updateMockData();
}

// Simulate a bond purchase
export function mockPurchaseBonds(tokenAmount) {
  // Calculate cost
  const amount = ethers.parseEther(tokenAmount);
  const cost = amount * mockData.tokenPrice / ethers.parseEther('1');
  
  // Update state
  mockData.tokensSold = mockData.tokensSold + amount;
  mockData.totalRaised = mockData.totalRaised + cost;
  mockData.bondBalance = mockData.bondBalance + amount;
  
  // Add to transaction history
  mockData.transactionHistory.push({
    type: 'purchase',
    amount: cost,
    tokens: amount,
    timestamp: Math.floor(Date.now() / 1000),
    txHash: '0x' + Math.random().toString(16).substring(2, 10).repeat(8)
  });
  
  return {
    hash: '0x' + Math.random().toString(16).substring(2, 10).repeat(8)
  };
}

// Simulate a manual impact data push
export function mockPushImpactData(deltaKwh, deltaCO2) {
  const kwh = parseInt(deltaKwh, 10);
  const co2 = parseInt(deltaCO2, 10) || Math.round(kwh * GROWTH_RATES.co2PerKwh);
  
  mockData.cumulativeKwh += kwh;
  mockData.cumulativeCO2 += co2;
  
  // Check for milestone achievements
  mockData.milestones.forEach((milestone, index) => {
    if (!milestone.achieved && mockData.cumulativeKwh >= milestone.threshold) {
      milestone.achieved = true;
      milestone.achievedAt = Math.floor(Date.now() / 1000);
      
      // Calculate release amount
      const releaseAmount = ethers.parseEther(
        (Number(ethers.formatEther(mockData.totalRaised)) * (milestone.releaseBps / 10000)).toFixed(18)
      );
      
      // Update released funds
      mockData.totalReleased = mockData.totalReleased + releaseAmount;
      
      // Add to transaction history
      mockData.transactionHistory.push({
        type: 'milestone',
        milestone: index,
        amount: releaseAmount,
        timestamp: Math.floor(Date.now() / 1000),
        txHash: '0x' + Math.random().toString(16).substring(2, 10).repeat(8)
      });
    }
  });
  
  return {
    hash: '0x' + Math.random().toString(16).substring(2, 10).repeat(8)
  };
}

// Export formatted values ready for UI consumption
export function getFormattedMockData() {
  const data = getMockData();
  
  return {
    tokenPrice: ethers.formatEther(data.tokenPrice),
    bondBalance: ethers.formatEther(data.bondBalance),
    tokensSold: ethers.formatEther(data.tokensSold),
    capTokens: ethers.formatEther(data.capTokens),
    totalRaised: ethers.formatEther(data.totalRaised),
    totalReleased: ethers.formatEther(data.totalReleased),
    cumulativeKwh: data.cumulativeKwh,
    cumulativeCO2: data.cumulativeCO2,
    saleStart: data.saleStart,
    saleEnd: data.saleEnd,
    issuerAddress: data.issuerAddress,
    milestones: data.milestones,
    transactionHistory: data.transactionHistory.map(tx => ({
      ...tx,
      amount: tx.amount ? ethers.formatEther(tx.amount) : '0',
      tokens: tx.tokens ? ethers.formatEther(tx.tokens) : '0'
    })).sort((a, b) => b.timestamp - a.timestamp) // Sort by newest first
  };
}

export default {
  getMockData,
  getFormattedMockData,
  mockPurchaseBonds,
  mockPushImpactData
};