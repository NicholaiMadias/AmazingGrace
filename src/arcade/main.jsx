import React, { useEffect, useRef, useState } from "react";

export default function MatrixOfConscience({ stats, chainLevel }) {
  const canvasRef = useRef(null);
  const [isSupernova, setIsSupernova] = useState(false);
  const prevLevel = useRef(chainLevel);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let particles = [];
    let animationFrameId;

    // Trigger Supernova on Level Up
    if (chainLevel > prevLevel.current) {
      triggerBurst();
    }
    prevLevel.current = chainLevel;

    function triggerBurst() {
      setIsSupernova(true);
      // Create 150 high-velocity particles
      for (let i = 0; i < 150; i++) {
        particles.push({
          x: canvas.width / 2,
          y: canvas.height / 2,
          dx: (Math.random() - 0.5) * 12,
          dy: (Math.random() - 0.5) * 12,
          radius: Math.random() * 3 + 1,
          color: i % 2 === 0 ? '#7effd8' : '#ffffff',
          alpha: 1
        });
      }
      setTimeout(() => setIsSupernova(false), 3000);
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach((p, index) => {
        p.x += p.dx;
        p.y += p.dy;
        p.alpha -= 0.01;

        if (p.alpha <= 0) {
          particles.splice(index, 1);
        } else {
          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.shadowBlur = 10;
          ctx.shadowColor = p.color;
          ctx.fill();
          ctx.restore();
        }
      });
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animationFrameId);
  }, [chainLevel]);

  return (
    <div style={{ position: 'relative', width: '400px', height: '400px' }}>
      <canvas 
        ref={canvasRef} 
        width="400" 
        height="400" 
        style={{ position: 'absolute', top: 0, left: 0, zIndex: 10, pointerEvents: 'none' }}
      />
      <svg width="400" height="400" viewBox="0 0 400 400" style={{ position: 'relative', zIndex: 5 }}>
        {/* Your Matrix Nodes and Aether Core here */}
        <circle cx="200" cy="200" r="60" fill="url(#aetherGlow)" className={isSupernova ? "mc-core-pulse-fast" : "mc-core-pulse"} />
      </svg>
      
      <div className={`supernova-text ${isSupernova ? 'supernova-active' : ''}`}>
        LEVEL {chainLevel} REACHED
      </div>
    </div>
  );
}
