import React, { useState, useEffect } from 'react';
import { 
  Info, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  Wallet, 
  DollarSign, 
  Leaf, 
  BarChart3,
  Lock,
  CheckCircle
} from 'lucide-react';

const Onboarding = ({ onComplete, isOpen = true }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [visible, setVisible] = useState(isOpen);
  
  useEffect(() => {
    // Check if the user has seen the onboarding before
    const hasSeenOnboarding = localStorage.getItem('ecofi_hasSeenOnboarding');
    if (hasSeenOnboarding) {
      setVisible(false);
    }
  }, []);
  
  const completeOnboarding = () => {
    // Save to localStorage to not show again
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
            <div className="h-24 w-24 bg-gradient-to-br from-eco-green to-eco-blue rounded-full flex items-center justify-center">
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
            <div className="h-20 w-20 bg-gradient-to-br from-eco-purple to-eco-indigo rounded-full flex items-center justify-center">
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
    },
    {
      title: 'Investing in Green Bonds',
      content: (
        <div>
          <div className="flex justify-center mb-6">
            <div className="h-20 w-20 bg-gradient-to-br from-eco-green to-eco-blue rounded-full flex items-center justify-center">
              <DollarSign className="h-10 w-10 text-white" />
            </div>
          </div>
          <p className="text-white/80 font-inter mb-4">
            Investing in green bonds is simple. Enter the amount of tokens you want to purchase and confirm the transaction in your wallet.
          </p>
          <div className="bg-black/20 p-4 rounded-lg mb-4">
            <h4 className="font-montserrat font-semibold text-white mb-2">How It Works:</h4>
            <ol className="list-decimal list-inside text-white/80 font-inter text-sm space-y-2">
              <li>Select the number of bond tokens you want to purchase</li>
              <li>Review the cost in ETH and projected environmental impact</li>
              <li>Confirm the transaction in your wallet</li>
              <li>Your bond tokens will appear in your portfolio once confirmed</li>
            </ol>
          </div>
        </div>
      ),
      icon: <DollarSign />
    },
    {
      title: 'Milestone-Based Returns',
      content: (
        <div>
          <div className="flex justify-center mb-6">
            <div className="h-20 w-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
              <BarChart3 className="h-10 w-10 text-white" />
            </div>
          </div>
          <p className="text-white/80 font-inter mb-4">
            Green bonds pay returns when energy production milestones are achieved. Each milestone unlocks a portion of the returns for investors.
          </p>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-black/20 p-3 rounded-lg">
              <h5 className="font-montserrat font-semibold text-white text-sm mb-1">Real Impact</h5>
              <p className="text-white/70 font-inter text-xs">
                Returns are tied to actual environmental impact measured in kilowatt-hours of clean energy produced.
              </p>
            </div>
            <div className="bg-black/20 p-3 rounded-lg">
              <h5 className="font-montserrat font-semibold text-white text-sm mb-1">Transparent</h5>
              <p className="text-white/70 font-inter text-xs">
                All milestones and energy production data are recorded on the blockchain for complete transparency.
              </p>
            </div>
          </div>
        </div>
      ),
      icon: <BarChart3 />
    },
    {
      title: 'Track Your Impact',
      content: (
        <div>
          <div className="flex justify-center mb-6">
            <div className="h-20 w-20 bg-gradient-to-br from-eco-purple to-eco-indigo rounded-full flex items-center justify-center">
              <Leaf className="h-10 w-10 text-white" />
            </div>
          </div>
          <p className="text-white/80 font-inter mb-4">
            Monitor the environmental impact of your investment in real-time. See how your contribution is helping to reduce CO₂ emissions and produce clean energy.
          </p>
          <div className="bg-black/20 p-4 rounded-lg mb-4">
            <h4 className="font-montserrat font-semibold text-white mb-2">Key Features:</h4>
            <ul className="list-disc list-inside text-white/80 font-inter text-sm space-y-2">
              <li>Real-time impact dashboard with visualizations</li>
              <li>Downloadable impact certificates</li>
              <li>Milestone progress tracking</li>
              <li>CO₂ offset and trees equivalent metrics</li>
            </ul>
          </div>
        </div>
      ),
      icon: <Leaf />
    },
    {
      title: "You're Ready to Go!",
      content: (
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="h-24 w-24 bg-gradient-to-br from-eco-green to-eco-blue rounded-full flex items-center justify-center">
              <Lock className="h-12 w-12 text-white" />
            </div>
          </div>
          <p className="text-white/80 font-inter mb-6">
            You're all set to start investing in green bonds and making a positive environmental impact while earning returns.
          </p>
          <div className="bg-eco-green/20 p-4 rounded-lg inline-block">
            <p className="text-white font-montserrat font-semibold">
              Thank you for supporting sustainable energy projects!
            </p>
          </div>
        </div>
      ),
      icon: <CheckCircle />
    }
  ];
  
  if (!visible) return null;
  
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center px-4">
      <div className="w-full max-w-2xl bg-gradient-to-br from-eco-slate-900 to-eco-slate-900/90 rounded-xl shadow-2xl border border-white/10 overflow-hidden">
        {/* Progress bar */}
        <div className="h-1.5 bg-white/10 w-full">
          <div 
            className="h-full bg-gradient-to-r from-eco-green to-eco-blue transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          ></div>
        </div>
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/10">
          <h2 className="text-xl font-montserrat font-bold text-white flex items-center">
            {steps[currentStep].icon && (
              <span className="mr-2 text-eco-green">{steps[currentStep].icon}</span>
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
        
        {/* Content */}
        <div className="p-8">
          {steps[currentStep].content}
        </div>
        
        {/* Footer */}
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
                  idx === currentStep ? 'bg-eco-green' : 'bg-white/20'
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
            className="flex items-center bg-gradient-to-r from-eco-green to-eco-blue text-white font-montserrat font-semibold py-2 px-4 rounded-lg hover:opacity-90 transition-all"
          >
            {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
            <ChevronRight className="ml-1 h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;