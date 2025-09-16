// src/ContractEventMonitor.js
import { useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

/**
 * A component that listens for events from smart contracts and updates the UI
 * This is a "headless" component that doesn't render anything, it just sets up event listeners
 */
const ContractEventMonitor = ({ 
  contracts, 
  provider, 
  onTokenPurchased, 
  onImpactUpdated,
  onMilestoneReached,
  onFundsReleased 
}) => {
  const setupEventListeners = useCallback(async () => {
    if (!contracts || !provider || !contracts.escrow) {
      console.log('Contracts or provider not ready for event monitoring');
      return;
    }

    try {
      console.log('Setting up contract event listeners...');
      
      // Listen for token purchase events from escrow
      contracts.escrow.on('TokensPurchased', (buyer, amount, totalCost, event) => {
        console.log('TokensPurchased event detected:', {
          buyer,
          amount: ethers.formatUnits(amount, 18),
          totalCost: ethers.formatUnits(totalCost, 18),
          blockNumber: event.log.blockNumber
        });
        
        if (onTokenPurchased) {
          onTokenPurchased({
            buyer,
            amount: ethers.formatUnits(amount, 18),
            totalCost: ethers.formatUnits(totalCost, 18),
            timestamp: new Date().toISOString()
          });
        }
      });
      
      // Listen for impact updates from oracle
      if (contracts.oracle) {
        contracts.oracle.on('ImpactDataUpdated', (kwhValue, timestamp, event) => {
          console.log('ImpactDataUpdated event detected:', {
            kwhValue: ethers.formatUnits(kwhValue, 0),
            timestamp: new Date(Number(timestamp) * 1000).toISOString(),
            blockNumber: event.log.blockNumber
          });
          
          if (onImpactUpdated) {
            onImpactUpdated({
              kwhValue: ethers.formatUnits(kwhValue, 0),
              timestamp: new Date(Number(timestamp) * 1000).toISOString()
            });
          }
        });
      }
      
      // Listen for milestone reached events
      contracts.escrow.on('MilestoneReached', (index, threshold, releaseAmount, event) => {
        console.log('MilestoneReached event detected:', {
          index: Number(index),
          threshold: ethers.formatUnits(threshold, 0),
          releaseAmount: ethers.formatUnits(releaseAmount, 18),
          blockNumber: event.log.blockNumber
        });
        
        if (onMilestoneReached) {
          onMilestoneReached({
            index: Number(index),
            threshold: ethers.formatUnits(threshold, 0),
            releaseAmount: ethers.formatUnits(releaseAmount, 18),
            timestamp: new Date().toISOString()
          });
        }
      });
      
      // Listen for funds released events
      contracts.escrow.on('FundsReleased', (amount, event) => {
        console.log('FundsReleased event detected:', {
          amount: ethers.formatUnits(amount, 18),
          blockNumber: event.log.blockNumber
        });
        
        if (onFundsReleased) {
          onFundsReleased({
            amount: ethers.formatUnits(amount, 18),
            timestamp: new Date().toISOString()
          });
        }
      });
      
      console.log('Event listeners set up successfully');
    } catch (error) {
      console.error('Error setting up event listeners:', error);
    }
  }, [contracts, provider, onTokenPurchased, onImpactUpdated, onMilestoneReached, onFundsReleased]);

  // Set up event listeners when contracts and provider are available
  useEffect(() => {
    if (contracts && provider) {
      setupEventListeners();
    }
    
    // Clean up event listeners on unmount
    return () => {
      if (contracts && contracts.escrow) {
        console.log('Removing event listeners');
        contracts.escrow.removeAllListeners();
        if (contracts.oracle) {
          contracts.oracle.removeAllListeners();
        }
        if (contracts.bondToken) {
          contracts.bondToken.removeAllListeners();
        }
      }
    };
  }, [contracts, provider, setupEventListeners]);

  // This component doesn't render anything
  return null;
};

export default ContractEventMonitor;