import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useFightingGame, PlayerData } from "./stores/useFightingGame";

// Create a singleton socket instance outside the hook
const socket = io(window.location.origin, {
  transports: ["websocket", "polling"],
  autoConnect: false, // We'll connect it manually when needed
});

export function useSocket() {
  const {
    setLocalPlayerId,
    setPlayers,
    updatePlayer,
    setGamePhase,
    setRoundsWon,
    setRoundWinner,
    setMatchWinner,
    setCurrentRound,
    roomId,
  } = useFightingGame();

  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }

    const onConnect = () => {
      console.log("Connected to server:", socket.id);
      setLocalPlayerId(socket.id!);
    };

    const onPlayerJoined = (data: { playerId: string; playerState: PlayerData; totalPlayers: number }) => {
      console.log("Player joined:", data);
      const players = new Map(useFightingGame.getState().players);
      players.set(data.playerId, data.playerState);
      setPlayers(players);
    };

    const onGameStart = (data: { players: Array<{ id: string } & PlayerData> }) => {
      console.log("Game starting:", data);
      const playersMap = new Map<string, PlayerData>();
      data.players.forEach((p) => {
        playersMap.set(p.id, {
          id: p.id,
          characterId: p.characterId,
          playerNumber: p.playerNumber,
          health: p.health,
          position: p.position,
          rotation: p.rotation,
          velocity: p.velocity,
          isBlocking: p.isBlocking,
          isAttacking: p.isAttacking,
          attackType: p.attackType,
          comboCount: p.comboCount || 0,
          specialEnergy: p.specialEnergy || 0,
        });
      });
      setPlayers(playersMap);
      setGamePhase("fighting");
    };

    const onOpponentUpdate = (data: { playerId: string; playerState: PlayerData }) => {
      updatePlayer(data.playerId, data.playerState);
    };

    const onOpponentAttack = (data: { playerId: string; attackType: string; attackData: any }) => {
      updatePlayer(data.playerId, {
        isAttacking: true,
        attackType: data.attackType,
      });
    };

    const onPlayerDamaged = (data: { playerId: string; health: number; damage: number }) => {
      console.log("Player damaged:", data);
      updatePlayer(data.playerId, { health: data.health });
    };

    const onRoundEnd = (data: { winner: number; roundsWon: { player1: number; player2: number } }) => {
      console.log("Round ended:", data);
      setRoundsWon(data.roundsWon);
      setRoundWinner(data.winner);
      setGamePhase("round_end");
    };

    const onMatchEnd = (data: { winner: number; roundsWon: { player1: number; player2: number } }) => {
      console.log("Match ended:", data);
      setMatchWinner(data.winner);
      setGamePhase("match_end");
    };

    const onRoundReset = (data: { currentRound: number; players: Array<{ id: string } & PlayerData> }) => {
      console.log("Round reset:", data);
      const playersMap = new Map<string, PlayerData>();
      data.players.forEach((p) => {
        playersMap.set(p.id, {
          id: p.id,
          characterId: p.characterId,
          playerNumber: p.playerNumber,
          health: p.health,
          position: p.position,
          rotation: p.rotation,
          velocity: p.velocity,
          isBlocking: p.isBlocking,
          isAttacking: p.isAttacking,
          attackType: p.attackType,
          comboCount: p.comboCount || 0,
          specialEnergy: p.specialEnergy || 0,
        });
      });
      setPlayers(playersMap);
      setCurrentRound(data.currentRound);
      setRoundWinner(null);
      setGamePhase("fighting");
    };

    const onMatchReset = (data: { players: Array<{ id: string } & PlayerData> }) => {
      console.log("Match reset:", data);
      const playersMap = new Map<string, PlayerData>();
      data.players.forEach((p) => {
        playersMap.set(p.id, {
          id: p.id,
          characterId: p.characterId,
          playerNumber: p.playerNumber,
          health: p.health,
          position: p.position,
          rotation: p.rotation,
          velocity: p.velocity,
          isBlocking: p.isBlocking,
          isAttacking: p.isAttacking,
          attackType: p.attackType,
          comboCount: p.comboCount || 0,
          specialEnergy: p.specialEnergy || 0,
        });
      });
      setPlayers(playersMap);
      setRoundsWon({ player1: 0, player2: 0 });
      setCurrentRound(1);
      setMatchWinner(null);
      setRoundWinner(null);
      setGamePhase("fighting");
    };

    const onPlayerLeft = (data: { playerId: string }) => {
      console.log("Player left:", data);
      const players = new Map(useFightingGame.getState().players);
      players.delete(data.playerId);
      setPlayers(players);
      setGamePhase("menu");
    };

    const onDisconnect = () => {
      console.log("Disconnected from server");
    };

    // Attach listeners
    socket.on("connect", onConnect);
    socket.on("player-joined", onPlayerJoined);
    socket.on("game-start", onGameStart);
    socket.on("opponent-update", onOpponentUpdate);
    socket.on("opponent-attack", onOpponentAttack);
    socket.on("player-damaged", onPlayerDamaged);
    socket.on("round-end", onRoundEnd);
    socket.on("match-end", onMatchEnd);
    socket.on("round-reset", onRoundReset);
    socket.on("match-reset", onMatchReset);
    socket.on("player-left", onPlayerLeft);
    socket.on("disconnect", onDisconnect);

    // Initial check if already connected
    if (socket.connected) {
      setLocalPlayerId(socket.id!);
    }

    // Cleanup listeners on unmount
    return () => {
      socket.off("connect", onConnect);
      socket.off("player-joined", onPlayerJoined);
      socket.off("game-start", onGameStart);
      socket.off("opponent-update", onOpponentUpdate);
      socket.off("opponent-attack", onOpponentAttack);
      socket.off("player-damaged", onPlayerDamaged);
      socket.off("round-end", onRoundEnd);
      socket.off("match-end", onMatchEnd);
      socket.off("round-reset", onRoundReset);
      socket.off("match-reset", onMatchReset);
      socket.off("player-left", onPlayerLeft);
      socket.off("disconnect", onDisconnect);
    };
  }, []);

  const createRoom = (callback: (result: { success: boolean; roomId?: string; error?: string }) => void) => {
    socket.emit("create-room", callback);
  };

  const joinRoom = (roomId: string, callback: (result: { success: boolean; roomId?: string; error?: string }) => void) => {
    socket.emit("join-room", roomId, callback);
  };

  const playerReady = (characterId: number) => {
    if (roomId) {
      socket.emit("player-ready", { roomId, characterId });
    }
  };

  const sendPlayerUpdate = (playerState: Partial<PlayerData>) => {
    if (roomId) {
      socket.emit("player-update", { roomId, playerState });
    }
  };

  const sendAttack = (attackType: string, attackData: any) => {
    if (roomId) {
      socket.emit("attack", { roomId, attackType, attackData });
    }
  };

  const confirmHit = (targetId: string, damage: number) => {
    if (roomId) {
      socket.emit("hit-confirmed", { roomId, targetId, damage });
    }
  };

  const resetRound = () => {
    if (roomId) {
      socket.emit("reset-round", roomId);
    }
  };

  const resetMatch = () => {
    if (roomId) {
      socket.emit("reset-match", roomId);
    }
  };

  return {
    socket,
    createRoom,
    joinRoom,
    playerReady,
    sendPlayerUpdate,
    sendAttack,
    confirmHit,
    resetRound,
    resetMatch,
  };
}
