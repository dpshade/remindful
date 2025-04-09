import React, { useState, useRef, useCallback, useEffect } from 'react';
import { FaTrashAlt, FaCalendarAlt, FaArrowLeft, FaChevronLeft, FaChevronRight, FaExternalLinkAlt, FaTimes, FaSearchPlus } from 'react-icons/fa';
import Popover from './popover';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './datepicker-custom.css';
import { ArrowUturnLeftIcon } from '@heroicons/react/24/outline';

// Link Preview component to gracefully handle URLs that can't be embedded
const LinkPreview = ({ url }) => {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  const iframeRef = useRef(null);
  const timeoutRef = useRef(null);
  
  useEffect(() => {
    // Set a timeout - if the iframe doesn't load within 2 seconds, show fallback
    timeoutRef.current = setTimeout(() => {
      if (!iframeLoaded) {
        setShowFallback(true);
      }
    }, 2000);
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [iframeLoaded]);
  
  const handleIframeLoad = () => {
    setIframeLoaded(true);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };
  
  return (
    <div className="link-container">
      {!showFallback && (
        <iframe 
          ref={iframeRef}
          src={url} 
          title="Embedded URL" 
          className="url-iframe"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          onLoad={handleIframeLoad}
          style={{ display: showFallback ? 'none' : 'block' }}
        />
      )}
      
      {showFallback && (
        <div className="iframe-fallback">
          <div className="fallback-card">
            <h4>External Link</h4>
            <p className="url-display">{url}</p>
            <p className="fallback-message">
              This website may not be viewable in an embedded frame due to security restrictions.
            </p>
            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="fallback-button"
            >
              <FaExternalLinkAlt /> Open in New Tab
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

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
  const [isImageZoomed, setIsImageZoomed] = useState(false);
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

  // Close image zoom on escape key
  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === 'Escape' && isImageZoomed) {
        setIsImageZoomed(false);
      }
    };

    window.addEventListener('keydown', handleEscKey);
    return () => window.removeEventListener('keydown', handleEscKey);
  }, [isImageZoomed]);

  if (!item) {
    return <div className="reader-view"><p>No item selected.</p></div>;
  }

  const renderContent = () => {
    switch (item.type) {
      case 'note':
        return <p style={{ whiteSpace: 'pre-wrap' }}>{item.content}</p>;
      case 'link':
        return <LinkPreview url={item.content} />;
      case 'image':
        return (
          <div className="image-container">
            <img 
              src={item.content} 
              alt={item.fileName || 'Review image'} 
              className="responsive-image"
              onClick={() => setIsImageZoomed(true)}
              style={{ cursor: 'zoom-in' }}
            />
            <button 
              className="zoom-button"
              onClick={() => setIsImageZoomed(true)}
              aria-label="Zoom image"
              title="Zoom image"
            >
              <FaSearchPlus />
            </button>
          </div>
        );
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

      {/* Image Zoom Modal */}
      {isImageZoomed && item.type === 'image' && (
        <div className="image-zoom-overlay" onClick={() => setIsImageZoomed(false)}>
          <div className="image-zoom-container">
            <button 
              className="close-zoom"
              onClick={() => setIsImageZoomed(false)}
              aria-label="Close zoom"
            >
              <FaTimes />
            </button>
            <img 
              src={item.content} 
              alt={item.fileName || 'Review image'} 
              className="zoomed-image"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default ReaderView; 