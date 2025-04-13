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

        // Create human-readable messages based on message type
        switch (data.type) {
          case 'new_turn':
            const playerName = data.player.user_id === players.currentUserId
              ? 'You'
              : players[data.player.user_id]?.user_data.username || `Player ${data.player.user_id}`;
            message = `${playerName}'s turn`;
            break;

          case 'recipe_completed':
            const completingPlayer = data.player.user_id === players.currentUserId
              ? 'You'
              : players[data.player.user_id]?.user_data.username || `Player ${data.player.user_id}`;
            message = `${completingPlayer} completed their recipe${data.is_first ? ' first' : ''}!`;
            break;

          case 'ingredient_added':
            const addingPlayer = data.player.user_id === players.currentUserId
              ? 'You'
              : players[data.player.user_id]?.user_data.username || `Player ${data.player.user_id}`;
            message = `${addingPlayer} added ${data.card?.name || data.card?.id || 'an ingredient'} to their borscht`;
            break;

          case 'cards_drawn':
            const drawingPlayer = data.player.user_id === players.currentUserId
              ? 'You'
              : players[data.player.user_id]?.user_data.username || `Player ${data.player.user_id}`;
            message = `${drawingPlayer} drew ${data.count} card${data.count !== 1 ? 's' : ''}`;
            break;

          case 'special_played':
            const specialPlayer = data.player.user_id === players.currentUserId
              ? 'You'
              : players[data.player.user_id]?.user_data.username || `Player ${data.player.user_id}`;
            message = `${specialPlayer} played ${data.special_card}`;
            break;

          case 'cards_from_discard_selected':
            const discardPlayer = data.player.user_id === players.currentUserId
              ? 'You'
              : players[data.player.user_id]?.user_data.username || `Player ${data.player.user_id}`;
            message = `${discardPlayer} took ${data.cards?.length || 'some'} card${data.cards?.length !== 1 ? 's' : ''} from the discard pile`;
            break;

          case 'market_cards_taken':
            message = `${data.cards?.length || 'Some'} card${data.cards?.length !== 1 ? 's' : ''} taken from the market`;
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
            const borshtPlayer = data.player.user_id === players.currentUserId
              ? 'Your'
              : `${players[data.player.user_id]?.user_data.username || `Player ${data.player.user_id}`}'s`;
            message = `${data.card?.name || data.card?.id || 'A card'} was discarded from ${borshtPlayer} borscht`;
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
            message = `${data.cards?.length || 'Some'} card${data.cards?.length !== 1 ? 's' : ''} discarded from market`;
            break;

          case 'market_cards_added':
            message = `${data.cards?.length || 'Some'} new card${data.cards?.length !== 1 ? 's' : ''} added to market`;
            break;

          case 'ingredients_exchanged':
            const exchangingPlayer = data.player.user_id === players.currentUserId
              ? 'You'
              : players[data.player.user_id]?.user_data.username || `Player ${data.player.user_id}`;
            message = `${exchangingPlayer} exchanged ${data.hand_cards?.length || 'some'} hand card${data.hand_cards?.length !== 1 ? 's' : ''} for ${data.market_cards?.length || 'some'} market card${data.market_cards?.length !== 1 ? 's' : ''}`;
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