import React, { useState, useRef } from 'react';
import { FaTrashAlt, FaCalendarAlt, FaArrowLeft } from 'react-icons/fa';
import Popover from './popover';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Component to display item content and provide review actions.
 * @param {object} props
 * @param {import('../types').ReviewItem} props.item - The review item to display.
 * @param {function} props.onBackToQueue - Handler for SRS update (shown for Inbox items).
 * @param {function} props.onSchedule - Handler for scheduling item for a specific timestamp.
 * @param {function} props.onDelete - Handler for deleting item.
 * @param {boolean} props.isItemFromAllItems - Flag indicating if item was selected from All Items view.
 */
function ReaderView({ item, onBackToQueue, onSchedule, onDelete, isItemFromAllItems }) {
  const [isPostponePopoverOpen, setIsPostponePopoverOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const postponeButtonRef = useRef(null);

  const handleOpenPostponePopover = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSelectedDate(tomorrow.toISOString().split('T')[0]);
    setIsPostponePopoverOpen(true);
  };

  const handleClosePostponePopover = () => {
    setIsPostponePopoverOpen(false);
  };

  const handleConfirmSchedule = () => {
    if (!selectedDate) return;
    const date = new Date(selectedDate);
    date.setHours(0, 0, 0, 0);
    const dateTimestamp = date.getTime();
    onSchedule(dateTimestamp);
    handleClosePostponePopover();
  };

  const handleRelativeDelay = (days) => {
    const targetTimestamp = Date.now() + days * ONE_DAY_MS;
    onSchedule(targetTimestamp);
    handleClosePostponePopover();
  };

  const handleMonthDelay = (months) => {
    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() + months);
    targetDate.setHours(0, 0, 0, 0);
    onSchedule(targetDate.getTime());
    handleClosePostponePopover();
  };

  if (!item) {
    return <div className="reader-view"><p>No item selected.</p></div>;
  }

  const renderContent = () => {
    switch (item.type) {
      case 'note':
        return <p style={{ whiteSpace: 'pre-wrap' }}>{item.content}</p>;
      case 'link':
        return (
          <a href={item.content} target="_blank" rel="noopener noreferrer">
            {item.content}
          </a>
        );
      case 'image':
        return <img src={item.content} alt={item.fileName || 'Review image'} />;
      case 'pdf':
        return (
          <a href={item.content} download={item.fileName} target="_blank" rel="noopener noreferrer">
            Download {item.fileName || 'PDF'}
          </a>
        );
      default:
        return <p>Unsupported item type: {item.type}</p>;
    }
  };

  return (
    <div className="reader-view">
      <div className="reader-content">
        {item.fileName && <h3>{item.fileName}</h3>}
        {renderContent()}
      </div>
      <div className="reader-actions">
        {!isItemFromAllItems && (
          <button onClick={onBackToQueue} title="Back to Queue (SRS)" className="action-button">
            <FaArrowLeft />
            <span>Back to Queue</span>
          </button>
        )}
        <button 
          ref={postponeButtonRef} 
          onClick={handleOpenPostponePopover} 
          title="Postpone..." 
          className="action-button"
        >
          <FaCalendarAlt />
          <span>Postpone...</span>
        </button>
        <button onClick={onDelete} title="Delete" className="action-button danger">
          <FaTrashAlt />
          <span>Delete</span>
        </button>
      </div>

      <Popover
        isOpen={isPostponePopoverOpen}
        onClose={handleClosePostponePopover}
        targetRef={postponeButtonRef}
      >
        <button onClick={() => handleRelativeDelay(1)}>Postpone 1 Day</button>
        <button onClick={() => handleRelativeDelay(3)}>Postpone 3 Days</button>
        <button onClick={() => handleRelativeDelay(7)}>Postpone 7 Days</button>
        <button onClick={() => handleMonthDelay(1)}>Postpone 1 Month</button>
        <button onClick={() => handleMonthDelay(3)}>Postpone 3 Months</button>
        <div className="date-input-wrapper">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="date-input"
          />
          <button onClick={handleConfirmSchedule}>
            Set Date
          </button>
        </div>
      </Popover>
    </div>
  );
}

export default ReaderView; 