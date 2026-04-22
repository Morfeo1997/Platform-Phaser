import { useEffect, useRef } from 'react';
// ✅ Misma regla: named imports de phaser
import { Game, AUTO, Scale } from 'phaser';
import { PlatformerScene } from './PlatformerScene';

interface PlatformerGameProps {
  width?: number;
  height?: number;
  className?: string;
}

export default function PlatformerGame({
  width = 800,
  height = 500,
  className = '',
}: PlatformerGameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Game | null>(null);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    gameRef.current = new Game({
      type: AUTO,
      width,
      height,
      parent: containerRef.current,
      backgroundColor: '#1a1a2e',
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false,              // true para ver hitboxes
        },
      },
      scale: {
        mode: Scale.FIT,
        autoCenter: Scale.CENTER_BOTH,
      },
      render: {
        pixelArt: true,
        antialias: false,
      },
      scene: [PlatformerScene],
    });

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, [width, height]);

  return (
    <div className={`relative ${className}`}>
      <div
        ref={containerRef}
        style={{ width, height }}
        className="rounded-xl overflow-hidden shadow-2xl"
      />
      <span className="absolute top-2 right-2 px-2 py-0.5 rounded text-xs font-mono bg-black/50 text-teal-400 border border-teal-800 pointer-events-none">
        Phaser 4
      </span>
    </div>
  );
}
