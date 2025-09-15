import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { 
  DollarSign, 
  TrendingUp, 
  Leaf, 
  BarChart3,
  Info 
} from 'lucide-react';
import GlassCard from './GlassCard';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart, 
  Area
} from 'recharts';

const InvestmentSimulator = ({ tokenPrice, currentImpact, cumulativeKwh }) => {
  const [simAmount, setSimAmount] = useState(100);
  const [costInEth, setCostInEth] = useState('0');
  const [projectedImpact, setProjectedImpact] = useState({
    kwh: 0,
    co2Offset: 0,
    treesEquivalent: 0
  });
  const [projectedData, setProjectedData] = useState([]);

  // Calculate the investment cost and projected impact
  const calculateInvestment = useCallback(() => {
    if (!tokenPrice || tokenPrice === '0') return;
    
    // Calculate cost in ETH
    const cost = parseFloat(simAmount) * parseFloat(tokenPrice);
    setCostInEth(cost.toFixed(4));
    
    // Calculate projected impact based on user's share of the total supply
    // This is a simplified calculation - you'd want to use actual project metrics
    const totalSupply = 1000000; // Example value, get from contract
    const userShare = simAmount / totalSupply;
    
    // Calculate projected impact metrics
    const projectedKwh = cumulativeKwh * userShare * 3; // 3x multiplier for projection
    const co2PerKwh = 0.7; // Average CO2 offset per kWh (kg)
    const treesPerTon = 20; // Trees equivalent to 1 ton of CO2
    
    setProjectedImpact({
      kwh: projectedKwh.toFixed(2),
      co2Offset: (projectedKwh * co2PerKwh / 1000).toFixed(2), // Convert to tons
      treesEquivalent: Math.round((projectedKwh * co2PerKwh / 1000) * treesPerTon)
    });
    
    // Generate projection data for charts
    const data = [];
    const months = 12;
    let cumulativeKwhValue = cumulativeKwh;
    
    for (let i = 0; i < months; i++) {
      const monthGrowth = (cumulativeKwhValue * 0.15) * userShare; // 15% monthly growth
      cumulativeKwhValue += monthGrowth;
      
      data.push({
        month: i + 1,
        kwh: cumulativeKwhValue * userShare,
        co2: (cumulativeKwhValue * userShare * co2PerKwh / 1000).toFixed(2),
        trees: Math.round((cumulativeKwhValue * userShare * co2PerKwh / 1000) * treesPerTon)
      });
    }
    
    setProjectedData(data);
  }, [simAmount, tokenPrice, cumulativeKwh]);

  // Update calculations when inputs change
  useEffect(() => {
    calculateInvestment();
  }, [simAmount, tokenPrice, cumulativeKwh, calculateInvestment]);

  return (
    <GlassCard className="p-6 mb-8" animatedBorder>
      <h2 className="text-2xl font-montserrat font-bold text-white mb-4 flex items-center">
        <TrendingUp className="mr-2 text-eco-green" />
        Investment Simulator
      </h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="mb-6">
            <label className="block text-white font-inter mb-2">
              Bond Token Amount
            </label>
            <div className="relative">
              <input
                type="number"
                value={simAmount}
                onChange={(e) => setSimAmount(Math.max(0, e.target.value))}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white font-mono focus:outline-none focus:ring-2 focus:ring-eco-green transition-all"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className="text-white/70 font-mono">TOKENS</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-white/70 text-sm font-inter mb-1">Cost in ETH</div>
              <div className="text-white text-2xl font-mono font-semibold flex items-center">
                <DollarSign className="w-5 h-5 mr-1 text-eco-green" />
                {costInEth}
              </div>
            </div>
            
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-white/70 text-sm font-inter mb-1">Your Share</div>
              <div className="text-white text-2xl font-mono font-semibold">
                {((simAmount / 1000000) * 100).toFixed(2)}%
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-white/70 text-sm font-inter mb-1">Energy Generated</div>
              <div className="text-white text-xl font-mono font-semibold flex items-center">
                <BarChart3 className="w-4 h-4 mr-1 text-eco-blue" />
                {projectedImpact.kwh} kWh
              </div>
            </div>
            
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-white/70 text-sm font-inter mb-1">CO₂ Offset</div>
              <div className="text-white text-xl font-mono font-semibold flex items-center">
                <Leaf className="w-4 h-4 mr-1 text-eco-green" />
                {projectedImpact.co2Offset} tons
              </div>
            </div>
            
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-white/70 text-sm font-inter mb-1">Trees Equivalent</div>
              <div className="text-white text-xl font-mono font-semibold">
                🌳 {projectedImpact.treesEquivalent}
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <div className="text-white font-inter mb-2 flex items-center">
            <Info className="w-4 h-4 mr-1 text-eco-purple" />
            <span>Projected Environmental Impact</span>
          </div>
          
          <div className="h-64 bg-white/5 rounded-lg p-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={projectedData}>
                <defs>
                  <linearGradient id="colorKwh" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="month" 
                  label={{ value: 'Months', position: 'insideBottom', offset: -5 }} 
                  stroke="rgba(255,255,255,0.5)"
                />
                <YAxis stroke="rgba(255,255,255,0.5)" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                    color: 'white'
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="kwh" 
                  stroke="#10B981" 
                  fillOpacity={1} 
                  fill="url(#colorKwh)" 
                  name="Energy (kWh)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-2 text-xs text-white/60 font-inter">
            Projected values based on current project performance and average growth rates.
            Actual results may vary.
          </div>
        </div>
      </div>
    </GlassCard>
  );
};

export default InvestmentSimulator;