import React, { useState, useEffect } from 'react';
import DecisionPopup from './DecisionPopup';
import './Game.css';

/**
 * General-purpose component for player decisions with options
 *
 * @param {Object} props
 * @param {string} props.title - The popup title
 * @param {string} props.message - Message explaining the decision
 * @param {Array} props.options - Array of option objects: { id, label, description }
 * @param {Function} props.onSelect - Callback function when an option is selected
 * @param {Function} props.onCancel - Callback function when canceled (optional)
 * @param {boolean} props.showCancel - Whether to show a cancel button (default: false)
 * @param {string} props.cancelLabel - Label for the cancel button (default: "Cancel")
 * @param {number} props.timeRemaining - Time remaining for decision in seconds (optional)
 */
const PlayerDecision = ({
  title,
  message,
  options,
  onSelect,
  onSubmit,
  onCancel,
  showCancel = false,
  cancelLabel = "Cancel",
  expiresAt
}) => {
  const now = Math.floor(Date.now() / 1000);
  const timeRemaining = expiresAt - now || 30; // Default
  const [timer, setTimer] = useState(timeRemaining || 30);

  // Timer countdown effect
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(prevTimer => {
        if (prevTimer <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prevTimer - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [onSubmit]);

  return (
    <DecisionPopup
      title={title}
      message={message}
      showClose={!!onCancel}
      onClose={onCancel}
    >
      {timeRemaining && (
        <div className="borsht-decision-timer">
          Time remaining: {timeRemaining} seconds
        </div>
      )}

      <div className="borsht-decision-options">
        {options.map((option) => (
          <div
            key={option.id}
            className="borsht-decision-option"
            onClick={() => onSelect(option.id)}
          >
            <div className="borsht-decision-option-label">{option.label}</div>
            {option.description && (
              <div className="borsht-decision-option-description">{option.description}</div>
            )}
          </div>
        ))}
      </div>

      {showCancel && (
        <div className="borsht-decision-actions">
          <button
            className="borsht-button borsht-button-cancel"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
        </div>
      )}
    </DecisionPopup>
  );
};

export default PlayerDecision;