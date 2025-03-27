// Type Definitions
export interface Game {
  id: string;
  name: string;
  description: string;
  maxPlayers: number;
  minPlayers: number;
  thumbnailUrl: string;
};

export interface GameRoom {
  id: string;
  gameId: string;
  name: string;
  creator: string;
  currentPlayers: number;
  maxPlayers: number;
  status: 'waiting' | 'in_progress' | 'completed';
};