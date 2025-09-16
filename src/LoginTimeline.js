import React, { useState, useEffect } from 'react';
import { getWalletLoginTimeline } from './firebaseConfig';
import { Clock, LogIn, LogOut } from 'lucide-react';

const LoginTimeline = ({ walletAddress }) => {
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchTimeline = async () => {
      if (!walletAddress) {
        setTimeline([]);
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const data = await getWalletLoginTimeline(walletAddress);
        setTimeline(data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching login timeline:", err);
        setError("Failed to load login history");
        setLoading(false);
      }
    };
    
    fetchTimeline();
  }, [walletAddress]);
  
  if (!walletAddress) {
    return (
      <div className="glass-card p-6 rounded-2xl">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" /> Login Timeline
        </h3>
        <p className="text-gray-400 text-center py-6">Connect your wallet to view login history</p>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div className="glass-card p-6 rounded-2xl">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" /> Login Timeline
        </h3>
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="glass-card p-6 rounded-2xl">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" /> Login Timeline
        </h3>
        <div className="text-red-500 text-center py-6">{error}</div>
      </div>
    );
  }
  
  return (
    <div className="glass-card p-6 rounded-2xl">
      <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
        <Clock className="w-5 h-5" /> Login Timeline
      </h3>
      
      {timeline.length === 0 ? (
        <p className="text-gray-400 text-center py-6">No login history found</p>
      ) : (
        <div className="space-y-4">
          {timeline.map((item) => (
            <div key={item.id} className="flex items-start gap-3">
              {item.action === 'login' ? (
                <LogIn className="w-5 h-5 text-green-500 mt-1" />
              ) : (
                <LogOut className="w-5 h-5 text-red-500 mt-1" />
              )}
              <div className="flex-1">
                <div className="text-white text-sm">
                  {item.action === 'login' ? 'Connected Wallet' : 'Disconnected Wallet'}
                </div>
                <div className="text-gray-400 text-xs">
                  {item.time.toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LoginTimeline;