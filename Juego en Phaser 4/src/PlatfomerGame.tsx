import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { PlatformerScene } from './PlatformerScene';

// ─── Tipos ────────────────────────────────────────────────────────────────
interface PlatformerGameProps {
  width?: number;
  height?: number;
  className?: string;
}

// ─── Componente ───────────────────────────────────────────────────────────
export default function PlatformerGame({
  width = 800,
  height = 500,
  className = '',
}: PlatformerGameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width,
      height,
      parent: containerRef.current,
      backgroundColor: '#1a1a2e',
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 }, // La gravedad del jugador se define en la escena
          debug: false,             // Cambiar a true para ver hitboxes
        },
      },
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      render: {
        pixelArt: true,            // Bordes nítidos para el estilo pixel-art
        antialias: false,
      },
      scene: [PlatformerScene],
    };

    gameRef.current = new Phaser.Game(config);

    // Cleanup al desmontar el componente
    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, [width, height]);

  return (
    <div className={`relative ${className}`}>
      {/* Contenedor del canvas de Phaser */}
      <div
        ref={containerRef}
        style={{ width, height }}
        className="rounded-xl overflow-hidden shadow-2xl"
      />

      {/* Badge de versión */}
      <div className="absolute top-2 right-2 px-2 py-0.5 rounded text-xs font-mono bg-black/50 text-teal-400 border border-teal-800 pointer-events-none">
        Phaser 4
      </div>
    </div>
  );
}
