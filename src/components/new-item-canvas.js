import React, { useState, useRef, useEffect } from 'react';
import { FaSave } from 'react-icons/fa';

function NewItemCanvas({ onSave }) { // Accept onSave prop
  const [text, setText] = useState('');
  const textareaRef = useRef(null); // Create a ref for the textarea

  // Focus the textarea when the component mounts
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  const handleSaveClick = () => {
    if (text.trim()) {
      // Call the passed-in onSave function
      onSave(text); 
      // Optionally clear the text area after save
      // setText(''); 
    } else {
        alert('Cannot save empty item.');
    }
  };

  return (
    <div className="new-item-canvas">
      <textarea
        ref={textareaRef} // Attach the ref
        placeholder="Start typing or paste content here to create a new review item..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        autoFocus={true}
      />
      <div className="save-button-container">
        <button 
          onClick={handleSaveClick} 
          disabled={!text.trim()}
          className="save-button"
          title="Save"
        >
          <FaSave />
        </button>
        {/* We might add a cancel button later if needed */}
      </div>
    </div>
  );
}

export default NewItemCanvas; 