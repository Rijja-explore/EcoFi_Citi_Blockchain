import React from 'react';
import { AlertTriangle, Info, HelpCircle, ExternalLink, RefreshCw } from 'lucide-react';
import GlassCard from './GlassCard';

const ErrorHandler = ({ 
  error, 
  type = 'contract', 
  onRetry = null,
  onDismiss = null,
  showDetails = false 
}) => {
  // Parse error to provide user-friendly messages
  const getErrorInfo = () => {
    if (!error) return {
      title: 'Unknown Error',
      message: 'An unexpected error occurred.',
      suggestion: 'Please try again later or contact support.',
      code: 'ERR_UNKNOWN'
    };
    
    // Extract error message
    let errorMessage = '';
    if (typeof error === 'string') {
      errorMessage = error;
    } else if (error.message) {
      errorMessage = error.message;
    } else if (error.reason) {
      errorMessage = error.reason;
    }
    
    // Contract errors
    if (type === 'contract') {
      if (errorMessage.includes('insufficient funds') || errorMessage.includes('insufficient balance')) {
        return {
          title: 'Insufficient Funds',
          message: 'You don\'t have enough ETH to complete this transaction.',
          suggestion: 'Add more funds to your wallet or reduce the amount you\'re trying to spend.',
          code: 'ERR_INSUFFICIENT_FUNDS'
        };
      } else if (errorMessage.includes('user rejected')) {
        return {
          title: 'Transaction Rejected',
          message: 'You rejected the transaction in your wallet.',
          suggestion: 'You need to confirm the transaction in your wallet to proceed.',
          code: 'ERR_USER_REJECTED'
        };
      } else if (errorMessage.includes('gas')) {
        return {
          title: 'Gas Estimation Failed',
          message: 'The transaction might fail or require more gas than expected.',
          suggestion: 'Try again with a higher gas limit or contact support for assistance.',
          code: 'ERR_GAS_ESTIMATION'
        };
      } else if (errorMessage.includes('nonce')) {
        return {
          title: 'Transaction Nonce Error',
          message: 'There was an issue with the transaction sequence number.',
          suggestion: 'Reset your wallet\'s transaction history or try again later.',
          code: 'ERR_NONCE'
        };
      } else if (errorMessage.includes('execution reverted')) {
        const revertReason = errorMessage.includes(':') 
          ? errorMessage.split(':')[1].trim() 
          : 'Contract execution reverted';
          
        return {
          title: 'Smart Contract Error',
          message: `The transaction was rejected by the smart contract: "${revertReason}"`,
          suggestion: 'Check if you meet all the requirements for this action, or contact support.',
          code: 'ERR_CONTRACT_REVERT'
        };
      }
    }
    
    // Wallet/connection errors
    if (type === 'wallet') {
      if (errorMessage.includes('wallet_requestPermissions')) {
        return {
          title: 'Wallet Connection Error',
          message: 'Unable to connect to your wallet.',
          suggestion: 'Make sure your wallet is unlocked and you have granted permission to this site.',
          code: 'ERR_WALLET_PERMISSIONS'
        };
      } else if (errorMessage.includes('network') || errorMessage.includes('chain')) {
        return {
          title: 'Network Error',
          message: 'You\'re connected to the wrong network.',
          suggestion: 'Please switch to the correct network in your wallet.',
          code: 'ERR_NETWORK'
        };
      } else if (errorMessage.includes('MetaMask')) {
        return {
          title: 'MetaMask Error',
          message: 'There was an issue with MetaMask.',
          suggestion: 'Try refreshing the page or restarting your browser.',
          code: 'ERR_METAMASK'
        };
      }
    }
    
    // Generic errors
    return {
      title: 'Operation Failed',
      message: errorMessage || 'An unexpected error occurred.',
      suggestion: 'Please try again or contact support if the issue persists.',
      code: 'ERR_GENERIC'
    };
  };
  
  const errorInfo = getErrorInfo();
  
  return (
    <GlassCard className="p-6 border border-red-500/30 shadow-xl">
      <div className="flex items-start">
        <div className="flex-shrink-0 mr-4">
          <AlertTriangle className="h-10 w-10 text-red-500" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-montserrat font-semibold text-white mb-2">
            {errorInfo.title}
          </h3>
          <p className="text-white/80 font-inter mb-4">
            {errorInfo.message}
          </p>
          
          <div className="bg-white/5 rounded-lg p-4 mb-4 flex items-start">
            <Info className="h-5 w-5 text-eco-blue mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-white/70 text-sm font-inter">
              <span className="font-semibold">Suggestion:</span> {errorInfo.suggestion}
            </p>
          </div>
          
          {showDetails && (
            <div className="mb-4 font-mono text-xs bg-black/30 p-3 rounded-lg text-white/60 overflow-x-auto">
              <div className="mb-1 text-white/40">Error Code: {errorInfo.code}</div>
              <pre>{JSON.stringify(error, null, 2)}</pre>
            </div>
          )}
          
          <div className="flex flex-wrap gap-3 mt-4">
            {onRetry && (
              <button
                onClick={onRetry}
                className="flex items-center bg-gradient-to-r from-eco-green to-eco-blue text-white font-montserrat font-semibold py-2 px-4 rounded-lg hover:opacity-90 transition-all"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </button>
            )}
            
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="flex items-center bg-white/10 text-white font-montserrat font-semibold py-2 px-4 rounded-lg hover:bg-white/20 transition-all"
              >
                Dismiss
              </button>
            )}
            
            <a
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center bg-white/10 text-white font-montserrat font-semibold py-2 px-4 rounded-lg hover:bg-white/20 transition-all ml-auto"
            >
              <HelpCircle className="mr-2 h-4 w-4" />
              Get Support
            </a>
            
            <a
              href="https://ethereum.org/en/developers/docs/networks/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center bg-white/10 text-white font-montserrat font-semibold py-2 px-4 rounded-lg hover:bg-white/20 transition-all"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Learn More
            </a>
          </div>
        </div>
      </div>
    </GlassCard>
  );
};

export default ErrorHandler;