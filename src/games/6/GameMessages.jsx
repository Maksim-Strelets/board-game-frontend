import React, { useState, useEffect, useRef } from 'react';
import './GameMessages.css'

const GameMessages = ({ websocket, players }) => {
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const maxMessages = 50; // Maximum number of messages to display

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!websocket || !websocket.socket) return;

    // Handler for WebSocket messages
    const handleMessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        let message = '';
        const timestamp = new Date().toLocaleTimeString();
        let CardNames = '';
        let playerName = '';

        // Create human-readable messages based on message type
        switch (data.type) {
          case 'new_turn':
            playerName = data.player.user_id === players.currentUserId
              ? 'You'
              : players[data.player.user_id]?.user_data.username || `Player ${data.player.user_id}`;
            message = `${playerName}'s turn`;
            break;

          case 'recipe_completed':
            playerName = data.player.user_id === players.currentUserId
              ? 'You'
              : players[data.player.user_id]?.user_data.username || `Player ${data.player.user_id}`;
            message = `${playerName} completed their recipe${data.is_first ? ' first' : ''}!`;
            break;

          case 'ingredient_added':
            playerName = data.player.user_id === players.currentUserId
              ? 'You'
              : players[data.player.user_id]?.user_data.username || `Player ${data.player.user_id}`;
            message = `${playerName} added ${data.card?.name || data.card?.id || 'an ingredient'} to their borscht`;
            break;

          case 'cards_drawn':
            playerName = data.player.user_id === players.currentUserId
              ? 'You'
              : players[data.player.user_id]?.user_data.username || `Player ${data.player.user_id}`;
            message = `${playerName} drew ${data.count} card${data.count !== 1 ? 's' : ''}`;
            break;

          case 'special_played':
            playerName = data.player.user_id === players.currentUserId
              ? 'You'
              : players[data.player.user_id]?.user_data.username || `Player ${data.player.user_id}`;
            message = `${playerName} played ${data.special_card}`;
            break;

          case 'cards_from_discard_selected':
            CardNames = data.cards?.map(card => card[1].name || card[1].id).join(', ') || 'some cards';
            playerName = data.player.user_id === players.currentUserId
              ? 'You'
              : players[data.player.user_id]?.user_data.username || `Player ${data.player.user_id}`;
            message = `${playerName} took ${CardNames} from the discard pile`;
            break;

          case 'market_cards_taken':
            CardNames = data.cards?.map(card => card[1].name || card[1].id).join(', ') || 'some cards';
            message = `${CardNames} taken from the market`;
            break;

          case 'special_effect':
            const effectPlayer = data.player.user_id === players.currentUserId
              ? 'You'
              : players[data.player.user_id]?.user_data.username || `Player ${data.player.user_id}`;

            if (data.effect === 'black_pepper') {
              message = `${effectPlayer} used Black Pepper to ${data.action_type === 'steal' ? 'take cards from opponents' : 'make opponents discard cards'}`;
            } else if (data.effect === 'chili_pepper') {
              const targetPlayer = data.target_player === players.currentUserId
                ? 'you'
                : players[data.target_player]?.user_data.username || `Player ${data.target_player}`;
              message = `${effectPlayer} used Chili Pepper to ${data.action_type === 'steal' ? 'steal from' : 'discard a card from'} ${targetPlayer}`;
            }
            break;

          case 'card_stolen':
            const fromPlayer = data.from_player === players.currentUserId
              ? 'you'
              : players[data.from_player]?.user_data.username || `Player ${data.from_player}`;
            const toPlayer = data.to_player === players.currentUserId
              ? 'you'
              : players[data.to_player]?.user_data.username || `Player ${data.to_player}`;
            message = `Card stolen from ${fromPlayer} by ${toPlayer}`;
            break;

          case 'defense_successful':
            const defender = data.defender === players.currentUserId
              ? 'You'
              : players[data.defender]?.user_data.username || `Player ${data.defender}`;
            const attacker = data.attacker === players.currentUserId
              ? 'you'
              : players[data.attacker]?.user_data.username || `Player ${data.attacker}`;
            message = `${defender} defended against ${attacker} using Sour Cream`;
            break;

          case 'borsht_card_discarded':
            CardNames = data.cards?.map(card => card.name || card.id).join(', ') || 'some cards';
            playerName = data.player.user_id === players.currentUserId
              ? 'Your'
              : `${players[data.player.user_id]?.user_data.username || `Player ${data.player.user_id}`}'s`;
            message = `${CardNames} was discarded from ${playerName} borscht`;
            break;

          case 'cards_from_hand_discarded':
            CardNames = data.cards?.map(card => card.name || card.id).join(', ') || 'some cards';
            playerName = data.player.user_id === players.currentUserId
              ? 'Your'
              : `${players[data.player.user_id]?.user_data.username || `Player ${data.player.user_id}`}'s`;
            message = `${CardNames} was discarded from ${playerName} hand`;
            break;

          case 'chili_pepper_effect_applied':
            const pepperPlayer = data.player.user_id === players.currentUserId
              ? 'You'
              : players[data.player.user_id]?.user_data.username || `Player ${data.player.user_id}`;
            const pepperTarget = data.target_player === players.currentUserId
              ? 'your'
              : `${players[data.target_player]?.user_data.username || `Player ${data.target_player}`}'s`;
            message = `${pepperPlayer} ${data.action_type === 'steal' ? 'stole from' : 'discarded from'} ${pepperTarget} borscht`;
            break;

          case 'cards_from_market_discarded':
            CardNames = data.cards?.map(card => card.name || card.id).join(', ') || 'some cards';
            message = `${CardNames} discarded from market`;
            break;

          case 'market_cards_added':
            CardNames = data.cards?.map(card => card.name || card.id).join(', ') || 'some cards';
            message = `${CardNames} added to market`;
            break;

          case 'ingredients_exchanged':
            const HandCardNames = data.hand_cards?.map(card => card[1].name || card[1].id).join(', ') || 'some cards';
            const MarketCardNames = data.market_cards?.map(card => card[1].name || card[1].id).join(', ') || 'some cards';
            playerName = data.player.user_id === players.currentUserId
              ? 'You'
              : players[data.player.user_id]?.user_data.username || `Player ${data.player.user_id}`;
            message = `${playerName} exchanged ${HandCardNames} from hand for ${MarketCardNames} from market`;
            break;

          case 'shkvarka_drawn':
            playerName = data.player.user_id === players.currentUserId
              ? 'You'
              : players[data.player.user_id]?.user_data.username || `Player ${data.player.user_id}`;
            message = `${playerName} drew shkvarka ${data.card?.name}`;
            break;

          case 'shkvarka_effect_discard':
            CardNames = data.discarded_cards?.map(card => card.name || card.id).join(', ') || 'some cards';
            const SelectorPlayer = data.selector_player.user_id === players.currentUserId
              ? 'You'
              : players[data.selector_player.user_id]?.user_data.username || `Player ${data.selector_player.user_id}`;
            const TargetPlayer = data.target_player.user_id === players.currentUserId
              ? 'You'
              : players[data.target_player.user_id]?.user_data.username || `Player ${data.target_player.user_id}`;
            message = `${SelectorPlayer} discarded ${CardNames} from ${TargetPlayer}'s hand'`;
            break;

          case 'shkvarka_effect_no_rare':
            playerName = data.player.user_id === players.currentUserId
              ? 'You'
              : players[data.player.user_id]?.user_data.username || `Player ${data.player.user_id}`;
              message = `${playerName} has no rare ingredients to discard`
            break;

          default:
            // Don't create a message for unhandled types
            return;
        }

        if (message) {
          setMessages(prevMessages => {
            const newMessages = [...prevMessages, { text: message, timestamp, type: data.type }];
            // Keep only the last maxMessages
            return newMessages.slice(-maxMessages);
          });
        }
      } catch (error) {
        console.error('Error processing game message:', error);
      }
    };

    // Add event listener
    websocket.socket.addEventListener('message', handleMessage);

    // Clean up
    return () => {
      if (websocket && websocket.socket) {
        websocket.socket.removeEventListener('message', handleMessage);
      }
    };
  }, [websocket, players]);

  return (
    <div className="borsht-game-messages-container">
      <div className="borsht-game-messages-header">
        <h3>Game Messages</h3>
      </div>
      <div className="borsht-game-messages-list">
        {messages.length === 0 ? (
          <div className="borsht-game-message-empty">Game events will appear here...</div>
        ) : (
          messages.map((msg, index) => (
            <div key={index} className={`borsht-game-message-item ${msg.type}`}>
              <span className="borsht-game-message-time">{msg.timestamp}</span>
              <span className="borsht-game-message-text">{msg.text}</span>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default GameMessages;