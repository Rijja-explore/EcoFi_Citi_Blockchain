import React, { useEffect, useRef } from 'react';

const EnhancedParticleBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas dimensions
    const setCanvasDimensions = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    setCanvasDimensions();
    window.addEventListener('resize', setCanvasDimensions);
    
    // Particle properties
    const particleCount = 120;
    const particles = [];
    let mousePosition = { x: null, y: null };
    let mouseRadius = 180;
    
    // Track mouse position
    const handleMouseMove = (event) => {
      mousePosition.x = event.clientX;
      mousePosition.y = event.clientY;
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    
    // Create gradient colors matching our design
    const gradients = [
      { from: [74, 222, 128, 0.7], to: [59, 130, 246, 0.7] }, // green-blue gradient
      { from: [139, 92, 246, 0.7], to: [79, 70, 229, 0.7] },  // purple-indigo gradient
    ];
    
    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 4 + 1;
        this.baseSize = this.size;
        this.speedX = Math.random() * 0.7 - 0.35;
        this.speedY = Math.random() * 0.7 - 0.35;
        
        // Randomly choose between green-blue and purple-indigo gradients
        const gradientIndex = Math.floor(Math.random() * gradients.length);
        const gradient = gradients[gradientIndex];
        
        // Create a dynamic gradient for each particle
        const opacity = Math.random() * 0.4 + 0.2; // Higher base opacity for better visibility
        
        // Interpolate between the gradient colors
        const t = Math.random(); // Interpolation factor (0 to 1)
        const r = Math.floor(gradient.from[0] * (1 - t) + gradient.to[0] * t);
        const g = Math.floor(gradient.from[1] * (1 - t) + gradient.to[1] * t);
        const b = Math.floor(gradient.from[2] * (1 - t) + gradient.to[2] * t);
        
        this.color = `rgba(${r}, ${g}, ${b}, ${opacity})`;
        this.density = Math.random() * 30 + 15;
        
        // Add pulse effect
        this.pulse = Math.random() * 0.5 + 0.5;
        this.pulseSpeed = 0.01 + Math.random() * 0.02;
        this.pulseDirection = 1;
        
        // Add rotation for line connections
        this.angle = Math.random() * 360;
        this.angleSpeed = Math.random() * 0.5 - 0.25;
      }
      
      update() {
        // Normal movement
        this.x += this.speedX;
        this.y += this.speedY;
        
        // Pulse effect
        this.pulse += this.pulseSpeed * this.pulseDirection;
        if (this.pulse > 1) {
          this.pulseDirection = -1;
        } else if (this.pulse < 0.5) {
          this.pulseDirection = 1;
        }
        
        // Update angle for dynamic connections
        this.angle += this.angleSpeed;
        if (this.angle > 360) this.angle = 0;
        
        // Mouse interaction
        if (mousePosition.x !== null && mousePosition.y !== null) {
          const dx = mousePosition.x - this.x;
          const dy = mousePosition.y - this.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < mouseRadius) {
            // Repel particles from mouse
            const forceDirectionX = dx / distance;
            const forceDirectionY = dy / distance;
            const force = (mouseRadius - distance) / mouseRadius;
            
            this.speedX -= forceDirectionX * force * 0.8;
            this.speedY -= forceDirectionY * force * 0.8;
            
            // Grow particles near mouse
            this.size = this.baseSize + (this.baseSize * force * 3);
          } else {
            // Return to base size
            if (this.size > this.baseSize) {
              this.size -= 0.1;
            }
          }
        }
        
        // Apply drag to slow particles
        this.speedX *= 0.98;
        this.speedY *= 0.98;
        
        // Wrap around edges with slight buffer to prevent edge particles
        const buffer = 50;
        if (this.x < -buffer) this.x = canvas.width + buffer;
        if (this.x > canvas.width + buffer) this.x = -buffer;
        if (this.y < -buffer) this.y = canvas.height + buffer;
        if (this.y > canvas.height + buffer) this.y = -buffer;
      }
      
      draw() {
        // Apply pulse effect to the opacity
        const parts = this.color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
        if (parts) {
          const baseOpacity = parseFloat(parts[4]);
          const adjustedOpacity = baseOpacity * this.pulse;
          ctx.fillStyle = `rgba(${parts[1]}, ${parts[2]}, ${parts[3]}, ${adjustedOpacity})`;
        } else {
          ctx.fillStyle = this.color;
        }
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    // Create particles
    const initParticles = () => {
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
      }
    };
    
    initParticles();
    
    // Connect particles with lines - enhanced with gradient support
    const connectParticles = () => {
      const maxDistance = 180;
      
      for (let i = 0; i < particles.length; i++) {
        for (let j = i; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < maxDistance) {
            // Create dynamic opacity based on distance
            const opacity = (1 - (distance / maxDistance)) * 0.5;
            
            // Extract color values from rgba strings
            const color1 = particles[i].color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
            const color2 = particles[j].color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
            
            if (color1 && color2) {
              // Create a gradient between the two particle colors
              const gradient = ctx.createLinearGradient(
                particles[i].x, particles[i].y, 
                particles[j].x, particles[j].y
              );
              
              gradient.addColorStop(0, `rgba(${color1[1]}, ${color1[2]}, ${color1[3]}, ${opacity})`);
              gradient.addColorStop(1, `rgba(${color2[1]}, ${color2[2]}, ${color2[3]}, ${opacity})`);
              
              ctx.strokeStyle = gradient;
              ctx.lineWidth = opacity * 2; // Dynamic line width
              ctx.beginPath();
              ctx.moveTo(particles[i].x, particles[i].y);
              ctx.lineTo(particles[j].x, particles[j].y);
              ctx.stroke();
            }
          }
        }
      }
    };
    
    // Animation loop
    const animate = () => {
      // Use a semi-transparent clear to create trails
      ctx.fillStyle = 'rgba(15, 23, 42, 0.05)'; // Matching eco-slate-900
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach(particle => {
        particle.update();
        particle.draw();
      });
      
      connectParticles();
      
      requestAnimationFrame(animate);
    };
    
    // Initial clear
    ctx.fillStyle = 'rgb(15, 23, 42)'; // eco-slate-900
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    animate();
    
    // Clean up
    return () => {
      window.removeEventListener('resize', setCanvasDimensions);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);
  
  return (
    <canvas 
      ref={canvasRef} 
      className="fixed top-0 left-0 w-full h-full -z-10 bg-eco-slate-900"
    />
  );
};

export default EnhancedParticleBackground;