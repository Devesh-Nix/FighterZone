import type { Express } from "express";
import { createServer, type Server } from "http";
import { Server as SocketServer } from "socket.io";
import { storage } from "./storage";

interface PlayerState {
  id: string;
  position: [number, number, number];
  rotation: number;
  health: number;
  isBlocking: boolean;
  isAttacking: boolean;
  attackType: string | null;
  velocity: [number, number, number];
  characterId: number;
  playerNumber: 1 | 2;
  comboCount: number;
  specialEnergy: number;
}

interface GameRoom {
  id: string;
  players: Map<string, PlayerState>;
  roundsWon: { player1: number; player2: number };
  currentRound: number;
  gameStarted: boolean;
}

const gameRooms = new Map<string, GameRoom>();

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  const io = new SocketServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Socket.IO for multiplayer fighting game
  io.on("connection", (socket) => {
    console.log("Player connected:", socket.id);

    // Create a new game room
    socket.on("create-room", (callback) => {
      const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
      const room: GameRoom = {
        id: roomId,
        players: new Map(),
        roundsWon: { player1: 0, player2: 0 },
        currentRound: 1,
        gameStarted: false
      };
      gameRooms.set(roomId, room);
      socket.join(roomId);
      console.log(`Room ${roomId} created by ${socket.id}`);
      callback({ success: true, roomId });
    });

    // Join an existing game room
    socket.on("join-room", (roomId: string, callback) => {
      const room = gameRooms.get(roomId);
      if (!room) {
        callback({ success: false, error: "Room not found" });
        return;
      }
      if (room.players.size >= 2) {
        callback({ success: false, error: "Room is full" });
        return;
      }
      socket.join(roomId);
      console.log(`Player ${socket.id} joined room ${roomId}`);
      callback({ success: true, roomId });
    });

    // Player ready with character selection
    socket.on("player-ready", (data: { roomId: string; characterId: number }) => {
      const room = gameRooms.get(data.roomId);
      if (!room) return;

      const playerNumber = room.players.size === 0 ? 1 : 2;
      const startPosition: [number, number, number] = playerNumber === 1 ? [-4, 0, 0] : [4, 0, 0];
      
      const playerState: PlayerState = {
        id: socket.id,
        position: startPosition,
        rotation: playerNumber === 1 ? Math.PI / 2 : -Math.PI / 2,
        health: 100,
        isBlocking: false,
        isAttacking: false,
        attackType: null,
        velocity: [0, 0, 0],
        characterId: data.characterId,
        playerNumber: playerNumber as 1 | 2,
        comboCount: 0,
        specialEnergy: 0
      };

      room.players.set(socket.id, playerState);

      // Notify all players in room
      io.to(data.roomId).emit("player-joined", {
        playerId: socket.id,
        playerState,
        totalPlayers: room.players.size
      });

      // Start game if both players are ready
      if (room.players.size === 2 && !room.gameStarted) {
        room.gameStarted = true;
        const playersArray = Array.from(room.players.entries()).map(([id, state]) => ({
          id,
          ...state
        }));
        io.to(data.roomId).emit("game-start", { players: playersArray });
        console.log(`Game started in room ${data.roomId}`);
      }
    });

    // Player state updates
    socket.on("player-update", (data: { roomId: string; playerState: Partial<PlayerState> }) => {
      const room = gameRooms.get(data.roomId);
      if (!room) return;

      const player = room.players.get(socket.id);
      if (player) {
        Object.assign(player, data.playerState);
        // Broadcast to other players in room
        socket.to(data.roomId).emit("opponent-update", {
          playerId: socket.id,
          playerState: player
        });
      }
    });

    // Attack event
    socket.on("attack", (data: { roomId: string; attackType: string; attackData: any }) => {
      socket.to(data.roomId).emit("opponent-attack", {
        playerId: socket.id,
        attackType: data.attackType,
        attackData: data.attackData
      });
    });

    // Hit detection
    socket.on("hit-confirmed", (data: { roomId: string; targetId: string; damage: number }) => {
      const room = gameRooms.get(data.roomId);
      if (!room) return;

      const targetPlayer = room.players.get(data.targetId);
      if (targetPlayer) {
        targetPlayer.health = Math.max(0, targetPlayer.health - data.damage);
        
        // Notify both players
        io.to(data.roomId).emit("player-damaged", {
          playerId: data.targetId,
          health: targetPlayer.health,
          damage: data.damage
        });

        // Check if round is over
        if (targetPlayer.health <= 0) {
          const winner = targetPlayer.playerNumber === 1 ? 2 : 1;
          if (winner === 1) {
            room.roundsWon.player1++;
          } else {
            room.roundsWon.player2++;
          }

          io.to(data.roomId).emit("round-end", {
            winner,
            roundsWon: room.roundsWon
          });

          // Check if match is over (best of 3)
          if (room.roundsWon.player1 === 2 || room.roundsWon.player2 === 2) {
            io.to(data.roomId).emit("match-end", {
              winner,
              roundsWon: room.roundsWon
            });
          }
        }
      }
    });

    // Round reset
    socket.on("reset-round", (roomId: string) => {
      const room = gameRooms.get(roomId);
      if (!room) return;

      room.currentRound++;
      
      // Reset player positions and health
      room.players.forEach((player, playerId) => {
        player.health = 100;
        player.position = player.playerNumber === 1 ? [-4, 0, 0] : [4, 0, 0];
        player.rotation = player.playerNumber === 1 ? Math.PI / 2 : -Math.PI / 2;
        player.velocity = [0, 0, 0];
        player.isBlocking = false;
        player.isAttacking = false;
        player.attackType = null;
        player.comboCount = 0;
        player.specialEnergy = 0;
      });

      io.to(roomId).emit("round-reset", {
        currentRound: room.currentRound,
        players: Array.from(room.players.entries()).map(([id, state]) => ({ id, ...state }))
      });
    });

    // Match reset
    socket.on("reset-match", (roomId: string) => {
      const room = gameRooms.get(roomId);
      if (!room) return;

      room.roundsWon = { player1: 0, player2: 0 };
      room.currentRound = 1;
      
      // Reset player positions and health
      room.players.forEach((player) => {
        player.health = 100;
        player.position = player.playerNumber === 1 ? [-4, 0, 0] : [4, 0, 0];
        player.rotation = player.playerNumber === 1 ? Math.PI / 2 : -Math.PI / 2;
        player.velocity = [0, 0, 0];
        player.isBlocking = false;
        player.isAttacking = false;
        player.attackType = null;
        player.comboCount = 0;
        player.specialEnergy = 0;
      });

      io.to(roomId).emit("match-reset", {
        players: Array.from(room.players.entries()).map(([id, state]) => ({ id, ...state }))
      });
    });

    // Disconnect
    socket.on("disconnect", () => {
      console.log("Player disconnected:", socket.id);
      
      // Find and clean up room
      gameRooms.forEach((room, roomId) => {
        if (room.players.has(socket.id)) {
          room.players.delete(socket.id);
          socket.to(roomId).emit("player-left", { playerId: socket.id });
          
          // Delete empty rooms
          if (room.players.size === 0) {
            gameRooms.delete(roomId);
            console.log(`Room ${roomId} deleted (empty)`);
          }
        }
      });
    });
  });

  return httpServer;
}
