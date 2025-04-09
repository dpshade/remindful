import React, { useState } from 'react';
// Import desired icons
import { FaCalendarCheck, FaCalendarPlus, FaTrashAlt, FaDownload, FaExternalLinkAlt } from 'react-icons/fa';
import { MdLowPriority, MdPriorityHigh } from "react-icons/md"; // Example priority icons

/**
 * Displays the details of a ReviewItem and provides action buttons.
 * Can optionally allow priority editing.
 * @param {object} props
 * @param {import('../types').ReviewItem} props.item - The review item to display.
 * @param {function} props.onPostpone - Callback function when Postpone is clicked.
 * @param {function} props.onRead - Callback function when Read is clicked.
 * @param {function} props.onDelete - Callback function when Delete is clicked.
 * @param {boolean} [props.isEditable=false] - If true, allows editing priority.
 * @param {function} [props.onUpdatePriority] - Callback function (itemId, newPriority) when priority is changed (required if isEditable is true).
 */
function ItemDetailView({ item, onPostpone, onRead, onDelete, isEditable = false, onUpdatePriority }) {
  const [currentPriority, setCurrentPriority] = useState(item.priority);

  const handlePriorityChange = (event) => {
    const newPriority = Number(event.target.value);
    setCurrentPriority(newPriority);
    if (onUpdatePriority) {
      onUpdatePriority(item.id, newPriority);
    }
  };

  // Helper to render priority with icon
  const renderPriority = () => {
    const Icon = currentPriority <= 2 ? MdPriorityHigh : MdLowPriority;
    const color = currentPriority <= 2 ? 'var(--danger-color)' : currentPriority === 3 ? 'inherit' : 'var(--secondary-text-color)';
    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: color }}>
           <Icon /> {currentPriority}
        </span>
    );
  };

  return (
    <div className="item-detail-view">
      <h4>
        <span>{item.fileName || item.type.toUpperCase()}</span>
        {isEditable ? (
          <span style={{ marginLeft: '10px' }}>
            Priority:
            <select value={currentPriority} onChange={handlePriorityChange} style={{ width: 'auto', marginLeft: '5px', padding: '2px 5px' }}>
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={4}>4</option>
                <option value={5}>5</option>
            </select>
          </span>
        ) : (
          <span>Priority: {renderPriority()}</span>
        )}
      </h4>
      <div className="content-display">
        {item.type === 'link' ? (
          <a href={item.content} target="_blank" rel="noopener noreferrer">
            {item.content} <FaExternalLinkAlt size=".8em" />
          </a>
        ) : item.type === 'image' ? (
          <img src={item.content} alt={item.fileName || 'Review Image'} />
        ) : item.type === 'pdf' ? (
          <p>
            <FaDownload /> {item.fileName || 'Shared PDF'} <br/>
            <a href={item.content} download={item.fileName || 'review.pdf'} target="_blank" rel="noopener noreferrer">
                View/Download PDF <FaExternalLinkAlt size=".8em" />
            </a>
          </p>
        ) : (
          <p>{item.content}</p>
        )}
      </div>
      <small>Added: {new Date(item.addedDate).toLocaleString()}</small><br/>
      <small>Next Review: {new Date(item.nextReviewDate).toLocaleDateString()}</small><br/>
      {item.lastReviewedDate && <small>Last Reviewed: {new Date(item.lastReviewedDate).toLocaleString()}</small>}<br/>
      {item.tags && item.tags.length > 0 && <small>Tags: {item.tags.join(', ')}</small>}
      <hr />
      <div className="actions">
        <button onClick={() => onPostpone(item.id)} className="secondary">
            <FaCalendarPlus /> Postpone
        </button>
        <button onClick={() => onRead(item.id)}>
            <FaCalendarCheck /> Read
        </button>
        <button onClick={() => onDelete(item.id)} className="danger">
            <FaTrashAlt /> Delete
        </button>
      </div>
    </div>
  );
}

export default ItemDetailView; 