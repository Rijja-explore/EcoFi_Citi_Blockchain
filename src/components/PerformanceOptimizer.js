import React, { useState, useCallback, useEffect } from 'react';
import { 
  Zap,
  BarChart3,
  X,
  RefreshCw,
  Check,
  AlertTriangle,
  Info
} from 'lucide-react';

const PerformanceOptimizer = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    renderTime: 0,
    memoryUsage: 0,
    bundleSize: 0,
    heavyComponents: []
  });
  const [optimizations, setOptimizations] = useState([
    { id: 1, name: 'Memo Components', applied: false, impact: 'high' },
    { id: 2, name: 'Fix Dependency Arrays', applied: false, impact: 'high' },
    { id: 3, name: 'Lazy Loading Routes', applied: false, impact: 'medium' },
    { id: 4, name: 'Image Optimization', applied: false, impact: 'medium' },
    { id: 5, name: 'Remove Unused Imports', applied: false, impact: 'low' }
  ]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Mock function to simulate performance analysis
  const analyzePerformance = useCallback(() => {
    setIsAnalyzing(true);
    
    // Simulate analysis delay
    setTimeout(() => {
      setPerformanceMetrics({
        renderTime: Math.random() * 300 + 100, // 100-400ms
        memoryUsage: Math.round(Math.random() * 50 + 20), // 20-70MB
        bundleSize: Math.round(Math.random() * 2 + 1.5), // 1.5-3.5MB
        heavyComponents: [
          { name: 'ImpactDashboard', renderTime: '180ms', reRenders: 8 },
          { name: 'InvestmentSimulator', renderTime: '120ms', reRenders: 5 },
          { name: 'DocumentVault', renderTime: '90ms', reRenders: 3 }
        ]
      });
      setIsAnalyzing(false);
    }, 1500);
  }, []);

  // Apply an optimization
  const applyOptimization = useCallback((id) => {
    setOptimizations(prev => 
      prev.map(opt => 
        opt.id === id ? { ...opt, applied: !opt.applied } : opt
      )
    );
  }, []);

  // Calculate optimization impact score
  const calculateOptimizationScore = useCallback(() => {
    const appliedOptimizations = optimizations.filter(opt => opt.applied);
    const highImpactCount = appliedOptimizations.filter(opt => opt.impact === 'high').length;
    const mediumImpactCount = appliedOptimizations.filter(opt => opt.impact === 'medium').length;
    const lowImpactCount = appliedOptimizations.filter(opt => opt.impact === 'low').length;
    
    return Math.min(100, (highImpactCount * 30) + (mediumImpactCount * 15) + (lowImpactCount * 5));
  }, [optimizations]);

  // Effect to run initial analysis
  useEffect(() => {
    if (isOpen) {
      analyzePerformance();
    }
  }, [isOpen, analyzePerformance]);

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-gradient-to-r from-indigo-600 to-violet-600 p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-40"
        title="Performance Optimizer"
      >
        <Zap className="h-5 w-5 text-white" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-3xl bg-gradient-to-br from-eco-slate-900 to-eco-slate-900/90 rounded-xl shadow-2xl border border-white/10 overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-white/10 bg-black/20">
          <h2 className="text-xl font-montserrat font-bold text-white flex items-center">
            <Zap className="mr-2 h-5 w-5 text-eco-green" />
            Performance Optimizer
          </h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {/* Performance Metrics */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-montserrat font-semibold text-white">Current Performance</h3>
              <button 
                onClick={analyzePerformance}
                disabled={isAnalyzing}
                className="flex items-center text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition-all"
              >
                {isAnalyzing ? (
                  <RefreshCw className="h-3 w-3 mr-1.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3 mr-1.5" />
                )}
                Analyze
              </button>
            </div>
            
            {isAnalyzing ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="h-8 w-8 text-eco-green animate-spin" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-black/20 p-4 rounded-lg">
                    <div className="text-white/60 text-sm mb-1">Average Render Time</div>
                    <div className="text-2xl font-dm-mono text-white">{performanceMetrics.renderTime.toFixed(0)}ms</div>
                  </div>
                  <div className="bg-black/20 p-4 rounded-lg">
                    <div className="text-white/60 text-sm mb-1">Memory Usage</div>
                    <div className="text-2xl font-dm-mono text-white">{performanceMetrics.memoryUsage}MB</div>
                  </div>
                  <div className="bg-black/20 p-4 rounded-lg">
                    <div className="text-white/60 text-sm mb-1">Bundle Size</div>
                    <div className="text-2xl font-dm-mono text-white">{performanceMetrics.bundleSize.toFixed(1)}MB</div>
                  </div>
                </div>
                
                <div className="bg-black/20 p-4 rounded-lg mb-6">
                  <h4 className="font-montserrat font-semibold text-white mb-3">Heavy Components</h4>
                  <div className="space-y-2">
                    {performanceMetrics.heavyComponents.map((component, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b border-white/10 last:border-0">
                        <div className="text-white font-inter">{component.name}</div>
                        <div className="flex items-center">
                          <span className="text-white/70 text-sm mr-4">
                            {component.renderTime}
                          </span>
                          <span className="bg-white/10 text-white/80 text-xs px-2 py-0.5 rounded">
                            {component.reRenders} re-renders
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
          
          {/* Optimizations */}
          <div>
            <h3 className="text-lg font-montserrat font-semibold text-white mb-4">Available Optimizations</h3>
            <div className="space-y-3 mb-6">
              {optimizations.map(opt => (
                <div 
                  key={opt.id} 
                  className={`bg-black/20 p-4 rounded-lg border-l-4 ${
                    opt.applied ? 'border-eco-green' : 
                    opt.impact === 'high' ? 'border-red-500' : 
                    opt.impact === 'medium' ? 'border-yellow-500' : 
                    'border-blue-500'
                  } transition-all`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="flex items-center">
                        <span className="text-white font-inter font-medium">{opt.name}</span>
                        <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                          opt.impact === 'high' ? 'bg-red-500/20 text-red-300' : 
                          opt.impact === 'medium' ? 'bg-yellow-500/20 text-yellow-300' : 
                          'bg-blue-500/20 text-blue-300'
                        }`}>
                          {opt.impact}
                        </span>
                      </div>
                      <OptimizationDescription optimization={opt.name} />
                    </div>
                    <button
                      onClick={() => applyOptimization(opt.id)}
                      className={`flex items-center ${
                        opt.applied ? 
                        'bg-eco-green text-white' : 
                        'bg-white/10 text-white hover:bg-white/20'
                      } px-3 py-1.5 rounded-lg transition-all text-sm`}
                    >
                      {opt.applied ? (
                        <>
                          <Check className="h-3.5 w-3.5 mr-1.5" />
                          Applied
                        </>
                      ) : (
                        'Apply'
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Optimization Score */}
            <div className="bg-gradient-to-r from-eco-indigo/20 to-eco-purple/20 p-5 rounded-lg border border-white/10">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-montserrat font-semibold text-white">Optimization Score</h4>
                <div className="text-2xl font-dm-mono text-white">{calculateOptimizationScore()}%</div>
              </div>
              <div className="w-full bg-black/30 h-2 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-eco-green to-eco-blue transition-all duration-500"
                  style={{ width: `${calculateOptimizationScore()}%` }}
                ></div>
              </div>
              <div className="mt-4 flex items-start space-x-2">
                <Info className="h-4 w-4 text-white/70 mt-0.5 flex-shrink-0" />
                <p className="text-white/70 text-sm">
                  {calculateOptimizationScore() < 30 ? (
                    "Your app has significant room for performance improvement. Start by applying high-impact optimizations."
                  ) : calculateOptimizationScore() < 70 ? (
                    "You're making good progress! Continue applying optimizations for better performance."
                  ) : (
                    "Excellent! Your app is well-optimized for performance."
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 bg-black/20 flex justify-between items-center">
          <div className="flex items-center text-white/70 text-sm">
            <AlertTriangle className="h-4 w-4 mr-2 text-yellow-500" />
            Performance analysis is simplified for demo purposes
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper component to display optimization descriptions
const OptimizationDescription = ({ optimization }) => {
  let description = '';
  
  switch (optimization) {
    case 'Memo Components':
      description = 'Wrap pure components with React.memo to prevent unnecessary re-renders';
      break;
    case 'Fix Dependency Arrays':
      description = 'Ensure useEffect and useCallback have proper dependency arrays';
      break;
    case 'Lazy Loading Routes':
      description = 'Implement code-splitting for different routes to reduce initial load time';
      break;
    case 'Image Optimization':
      description = 'Optimize image sizes and use proper formats for web';
      break;
    case 'Remove Unused Imports':
      description = 'Clean up unused imports to reduce bundle size';
      break;
    default:
      description = 'Apply this optimization to improve performance';
  }
  
  return <p className="text-white/60 text-sm mt-1">{description}</p>;
};

export default PerformanceOptimizer;