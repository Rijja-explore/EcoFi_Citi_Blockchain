import React from 'react';

const GlassCard = ({ 
  children, 
  className = '', 
  hoverEffect = true, 
  animatedBorder = false,
  gradientBorder = false
}) => {
  const baseClasses = "relative backdrop-blur-lg bg-white/10 rounded-2xl shadow-xl overflow-hidden";
  const hoverClasses = hoverEffect ? "transition-all duration-300 hover:shadow-2xl hover:translate-y-[-2px] hover:bg-white/20" : "";
  const borderClasses = animatedBorder 
    ? "before:absolute before:inset-0 before:p-[2px] before:rounded-2xl before:bg-gradient-to-r before:from-eco-green before:via-eco-purple before:to-eco-blue before:animate-purple-glow before:-z-10"
    : gradientBorder
      ? "border-2 border-transparent bg-gradient-to-r from-eco-green via-eco-purple to-eco-blue bg-clip-padding"
      : "";
    
  return (
    <div className={`${baseClasses} ${hoverClasses} ${borderClasses} ${className}`}>
      {children}
    </div>
  );
};

export default GlassCard;