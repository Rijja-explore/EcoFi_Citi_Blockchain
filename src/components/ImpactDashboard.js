import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar
} from 'recharts';
import GlassCard from './GlassCard';
import { BarChart3, TrendingUp, PieChart as PieChartIcon, Activity } from 'lucide-react';

const ImpactDashboard = ({ cumulativeKwh, milestones }) => {
  // Calculate derived metrics
  const co2Offset = (cumulativeKwh * 0.7) / 1000; // 0.7 kg CO2 per kWh / 1000 = tons
  const treesEquivalent = Math.round(co2Offset * 20); // 20 trees per ton of CO2
  
  // Generate time series data (simulated)
  const generateTimeSeriesData = () => {
    const data = [];
    const months = 6;
    let kwhValue = 0;
    
    // Add historical data points (past months)
    for (let i = 0; i < months; i++) {
      // Simulate a realistic growth curve
      const monthlyGrowth = i === 0 ? cumulativeKwh * 0.2 : data[i-1].kwh * 0.2;
      kwhValue = i === 0 ? cumulativeKwh : data[i-1].kwh + monthlyGrowth;
      
      data.push({
        month: getMonthName(i),
        kwh: Math.round(kwhValue),
        co2: Math.round((kwhValue * 0.7) / 1000 * 10) / 10, // Convert to tons with 1 decimal place
      });
    }
    
    // Add forecast data (future months)
    for (let i = 0; i < 6; i++) {
      const monthlyGrowth = data[data.length-1].kwh * 0.15; // 15% growth
      kwhValue = data[data.length-1].kwh + monthlyGrowth;
      
      data.push({
        month: getMonthName(months + i),
        kwh: Math.round(kwhValue),
        co2: Math.round((kwhValue * 0.7) / 1000 * 10) / 10,
        forecast: true
      });
    }
    
    return data;
  };
  
  // Get month name for time series
  const getMonthName = (monthsFromNow) => {
    const date = new Date();
    date.setMonth(date.getMonth() - 5 + monthsFromNow);
    return date.toLocaleString('default', { month: 'short' });
  };
  
  // Generate milestone progress data
  const generateMilestoneData = () => {
    if (!milestones || milestones.length === 0) return [];
    
    return milestones.map((milestone, index) => {
      const thresholdKwh = parseFloat(milestone.thresholdKwh.toString());
      const percentComplete = Math.min(100, (cumulativeKwh / thresholdKwh) * 100);
      
      return {
        name: `M${index + 1}`,
        value: percentComplete,
        threshold: thresholdKwh,
        fill: percentComplete >= 100 ? '#10B981' : '#8A5CF6'
      };
    });
  };
  
  // Generate distribution of environmental impact
  const generateImpactDistribution = () => {
    return [
      { name: 'CO₂ Reduction', value: 45, fill: '#10B981' },
      { name: 'Clean Water', value: 20, fill: '#3B82F6' },
      { name: 'Habitat Protection', value: 25, fill: '#8A5CF6' },
      { name: 'Other Benefits', value: 10, fill: '#F59E0B' }
    ];
  };
  
  const timeSeriesData = generateTimeSeriesData();
  const milestoneData = generateMilestoneData();
  const impactDistribution = generateImpactDistribution();
  
  // Custom tooltip for time series chart
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const isForecast = payload[0].payload.forecast;
      
      return (
        <div className="bg-eco-slate-900/90 p-3 rounded-lg border border-white/10 shadow-xl">
          <p className="font-montserrat font-semibold text-white">{label} {isForecast ? '(Forecast)' : ''}</p>
          <p className="text-eco-green font-mono">
            Energy: {payload[0].value.toLocaleString()} kWh
          </p>
          <p className="text-eco-blue font-mono">
            CO₂ Offset: {payload[1].value} tons
          </p>
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="space-y-8">
      <GlassCard className="p-6" animatedBorder>
        <h2 className="text-2xl font-montserrat font-bold text-white mb-6 flex items-center">
          <Activity className="mr-2 text-eco-green" />
          Impact Metrics Dashboard
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white/5 p-4 rounded-lg">
            <div className="text-white/70 text-sm font-inter mb-1">Total Clean Energy</div>
            <div className="text-white text-3xl font-mono font-semibold">
              {cumulativeKwh.toLocaleString()} kWh
            </div>
          </div>
          
          <div className="bg-white/5 p-4 rounded-lg">
            <div className="text-white/70 text-sm font-inter mb-1">CO₂ Emissions Avoided</div>
            <div className="text-white text-3xl font-mono font-semibold">
              {co2Offset.toFixed(2)} tons
            </div>
          </div>
          
          <div className="bg-white/5 p-4 rounded-lg">
            <div className="text-white/70 text-sm font-inter mb-1">Equivalent Trees Planted</div>
            <div className="text-white text-3xl font-mono font-semibold">
              {treesEquivalent.toLocaleString()} trees
            </div>
          </div>
        </div>
        
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-montserrat font-semibold text-white flex items-center">
              <TrendingUp className="mr-2 h-5 w-5 text-eco-blue" />
              Energy Production & Impact Timeline
            </h3>
            <div className="flex items-center text-xs font-inter">
              <div className="flex items-center mr-4">
                <div className="w-3 h-3 bg-eco-green rounded-full mr-1"></div>
                <span className="text-white/70">Actual</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-eco-green/40 rounded-full mr-1"></div>
                <span className="text-white/70">Forecast</span>
              </div>
            </div>
          </div>
          
          <div className="h-72 bg-white/5 rounded-lg p-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="month" 
                  stroke="rgba(255,255,255,0.5)"
                  tick={{ fill: 'rgba(255,255,255,0.7)' }}
                />
                <YAxis 
                  yAxisId="left"
                  orientation="left"
                  stroke="rgba(255,255,255,0.5)"
                  tick={{ fill: 'rgba(255,255,255,0.7)' }}
                  label={{ 
                    value: 'Energy (kWh)', 
                    angle: -90, 
                    position: 'insideLeft',
                    fill: 'rgba(255,255,255,0.7)'
                  }}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  stroke="rgba(255,255,255,0.5)"
                  tick={{ fill: 'rgba(255,255,255,0.7)' }}
                  label={{ 
                    value: 'CO₂ Offset (tons)', 
                    angle: -90, 
                    position: 'insideRight',
                    fill: 'rgba(255,255,255,0.7)' 
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="kwh" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  dot={(props) => {
                    const { cx, cy, payload } = props;
                    if (payload.forecast) {
                      return (
                        <circle 
                          cx={cx} 
                          cy={cy} 
                          r={4} 
                          fill="#0d9668" 
                          fillOpacity={0.4}
                          stroke="#10B981"
                          strokeWidth={1}
                        />
                      );
                    }
                    return (
                      <circle 
                        cx={cx} 
                        cy={cy} 
                        r={4} 
                        fill="#10B981" 
                        stroke="#fff"
                        strokeWidth={1}
                      />
                    );
                  }}
                  activeDot={{ r: 6, fill: '#10B981', stroke: '#fff', strokeWidth: 2 }}
                  name="Energy Generated"
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="co2" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={(props) => {
                    const { cx, cy, payload } = props;
                    if (payload.forecast) {
                      return (
                        <circle 
                          cx={cx} 
                          cy={cy} 
                          r={4} 
                          fill="#2563eb" 
                          fillOpacity={0.4}
                          stroke="#3B82F6"
                          strokeWidth={1}
                        />
                      );
                    }
                    return (
                      <circle 
                        cx={cx} 
                        cy={cy} 
                        r={4} 
                        fill="#3B82F6" 
                        stroke="#fff"
                        strokeWidth={1}
                      />
                    );
                  }}
                  activeDot={{ r: 6, fill: '#3B82F6', stroke: '#fff', strokeWidth: 2 }}
                  name="CO₂ Offset"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-montserrat font-semibold text-white mb-4 flex items-center">
              <BarChart3 className="mr-2 h-5 w-5 text-eco-purple" />
              Milestone Progress
            </h3>
            
            <div className="h-64 bg-white/5 rounded-lg p-4">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart 
                  innerRadius="20%" 
                  outerRadius="80%" 
                  data={milestoneData} 
                  startAngle={180} 
                  endAngle={0}
                >
                  <RadialBar
                    background
                    clockWise={true}
                    dataKey="value"
                    cornerRadius={10}
                    label={{
                      fill: '#fff',
                      position: 'insideStart',
                      formatter: (value) => `${Math.round(value)}%`,
                    }}
                  />
                  <Tooltip 
                    formatter={(value, name, props) => [`${Math.round(value)}% Complete`, `Milestone ${name}`]}
                    contentStyle={{ 
                      backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                      color: 'white'
                    }}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-montserrat font-semibold text-white mb-4 flex items-center">
              <PieChartIcon className="mr-2 h-5 w-5 text-eco-blue" />
              Environmental Impact Distribution
            </h3>
            
            <div className="h-64 bg-white/5 rounded-lg p-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={impactDistribution}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {impactDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`${value}%`, 'Distribution']}
                    contentStyle={{ 
                      backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                      color: 'white'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default ImpactDashboard;