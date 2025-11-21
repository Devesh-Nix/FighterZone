import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

export type GamePhase = "menu" | "character_selection" | "waiting" | "fighting" | "round_end" | "match_end";

export interface PlayerData {
  id: string;
  characterId: number;
  playerNumber: 1 | 2;
  health: number;
  position: [number, number, number];
  rotation: number;
  velocity: [number, number, number];
  isBlocking: boolean;
  isAttacking: boolean;
  attackType: string | null;
}

interface FightingGameState {
  gamePhase: GamePhase;
  roomId: string | null;
  isHost: boolean;
  localPlayerId: string | null;
  players: Map<string, PlayerData>;
  roundsWon: { player1: number; player2: number };
  currentRound: number;
  roundWinner: number | null;
  matchWinner: number | null;
  selectedCharacter: number;
  selectedArena: number;

  // Actions
  setGamePhase: (phase: GamePhase) => void;
  setRoomId: (roomId: string | null) => void;
  setIsHost: (isHost: boolean) => void;
  setLocalPlayerId: (id: string) => void;
  setPlayers: (players: Map<string, PlayerData>) => void;
  updatePlayer: (playerId: string, data: Partial<PlayerData>) => void;
  setRoundsWon: (roundsWon: { player1: number; player2: number }) => void;
  setCurrentRound: (round: number) => void;
  setRoundWinner: (winner: number | null) => void;
  setMatchWinner: (winner: number | null) => void;
  setSelectedCharacter: (characterId: number) => void;
  setSelectedArena: (arenaId: number) => void;
  resetGame: () => void;
  getLocalPlayer: () => PlayerData | null;
  getOpponent: () => PlayerData | null;
}

export const useFightingGame = create<FightingGameState>()(
  subscribeWithSelector((set, get) => ({
    gamePhase: "menu",
    roomId: null,
    isHost: false,
    localPlayerId: null,
    players: new Map(),
    roundsWon: { player1: 0, player2: 0 },
    currentRound: 1,
    roundWinner: null,
    matchWinner: null,
    selectedCharacter: 0,
    selectedArena: 0,

    setGamePhase: (phase) => set({ gamePhase: phase }),
    
    setRoomId: (roomId) => set({ roomId }),
    
    setIsHost: (isHost) => set({ isHost }),
    
    setLocalPlayerId: (id) => set({ localPlayerId: id }),
    
    setPlayers: (players) => set({ players }),
    
    updatePlayer: (playerId, data) => {
      const players = new Map(get().players);
      const player = players.get(playerId);
      if (player) {
        players.set(playerId, { ...player, ...data });
        set({ players });
      }
    },
    
    setRoundsWon: (roundsWon) => set({ roundsWon }),
    
    setCurrentRound: (round) => set({ currentRound: round }),
    
    setRoundWinner: (winner) => set({ roundWinner: winner }),
    
    setMatchWinner: (winner) => set({ matchWinner: winner }),
    
    setSelectedCharacter: (characterId) => set({ selectedCharacter: characterId }),
    
    setSelectedArena: (arenaId) => set({ selectedArena: arenaId }),
    
    resetGame: () => set({
      gamePhase: "menu",
      roomId: null,
      isHost: false,
      localPlayerId: null,
      players: new Map(),
      roundsWon: { player1: 0, player2: 0 },
      currentRound: 1,
      roundWinner: null,
      matchWinner: null,
      selectedCharacter: 0,
      selectedArena: 0,
    }),
    
    getLocalPlayer: () => {
      const { localPlayerId, players } = get();
      if (!localPlayerId) return null;
      return players.get(localPlayerId) || null;
    },
    
    getOpponent: () => {
      const { localPlayerId, players } = get();
      if (!localPlayerId) return null;
      for (const [id, player] of players.entries()) {
        if (id !== localPlayerId) {
          return player;
        }
      }
      return null;
    },
  }))
);
