import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useFightingGame, PlayerData } from "./stores/useFightingGame";

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
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
    const socket = io(window.location.origin, {
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Connected to server:", socket.id);
      setLocalPlayerId(socket.id);
    });

    socket.on("player-joined", (data: { playerId: string; playerState: PlayerData; totalPlayers: number }) => {
      console.log("Player joined:", data);
      const players = new Map(useFightingGame.getState().players);
      players.set(data.playerId, data.playerState);
      setPlayers(players);
    });

    socket.on("game-start", (data: { players: Array<{ id: string } & PlayerData> }) => {
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
        });
      });
      setPlayers(playersMap);
      setGamePhase("fighting");
    });

    socket.on("opponent-update", (data: { playerId: string; playerState: PlayerData }) => {
      updatePlayer(data.playerId, data.playerState);
    });

    socket.on("opponent-attack", (data: { playerId: string; attackType: string; attackData: any }) => {
      updatePlayer(data.playerId, {
        isAttacking: true,
        attackType: data.attackType,
      });
    });

    socket.on("player-damaged", (data: { playerId: string; health: number; damage: number }) => {
      console.log("Player damaged:", data);
      updatePlayer(data.playerId, { health: data.health });
    });

    socket.on("round-end", (data: { winner: number; roundsWon: { player1: number; player2: number } }) => {
      console.log("Round ended:", data);
      setRoundsWon(data.roundsWon);
      setRoundWinner(data.winner);
      setGamePhase("round_end");
    });

    socket.on("match-end", (data: { winner: number; roundsWon: { player1: number; player2: number } }) => {
      console.log("Match ended:", data);
      setMatchWinner(data.winner);
      setGamePhase("match_end");
    });

    socket.on("round-reset", (data: { currentRound: number; players: Array<{ id: string } & PlayerData> }) => {
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
        });
      });
      setPlayers(playersMap);
      setCurrentRound(data.currentRound);
      setRoundWinner(null);
      setGamePhase("fighting");
    });

    socket.on("match-reset", (data: { players: Array<{ id: string } & PlayerData> }) => {
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
        });
      });
      setPlayers(playersMap);
      setRoundsWon({ player1: 0, player2: 0 });
      setCurrentRound(1);
      setMatchWinner(null);
      setRoundWinner(null);
      setGamePhase("fighting");
    });

    socket.on("player-left", (data: { playerId: string }) => {
      console.log("Player left:", data);
      const players = new Map(useFightingGame.getState().players);
      players.delete(data.playerId);
      setPlayers(players);
      setGamePhase("menu");
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from server");
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const createRoom = (callback: (result: { success: boolean; roomId?: string; error?: string }) => void) => {
    socketRef.current?.emit("create-room", callback);
  };

  const joinRoom = (roomId: string, callback: (result: { success: boolean; roomId?: string; error?: string }) => void) => {
    socketRef.current?.emit("join-room", roomId, callback);
  };

  const playerReady = (characterId: number) => {
    if (roomId) {
      socketRef.current?.emit("player-ready", { roomId, characterId });
    }
  };

  const sendPlayerUpdate = (playerState: Partial<PlayerData>) => {
    if (roomId) {
      socketRef.current?.emit("player-update", { roomId, playerState });
    }
  };

  const sendAttack = (attackType: string, attackData: any) => {
    if (roomId) {
      socketRef.current?.emit("attack", { roomId, attackType, attackData });
    }
  };

  const confirmHit = (targetId: string, damage: number) => {
    if (roomId) {
      socketRef.current?.emit("hit-confirmed", { roomId, targetId, damage });
    }
  };

  const resetRound = () => {
    if (roomId) {
      socketRef.current?.emit("reset-round", roomId);
    }
  };

  const resetMatch = () => {
    if (roomId) {
      socketRef.current?.emit("reset-match", roomId);
    }
  };

  return {
    socket: socketRef.current,
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
