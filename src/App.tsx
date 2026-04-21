import PlatformerGame from './PlatformerGame';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-3xl font-bold text-teal-400 font-mono tracking-tight">
        🎮 Platformer Base — Phaser 4
      </h1>

      <PlatformerGame width={800} height={500} />

      <p className="text-gray-500 text-sm font-mono">
        ← → Mover &nbsp;|&nbsp; ↑ / ESPACIO Saltar (doble salto) &nbsp;|&nbsp; Z Golpear
      </p>
    </div>
  );
}
