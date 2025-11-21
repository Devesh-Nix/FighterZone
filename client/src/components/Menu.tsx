import { useState } from "react";
import { useFightingGame } from "@/lib/stores/useFightingGame";
import { useSocket } from "@/lib/useSocket";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function Menu() {
  const { setGamePhase, setRoomId, setIsHost } = useFightingGame();
  const { createRoom, joinRoom } = useSocket();
  const [roomInput, setRoomInput] = useState("");
  const [error, setError] = useState("");

  const handleCreateRoom = () => {
    createRoom((result) => {
      if (result.success && result.roomId) {
        setRoomId(result.roomId);
        setIsHost(true);
        setGamePhase("character_selection");
        console.log("Room created:", result.roomId);
      } else {
        setError(result.error || "Failed to create room");
      }
    });
  };

  const handleJoinRoom = () => {
    if (!roomInput.trim()) {
      setError("Please enter a room code");
      return;
    }

    joinRoom(roomInput.toUpperCase(), (result) => {
      if (result.success && result.roomId) {
        setRoomId(result.roomId);
        setIsHost(false);
        setGamePhase("character_selection");
        console.log("Joined room:", result.roomId);
      } else {
        setError(result.error || "Failed to join room");
      }
    });
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-black">
      <div className="max-w-2xl w-full px-4">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold text-white mb-4 drop-shadow-lg">
            FIGHTER<span className="text-yellow-400">ZONE</span>
          </h1>
          <p className="text-xl text-gray-300">Multiplayer Fighting Game</p>
        </div>

        {/* Menu Card */}
        <Card className="bg-black/50 backdrop-blur-md border-2 border-white/20">
          <CardHeader>
            <CardTitle className="text-2xl text-white text-center">
              Choose Your Mode
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Create Room */}
            <div className="space-y-3">
              <h3 className="text-white font-semibold text-lg">Host a Match</h3>
              <Button
                onClick={handleCreateRoom}
                className="w-full h-14 text-lg bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              >
                Create Room
              </Button>
              <p className="text-sm text-gray-400 text-center">
                Create a new room and share the code with your friend
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-white/20" />
              <span className="text-white/50">OR</span>
              <div className="flex-1 h-px bg-white/20" />
            </div>

            {/* Join Room */}
            <div className="space-y-3">
              <h3 className="text-white font-semibold text-lg">Join a Match</h3>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Enter room code"
                  value={roomInput}
                  onChange={(e) => {
                    setRoomInput(e.target.value.toUpperCase());
                    setError("");
                  }}
                  className="flex-1 h-14 text-lg bg-white/10 border-white/30 text-white placeholder:text-gray-400"
                  maxLength={6}
                />
                <Button
                  onClick={handleJoinRoom}
                  className="h-14 px-8 text-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  Join
                </Button>
              </div>
              <p className="text-sm text-gray-400 text-center">
                Enter the room code from your friend
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-red-500/20 border border-red-500 rounded-lg p-3">
                <p className="text-red-200 text-center">{error}</p>
              </div>
            )}

            {/* Info */}
            <div className="bg-blue-500/20 border border-blue-500 rounded-lg p-4 mt-6">
              <p className="text-blue-200 text-sm text-center">
                <strong>Note:</strong> Both players must be on the same WiFi network
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <div className="mt-8 text-center text-white/70 text-sm">
          <p>Best of 3 rounds • Local network multiplayer</p>
        </div>
      </div>
    </div>
  );
}
