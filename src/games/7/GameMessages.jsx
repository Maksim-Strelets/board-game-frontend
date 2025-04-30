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
              <span className="message-text">{msg.text}</span>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default GameMessages;