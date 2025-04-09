import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom'; // Import hooks
import { v4 as uuidv4 } from 'uuid';
import { saveReviewItem, getSettings } from '../storage/storage';
import { calculateInitialReviewState } from '../logic/scheduler';

// Rename component
function AddNoteFromParam() {
  const location = useLocation(); // Hook to get location object (including search query)
  const navigate = useNavigate(); // Hook for navigation

  // State for content from params and saving status
  const [paramContent, setParamContent] = useState('');
  const [paramSourceUrl, setParamSourceUrl] = useState('');
  // const [paramTitle, setParamTitle] = useState(''); // Optional: if you plan to pass title
  const [error, setError] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Loading from URL parameters...'); // User feedback

  // Effect to parse query params on mount
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const content = params.get('content');
    const sourceUrl = params.get('sourceUrl'); // Optional source URL
    // const title = params.get('title'); // Optional title

    if (content) {
      setParamContent(content);
      setParamSourceUrl(sourceUrl || ''); // Use sourceUrl if provided
      // setParamTitle(title || ''); // Use title if provided
      setStatusMessage('Content loaded from parameters. Ready to save.');
      setError(null);
    } else {
      // Handle case where no content param is found
      setStatusMessage(''); // Clear loading message
      setError('No content found in URL parameters. Please provide "?content=..."');
      setParamContent('');
      setParamSourceUrl('');
      // setParamTitle('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]); // Re-run if the search query changes

  // Updated save handler
  const handleAddContent = async () => {
    if (!paramContent) {
      setError('No content available to add.');
      return;
    }
    setIsAdding(true);
    setError(null);
    setStatusMessage('Saving...');

    try {
      const settings = await getSettings();
      if (!settings) {
        throw new Error("Settings not available.");
      }
      const defaultPriority = 3; // Or get from settings/UI if needed

      const { nextReviewDate, interval, easeFactor } = calculateInitialReviewState(settings, defaultPriority);

      const newItem = {
        id: uuidv4(),
        type: 'note', // Saving as a note
        content: paramContent, // Use content from params
        sourceUrl: paramSourceUrl, // Use sourceUrl from params if available
        // title: paramTitle, // Optional: Use title if available
        addedDate: Date.now(),
        nextReviewDate: nextReviewDate,
        interval: interval,
        easeFactor: easeFactor,
        priority: defaultPriority,
        tags: ['bookmarklet'], // Tag as added via bookmarklet/param
      };

      await saveReviewItem(newItem);
      console.log("Content from parameter saved:", newItem);
      setStatusMessage('Content saved successfully! Redirecting...');

      // Redirect to root page after successful save
      setTimeout(() => navigate('/'), 1500); // Redirect to root instead of /catalog

    } catch (err) {
      console.error("Error adding content from parameter:", err);
      setError(err.message || 'Failed to save the content.');
      setStatusMessage('');
    } finally {
      setIsAdding(false);
    }
  };

  // Simplified JSX
  return (
    <div className="add-note-from-param-page" style={{ padding: '20px' }}>
      <h2>Add Note from URL Parameter</h2>

      {statusMessage && !error && <p>{statusMessage}</p>}
      {error && <p className="error-message" style={{ color: 'red' }}>Error: {error}</p>}

      {/* Display content preview if available */}
      {paramContent && !error && (
        <div className="content-preview-section">
          <h3>Content to Add:</h3>
          {/* Use a div or pre for better formatting of potentially long text */}
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', border: '1px solid #ccc', padding: '10px', maxHeight: '300px', overflowY: 'auto' }}>
            {paramContent}
          </pre>
          {paramSourceUrl && <p><small>Source URL: {paramSourceUrl}</small></p>}
          {/* {paramTitle && <p><small>Title: {paramTitle}</small></p>} */}
          <button onClick={handleAddContent} disabled={isAdding || !!error || !paramContent}>
            {isAdding ? 'Saving...' : 'Save This Note'}
          </button>
        </div>
      )}
    </div>
  );
}

// Update export name
export default AddNoteFromParam; 