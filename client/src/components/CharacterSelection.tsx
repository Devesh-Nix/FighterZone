import { useState } from "react";
import { useFightingGame } from "@/lib/stores/useFightingGame";
import { useSocket } from "@/lib/useSocket";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const characters = [
  {
    id: 0,
    name: "RED WARRIOR",
    description: "Martial artist with powerful strikes",
    color: "from-red-500 to-red-700",
    style: "Balanced"
  },
  {
    id: 1,
    name: "BLUE STRIKER",
    description: "Agile kickboxer with fast combos",
    color: "from-blue-500 to-blue-700",
    style: "Speed"
  },
  {
    id: 2,
    name: "SHADOW NINJA",
    description: "Swift assassin with lightning attacks",
    color: "from-gray-700 to-black",
    style: "Speed"
  },
  {
    id: 3,
    name: "IRON GRAPPLER",
    description: "Powerful wrestler with devastating throws",
    color: "from-amber-600 to-orange-700",
    style: "Power"
  },
  {
    id: 4,
    name: "FLOW DANCER",
    description: "Capoeira master with acrobatic moves",
    color: "from-green-500 to-teal-600",
    style: "Technique"
  },
  {
    id: 5,
    name: "STEEL STRIKER",
    description: "Muay Thai champion with brutal strikes",
    color: "from-purple-600 to-pink-600",
    style: "Power"
  },
];

export function CharacterSelection() {
  const { selectedCharacter, setSelectedCharacter, roomId, setGamePhase } = useFightingGame();
  const { playerReady } = useSocket();
  const [isReady, setIsReady] = useState(false);

  const handleSelectCharacter = (characterId: number) => {
    setSelectedCharacter(characterId);
  };

  const handleReady = () => {
    if (selectedCharacter !== null && !isReady) {
      playerReady(selectedCharacter);
      setIsReady(true);
      setGamePhase("waiting");
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-black">
      <div className="max-w-5xl w-full px-4">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2 drop-shadow-lg">
            SELECT YOUR FIGHTER
          </h1>
          {roomId && (
            <div className="inline-block bg-black/50 backdrop-blur-sm px-6 py-3 rounded-lg border-2 border-yellow-400">
              <p className="text-yellow-400 font-bold text-xl">
                Room Code: {roomId}
              </p>
            </div>
          )}
        </div>

        {/* Character Grid */}
        <div className="grid grid-cols-3 gap-6 mb-8 max-h-[60vh] overflow-y-auto px-2">
          {characters.map((character) => (
            <Card
              key={character.id}
              className={`cursor-pointer transition-all duration-300 ${
                selectedCharacter === character.id
                  ? "scale-105 border-4 border-yellow-400 bg-yellow-400/20"
                  : "border-2 border-white/20 bg-black/50 hover:scale-102 hover:border-white/40"
              }`}
              onClick={() => handleSelectCharacter(character.id)}
            >
              <CardContent className="p-4">
                <div
                  className={`w-full h-40 rounded-lg bg-gradient-to-br ${character.color} mb-3 flex items-center justify-center`}
                >
                  <div className="text-white/30 text-5xl font-bold">
                    {character.name.charAt(0)}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-1">{character.name}</h3>
                <p className="text-gray-400 text-sm mb-2">{character.description}</p>
                <div className="text-xs text-yellow-400 font-semibold">
                  Style: {character.style}
                </div>
                {selectedCharacter === character.id && (
                  <div className="mt-3 text-yellow-400 font-bold text-center">
                    ✓ SELECTED
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Ready Button */}
        <div className="text-center">
          <Button
            onClick={handleReady}
            disabled={selectedCharacter === null || isReady}
            className="h-16 px-12 text-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:opacity-50"
          >
            {isReady ? "WAITING FOR OPPONENT..." : "READY"}
          </Button>
        </div>

        {isReady && (
          <div className="text-center mt-6">
            <div className="inline-block bg-blue-500/20 border border-blue-500 rounded-lg px-6 py-3">
              <p className="text-blue-200 animate-pulse">Waiting for other player...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
