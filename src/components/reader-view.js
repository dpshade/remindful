import React, { useState, useRef, useMemo } from 'react';
import { FaTrashAlt, FaCalendarAlt, FaArrowLeft, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import Popover from './popover';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

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
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDateTimestamp, setSelectedDateTimestamp] = useState(null);
  const postponeButtonRef = useRef(null);

  const handleOpenPostponePopover = () => {
    setCalendarDate(new Date());
    setSelectedDateTimestamp(null);
    setIsPostponePopoverOpen(true);
  };

  const handleClosePostponePopover = () => {
    setIsPostponePopoverOpen(false);
  };

  const handleDateSelect = (day) => {
    const selected = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), day);
    selected.setHours(0, 0, 0, 0);
    const timestamp = selected.getTime();
    setSelectedDateTimestamp(timestamp);
    onSchedule(timestamp);
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

  const handlePrevMonth = () => {
    setCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const calendarDays = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  }, [calendarDate]);

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
        <div className="calendar-container">
          <div className="calendar-header">
            <button onClick={handlePrevMonth} className="calendar-nav"><FaChevronLeft size={14} /></button>
            <span>{MONTH_NAMES[calendarDate.getMonth()].substring(0, 3)} {calendarDate.getFullYear()}</span>
            <button onClick={handleNextMonth} className="calendar-nav"><FaChevronRight size={14} /></button>
          </div>
          <div className="calendar-grid calendar-days-header">
            {DAY_NAMES.map(day => <div key={day}>{day}</div>)}
          </div>
          <div className="calendar-grid">
            {calendarDays.map((day, index) => {
              if (!day) return <button key={index} className="calendar-day disabled" tabIndex={-1} />;
              
              const currentDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), day);
              currentDate.setHours(0, 0, 0, 0);
              const currentDayTimestamp = currentDate.getTime();
              
              const isToday = new Date().toDateString() === currentDate.toDateString();
              
              const isSelected = currentDayTimestamp === selectedDateTimestamp;
              
              return (
                <button 
                  key={index} 
                  className={`calendar-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                  onClick={() => handleDateSelect(day)}
                  aria-selected={isSelected}
                  title={currentDate.toLocaleDateString()}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        <div className="relative-delays-popover">
          <button onClick={() => handleRelativeDelay(1)}>Tomorrow</button>
          <button onClick={() => handleRelativeDelay(3)}>In 3 days</button>
          <button onClick={() => handleRelativeDelay(7)}>In 1 week</button>
          <button onClick={() => handleMonthDelay(1)}>In 1 month</button>
          <button onClick={() => handleMonthDelay(3)}>In 3 months</button>
        </div>
      </Popover>
    </div>
  );
}

export default ReaderView; 