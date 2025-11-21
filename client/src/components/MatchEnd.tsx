import { useFightingGame } from "@/lib/stores/useFightingGame";
import { useSocket } from "@/lib/useSocket";
import { Button } from "@/components/ui/button";

export function MatchEnd() {
  const { matchWinner, localPlayerId, players, roundsWon, isHost, resetGame } = useFightingGame();
  const { resetMatch } = useSocket();

  const localPlayer = localPlayerId ? players.get(localPlayerId) : null;
  const isWinner = localPlayer && matchWinner === localPlayer.playerNumber;

  const handleRematch = () => {
    if (isHost) {
      resetMatch();
    }
  };

  const handleQuit = () => {
    resetGame();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-black z-50">
      <div className="text-center space-y-8 max-w-2xl px-4">
        {/* Victory/Defeat Banner */}
        <div className="space-y-4">
          <div
            className={`text-9xl font-bold drop-shadow-2xl ${
              isWinner
                ? "text-yellow-400 animate-bounce"
                : "text-red-500"
            }`}
          >
            {isWinner ? "VICTORY!" : "DEFEAT"}
          </div>
          <div className="text-4xl text-white font-bold">
            {isWinner ? "🏆 YOU ARE THE CHAMPION! 🏆" : "Better luck next time..."}
          </div>
        </div>

        {/* Match Results */}
        <div className="bg-black/70 backdrop-blur-md p-8 rounded-xl border-4 border-white/20">
          <h2 className="text-3xl text-white font-bold mb-6">MATCH RESULTS</h2>
          
          <div className="flex justify-center items-center gap-16 mb-6">
            <div className="text-center">
              <div className="text-gray-400 text-xl mb-3">Player 1</div>
              <div
                className={`text-6xl font-bold ${
                  roundsWon.player1 > roundsWon.player2 ? "text-yellow-400" : "text-white"
                }`}
              >
                {roundsWon.player1}
              </div>
            </div>
            
            <div className="text-white text-5xl font-bold">-</div>
            
            <div className="text-center">
              <div className="text-gray-400 text-xl mb-3">Player 2</div>
              <div
                className={`text-6xl font-bold ${
                  roundsWon.player2 > roundsWon.player1 ? "text-yellow-400" : "text-white"
                }`}
              >
                {roundsWon.player2}
              </div>
            </div>
          </div>

          <div className="text-gray-300 text-lg">
            Best of 3 Rounds
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          {isHost && (
            <Button
              onClick={handleRematch}
              className="h-16 px-12 text-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
            >
              REMATCH
            </Button>
          )}
          {!isHost && (
            <div className="bg-blue-500/20 border border-blue-500 rounded-lg px-6 py-4">
              <p className="text-blue-200">Waiting for host to start rematch...</p>
            </div>
          )}
          <Button
            onClick={handleQuit}
            variant="outline"
            className="h-16 px-12 text-xl border-2 border-white/30 bg-white/10 hover:bg-white/20 text-white"
          >
            QUIT TO MENU
          </Button>
        </div>
      </div>
    </div>
  );
}
