import { useEffect, useState } from "react";
import { useFightingGame } from "@/lib/stores/useFightingGame";
import { useSocket } from "@/lib/useSocket";
import { Button } from "@/components/ui/button";

export function RoundEnd() {
  const { roundWinner, localPlayerId, players, roundsWon, isHost } = useFightingGame();
  const { resetRound } = useSocket();
  const [countdown, setCountdown] = useState(3);

  const localPlayer = localPlayerId ? players.get(localPlayerId) : null;
  const isWinner = localPlayer && roundWinner === localPlayer.playerNumber;

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (isHost) {
            resetRound();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isHost, resetRound]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-50">
      <div className="text-center space-y-6">
        {/* Winner announcement */}
        <div
          className={`text-8xl font-bold drop-shadow-lg animate-pulse ${
            isWinner ? "text-yellow-400" : "text-red-500"
          }`}
        >
          {isWinner ? "YOU WIN!" : "YOU LOSE!"}
        </div>

        {/* Round status */}
        <div className="bg-black/70 backdrop-blur-sm px-12 py-6 rounded-lg border-2 border-white/30">
          <h2 className="text-3xl text-white font-bold mb-4">ROUND COMPLETE</h2>
          <div className="flex justify-center gap-12 text-2xl">
            <div className="text-center">
              <div className="text-gray-400 mb-2">Player 1</div>
              <div className="text-white font-bold">{roundsWon.player1}</div>
            </div>
            <div className="text-yellow-400 text-4xl">-</div>
            <div className="text-center">
              <div className="text-gray-400 mb-2">Player 2</div>
              <div className="text-white font-bold">{roundsWon.player2}</div>
            </div>
          </div>
        </div>

        {/* Countdown */}
        <div className="bg-white/10 backdrop-blur-sm px-8 py-4 rounded-lg border-2 border-white/20">
          <div className="text-white text-xl">
            Next round in <span className="text-yellow-400 font-bold text-3xl">{countdown}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
