import React from 'react';
import './Game.css';

/**
 * A reusable popup component for player decisions
 *
 * @param {Object} props
 * @param {string} props.title - The popup title
 * @param {string} props.message - Optional message to display
 * @param {React.ReactNode} props.children - Content to display in the popup
 * @param {Function} props.onClose - Function to call when closing the popup (optional)
 * @param {boolean} props.showClose - Whether to show the close button (default: true)
 * @param {string} props.className - Additional CSS classes to apply
 */
const DecisionPopup = ({
  title,
  message,
  children,
  onClose,
  showClose = true,
  className = ""
}) => {
  return (
    <div className="borsht-decision-popup-overlay" onClick={showClose ? onClose : undefined}>
      <div
        className={`borsht-decision-popup ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {showClose && (
          <button
            className="borsht-decision-popup-close"
            onClick={onClose}
          >
            ×
          </button>
        )}
        <div className="borsht-decision-popup-header">
          <h3 className="borsht-decision-popup-title">{title}</h3>
          {message && <p className="borsht-decision-popup-message">{message}</p>}
        </div>
        <div className="borsht-decision-popup-content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default DecisionPopup;