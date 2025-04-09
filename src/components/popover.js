import React, { useEffect, useRef } from 'react';
import './popover.css';

/**
 * A simple popover component that positions itself near a target element.
 * @param {object} props
 * @param {boolean} props.isOpen - Whether the popover is visible.
 * @param {function} props.onClose - Function to call when the popover should close.
 * @param {React.RefObject} props.targetRef - Ref to the element the popover should anchor to.
 * @param {React.ReactNode} props.children - Content to display inside the popover.
 */
function Popover({ isOpen, onClose, targetRef, children }) {
  const popoverRef = useRef(null);

  // Close popover if clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target) &&
        targetRef.current &&
        !targetRef.current.contains(event.target)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, targetRef]);

  // Position popover near target
  useEffect(() => {
    if (isOpen && targetRef.current && popoverRef.current) {
      const targetRect = targetRef.current.getBoundingClientRect();
      const popover = popoverRef.current;

      // Position above the button for now, centered horizontally
      popover.style.left = `${targetRect.left + targetRect.width / 2 - popover.offsetWidth / 2}px`;
      popover.style.top = `${targetRect.top - popover.offsetHeight - 8}px`; // 8px gap

      // Basic boundary detection (prevent going off-screen left/right/top)
      if (popover.offsetLeft < 8) popover.style.left = '8px';
      if (popover.offsetTop < 8) popover.style.top = `${targetRect.bottom + 8}px`; // Flip below if no space above
      if (popover.offsetLeft + popover.offsetWidth > window.innerWidth - 8) {
        popover.style.left = `${window.innerWidth - popover.offsetWidth - 8}px`;
      }
    }
  }, [isOpen, targetRef]);

  if (!isOpen) {
    return null;
  }

  return (
    <div ref={popoverRef} className="popover-container">
      {children}
    </div>
  );
}

export default Popover; 