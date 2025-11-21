import { useFightingGame } from "@/lib/stores/useFightingGame";
import { Progress } from "@/components/ui/progress";
import { useEffect, useState } from "react";

export function GameUI() {
  const { players, roundsWon, currentRound, localPlayerId } = useFightingGame();
  const [timer, setTimer] = useState(99);

  const localPlayer = localPlayerId ? players.get(localPlayerId) : null;
  const opponent = Array.from(players.values()).find(p => p.id !== localPlayerId);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 0) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentRound]);

  useEffect(() => {
    setTimer(99);
  }, [currentRound]);

  if (!localPlayer || !opponent) return null;

  const player1 = localPlayer.playerNumber === 1 ? localPlayer : opponent;
  const player2 = localPlayer.playerNumber === 2 ? localPlayer : opponent;

  return (
    <div className="fixed inset-0 pointer-events-none">
      {/* Top HUD */}
      <div className="absolute top-0 left-0 right-0 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-start justify-between gap-8">
            {/* Player 1 Health */}
            <div className="flex-1">
              <div className="bg-black/70 backdrop-blur-sm p-4 rounded-lg border-2 border-red-500">
                <div className="text-white font-bold mb-2 text-xl">PLAYER 1</div>
                <div className="space-y-2">
                  <Progress value={player1.health} className="h-6 bg-gray-700" />
                  <div className="text-white text-sm">{Math.round(player1.health)}%</div>
                  {/* Special Energy Bar */}
                  <div className="mt-2">
                    <div className="text-xs text-yellow-400 mb-1">SPECIAL</div>
                    <Progress value={player1.specialEnergy || 0} className="h-3 bg-gray-700" />
                  </div>
                </div>
                {/* Round indicators */}
                <div className="flex gap-2 mt-2">
                  {[1, 2].map((round) => (
                    <div
                      key={round}
                      className={`w-4 h-4 rounded-full ${
                        roundsWon.player1 >= round ? "bg-yellow-400" : "bg-gray-600"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Center - Timer and Round */}
            <div className="flex flex-col items-center gap-2">
              <div className="bg-black/70 backdrop-blur-sm px-8 py-4 rounded-lg border-2 border-yellow-400">
                <div className="text-yellow-400 font-bold text-4xl tabular-nums">
                  {timer.toString().padStart(2, "0")}
                </div>
              </div>
              <div className="bg-black/70 backdrop-blur-sm px-6 py-2 rounded-lg border-2 border-white">
                <div className="text-white font-bold text-lg">ROUND {currentRound}</div>
              </div>
            </div>

            {/* Player 2 Health */}
            <div className="flex-1">
              <div className="bg-black/70 backdrop-blur-sm p-4 rounded-lg border-2 border-blue-500">
                <div className="text-white font-bold mb-2 text-xl">PLAYER 2</div>
                <div className="space-y-2">
                  <Progress value={player2.health} className="h-6 bg-gray-700" />
                  <div className="text-white text-sm">{Math.round(player2.health)}%</div>
                  {/* Special Energy Bar */}
                  <div className="mt-2">
                    <div className="text-xs text-yellow-400 mb-1">SPECIAL</div>
                    <Progress value={player2.specialEnergy || 0} className="h-3 bg-gray-700" />
                  </div>
                </div>
                {/* Round indicators */}
                <div className="flex gap-2 mt-2 justify-end">
                  {[1, 2].map((round) => (
                    <div
                      key={round}
                      className={`w-4 h-4 rounded-full ${
                        roundsWon.player2 >= round ? "bg-yellow-400" : "bg-gray-600"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Combo Counter */}
      {localPlayer && localPlayer.comboCount > 0 && (
        <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 pointer-events-none">
          <div className="text-center">
            <div className="text-yellow-400 font-bold text-7xl animate-bounce drop-shadow-lg">
              {localPlayer.comboCount} HITS!
            </div>
            <div className="text-white text-3xl font-bold mt-2">COMBO</div>
          </div>
        </div>
      )}

      {/* Bottom - Controls hint */}
      <div className="absolute bottom-4 left-0 right-0">
        <div className="max-w-2xl mx-auto bg-black/70 backdrop-blur-sm p-4 rounded-lg border-2 border-white/30">
          <div className="text-white text-sm text-center space-y-1">
            <div className="font-bold mb-2">CONTROLS</div>
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div>WASD / Arrows - Move</div>
              <div>J - Punch</div>
              <div>K - Kick</div>
              <div>Space - Jump</div>
              <div>L - Block</div>
              <div>Q - Special Move (when energy full)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
