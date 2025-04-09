import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';
import ReviewPage from './pages/review-page';
import CatalogPage from './pages/catalog-page';
import SettingsPage from './pages/settings-page';
import { saveReviewItem, getSettings, initializeSettingsIfNeeded } from './storage/storage';
import { v4 as uuidv4 } from 'uuid';
import { readFileAsDataURL } from './utils/file-helpers';
import { calculateInitialReviewState } from './logic/scheduler';

function App() {
  const [shareError, setShareError] = useState(null);

  useEffect(() => {
    initializeSettingsIfNeeded();
  }, []);

  useEffect(() => {
    // --- Share Target Listener --- Start
    const handleShareMessage = async (event) => {
      if (event.data && event.data.type === 'SHARE_TARGET_RECEIVED') {
        console.log('Share data received from SW:', event.data.data);
        setShareError(null);
        const { title, text, url, files } = event.data.data;

        try {
          const settings = await getSettings();
          if (!settings) {
            throw new Error("Settings not available for processing share.");
          }
          const defaultPriority = 3; // Default priority for shared items

          // Use scheduler for initial state
          const { nextReviewDate, interval, easeFactor } = calculateInitialReviewState(settings, defaultPriority);

          // Prioritize URL, then text, then title as content
          let itemType = 'note';
          let itemContent = text || title || 'Shared Content';

          if (url) {
            itemType = 'link';
            itemContent = url;
          }

          // Handle files (take the first one for MVP)
          let fileContent = null;
          let fileName = null;
          if (files && files.length > 0) {
            const file = files[0];
            fileName = file.name;
            if (file.type.startsWith('image/')) {
              itemType = 'image';
              fileContent = await readFileAsDataURL(file);
            } else if (file.type === 'application/pdf') {
              itemType = 'pdf';
              fileContent = await readFileAsDataURL(file); // Store as data URL for MVP
              // In a real app, might store the Blob directly or use a different strategy
            } else {
              // If it's not an image or PDF, try to treat as text if no other text/url provided
              if (!url && !text && !title) {
                 try {
                   itemContent = await file.text();
                   itemType = 'note';
                 } catch (readErr) {
                   console.warn("Could not read shared file as text:", readErr);
                   // Keep default content if read fails
                 }
              }
            }
          }

          // If we got file content, use it
          if (fileContent) {
            itemContent = fileContent;
          }

          const newItem = {
            id: uuidv4(),
            type: itemType,
            content: itemContent,
            fileName: fileName, // Add filename if available
            addedDate: Date.now(),
            nextReviewDate: nextReviewDate,
            interval: interval,
            easeFactor: easeFactor,
            priority: defaultPriority,
            tags: ['shared'], // Add a default tag
          };

          await saveReviewItem(newItem);
          console.log('Shared item saved:', newItem);
          // Optional: Add visual feedback to the user (e.g., a toast notification)
          alert('Shared item added successfully!');

        } catch (err) {
          console.error("Error processing shared data:", err);
          setShareError(`Failed to save the shared item. ${err.message}`);
        }
      }
    };

    navigator.serviceWorker.addEventListener('message', handleShareMessage);

    // Cleanup listener on component unmount
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleShareMessage);
    };
    // --- Share Target Listener --- End

  }, []);

  return (
    <Router>
      <div className="App">
        <main>
          {shareError && <div className="error-message">Error: {shareError}</div>}
          <Routes>
            <Route path="/" element={<ReviewPage />} />
            <Route path="/catalog" element={<CatalogPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
