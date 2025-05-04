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

  // Format gem color with appropriate styling
  const formatGemColor = (color, count) => {
    return (
      <span className={`gem-${color}`}>
        {count} {color}
      </span>
    );
  };

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
            // New player turn announcement
            const playerName = data.player?.user_data?.username || 'Unknown player';
            message = (
              <>
                <span style={{fontWeight: 'bold'}}>{playerName}</span>'s turn
              </>
            );
            break;

          case 'gems_taken':
            // Player took gems
            const playerTakingGems = data.player?.user_data?.username || 'A player';
            const gemColors = data.gems || [];

            // Count occurrences of each gem
            const gemCounts = {};
            gemColors.forEach(color => {
              gemCounts[color] = (gemCounts[color] || 0) + 1;
            });

            // Create readable message with colored gems
            const gemElements = Object.entries(gemCounts).map(([color, count], index, array) => (
              <React.Fragment key={color}>
                {formatGemColor(color, count)}
                {index < array.length - 1 ? ', ' : ''}
              </React.Fragment>
            ));

            message = (
              <>
                <span style={{fontWeight: 'bold'}}>{playerTakingGems}</span> took {gemElements} gems
              </>
            );
            break;

          case 'card_purchased':
            // Player purchased a card
            const buyingPlayer = data.player?.user_data?.username || 'A player';
            const card = data.card || {};
            const cardLevel = card.level || '?';
            const cardPoints = card.points ? `(${card.points} points)` : '';
            const cardColor = card.gem_color || 'unknown';
            const fromReserved = data.from_reserved ? 'reserved' : 'market';

            message = (
              <>
                <span style={{fontWeight: 'bold'}}>{buyingPlayer}</span> purchased a L{cardLevel}{' '}
                <span className={`gem-${cardColor}`}>{cardColor}</span> card {cardPoints} from {fromReserved}
              </>
            );
            break;

          case 'card_reserved':
            // Player reserved a card
            const reservingPlayer = data.player?.user_data?.username || 'A player';
            const reservedCard = data.card || {};
            const reservedCardLevel = reservedCard.level || '?';
            const fromDeck = data.from_deck;
            const receivedGold = data.received_gold;

            message = (
              <>
                <span style={{fontWeight: 'bold'}}>{reservingPlayer}</span> reserved a level {reservedCardLevel} card {fromDeck ? 'from the deck' : 'from the market'}
                {receivedGold ? ' and received a ' : ''}
                {receivedGold ? <span className="gem-gold">gold</span> : ''}
                {receivedGold ? ' token' : ''}
              </>
            );
            break;

          case 'noble_visited':
            // Player was visited by a noble
            const visitedPlayer = data.player?.user_data?.username || 'A player';
            const noble = data.noble || {};
            const noblePoints = noble.points || 0;

            message = (
              <>
                <span style={{fontWeight: 'bold'}}>{visitedPlayer}</span> was visited by a noble ({noblePoints} points)
              </>
            );
            break;

          case 'game_over':
            // Game is over
            const winner = data.winner?.user_data?.username || 'Unknown player';
            message = (
              <>
                <span style={{fontWeight: 'bold', color: '#dc3545'}}>Game Over!</span>{' '}
                <span style={{fontWeight: 'bold'}}>{winner}</span> wins!
              </>
            );
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

  // Custom rendering of message text which might be a React element
  const renderMessageText = (text) => {
    if (React.isValidElement(text)) {
      return text;
    }
    return text;
  };

  return (
    <div className="messages-container">
      <div className="messages-header">
        <h3>Game Messages</h3>
      </div>
      <div className="messages-list">
        {messages.length === 0 ? (
          <div className="message-empty">Game events will appear here...</div>
        ) : (
          messages.map((msg, index) => (
            <div key={index} className={`message-item ${msg.type}`}>
              <span className="message-time">{msg.timestamp}</span>
              <span className="message-text">{renderMessageText(msg.text)}</span>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default GameMessages;