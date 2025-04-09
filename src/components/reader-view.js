import React, { useState, useRef } from 'react';
import { FaTrashAlt, FaCalendarAlt, FaArrowLeft } from 'react-icons/fa';
import Popover from './popover';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './datepicker-custom.css';

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
  const [selectedDate, setSelectedDate] = useState(null);
  const postponeButtonRef = useRef(null);

  const handleOpenPostponePopover = () => {
    setSelectedDate(null);
    setIsPostponePopoverOpen(true);
  };

  const handleClosePostponePopover = () => {
    setIsPostponePopoverOpen(false);
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    if (date) {
      // Ensure time is set to beginning of day
      const newDate = new Date(date);
      newDate.setHours(0, 0, 0, 0);
      onSchedule(newDate.getTime());
    }
    handleClosePostponePopover();
  };

  const handleQuickOptionSelect = (days) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    date.setHours(0, 0, 0, 0);
    setSelectedDate(date);
    onSchedule(date.getTime());
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

  const initialDate = item.due ? new Date(item.due) : new Date();

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
        <div className="datepicker-container">
          <DatePicker
            selected={selectedDate || initialDate}
            onChange={handleDateSelect}
            inline
            popperClassName="datepicker-popper"
            calendarClassName="datepicker-calendar"
            dayClassName={() => "datepicker-day"}
          />
          <div className="quick-options">
            <button onClick={() => handleQuickOptionSelect(1)}>Tomorrow</button>
            <button onClick={() => handleQuickOptionSelect(3)}>In 3 days</button>
            <button onClick={() => handleQuickOptionSelect(7)}>In 1 week</button>
            <button onClick={() => handleQuickOptionSelect(30)}>In 1 month</button>
            <button onClick={() => handleQuickOptionSelect(90)}>In 3 months</button>
          </div>
        </div>
      </Popover>
    </div>
  );
}

export default ReaderView; 