import GameRoom from './Interfaces';

// Game Room Card Component
const GameRoomCard: React.FC<{
  room: GameRoom,
  onJoin: (roomId: string) => void
}> = ({ room, onJoin }) => (
  <div className="border rounded-lg p-4 shadow-md">
    <h2 className="text-xl font-semibold mb-2">{room.name}</h2>
    <p>Creator: {room.creator}</p>
    <p>
      Players: {room.currentPlayers}/{room.maxPlayers}
    </p>
    <p>Status: {room.status}</p>
    <button
      className={`mt-2 px-4 py-2 rounded ${
        room.currentPlayers >= room.maxPlayers
          ? 'bg-gray-300 cursor-not-allowed'
          : 'bg-green-500 text-white hover:bg-green-600'
      }`}
      disabled={room.currentPlayers >= room.maxPlayers}
      onClick={() => onJoin(room.id)}
    >
      Join Room
    </button>
  </div>
);

export default GameRoomCard;