import React, { useState, useRef, useCallback } from 'react';
import { FaTrashAlt, FaCalendarAlt, FaArrowLeft, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import Popover from './popover';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './datepicker-custom.css';
import { ArrowUturnLeftIcon } from '@heroicons/react/24/outline';

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

  const handleOpenPostponePopover = useCallback(() => {
    setSelectedDate(null);
    setIsPostponePopoverOpen(true);
  }, []);

  const handleClosePostponePopover = useCallback(() => {
    setIsPostponePopoverOpen(false);
  }, []);

  const handleDateSelect = useCallback((date) => {
    setSelectedDate(date);
    if (date) {
      // Ensure time is set to beginning of day
      const newDate = new Date(date);
      newDate.setHours(0, 0, 0, 0);
      onSchedule(newDate.getTime());
    }
    handleClosePostponePopover();
  }, [onSchedule, handleClosePostponePopover]);

  const handleQuickOptionSelect = useCallback((days) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    date.setHours(0, 0, 0, 0);
    setSelectedDate(date);
    onSchedule(date.getTime());
    handleClosePostponePopover();
  }, [onSchedule, handleClosePostponePopover]);

  // Custom header that replaces the default month display with only dropdowns
  const renderCustomHeader = useCallback(({
    date,
    changeYear,
    changeMonth,
    decreaseMonth,
    increaseMonth,
    prevMonthButtonDisabled,
    nextMonthButtonDisabled
  }) => {
    const years = [];
    const currentYear = new Date().getFullYear();
    for (let i = currentYear - 10; i <= currentYear + 10; i++) {
      years.push(i);
    }

    const months = Array.from({ length: 12 }, (_, i) => (
      new Date(2000, i, 1).toLocaleString('default', { month: 'long' })
    ));

    return (
      <div className="datepicker-header">
        <button
          type="button" // Prevent form submission if nested
          className="datepicker-nav-button"
          onClick={decreaseMonth}
          disabled={prevMonthButtonDisabled}
          aria-label="Previous Month"
        >
          <FaChevronLeft size={14} />
        </button>
        <div className="datepicker-select-container">
          <select
            className="datepicker-select"
            value={date.getMonth()}
            onChange={({ target: { value } }) => changeMonth(value)}
          >
            {months.map((month, index) => (
              <option key={index} value={index}>
                {month}
              </option>
            ))}
          </select>
          <select
            className="datepicker-select"
            value={date.getFullYear()}
            onChange={({ target: { value } }) => changeYear(value)}
          >
            {years.map(year => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button" // Prevent form submission if nested
          className="datepicker-nav-button"
          onClick={increaseMonth}
          disabled={nextMonthButtonDisabled}
          aria-label="Next Month"
        >
          <FaChevronRight size={14} />
        </button>
      </div>
    );
  }, []);

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
          <button type="button" onClick={onBackToQueue} title="Mark as Read (SRS)" className="action-button">
            <ArrowUturnLeftIcon className="h-5 w-5 text-gray-600 mr-1" />
            <span>Mark as Read</span>
          </button>
        )}
        <button 
          type="button" 
          ref={postponeButtonRef} 
          onClick={handleOpenPostponePopover} 
          title="Postpone..." 
          className="action-button"
        >
          <FaCalendarAlt />
          <span>Postpone...</span>
        </button>
        <button type="button" onClick={onDelete} title="Delete" className="action-button danger">
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
            renderCustomHeader={renderCustomHeader}
            monthsShown={1}
            fixedHeight
            minDate={new Date()}
            todayButton="Today"
          />
          <div className="quick-options">
            <button type="button" onClick={() => handleQuickOptionSelect(1)}>Tomorrow</button>
            <button type="button" onClick={() => handleQuickOptionSelect(3)}>In 3 days</button>
            <button type="button" onClick={() => handleQuickOptionSelect(7)}>In 1 week</button>
            <button type="button" onClick={() => handleQuickOptionSelect(30)}>In 1 month</button>
            <button type="button" onClick={() => handleQuickOptionSelect(90)}>In 3 months</button>
          </div>
        </div>
      </Popover>
    </div>
  );
}

export default ReaderView; 