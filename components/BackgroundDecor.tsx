
import React, { useEffect, useState } from 'react';

const BackgroundDecor: React.FC = () => {
  const [particles, setParticles] = useState<{ id: number; left: number; size: number; duration: number; delay: number; char: string }[]>([]);

  useEffect(() => {
    const chars = ['❤', '·', '✧', '•', '❣'];
    const newParticles = Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: Math.random() * (18 - 6) + 6,
      duration: Math.random() * (30 - 15) + 15,
      delay: Math.random() * 10,
      char: chars[Math.floor(Math.random() * chars.length)]
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((p) => (
        <div
          key={p.id}
          className="dust-particle opacity-0"
          style={{
            left: `${p.left}%`,
            fontSize: `${p.size}px`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            bottom: '-50px',
          }}
        >
          {p.char}
        </div>
      ))}
      {/* Vignette effect */}
      <div className="absolute inset-0 bg-radial-gradient(circle, transparent 40%, rgba(0,0,0,0.4) 100%) pointer-events-none shadow-[inset_0_0_150px_rgba(0,0,0,0.8)]"></div>
    </div>
  );
};

export default BackgroundDecor;
