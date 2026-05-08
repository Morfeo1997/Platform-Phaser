import { useEffect, useRef } from 'react';
import { Game, AUTO, Scale } from 'phaser';
import { MenuScene }        from './scenes/transitions/MenuScene';
import { LevelSelectScene } from './scenes/LevelSelectScene';
import { GameScene }        from './scenes/GameScene';

interface GameProps {
  width?:     number;
  height?:    number;
  className?: string;
}

/**
 * Componente React que monta el juego completo.
 * Reemplaza a PlatformerGame.tsx — ahora arranca en MenuScene
 * y navega a LevelSelectScene / GameScene internamente.
 */
export default function PixelQuestGame({
  width     = 800,
  height    = 500,
  className = '',
}: GameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef      = useRef<Game | null>(null);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    gameRef.current = new Game({
      type:            AUTO,
      width,
      height,
      parent:          containerRef.current,
      backgroundColor: '#1a1a2e',

      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 }, // cada entidad define su propia gravedad
          debug:   false,           // → true para ver hitboxes
        },
      },

      scale: {
        mode:       Scale.FIT,
        autoCenter: Scale.CENTER_BOTH,
      },

      render: {
        pixelArt:  true,
        antialias: false,
      },

      // Orden importante: la primera escena arranca automáticamente
      scene: [
        MenuScene,         // ← pantalla de inicio
        LevelSelectScene,  // ← selección de nivel
        GameScene,         // ← juego
      ],
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
    </div>
  );
}
