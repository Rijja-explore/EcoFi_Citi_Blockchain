import React, { useCallback } from 'react';

const EnhancedParticleBackground = () => {
  const canvasRef = useCallback((canvas) => {
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let particles = [];
    
    // Resize canvas
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    // Initialize particles
    const initParticles = () => {
      particles = [];
      const numParticles = Math.min(150, Math.floor((canvas.width * canvas.height) / 8000));
      
      for (let i = 0; i < numParticles; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          size: Math.random() * 4 + 1,
          opacity: Math.random() * 0.5 + 0.1,
          color: Math.random() > 0.5 ? '#10b981' : '#3b82f6',
          pulse: Math.random() * Math.PI * 2,
          growth: 0
        });
      }
    };
    
    // Mouse interaction
    let mouse = { x: 0, y: 0 };
    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    
    // Animation loop
    const animate = () => {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach((particle, index) => {
        // Mouse repulsion
        const dx = mouse.x - particle.x;
        const dy = mouse.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 100) {
          const force = (100 - distance) / 100;
          particle.vx -= (dx / distance) * force * 0.5;
          particle.vy -= (dy / distance) * force * 0.5;
          
          // Limit growth to prevent NaN or Infinity
          particle.growth = Math.min(particle.growth + 0.1, 2);
          
          // Limit velocity to prevent extreme values
          particle.vx = Math.min(Math.max(particle.vx, -3), 3);
          particle.vy = Math.min(Math.max(particle.vy, -3), 3);
        } else {
          particle.growth = Math.max(particle.growth - 0.05, 0);
        }
        
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;
        
        // Wrap around edges
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;
        
        // Update pulse
        particle.pulse += 0.02;
        const pulseSize = Math.sin(particle.pulse) * 0.5 + 1;
        const currentSize = Math.min((particle.size + particle.growth) * pulseSize, 20); // Limit maximum size
        
        // Draw particle with gradient
        // Handle potential NaN or Infinity values
        const safeSize = isFinite(currentSize) ? currentSize : particle.size;
        
        try {
          const gradient = ctx.createRadialGradient(
            particle.x, particle.y, 0,
            particle.x, particle.y, safeSize * 2
          );
          gradient.addColorStop(0, particle.color + Math.floor(particle.opacity * 255).toString(16).padStart(2, '0'));
          gradient.addColorStop(1, particle.color + '00');
          
          ctx.fillStyle = gradient;
        } catch (error) {
          // Fallback to solid color if gradient fails
          ctx.fillStyle = particle.color + Math.floor(particle.opacity * 255).toString(16).padStart(2, '0');
        }
        
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, safeSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw connections
        particles.slice(index + 1).forEach(otherParticle => {
          const dx = particle.x - otherParticle.x;
          const dy = particle.y - otherParticle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 120) {
            const opacity = (1 - distance / 120) * 0.2;
            ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(otherParticle.x, otherParticle.y);
            ctx.stroke();
          }
        });
      });
      
      animationFrameId = requestAnimationFrame(animate);
    };
    
    // Setup and cleanup
    resizeCanvas();
    initParticles();
    window.addEventListener('resize', () => {
      resizeCanvas();
      initParticles();
    });
    canvas.addEventListener('mousemove', handleMouseMove);
    animate();
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);
  
  return (
    <canvas 
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
    />
  );
};

export default EnhancedParticleBackground;