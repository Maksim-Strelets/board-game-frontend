import { GamepadIcon } from 'lucide-react';
import Game from './Interfaces';

// Game Card Component
const GameCard: React.FC<{
  game: Game,
  onSelect: (game: Game) => void
}> = ({ game, onSelect }) => (
  <div
    className="border rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
    onClick={() => onSelect(game)}
  >
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-2">{game.name}</h2>
      <img
        src={game.thumbnailUrl}
        alt={game.name}
        className="w-full h-48 object-cover rounded"
      />
      <p className="mt-2 text-gray-600">{game.description}</p>
      <div className="mt-2 flex items-center text-sm text-gray-500">
        <GamepadIcon className="mr-2 w-4 h-4" />
        {game.minPlayers}-{game.maxPlayers} Players
      </div>
    </div>
  </div>
);

export default GameCard;