
import React, { useEffect, useState } from 'react';

const BackgroundDecor: React.FC = () => {
  const [hearts, setHearts] = useState<{ id: number; left: number; size: number; duration: number; delay: number }[]>([]);

  useEffect(() => {
    const newHearts = Array.from({ length: 12 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: Math.random() * (20 - 10) + 10,
      duration: Math.random() * (25 - 15) + 15,
      delay: Math.random() * 10
    }));
    setHearts(newHearts);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {hearts.map((heart) => (
        <div
          key={heart.id}
          className="heart-particle opacity-0"
          style={{
            left: `${heart.left}%`,
            fontSize: `${heart.size}px`,
            animationDuration: `${heart.duration}s`,
            animationDelay: `${heart.delay}s`,
            bottom: '-50px',
            color: '#a0522d' // Sienna brown instead of bright red
          }}
        >
          ❤
        </div>
      ))}
    </div>
  );
};

export default BackgroundDecor;
