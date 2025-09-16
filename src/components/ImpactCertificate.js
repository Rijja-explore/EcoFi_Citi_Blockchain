import React, { useState } from 'react';
import { Download, Shield, CheckCircle, FileText } from 'lucide-react';
import GlassCard from './GlassCard';

const ImpactCertificate = ({ bondBalance, address, cumulativeKwh, escrowAddress }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  
  // In a real implementation, this would use react-pdf to generate a downloadable PDF
  const generateCertificate = () => {
    setIsGenerating(true);
    
    // Simulate PDF generation
    setTimeout(() => {
      setIsGenerating(false);
      
      // Create a mock download link
      const link = document.createElement('a');
      link.href = '#';
      link.setAttribute('download', `EcoFi_Impact_Certificate_${address.substring(0, 6)}.pdf`);
      link.click();
      
      // Show success toast
      // In the real implementation, you would trigger a toast notification here
    }, 2000);
  };
  
  // Calculate impact based on user's share
  const calculatePersonalImpact = () => {
    // This is a simplified calculation
    const totalSupply = 1000000; // Example value, get from contract
    const userShare = parseFloat(bondBalance) / totalSupply;
    
    const personalKwh = cumulativeKwh * userShare;
    const co2PerKwh = 0.7; // Average CO2 offset per kWh (kg)
    const treesPerTon = 20; // Trees equivalent to 1 ton of CO2
    
    return {
      kwh: personalKwh.toFixed(2),
      co2: (personalKwh * co2PerKwh / 1000).toFixed(2), // Convert to tons
      trees: Math.round((personalKwh * co2PerKwh / 1000) * treesPerTon)
    };
  };
  
  const impact = calculatePersonalImpact();
  
  return (
    <GlassCard className="p-6" gradientBorder>
      <h2 className="text-2xl font-montserrat font-bold text-white mb-4 flex items-center">
        <FileText className="mr-2 text-eco-green" />
        Impact Certificate
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white/5 rounded-lg p-4">
          <div className="text-white/70 text-sm font-inter mb-1">Your Energy Contribution</div>
          <div className="text-white text-xl font-mono font-semibold">
            {impact.kwh} kWh
          </div>
        </div>
        
        <div className="bg-white/5 rounded-lg p-4">
          <div className="text-white/70 text-sm font-inter mb-1">CO₂ Offset</div>
          <div className="text-white text-xl font-mono font-semibold">
            {impact.co2} tons
          </div>
        </div>
        
        <div className="bg-white/5 rounded-lg p-4">
          <div className="text-white/70 text-sm font-inter mb-1">Trees Equivalent</div>
          <div className="text-white text-xl font-mono font-semibold">
            {impact.trees} trees
          </div>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row justify-between items-center bg-white/5 rounded-lg p-4 mb-4">
        <div className="mb-4 md:mb-0">
          <div className="text-white/70 text-sm font-inter mb-1">Certificate ID</div>
          <div className="text-white font-mono">
            ECOFI-{address.substring(2, 10)}-{Math.floor(Date.now() / 1000).toString(16)}
          </div>
        </div>
        
        <div className="flex items-center text-white/70 text-sm font-inter">
          <Shield className="w-4 h-4 mr-1 text-eco-purple" />
          <span>Verified on Blockchain</span>
          <CheckCircle className="w-4 h-4 ml-2 text-eco-green" />
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4">
        <button
          onClick={generateCertificate}
          disabled={isGenerating || parseFloat(bondBalance) === 0}
          className={`w-full md:w-auto flex items-center justify-center bg-gradient-to-r from-eco-green to-eco-blue text-white font-montserrat font-semibold py-3 px-6 rounded-lg transition-all hover:opacity-90 ${
            isGenerating || parseFloat(bondBalance) === 0 ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isGenerating ? (
            <>
              <div className="animate-spin mr-2 h-5 w-5 border-t-2 border-b-2 border-white rounded-full"></div>
              Generating...
            </>
          ) : (
            <>
              <Download className="mr-2 h-5 w-5" />
              Download Certificate
            </>
          )}
        </button>
        
        <button
          className="w-full md:w-auto flex items-center justify-center bg-white/10 text-white font-montserrat font-semibold py-3 px-6 rounded-lg transition-all hover:bg-white/20"
        >
          <FileText className="mr-2 h-5 w-5" />
          View Sample
        </button>
      </div>
      
      {parseFloat(bondBalance) === 0 && (
        <div className="mt-4 text-amber-400 text-sm font-inter flex items-center">
          <AlertTriangle className="w-4 h-4 mr-1" />
          You need to hold bond tokens to generate a certificate.
        </div>
      )}
    </GlassCard>
  );
};

export default ImpactCertificate;