import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import {
  Wallet, CheckCircle, AlertTriangle, RefreshCw, Lock,
  Award, Flame, BarChart3, Leaf, Globe,
  Zap, DollarSign, TrendingUp, Database,
  CheckCircle2, Sparkles, Wind, Lightbulb, Plus, Building2,
  Clock, Target
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
import BondFactoryArtifact from './Backend/artifacts/contracts/BondFactory.sol/BondFactory.json';
import GreenBondEscrowArtifact from './Backend/artifacts/contracts/GreenBondEscrow.sol/GreenBondEscrow.json';
import ImpactOracleArtifact from './Backend/artifacts/contracts/ImpactOracle.sol/ImpactOracle.json';

// Investment Modal Component
// Reusable Project Selector Component
const ProjectSelector = ({ projects, selectedProject, onProjectSelect, className = "" }) => {
  return (
    <div className={`space-y-3 ${className}`}>
      <h3 className="text-lg font-semibold text-white mb-3">📋 Select Project</h3>
      {projects.length === 0 ? (
        <div className="text-center py-8 bg-white/5 backdrop-blur-md rounded-xl border border-white/20">
          <Building2 size={48} className="text-gray-400 mx-auto mb-4" />
          <div className="text-white text-sm mb-2">No Projects Available</div>
          <div className="text-gray-400 text-xs">Projects will appear here once created</div>
        </div>
      ) : (
        projects.map((project) => (
          <div
            key={project.id}
            onClick={() => onProjectSelect(project)}
            className={`p-4 rounded-lg border cursor-pointer transition-all duration-300 ${
              selectedProject?.id === project.id
                ? 'bg-white/20 border-green-400 shadow-lg'
                : 'bg-white/10 border-white/20 hover:bg-white/15'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <h4 className="text-white font-medium">{project.projectName}</h4>
              <div className={`px-2 py-1 rounded text-xs ${
                project.saleClosed ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'
              }`}>
                {project.saleClosed ? 'Active' : 'Sale Open'}
              </div>
            </div>
            <div className="text-gray-300 text-sm mb-2">{project.description}</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-400">💰 Token Price:</span>
                <div className="text-white">{project.priceWeiPerToken ? ethers.formatEther(project.priceWeiPerToken) : '0'} ETH</div>
              </div>
              <div>
                <span className="text-gray-400">📈 Total Raised:</span>
                <div className="text-white">{project.totalRaised ? ethers.formatEther(project.totalRaised) : '0'} ETH</div>
              </div>
              <div>
                <span className="text-gray-400">🌟 Impact Score:</span>
                <div className="text-white">
                  {project.cumulativeMetric && project.totalRaised
                    ? Math.min(100, Math.round(parseFloat(project.cumulativeMetric) / parseFloat(ethers.formatEther(project.totalRaised)) * 10))
                    : '0'}%
                </div>
              </div>
              <div>
                <span className="text-gray-400">⚡ Energy Generated:</span>
                <div className="text-white">{project.cumulativeMetric ? project.cumulativeMetric.toString() : '0'} kWh</div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

// Toast Component
const Toast = ({ message, type, onClose }) => {
  const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';

  return (
    <div className={`${bgColor} text-white px-4 py-3 rounded-lg shadow-lg flex items-center justify-between`}>
      <span>{message}</span>
      <button
        onClick={onClose}
        className="ml-4 text-white hover:text-gray-200"
      >
        ×
      </button>
    </div>
  );
};

// Component definitions moved outside main component
const InvestModal = ({ project, onClose, onInvest, loading }) => {
  const [investAmount, setInvestAmount] = useState('');
  const [calculatedTokens, setCalculatedTokens] = useState('0');

  useEffect(() => {
    if (project && investAmount) {
      const amount = parseFloat(investAmount);
      if (amount > 0 && project.priceWeiPerToken) {
        const tokens = amount / parseFloat(ethers.formatEther(project.priceWeiPerToken));
        setCalculatedTokens(tokens.toFixed(2));
      }
    }
  }, [investAmount, project]);

  const handleInvestClick = async () => {
    if (!investAmount) return;
    await onInvest(investAmount);
    setInvestAmount('');
  };

  if (!project) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900/95 backdrop-blur-md rounded-xl border border-white/20 p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">Invest in {project.projectName}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-white/5 p-4 rounded-lg">
            <div className="text-sm text-gray-400 mb-1">📋 Project Details</div>
            <div className="text-white font-medium">{project.description}</div>
            <div className="text-green-400 text-sm mt-2">
              Target: {project.targetAmount ? ethers.formatEther(project.targetAmount) : '0'} ETH
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-2 block">💰 Investment Amount (ETH)</label>
            <input
              type="number"
              value={investAmount}
              onChange={(e) => setInvestAmount(e.target.value)}
              placeholder="0.1"
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400"
            />
          </div>

          <div className="bg-white/5 p-4 rounded-lg">
            <div className="text-sm text-gray-400 mb-1">You will receive</div>
            <div className="text-2xl font-bold text-green-400">{calculatedTokens} Tokens</div>
            <div className="text-xs text-gray-400 mt-1">
              Token Price: {project.priceWeiPerToken ? ethers.formatEther(project.priceWeiPerToken) : '0'} ETH
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-700 text-white px-4 py-3 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleInvestClick}
              disabled={!investAmount || loading}
              className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 text-white px-4 py-3 rounded-lg hover:from-green-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              {loading ? 'Investing...' : 'Invest Now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const InvestmentCalculator = ({ project, onClose }) => {
  const [calcAmount, setCalcAmount] = useState('');
  const [calcTokens, setCalcTokens] = useState('0');
  const [potentialReturns, setPotentialReturns] = useState('0');
  const [selectedMilestone, setSelectedMilestone] = useState(0);
  const [investmentPeriod, setInvestmentPeriod] = useState(12); // months

  // Enhanced calculation with milestone-based returns
  useEffect(() => {
    if (project && calcAmount) {
      const amount = parseFloat(calcAmount);
      if (amount > 0 && project.priceWeiPerToken) {
        const tokens = amount / parseFloat(ethers.formatEther(project.priceWeiPerToken));
        setCalcTokens(tokens.toFixed(2));

        // Calculate returns based on selected milestone and period
        const baseReturn = tokens * 0.08; // Base 8% annual return
        const milestoneMultiplier = 1 + (selectedMilestone * 0.1); // 10% bonus per milestone
        const periodMultiplier = investmentPeriod / 12; // Adjust for investment period
        const adjustedReturns = baseReturn * milestoneMultiplier * periodMultiplier;

        setPotentialReturns(adjustedReturns.toFixed(2));
      }
    }
  }, [calcAmount, project, selectedMilestone, investmentPeriod]);

  // Milestone options with different return profiles
  const milestoneOptions = [
    { id: 0, name: 'Conservative', description: 'Safe and steady growth', multiplier: 1.0, color: 'green' },
    { id: 1, name: 'Balanced', description: 'Good balance of risk and reward', multiplier: 1.1, color: 'blue' },
    { id: 2, name: 'Growth', description: 'Higher potential returns', multiplier: 1.2, color: 'purple' },
    { id: 3, name: 'Aggressive', description: 'Maximum growth potential', multiplier: 1.3, color: 'orange' }
  ];

  // Environmental impact calculation
  const calculateImpact = () => {
    if (!project || !calcTokens) return null;

    const tokens = parseFloat(calcTokens);
    const co2Reduction = tokens * 400; // kg CO2 per token
    const energyGenerated = tokens * 1000; // kWh per token
    const treesEquivalent = Math.round(energyGenerated * 0.02); // trees per kWh
    const waterConserved = Math.round(energyGenerated * 0.5); // liters per kWh

    return {
      co2Reduction: co2Reduction.toLocaleString(),
      energyGenerated: energyGenerated.toLocaleString(),
      treesEquivalent,
      waterConserved: waterConserved.toLocaleString()
    };
  };

  const impact = calculateImpact();

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-r from-custom-purple to-bright-purple rounded-lg">
          <DollarSign className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">💰 Smart Investment Calculator</h3>
          <p className="text-gray-400 text-sm">Plan your investment and see your potential returns and environmental impact</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Investment Configuration */}
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-2 block">💵 How much would you like to invest?</label>
            <input
              type="number"
              value={calcAmount}
              onChange={(e) => setCalcAmount(e.target.value)}
              placeholder="0.1"
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-white/40 focus:bg-white/15 transition-all"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-2 block">⏰ Investment Period</label>
            <select
              value={investmentPeriod}
              onChange={(e) => setInvestmentPeriod(parseInt(e.target.value))}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white"
            >
              <option value={6}>6 Months</option>
              <option value={12}>12 Months</option>
              <option value={24}>24 Months</option>
              <option value={36}>36 Months</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-3 block">📈 Choose Your Investment Strategy</label>
            <div className="grid grid-cols-2 gap-2">
              {milestoneOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setSelectedMilestone(option.id)}
                  className={`p-3 rounded-lg border transition-all ${
                    selectedMilestone === option.id
                      ? `border-${option.color}-400 bg-${option.color}-500/20 text-${option.color}-400`
                      : 'border-white/20 bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  <div className="text-sm font-medium">{option.name}</div>
                  <div className="text-xs opacity-75">{option.description}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Display */}
        <div className="space-y-4">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 p-4 rounded-lg">
              <div className="text-xs text-gray-400 mb-1">🎫 Tokens You'll Receive</div>
              <div className="text-2xl font-bold text-green-400">{calcTokens}</div>
              <div className="text-xs text-gray-500">GBOND</div>
            </div>
            <div className="bg-white/5 p-4 rounded-lg">
              <div className="text-xs text-gray-400 mb-1">💰 Potential Returns</div>
              <div className="text-2xl font-bold text-blue-400">{potentialReturns}</div>
              <div className="text-xs text-gray-500">ETH</div>
            </div>
          </div>

          {/* Project Information */}
          {project && (
            <div className="bg-white/5 p-4 rounded-lg">
              <h4 className="text-white font-medium mb-3">📊 Project Overview</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-400">💰 Token Price:</span>
                  <div className="text-white font-medium">
                    {project.priceWeiPerToken ? ethers.formatEther(project.priceWeiPerToken) : '0'} ETH
                  </div>
                </div>
                <div>
                  <span className="text-gray-400">📈 Total Raised:</span>
                  <div className="text-white font-medium">
                    {project.totalRaised ? ethers.formatEther(project.totalRaised) : '0'} ETH
                  </div>
                </div>
                <div>
                  <span className="text-gray-400">⚡ Energy Generated:</span>
                  <div className="text-white font-medium">
                    {project.cumulativeMetric ? project.cumulativeMetric.toString() : '0'} kWh
                  </div>
                </div>
                <div>
                  <span className="text-gray-400">🌟 Impact Score:</span>
                  <div className="text-white font-medium">
                    {project.cumulativeMetric && project.totalRaised
                      ? Math.min(100, Math.round(parseFloat(project.cumulativeMetric) / parseFloat(ethers.formatEther(project.totalRaised)) * 10))
                      : '0'}%
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Environmental Impact Table */}
      {impact && (
        <div className="mt-6 bg-gradient-to-r from-green-900/30 to-blue-900/30 rounded-lg p-4 border border-green-500/20">
          <h4 className="text-white font-medium mb-4 flex items-center gap-2">
            <Leaf className="w-4 h-4 text-green-400" />
            🌍 Your Positive Environmental Impact
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{impact.co2Reduction}</div>
              <div className="text-xs text-gray-400">kg CO₂ Reduced</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{impact.energyGenerated}</div>
              <div className="text-xs text-gray-400">kWh Generated</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{impact.treesEquivalent}</div>
              <div className="text-xs text-gray-400">Trees Equivalent</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{impact.waterConserved}</div>
              <div className="text-xs text-gray-400">Liters Water Saved</div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 mt-6">
        {project && (
          <button
            onClick={() => onClose(true)}
            className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 text-white px-6 py-3 rounded-lg hover:from-green-600 hover:to-blue-600 transition-all duration-300 font-medium"
          >
            💰 Invest Now
          </button>
        )}
        <button
          onClick={() => onClose(false)}
          className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all duration-300"
        >
          Maybe Later
        </button>
      </div>
    </div>
  );
};

const TransactionHistoryComponent = ({ transactions, onClose }) => {
  return (
    <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
      <h3 className="text-lg font-bold text-white mb-4">Recent Transactions</h3>
      
      <div className="space-y-3">
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No transactions yet
          </div>
        ) : (
          transactions.slice(0, 5).map((tx, index) => (
            <div key={index} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
              <div>
                <div className="text-white text-sm font-medium">{tx.type}</div>
                <div className="text-gray-400 text-xs">{tx.time}</div>
              </div>
              <div className={`text-sm font-medium ${
                tx.status === 'Success' ? 'text-green-400' : 'text-red-400'
              }`}>
                {tx.status}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const OracleSimulator = ({ project, onClose, onUpdate, loading, allProjects = [], onProjectSelect }) => {
  const [deltaKwh, setDeltaKwh] = useState('');
  const [deltaCO2, setDeltaCO2] = useState('');
  const [oracleKey, setOracleKey] = useState('');
  const [selectedOracleProject, setSelectedOracleProject] = useState(project);

  const handleSubmit = async () => {
    if (!deltaKwh || !deltaCO2) return;
    await onUpdate(deltaKwh, deltaCO2);
    setDeltaKwh('');
    setDeltaCO2('');
  };

  const handleProjectChange = (newProject) => {
    setSelectedOracleProject(newProject);
    if (onProjectSelect) onProjectSelect(newProject);
  };

  return (
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

      {/* Project Selection for Oracle */}
      {allProjects.length > 1 && (
        <div className="mb-4">
          <label className="block text-gray-400 text-sm mb-2">📋 Select Project for Impact Update</label>
          <select
            value={selectedOracleProject?.id || ''}
            onChange={(e) => {
              const selectedProj = allProjects.find(p => p.id === e.target.value);
              if (selectedProj) handleProjectChange(selectedProj);
            }}
            className="w-full p-3 bg-white/10 backdrop-blur-sm text-white border border-white/20 rounded-xl focus:border-white/40 focus:bg-white/15 focus:outline-none transition-all duration-300"
          >
            {allProjects.map((proj) => (
              <option key={proj.id} value={proj.id} className="bg-gray-800">
                {proj.projectName} - {proj.cumulativeMetric ? proj.cumulativeMetric.toString() : '0'} kWh
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Current Progress Display */}
      <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-300 text-sm">Current Progress</span>
          <span className="text-green-400 text-sm font-semibold">
            {selectedOracleProject ? selectedOracleProject.cumulativeMetric.toString() : '0'} kWh Total
          </span>
        </div>
        <div className="flex gap-4 text-xs text-gray-400">
          <span>Next Milestone: Coming Soon</span>
          <span>•</span>
          <span>Project: {project ? project.projectName : 'Unknown'}</span>
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
            className="w-full p-3 bg-white/10 backdrop-blur-sm text-white border border-white/20 rounded-xl text-lg placeholder-white/60 focus:border-white/40 focus:bg-white/15 focus:outline-none transition-all duration-300"
            placeholder="Enter kWh generated (e.g., 1000000)"
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
            className="w-full p-3 bg-white/10 backdrop-blur-sm text-white border border-white/20 rounded-xl text-lg placeholder-white/60 focus:border-white/40 focus:bg-white/15 focus:outline-none transition-all duration-300"
            placeholder="Enter CO₂ offset (e.g., 400000)"
          />
        </div>
      </div>

      {/* Quick Fill Buttons */}
      <div className="mb-6">
        <div className="text-white text-sm font-medium mb-2">Quick Fill Options:</div>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "Small Update", kwh: 1000000, co2: 400000 },
            { label: "Medium Update", kwh: 2500000, co2: 1000000 },
            { label: "Large Update", kwh: 5000000, co2: 2000000 },
            { label: "Milestone Push", kwh: 10000000, co2: 4000000 },
            { label: "Major Push", kwh: 15000000, co2: 6000000 },
            { label: "Mega Push", kwh: 25000000, co2: 10000000 }
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
              <span className="text-white font-semibold">
                {((project ? Number(project.cumulativeMetric) : 0) + parseInt(deltaKwh || 0)).toLocaleString()} kWh
              </span>
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
        onClick={handleSubmit}
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
  const [isCurrentProjectIssuer, setIsCurrentProjectIssuer] = useState(false);
  const [milestones, setMilestones] = useState([]);
  const [saleEnd, setSaleEnd] = useState(0);

  // State for impact data entry
  const [deltaKwh, setDeltaKwh] = useState('');
  const [deltaCO2, setDeltaCO2] = useState('');
  const [oracleKey, setOracleKey] = useState('');

  // State for UI
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showInvestModal, setShowInvestModal] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);
  const [showOracleSimulator, setShowOracleSimulator] = useState(false);
  const [tokenAmount, setTokenAmount] = useState('');
  const [investAmount, setInvestAmount] = useState('');
  const [calculatedTokens, setCalculatedTokens] = useState('0');
  const [calcAmount, setCalcAmount] = useState('');
  const [calcTokens, setCalcTokens] = useState('0');
  const [potentialReturns, setPotentialReturns] = useState('0');
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

  // Multi-project state
  const [allProjects, setAllProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [issuerSelectedProject, setIssuerSelectedProject] = useState(null);
  const [factoryContract, setFactoryContract] = useState(null);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [projectForm, setProjectForm] = useState({
    name: 'Solar Energy Project',
    description: 'A green energy project focused on solar power generation',
    tokenName: 'Solar Energy Token',
    tokenSymbol: 'SOLAR',
    targetAmount: '100',
    saleDuration: '7'
  });
  const [notifications, setNotifications] = useState([]);
  const [walletBalance, setWalletBalance] = useState('0');

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

  // Multi-project functionality
  const initializeFactory = useCallback(async (providerInstance) => {
    try {
      const factoryAddr = process.env.REACT_APP_BOND_FACTORY_ADDRESS;
      console.log('Initializing factory with address:', factoryAddr);
      
      if (!factoryAddr) {
        console.error('No factory address found in environment variables');
        return null;
      }
      
      // Use a direct provider to check contract existence and for contract instance
      const directProvider = new ethers.JsonRpcProvider('http://localhost:8545');
      
      // Check if contract exists at address using direct provider
      const code = await directProvider.getCode(factoryAddr);
      console.log('Contract code at address:', code.substring(0, 10) + '...');
      
      if (code === '0x') {
        console.error('No contract found at factory address:', factoryAddr);
        return null;
      }
      
      // Create contract instance with direct provider for reads, will connect signer for writes
      const factory = new ethers.Contract(factoryAddr, BondFactoryArtifact.abi, directProvider);
      console.log('Factory contract initialized successfully');
      
      setFactoryContract(factory);
      return factory;
    } catch (error) {
      console.error('Failed to initialize factory:', error);
      return null;
    }
  }, []);

  const setupProjectOracles = async (projects) => {
    if (!signer || !walletAddress) return;
    
    try {
      console.log('Setting up oracles for user projects...');
      
      for (const project of projects) {
        // Check if current user is the issuer of this project
        if (project.issuer.toLowerCase() === walletAddress.toLowerCase()) {
          console.log(`Setting up oracle for project ${project.id}...`);
          
          // Create oracle contract instance
          const oracleContract = new ethers.Contract(
            project.oracleContract,
            ImpactOracleArtifact.abi,
            signer
          );
          
          // Create escrow contract instance
          const escrowContract = new ethers.Contract(
            project.escrowContract,
            GreenBondEscrowArtifact.abi,
            signer
          );
          
          try {
            // Set escrow address in oracle
            const escrowTx = await oracleContract.setEscrow(project.escrowContract);
            await escrowTx.wait();
            console.log(`✅ Oracle escrow set for project ${project.id}`);
            
            // Set oracle address in escrow
            const oracleTx = await escrowContract.setOracle(project.oracleContract);
            await oracleTx.wait();
            console.log(`✅ Escrow oracle set for project ${project.id}`);
            
            // Set updater to current user
            const updaterTx = await oracleContract.setUpdater(walletAddress);
            await updaterTx.wait();
            console.log(`✅ Oracle updater set for project ${project.id}`);
            
          } catch (error) {
            // These might already be set, which is fine
            if (error.message.includes('execution reverted')) {
              console.log(`Oracle already configured for project ${project.id}`);
            } else {
              console.error(`Failed to setup oracle for project ${project.id}:`, error);
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to setup project oracles:', error);
    }
  };

  const loadAllProjects = async (factory) => {
    try {
      if (!factory) {
        console.error('Factory contract not provided to loadAllProjects');
        return;
      }
      
      console.log('Loading projects from factory...');
      const activeProjectIds = await factory.getActiveProjects();
      console.log('Active project IDs:', activeProjectIds);
      
      const projectsData = [];

      for (const projectId of activeProjectIds) {
        console.log('Loading project:', projectId.toString());
        const projectInfo = await factory.getProject(projectId);
        const stats = await factory.getProjectStats(projectId);
        
        // Ensure we have valid data with defaults for null values
        const safeProjectInfo = {
          escrowContract: projectInfo.escrowContract || '0x0000000000000000000000000000000000000000',
          oracleContract: projectInfo.oracleContract || '0x0000000000000000000000000000000000000000',
          issuer: projectInfo.issuer || '0x0000000000000000000000000000000000000000',
          projectName: projectInfo.projectName || 'Unknown Project',
          description: projectInfo.description || 'No description available',
          targetAmount: projectInfo.targetAmount || 0n,
          createdAt: projectInfo.createdAt || 0n,
          active: projectInfo.active || false
        };
        
        const safeStats = {
          totalRaised: stats.totalRaised || 0n,
          tokensSold: stats.tokensSold || 0n,
          cumulativeMetric: stats.cumulativeMetric || 0n,
          saleClosed: stats.saleClosed || false
        };
        
        const totalRaisedNum = Number(safeStats.totalRaised);
        const targetAmountNum = Number(safeProjectInfo.targetAmount);
        
        projectsData.push({
          id: projectId.toString(),
          ...safeProjectInfo,
          ...safeStats,
          fundingProgress: targetAmountNum > 0 ? 
            ((totalRaisedNum / targetAmountNum) * 100).toFixed(1) : 0
        });
      }

      console.log('Loaded projects data:', projectsData);
      setAllProjects(projectsData);
      
      // Set up oracles for projects if user is connected
      if (walletAddress && projectsData.length > 0) {
        await setupProjectOracles(projectsData);
      }
      
      // Set first project as selected if none selected
      if (projectsData.length > 0 && !selectedProject) {
        const firstProject = projectsData[0];
        setSelectedProject(firstProject);
        if (walletAddress) {
          checkCurrentProjectIssuer(firstProject);
        }
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
      console.error('Error details:', {
        message: error.message,
        data: error.data,
        reason: error.reason,
        code: error.code
      });
    }
  };

  // Helper function to check if current user is issuer of selected project
  const checkCurrentProjectIssuer = async (project) => {
    if (!project || !walletAddress || !provider) {
      setIsCurrentProjectIssuer(false);
      return;
    }
    
    try {
      const escrowContract = new ethers.Contract(
        project.escrowContract, 
        GreenBondEscrowArtifact.abi, 
        provider
      );
      const issuerAddr = await escrowContract.issuer();
      setIsCurrentProjectIssuer(issuerAddr.toLowerCase() === walletAddress.toLowerCase());
    } catch (error) {
      console.error("Failed to check project issuer status:", error);
      setIsCurrentProjectIssuer(false);
    }
  };

  const createProject = async () => {
    try {
      if (!signer || !factoryContract) {
        throw new Error('Wallet not connected or factory contract not initialized');
      }

      // Check if user is on the correct network
      const network = await signer.provider.getNetwork();
      const expectedChainId = parseInt(process.env.REACT_APP_CHAIN_ID || '31337');
      if (network.chainId.toString() !== expectedChainId.toString()) {
        throw new Error(`Please switch to the correct network (Chain ID: ${expectedChainId})`);
      }

      console.log('Creating project with form data:', projectForm);

      // Validate all required fields
      if (!projectForm.name || projectForm.name.trim() === '') {
        throw new Error('Project name is required');
      }
      if (!projectForm.tokenName || projectForm.tokenName.trim() === '') {
        throw new Error('Token name is required');
      }
      if (!projectForm.tokenSymbol || projectForm.tokenSymbol.trim() === '') {
        throw new Error('Token symbol is required');
      }
      if (!projectForm.targetAmount || parseFloat(projectForm.targetAmount) <= 0) {
        throw new Error('Target amount must be greater than 0');
      }
      if (!projectForm.saleDuration || parseInt(projectForm.saleDuration) <= 0) {
        throw new Error('Sale duration must be greater than 0');
      }

      const targetAmountWei = ethers.parseEther(projectForm.targetAmount);
      const capTokens = ethers.parseUnits("1000000", 18); // 1M tokens
      const priceWeiPerToken = targetAmountWei / 1000000n;
      const saleDurationSeconds = parseInt(projectForm.saleDuration) * 24 * 60 * 60;

      // Enterprise-scale milestones
      const thresholds = [5000000, 10000000, 20000000, 35000000, 50000000, 75000000];
      const bps = [1666, 1667, 1667, 1667, 1666, 1667];

      console.log('Calculated values:', {
        targetAmountWei: targetAmountWei.toString(),
        capTokens: capTokens.toString(),
        priceWeiPerToken: priceWeiPerToken.toString(),
        saleDurationSeconds,
        thresholds,
        bps
      });

      // Additional validation
      if (priceWeiPerToken <= 0n) {
        throw new Error('Price per token calculation resulted in invalid value');
      }

      const factoryWithSigner = factoryContract.connect(signer);
      
      // Verify factory contract is accessible
      try {
        console.log('Checking factory contract accessibility...');
        const projectCount = await factoryContract.projectCount();
        console.log('Factory contract accessible, current project count:', projectCount.toString());
      } catch (error) {
        console.error('Factory contract is not accessible:', error);
        console.error('Contract address:', factoryContract.target);
        throw new Error('Factory contract is not accessible: ' + error.message);
      }
      
      console.log('Sending transaction to factory...');
      const tx = await factoryWithSigner.createProject(
        projectForm.name.trim(),
        projectForm.description.trim(),
        projectForm.tokenName.trim(),
        projectForm.tokenSymbol.trim(),
        capTokens,
        priceWeiPerToken,
        saleDurationSeconds,
        thresholds,
        bps,
        12, // maturityMonths
        500, // annualYieldBps (5%)
        {
          gasLimit: 5000000 // Manual gas limit to avoid estimation issues
        }
      );

      console.log('Transaction sent:', tx.hash);
      await tx.wait();
      console.log('Transaction confirmed');
      
      // Reset form and reload projects
      setProjectForm({
        name: '', description: '', tokenName: '', tokenSymbol: '',
        targetAmount: '', saleDuration: '7'
      });
      setShowCreateProject(false);
      await loadAllProjects(factoryContract);
      showToast('Project created successfully!', 'success');
      
    } catch (error) {
      console.error('Failed to create project:', error);
      console.error('Error details:', {
        message: error.message,
        data: error.data,
        reason: error.reason,
        code: error.code
      });
      
      // Provide more specific error messages
      let errorMessage = 'Failed to create project';
      if (error.message.includes('empty project name')) {
        errorMessage = 'Project name cannot be empty';
      } else if (error.message.includes('invalid params')) {
        errorMessage = 'Invalid token parameters - check target amount';
      } else if (error.message.includes('bad addr')) {
        errorMessage = 'Invalid contract addresses';
      } else if (error.message.includes('bad window')) {
        errorMessage = 'Invalid sale time window';
      } else if (error.message.includes('bad milestones')) {
        errorMessage = 'Invalid milestone configuration';
      } else if (error.message.includes('bps must sum to 10000')) {
        errorMessage = 'Milestone percentages must sum to 100%';
      }
      
      showToast(errorMessage, 'error');
    }
  };

  const investInProject = async (project, amount) => {
    try {
      if (!signer) return;

      const investmentWei = ethers.parseEther(amount);
      const escrow = new ethers.Contract(project.escrowContract, GreenBondEscrowArtifact.abi, signer);
      
      const priceWei = await escrow.priceWeiPerToken();
      const tokenAmount = (investmentWei * 1000000000000000000n) / priceWei;
      
      const tx = await escrow.invest(tokenAmount, { value: investmentWei });
      await tx.wait();
      
      // Show notification
      showNotification(`Investment successful! Invested ${amount} ETH in ${project.projectName}`, 'success');
      
      // Reload projects and update wallet balance
      await loadAllProjects(factoryContract);
      await updateWalletBalance();
      
    } catch (error) {
      console.error('Investment failed:', error);
      showToast(handleContractError(error), 'error');
    }
  };

  const releaseFunds = async (project, milestoneIndex) => {
    try {
      if (!signer) return;

      const escrow = new ethers.Contract(project.escrowContract, GreenBondEscrowArtifact.abi, signer);
      
      // Submit milestone achievement (this will trigger fund release)
      const milestone = project.milestones[milestoneIndex];
      const tx = await escrow.submitMetric(milestone.threshold);
      await tx.wait();
      
      // Calculate released amount
      const releasedAmount = (Number(project.totalRaised) * milestone.releaseBps) / 10000;
      const releasedEth = ethers.formatEther(releasedAmount.toString());
      
      // Show milestone achievement notification
      showNotification(
        `🎉 Milestone ${milestoneIndex + 1} achieved! ${releasedEth} ETH released to your wallet`,
        'milestone',
        releasedEth
      );
      
      // Reload projects and update wallet balance
      await loadAllProjects(factoryContract);
      await updateWalletBalance();
      
    } catch (error) {
      console.error('Failed to release funds:', error);
      showToast(handleContractError(error), 'error');
    }
  };

  const updateWalletBalance = async () => {
    try {
      if (!provider || !walletAddress) return;
      
      const balance = await provider.getBalance(walletAddress);
      setWalletBalance(ethers.formatEther(balance));
    } catch (error) {
      console.error('Failed to update wallet balance:', error);
    }
  };

  const showNotification = (message, type = 'info', amount = null) => {
    const notification = {
      id: Date.now(),
      message,
      type,
      amount,
      timestamp: new Date().toLocaleTimeString()
    };
    
    setNotifications(prev => [notification, ...prev.slice(0, 4)]); // Keep last 5
    showToast(message, type === 'milestone' ? 'success' : type);
    
    // Auto-remove notification after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  };

  // Calculate environmental impact metrics based on kWh
  const calculateEnvironmentalImpact = (kwhValue) => {
    try {
      console.log("Calculating environmental impact with kWh:", kwhValue);
      
      // Get environmental multipliers from environment variables with sensible defaults
      const co2PerKwh = parseFloat(process.env.REACT_APP_CO2_PER_KWH) || 0.4;
      const treesPerKwh = parseFloat(process.env.REACT_APP_TREES_PER_KWH) || 0.02;
      const waterPerKwh = parseFloat(process.env.REACT_APP_WATER_PER_KWH) || 0.5;
      
      // If no real data from oracle, show demo data for better UX
      const showDemoData = process.env.REACT_APP_SHOW_DEMO_DATA === 'true' && kwhValue === 0;
      const displayKwh = showDemoData ? 2500000 : kwhValue; // Demo: 2.5M kWh
      
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
  };

  // Fetch contract data
  const fetchContractData = async (providerInstance, address) => {
    if (!providerInstance) return;
    
    try {
      setLoading(true);
      
      // Initialize factory contract first and get the factory instance
      const factory = await initializeFactory(providerInstance);
      
      // Load all projects from factory if initialization was successful
      if (factory) {
        await loadAllProjects(factory);
      } else {
        console.error('Factory contract initialization failed');
        showToast('Failed to connect to contract factory', 'error');
      }
      
      // Calculate environmental impact (using current cumulative kWh)
      calculateEnvironmentalImpact(cumulativeKwh);
      
      // Set general issuer status to true for all connected users (anyone can create projects)
      setIsIssuer(true);
      
      // Check specific project issuer status (if a project is selected)
      if (selectedProject) {
        await checkCurrentProjectIssuer(selectedProject);
      } else {
        setIsCurrentProjectIssuer(false);
      }
      
      // Update wallet balance
      await updateWalletBalance(address, providerInstance);
      
    } catch (error) {
      console.error('Failed to fetch contract data:', error);
      showToast('Failed to load contract data', 'error');
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
      
      // Reset form and refresh data after a short delay to ensure transaction is confirmed
      setDeltaKwh('');
      setDeltaCO2('');
      
      // Wait a moment for transaction to be mined, then refresh
      setTimeout(() => {
        fetchContractData(provider, walletAddress);
      }, 2000);
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

  // Handle Oracle Update
  const handleOracleUpdate = async (deltaKwh, deltaCo2Kg) => {
    if (!signer || !selectedProject || !deltaKwh || !deltaCo2Kg) {
      showToast('Please enter valid oracle data', 'error');
      return;
    }
    
    setLoading(true);
    
    try {
      const oracleContract = new ethers.Contract(
        selectedProject.oracleContract,
        ImpactOracleArtifact.abi,
        signer
      );
      
      const tx = await oracleContract.pushImpact(parseInt(deltaKwh), parseInt(deltaCo2Kg));
      
      setTransactionHistory(prev => [...prev, { 
        type: 'Oracle Update', 
        status: 'Pending', 
        time: new Date().toLocaleTimeString(), 
        txHash: tx.hash 
      }]);
      
      showToast('Oracle update transaction pending...', 'info');
      
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
      
      showToast('Oracle updated successfully', 'success');
      
      // Refresh project data
      await loadAllProjects(factoryContract);
      
    } catch (error) {
      console.error('Oracle update failed:', error);
      setTransactionHistory(prev => [...prev, { 
        type: 'Oracle Update', 
        status: 'Failed', 
        time: new Date().toLocaleTimeString() 
      }]);
      showToast(handleContractError(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle Investment
  const handleInvest = async () => {
    if (!signer || !selectedProject || !investAmount) {
      showToast('Please enter a valid investment amount', 'error');
      return;
    }
    
    setLoading(true);
    
    try {
      const amount = ethers.parseEther(investAmount);
      
      // Get escrow contract with signer
      const escrowContract = new ethers.Contract(
        selectedProject.escrowContract,
        GreenBondEscrowArtifact.abi,
        signer
      );
      
      const tx = await escrowContract.buyBonds({ value: amount });
      await tx.wait();
      
      showToast(`Successfully invested ${investAmount} ETH in ${selectedProject.projectName}!`, 'success');
      setShowInvestModal(false);
      setInvestAmount('');
      
      // Refresh data
      await loadAllProjects(factoryContract);
      await updateWalletBalance();
      
    } catch (error) {
      console.error('Investment failed:', error);
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
                    <div class="info-label">🔑 Wallet Address</div>
                    <div class="info-value">${certificateData.walletAddress}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">💼 Bond Balance</div>
                    <div class="info-value">${certificateData.bondBalance} GBOND</div>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">🌍 Environmental Impact Contribution</div>
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
  const InvestmentCalculator = ({ project, onClose, allProjects = [], onProjectSelect }) => {
    const [simAmount, setSimAmount] = useState('1');
    const [simResults, setSimResults] = useState({
      tokens: '0',
      impact: 0,
      returns: 0
    });
    const [selectedCalcProject, setSelectedCalcProject] = useState(project);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const calculateInvestment = useCallback(() => {
      if (!simAmount || !selectedCalcProject) return;

      const amount = parseFloat(simAmount);
      const price = selectedCalcProject.priceWeiPerToken ? parseFloat(ethers.formatEther(selectedCalcProject.priceWeiPerToken)) : 0.1;

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
    }, [simAmount, selectedCalcProject]);

    useEffect(() => {
      calculateInvestment();
    }, [calculateInvestment]);

    const handleProjectChange = (newProject) => {
      setSelectedCalcProject(newProject);
      if (onProjectSelect) onProjectSelect(newProject);
    };

    return (
      <div className="glass-card p-4 rounded-xl">
        <h3 className="text-white text-lg font-semibold mb-3">Investment Simulator</h3>

        {/* Project Selection for Calculator */}
        {allProjects.length > 1 && (
          <div className="mb-4">
            <label className="block text-gray-400 text-sm mb-2">📋 Select Project for Simulation</label>
            <select
              value={selectedCalcProject?.id || ''}
              onChange={(e) => {
                const selectedProj = allProjects.find(p => p.id === e.target.value);
                if (selectedProj) handleProjectChange(selectedProj);
              }}
              className="w-full p-3 bg-white/10 backdrop-blur-sm text-white border border-white/20 rounded-xl focus:border-white/40 focus:bg-white/15 focus:outline-none transition-all duration-300"
            >
              {allProjects.map((proj) => (
                <option key={proj.id} value={proj.id} className="bg-gray-800">
                  {proj.projectName} - {proj.priceWeiPerToken ? ethers.formatEther(proj.priceWeiPerToken) : '0'} ETH/token
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="mb-4">
          <label className="block text-gray-400 text-sm mb-1">💰 Investment Amount (ETH)</label>
          <input
            type="text"
            value={simAmount}
            onChange={(e) => setSimAmount(e.target.value)}
            onBlur={calculateInvestment}
            className="w-full p-3 bg-white/10 backdrop-blur-sm text-white border border-white/20 rounded-xl text-lg placeholder-white/60 focus:border-white/40 focus:bg-white/15 focus:outline-none transition-all duration-300"
            placeholder="0.01"
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
            <div className="text-gray-400 text-xs">💰 Potential Returns</div>
            <div className="text-white text-lg font-semibold">{simResults.returns} ETH</div>
            <div className="text-gray-400 text-xs">Based on milestone achievements</div>
          </div>
        </div>

        <button
          onClick={() => onClose(true)} // This will close calculator and open invest modal
          className="w-full mt-4 bg-gradient-to-r from-green-600 to-green-500 text-white px-4 py-2 rounded-lg font-semibold"
        >
          💰 Invest Now
        </button>
      </div>
    );
  };

  // Enhanced Milestone Progress Component
  const MilestoneProgress = () => (
    <div className="glass-card p-4 rounded-xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white text-lg font-semibold">🎯 Project Milestones</h3>
        <div className="text-xs text-gray-400 bg-gray-800/50 px-2 py-1 rounded">
          {milestones.filter(m => m.achieved).length} / {milestones.length} Completed
        </div>
      </div>

      {milestones.length === 0 ? (
        <div className="text-gray-400 text-center py-8">
          <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <div>No milestones defined</div>
        </div>
      ) : (
        <div className="space-y-4">
          {milestones.map((milestone, index) => {
            const progress = Math.min(100, (cumulativeKwh / milestone.threshold) * 100);
            const isCompleted = milestone.achieved;
            const isNext = !isCompleted && index === milestones.findIndex(m => !m.achieved);
            const estimatedRelease = isNext ? new Date(Date.now() + ((milestone.threshold - cumulativeKwh) / (cumulativeKwh / 30)) * 24 * 60 * 60 * 1000) : null;

            return (
              <div key={index} className={`relative p-4 rounded-lg border transition-all duration-300 ${
                isCompleted ? 'bg-green-500/10 border-green-500/30' :
                isNext ? 'bg-purple-500/10 border-purple-500/30' :
                'bg-gray-800/30 border-gray-700/50'
              }`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isCompleted ? 'bg-green-500 shadow-lg shadow-green-500/30' :
                      isNext ? 'bg-purple-500 shadow-lg shadow-purple-500/30' :
                      'bg-gray-700'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5 text-white" />
                      ) : (
                        <span className="text-white text-sm font-semibold">{index + 1}</span>
                      )}
                    </div>
                    <div>
                      <div className="text-white font-semibold text-base">
                        Milestone {index + 1}
                        {isNext && <span className="ml-2 text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded">Next</span>}
                      </div>
                      <div className="text-gray-400 text-sm">
                        {milestone.threshold.toLocaleString()} kWh Target
                      </div>
                    </div>
                  </div>

                  {isCompleted && (
                    <div className="text-green-400 text-sm flex items-center font-medium">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Funds Released
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div className="bg-gray-800/50 p-3 rounded-lg">
                    <div className="text-gray-400 text-xs mb-1">Release Amount</div>
                    <div className="text-white font-semibold">
                      {(totalRaised * milestone.releaseBps / 10000).toFixed(4)} ETH
                    </div>
                    <div className="text-gray-400 text-xs">
                      {milestone.releaseBps/100}% of total raised
                    </div>
                  </div>

                  <div className="bg-gray-800/50 p-3 rounded-lg">
                    <div className="text-gray-400 text-xs mb-1">Progress</div>
                    <div className="text-white font-semibold">
                      {Math.min(cumulativeKwh, milestone.threshold).toLocaleString()} / {milestone.threshold.toLocaleString()} kWh
                    </div>
                    <div className="text-gray-400 text-xs">
                      {Math.round(progress)}% Complete
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Progress to Milestone</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        isCompleted ? 'bg-gradient-to-r from-green-500 to-green-400' :
                        isNext ? 'bg-gradient-to-r from-purple-500 to-purple-400' :
                        'bg-purple-600'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {isNext && estimatedRelease && (
                  <div className="flex items-center gap-2 text-purple-300 text-sm bg-purple-500/10 p-2 rounded">
                    <Clock className="w-4 h-4" />
                    <span>Est. completion: {estimatedRelease.toLocaleDateString()}</span>
                  </div>
                )}

                {isCompleted && (
                  <div className="flex items-center gap-2 text-green-300 text-sm bg-green-500/10 p-2 rounded">
                    <CheckCircle className="w-4 h-4" />
                    <span>Completed on {new Date(milestone.achievedAt * 1000).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Milestone Summary */}
      <div className="mt-6 pt-4 border-t border-gray-700">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-white">
              {milestones.filter(m => m.achieved).length}
            </div>
            <div className="text-xs text-gray-400">Completed</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-400">
              {(totalRaised * milestones.filter(m => m.achieved).reduce((sum, m) => sum + m.releaseBps, 0) / 10000).toFixed(4)}
            </div>
            <div className="text-xs text-gray-400">ETH Released</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-400">
              {milestones.filter(m => m.achieved).length > 0 ?
                Math.round(milestones.filter(m => m.achieved).reduce((sum, m) => sum + m.threshold, 0) / cumulativeKwh * 100) : 0}%
            </div>
            <div className="text-xs text-gray-400">Efficiency</div>
          </div>
        </div>
      </div>
    </div>
  );

  // Enhanced Impact Metrics Component
  const ImpactMetrics = () => {
    // Calculate additional impact metrics
    const co2PerHousehold = environmentalImpact.co2Reduced / 2.5; // Average annual CO2 per US household
    const homesPowered = environmentalImpact.energySaved / 8760; // Average annual kWh per US home
    const acresForested = environmentalImpact.treesPlanted / 200; // Trees per acre
    const olympicPools = environmentalImpact.waterConserved / 660000; // Liters in Olympic pool

    return (
      <div className="glass-card p-4 rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white text-lg font-semibold">Environmental Impact</h3>
          <div className="text-xs text-gray-400 bg-gray-800/50 px-2 py-1 rounded">
            Real-time Metrics
          </div>
        </div>

        {/* Primary Impact Metrics */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20 p-4 rounded-lg hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Leaf className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <div className="text-green-400 text-sm font-medium">CO₂ Reduced</div>
                <div className="text-white text-xl font-bold">{environmentalImpact.co2Reduced.toLocaleString()} kg</div>
              </div>
            </div>
            <div className="text-gray-400 text-xs">
              Equivalent to {co2PerHousehold.toFixed(1)} households' annual emissions
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20 p-4 rounded-lg hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Wind className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <div className="text-green-400 text-sm font-medium">Trees Equivalent</div>
                <div className="text-white text-xl font-bold">{environmentalImpact.treesPlanted.toLocaleString()}</div>
              </div>
            </div>
            <div className="text-gray-400 text-xs">
              Would cover {acresForested.toFixed(2)} acres of forest
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 p-4 rounded-lg hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Zap className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <div className="text-blue-400 text-sm font-medium">Energy Generated</div>
                <div className="text-white text-xl font-bold">{environmentalImpact.energySaved.toLocaleString()} kWh</div>
              </div>
            </div>
            <div className="text-gray-400 text-xs">
              Powers {homesPowered.toFixed(1)} homes for a year
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 p-4 rounded-lg hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Lightbulb className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <div className="text-blue-400 text-sm font-medium">Water Conserved</div>
                <div className="text-white text-xl font-bold">{environmentalImpact.waterConserved.toLocaleString()} L</div>
              </div>
            </div>
            <div className="text-gray-400 text-xs">
              Fills {olympicPools.toFixed(2)} Olympic swimming pools
            </div>
          </div>
        </div>

        {/* Impact Score Progress */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-white text-sm font-medium">Overall Impact Score</h4>
            <span className="text-white text-sm font-semibold">{impactScore}%</span>
          </div>
          <div className="h-4 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 transition-all duration-1000"
              style={{ width: `${impactScore}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>Baseline</span>
            <span>Excellent Impact</span>
          </div>
        </div>

        {/* Detailed Impact Table */}
        <div className="border border-gray-700 rounded-lg overflow-hidden">
          <div className="bg-gray-800/50 px-4 py-3 border-b border-gray-700">
            <h4 className="text-white text-sm font-medium">Impact Breakdown</h4>
          </div>

          <div className="divide-y divide-gray-700">
            <div className="px-4 py-3 flex justify-between items-center hover:bg-gray-800/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-300 text-sm">Carbon Footprint Reduction</span>
              </div>
              <div className="text-white font-semibold">
                {environmentalImpact.co2Reduced.toLocaleString()} kg CO₂
              </div>
            </div>

            <div className="px-4 py-3 flex justify-between items-center hover:bg-gray-800/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-gray-300 text-sm">Clean Energy Production</span>
              </div>
              <div className="text-white font-semibold">
                {environmentalImpact.energySaved.toLocaleString()} kWh
              </div>
            </div>

            <div className="px-4 py-3 flex justify-between items-center hover:bg-gray-800/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-300 text-sm">Biodiversity Enhancement</span>
              </div>
              <div className="text-white font-semibold">
                {environmentalImpact.treesPlanted.toLocaleString()} trees
              </div>
            </div>

            <div className="px-4 py-3 flex justify-between items-center hover:bg-gray-800/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-gray-300 text-sm">Water Resource Conservation</span>
              </div>
              <div className="text-white font-semibold">
                {environmentalImpact.waterConserved.toLocaleString()} L
              </div>
            </div>

            <div className="px-4 py-3 flex justify-between items-center hover:bg-gray-800/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-gray-300 text-sm">Project Efficiency Rating</span>
              </div>
              <div className="text-white font-semibold">
                {impactScore}% Efficiency
              </div>
            </div>
          </div>
        </div>

        {/* Impact Summary */}
        <div className="mt-4 p-3 bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-lg">
          <div className="text-center">
            <div className="text-white text-sm font-medium mb-1">Total Environmental Contribution</div>
            <div className="text-green-400 text-lg font-bold">
              {((environmentalImpact.co2Reduced / 1000) + (environmentalImpact.energySaved / 1000) + environmentalImpact.treesPlanted + (environmentalImpact.waterConserved / 1000000)).toFixed(2)} Impact Units
            </div>
            <div className="text-gray-400 text-xs mt-1">
              Combined metric of all environmental benefits
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Transaction History Component
  const TransactionHistoryComponent = ({ transactions, onClose }) => (
    <div className="glass-card p-4 rounded-xl">
      <h3 className="text-white text-lg font-semibold mb-3">Transaction History</h3>

      {transactions && transactions.length === 0 ? (
        <div className="text-gray-400 text-center py-4">No transactions yet</div>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
          {transactions && transactions.map((tx, index) => (
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
            type="text"
            value={tokenAmount}
            onChange={(e) => setTokenAmount(e.target.value)}
            className="w-full p-3 bg-white/10 backdrop-blur-sm text-white border border-white/20 rounded-xl text-lg placeholder-white/60 focus:border-white/40 focus:bg-white/15 focus:outline-none transition-all duration-300"
            placeholder="0.0"
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
    { id: 'dashboard', label: 'My Dashboard', icon: BarChart3 },
    { id: 'projects', label: 'Explore Projects', icon: Globe },
    { id: 'impact', label: 'My Impact', icon: Leaf },
    { id: 'transactions', label: 'My Transactions', icon: Database }
  ];

  // Conditionally add issuer tab
  if (isIssuer) {
    tabs.push({ id: 'issuer', label: 'Project Management', icon: Lock });
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
              🌱 EcoFi Green Bond Platform
            </h1>
            <p className="text-gray-400">Invest in a sustainable future with tokenized green bonds</p>
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
                <h3 className="text-white font-semibold">💰 Returns</h3>
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
                {/* Header with Create Project button */}
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-white">🌍 Discover Green Projects</h2>
                  <div className="flex gap-3">
                    <div className="bg-white/10 backdrop-blur-md rounded-lg px-4 py-2 border border-white/20">
                      <div className="text-xs text-gray-400">Your Balance</div>
                      <div className="text-lg font-bold text-green-400">{parseFloat(walletBalance).toFixed(4)} ETH</div>
                    </div>
                    {walletAddress && isIssuer && (
                      <button
                        onClick={() => setShowCreateProject(true)}
                        className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-blue-500 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-blue-600 transition-all duration-300"
                      >
                        <Plus size={18} />
                        Start New Project
                      </button>
                    )}
                  </div>
                </div>

                {/* Notifications Panel */}
                {notifications.length > 0 && (
                  <div className="space-y-2">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`bg-gradient-to-r p-4 rounded-lg border-l-4 ${
                          notification.type === 'milestone' 
                            ? 'from-green-500/20 to-blue-500/20 border-green-400' 
                            : 'from-blue-500/20 to-purple-500/20 border-blue-400'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-white font-medium">{notification.message}</div>
                            <div className="text-gray-400 text-sm">{notification.timestamp}</div>
                          </div>
                          {notification.amount && (
                            <div className="text-green-400 font-bold text-lg">+{notification.amount} ETH</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Project Selection and Management */}
                {allProjects.length === 0 ? (
                  <div className="text-center py-12 bg-white/5 backdrop-blur-md rounded-xl border border-white/20">
                    <Building2 size={64} className="text-gray-400 mx-auto mb-4" />
                    <div className="text-white text-lg mb-2">No Projects Yet</div>
                    <div className="text-gray-400 mb-4">Be the first to create a green bond project and make a positive impact!</div>
                    {isIssuer && (
                      <button
                        onClick={() => setShowCreateProject(true)}
                        className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-6 py-3 rounded-lg hover:from-green-600 hover:to-blue-600 transition-all duration-300"
                      >
                        🚀 Create Your First Project
                      </button>
                    )}
                    {!isIssuer && (
                      <div className="text-center text-gray-400">
                        <div className="text-sm mb-2">💼 Issuer-Only Access</div>
                        <div className="text-xs">Project creation is available for verified issuers only</div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Project List */}
                    <div className="lg:col-span-1">
                      <ProjectSelector
                        projects={allProjects}
                        selectedProject={selectedProject}
                        onProjectSelect={(project) => {
                          setSelectedProject(project);
                          checkCurrentProjectIssuer(project);
                        }}
                      />
                    </div>

                    {/* Selected Project Details */}
                    {selectedProject && (
                      <div className="lg:col-span-2">
                        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
                          <div className="flex justify-between items-start mb-6">
                            <div>
                              <h3 className="text-2xl font-bold text-white mb-2">{selectedProject.projectName}</h3>
                              <p className="text-gray-300">{selectedProject.description}</p>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-gray-400">Target Amount</div>
                              <div className="text-xl font-bold text-green-400">
                                {selectedProject.targetAmount ? ethers.formatEther(selectedProject.targetAmount) : '0'} ETH
                              </div>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="mb-6">
                            <div className="flex justify-between text-sm mb-2">
                              <span className="text-gray-400">Funding Progress</span>
                              <span className="text-white">{selectedProject.fundingProgress}%</span>
                            </div>
                            <div className="bg-gray-700 rounded-full h-3">
                              <div 
                                className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-300"
                                style={{ width: `${Math.min(selectedProject.fundingProgress, 100)}%` }}
                              />
                            </div>
                          </div>

                          {/* Stats Grid */}
                          <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-white">{selectedProject.totalRaised ? ethers.formatEther(selectedProject.totalRaised) : '0'}</div>
                              <div className="text-gray-400 text-sm">ETH Raised</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-white">{selectedProject.cumulativeMetric.toString()}</div>
                              <div className="text-gray-400 text-sm">kWh Generated</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-white">{ethers.formatUnits(selectedProject.tokensSold, 18)}</div>
                              <div className="text-gray-400 text-sm">Tokens Sold</div>
                            </div>
                          </div>

                          {/* Investment and Issuer Controls */}
                          <div className="flex gap-4 mb-6">
                            {/* Single Investment Button for Investors */}
                            {!isCurrentProjectIssuer && !selectedProject.saleClosed && (
                              <button
                                onClick={() => setShowInvestModal(true)}
                                className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 text-white px-6 py-3 rounded-lg hover:from-green-600 hover:to-blue-600 transition-all duration-300 font-medium"
                              >
                                <DollarSign className="w-5 h-5 inline mr-2" />
                                Invest Now
                              </button>
                            )}

                            {/* Fund Release Button for Issuers */}
                            {isCurrentProjectIssuer && selectedProject.totalRaised > 0n && (
                              <button
                                onClick={() => releaseFunds(selectedProject)}
                                disabled={loading}
                                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-medium"
                              >
                                <TrendingUp className="w-5 h-5 inline mr-2" />
                                {loading ? 'Releasing Funds...' : 'Release Funds'}
                              </button>
                            )}
                          </div>

                          {/* Issuer Status */}
                          {isCurrentProjectIssuer && (
                            <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg p-4 mb-6">
                              <div className="flex items-center gap-2 text-blue-400 font-medium">
                                <Building2 className="w-5 h-5" />
                                You are the project issuer
                              </div>
                              <div className="text-blue-300 text-sm mt-1">
                                You can release funds when milestones are achieved and manage project settings.
                              </div>
                            </div>
                          )}

                          {/* Investor Status */}
                          {!isCurrentProjectIssuer && (
                            <div className="bg-green-500/20 border border-green-400/30 rounded-lg p-4 mb-6">
                              <div className="flex items-center gap-2 text-green-400 font-medium">
                                <DollarSign className="w-5 h-5" />
                                Investment Opportunity
                              </div>
                              <div className="text-green-300 text-sm mt-1">
                                Invest in this project to support green energy initiatives and earn returns.
                              </div>
                            </div>
                          )}

                          {/* Project Access Notice */}
                          <div className="bg-purple-500/20 border border-purple-400/30 rounded-lg p-4">
                            <div className="flex items-center gap-2 text-purple-400 font-medium">
                              <Lock className="w-5 h-5" />
                              Project Access
                            </div>
                            <div className="text-purple-300 text-sm mt-1">
                              This project is available only for the designated issuer. Investors can participate through the investment simulator.
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Create Project Modal */}
                {showCreateProject && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-gray-900 rounded-xl p-6 w-full max-w-2xl mx-4 border border-white/20">
                      <h3 className="text-2xl font-bold text-white mb-6">Create New Green Bond Project</h3>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <input
                          type="text"
                          placeholder="Project Name"
                          value={projectForm.name}
                          onChange={(e) => setProjectForm({...projectForm, name: e.target.value})}
                          className="bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400"
                        />
                        <input
                          type="text"
                          placeholder="Token Symbol (e.g., SOLAR)"
                          value={projectForm.tokenSymbol}
                          onChange={(e) => setProjectForm({...projectForm, tokenSymbol: e.target.value})}
                          className="bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400"
                        />
                      </div>

                      <input
                        type="text"
                        placeholder="Token Name (e.g., Solar Energy Token)"
                        value={projectForm.tokenName}
                        onChange={(e) => setProjectForm({...projectForm, tokenName: e.target.value})}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 mb-4"
                      />

                      <textarea
                        placeholder="Project Description"
                        value={projectForm.description}
                        onChange={(e) => setProjectForm({...projectForm, description: e.target.value})}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 mb-4 h-24 resize-none"
                      />

                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                          <label className="text-sm text-gray-400 mb-2 block">Target Amount (ETH)</label>
                          <input
                            type="number"
                            value={projectForm.targetAmount}
                            onChange={(e) => setProjectForm({...projectForm, targetAmount: e.target.value})}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-gray-400 mb-2 block">Sale Duration (days)</label>
                          <input
                            type="number"
                            value={projectForm.saleDuration}
                            onChange={(e) => setProjectForm({...projectForm, saleDuration: e.target.value})}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white"
                          />
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <button
                          onClick={() => setShowCreateProject(false)}
                          className="flex-1 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-all duration-300"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={createProject}
                          className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 text-white px-6 py-3 rounded-lg hover:from-green-600 hover:to-blue-600 transition-all duration-300"
                        >
                          Create Project
                        </button>
                      </div>
                    </div>
                  </div>
                )}
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
                
                {/* Project Selection for Issuer */}
                <div className="glass-card p-4 rounded-xl">
                  <h3 className="text-white text-lg font-semibold mb-3">Select Project to Manage</h3>
                  <select
                    value={issuerSelectedProject?.id || ''}
                    onChange={(e) => {
                      const projectId = e.target.value;
                      const project = allProjects.find(p => p.id === projectId);
                      setIssuerSelectedProject(project);
                    }}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white"
                  >
                    <option value="" className="bg-gray-800">Select a project...</option>
                    {allProjects.map(project => (
                      <option key={project.id} value={project.id} className="bg-gray-800">
                        {project.projectName} - {project.description}
                      </option>
                    ))}
                  </select>
                  {issuerSelectedProject && (
                    <div className="mt-3 text-sm text-gray-400">
                      Managing: <span className="text-green-400">{issuerSelectedProject.projectName}</span>
                    </div>
                  )}
                </div>
                
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
                  
                  <OracleSimulator 
                    project={issuerSelectedProject} 
                    onUpdate={handleOracleUpdate} 
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Investment modal */}
      {showInvestModal && <InvestModal 
        project={selectedProject}
        onClose={() => setShowInvestModal(false)}
        onInvest={handleInvest}
        loading={loading}
      />}
      
      {/* Investment Calculator Modal */}
      {showCalculator && selectedProject && (
        <InvestmentCalculator
          project={selectedProject}
          allProjects={allProjects}
          onProjectSelect={setSelectedProject}
          onClose={(openInvest) => {
            setShowCalculator(false);
            if (openInvest) setShowInvestModal(true);
          }}
        />
      )}

      {/* Transaction History Modal */}
      {showTransactionHistory && (
        <TransactionHistoryComponent
          transactions={transactionHistory}
          onClose={() => setShowTransactionHistory(false)}
        />
      )}

      {/* Oracle Simulator Modal */}
      {showOracleSimulator && selectedProject && (
        <OracleSimulator
          project={selectedProject}
          allProjects={allProjects}
          onProjectSelect={setSelectedProject}
          onClose={() => setShowOracleSimulator(false)}
          onUpdate={handleOracleUpdate}
          loading={loading}
        />
      )}
      
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