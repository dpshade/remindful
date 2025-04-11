import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import ReaderView from '../components/reader-view';
import Modal from '../components/modal';
import { getDueReviewItems, getSettings, saveReviewItem, getAllReviewItems } from '../storage/storage';
import { markItemAsRead, deleteReviewItem, scheduleItemForDate } from '../logic/review-actions-mvp';
import { FaPlus, FaFileAlt, FaCloudUploadAlt, FaInbox, FaList, FaSave, FaArrowLeft } from 'react-icons/fa';
import { v4 as uuidv4 } from 'uuid';
import { calculateInitialReviewState } from '../logic/scheduler';
import { readFileAsDataURL } from '../utils/file-helpers';

function ReviewPage({ isMobile }) {
  const [dueItems, setDueItems] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTextInputOpen, setIsTextInputOpen] = useState(false);
  const [showAllItems, setShowAllItems] = useState(false);
  const [allItems, setAllItems] = useState([]);
  const [textInput, setTextInput] = useState('');
  const fileInputRef = useRef(null);
  const [isFileUploading, setIsFileUploading] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [dueItemsResult, allItemsResult] = await Promise.all([
        getDueReviewItems(),
        getAllReviewItems(),
      ]);
      setDueItems(dueItemsResult);
      setAllItems(allItemsResult);
      if (!isMobile && dueItemsResult.length > 0 && !selectedItemId) {
         if (!selectedItemId) { 
             setSelectedItemId(dueItemsResult[0].id);
         }
      }
    } catch (err) {
      console.error("Error loading data:", err);
      setError('Failed to load review items.');
    } finally {
      setIsLoading(false);
    }
  }, [isMobile, selectedItemId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectedItem = useMemo(() => {
    if (!selectedItemId) return null;
    const items = showAllItems ? allItems : dueItems;
    return items.find(item => item.id === selectedItemId) || null;
  }, [selectedItemId, showAllItems, allItems, dueItems]);

  const handleSelectItem = useCallback((itemId) => {
    setSelectedItemId(itemId);
    setIsTextInputOpen(false);
  }, []);

  const handleBackToList = useCallback(() => {
    setSelectedItemId(null);
    setIsTextInputOpen(false);
  }, []);

  const handleActionComplete = useCallback(async () => {
    const previouslySelectedItem = selectedItemId;
    setSelectedItemId(null);
    setIsTextInputOpen(false);
    await loadData();

    if (!isMobile) {
      const currentItems = showAllItems ? allItems : dueItems;
      const completedIndex = currentItems.findIndex(item => item.id === previouslySelectedItem);
      if (completedIndex !== -1 && completedIndex < currentItems.length - 1) {
          setSelectedItemId(currentItems[completedIndex + 1].id);
      } else if (currentItems.length > 0) {
          setSelectedItemId(currentItems[0].id);
      } else {
          setIsTextInputOpen(true);
      }
    }
  }, [loadData, isMobile, showAllItems, allItems, dueItems, selectedItemId]);

  const handleMarkAsReadAction = useCallback(async (quality) => {
    if (!selectedItem) return;
    setError(null);
    try {
      await markItemAsRead(selectedItem.id, quality);
      handleActionComplete();
    } catch (err) {
      console.error("Error marking item as read:", err);
      setError(`Failed to mark item as read: ${err.message}`);
    }
  }, [selectedItem, handleActionComplete]);

  const handleScheduleAction = useCallback(async (dateTimestamp) => {
    if (!selectedItem) return;
    setError(null);
    try {
      await scheduleItemForDate(selectedItem.id, dateTimestamp);
      await loadData();
    } catch (err) {
      console.error("Error scheduling item:", err);
      setError(`Failed to schedule item: ${err.message}`);
    }
  }, [selectedItem, loadData]);

  const handleDeleteAction = useCallback(async () => {
    if (!selectedItem) return;
    if (!window.confirm("Delete this item permanently?")) return;
    setError(null);
    try {
      await deleteReviewItem(selectedItem.id);
      handleActionComplete();
    } catch (err) {
      console.error("Error deleting item:", err);
      setError(`Failed to delete item: ${err.message}`);
    }
  }, [selectedItem, handleActionComplete]);

  const handleShowAddModal = () => {
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
  };

  const handleAddTextNote = useCallback(() => {
    setIsAddModalOpen(false);
    setSelectedItemId(null);
    setIsTextInputOpen(true);
    setTextInput('');
  }, []);

  const handleCloseTextInput = useCallback(() => {
    setIsTextInputOpen(false);
    setTextInput('');
    if (!isMobile && !selectedItemId && dueItems.length > 0) {
        setSelectedItemId(dueItems[0].id);
    }
  }, [isMobile, selectedItemId, dueItems]);

  const handleSaveNewItem = useCallback(async () => {
    if (!textInput.trim()) return;
    setError(null);
    try {
      const settings = await getSettings();
      if (!settings) {
        throw new Error("Settings not available.");
      }
      const defaultPriority = 5;
      const { nextReviewDate, interval, easeFactor } = calculateInitialReviewState(settings, defaultPriority);

      const isURL = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i.test(textInput.trim());
      
      const newItem = {
        id: uuidv4(),
        type: isURL ? 'link' : 'note',
        content: textInput.trim(),
        priority: defaultPriority,
        addedDate: Date.now(),
        nextReviewDate: nextReviewDate,
        interval: interval,
        easeFactor: easeFactor,
        tags: []
      };
      await saveReviewItem(newItem);
      await loadData();
      handleCloseTextInput();
    } catch (err) {
      console.error("Error saving new item:", err);
      setError('Failed to save item.');
    }
  }, [loadData, textInput, handleCloseTextInput]);

  const handleUploadFile = useCallback(() => {
    setIsAddModalOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  const handleFileChange = useCallback(async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setError(null);
    setIsFileUploading(true);
    try {
      const settings = await getSettings();
      if (!settings) {
        throw new Error("Settings not available.");
      }
      
      const itemPriority = 5;
      const { nextReviewDate, interval, easeFactor } = calculateInitialReviewState(settings, itemPriority);
      let itemType = 'note';
      let itemContent = '';
      let fileName = file.name;

      if (file.type.startsWith('image/')) {
        itemType = 'image';
        itemContent = await readFileAsDataURL(file);
      } else if (file.type === 'application/pdf') {
        itemType = 'pdf';
        itemContent = await readFileAsDataURL(file);
      } else {
        try {
          itemContent = await file.text();
          itemType = 'note';
        } catch (readErr) {
          console.error("Could not read file as text:", readErr);
          throw new Error("Unsupported file type. Please upload an image, PDF, or text file.");
        }
      }

      const newItem = {
        id: uuidv4(),
        type: itemType,
        content: itemContent,
        fileName: fileName,
        priority: itemPriority,
        addedDate: Date.now(),
        nextReviewDate: nextReviewDate,
        interval: interval,
        easeFactor: easeFactor,
        tags: []
      };

      await saveReviewItem(newItem);
      await loadData();
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      alert(`${itemType.charAt(0).toUpperCase() + itemType.slice(1)} added successfully!`);
    } catch (err) {
      console.error("Error uploading file:", err);
      setError(`Failed to upload file: ${err.message}`);
    } finally {
      setIsFileUploading(false);
    }
  }, [loadData]);

  const handleShowAllItems = useCallback(async () => {
    try {
      if (allItems.length > 0 && !showAllItems) {
          setShowAllItems(true);
          setSelectedItemId(null);
          setIsTextInputOpen(false);
      } else {
        const items = await getAllReviewItems();
        setAllItems(items);
        setShowAllItems(true);
        setSelectedItemId(null);
        setIsTextInputOpen(false);
      }
    } catch (err) {
      console.error("Error loading all items:", err);
      setError('Failed to load all items.');
    }
  }, [allItems, showAllItems]);

  const handleShowDueItems = useCallback(() => {
    setShowAllItems(false);
    setSelectedItemId(null);
    setIsTextInputOpen(false);
  }, []);

  const SidebarComponent = () => (
    <aside className="sidebar">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--spacing-unit)' }}>
        <h2>{showAllItems ? 'All Items' : 'Review Inbox'} ({showAllItems ? allItems.length : dueItems.length})</h2>
        <button onClick={showAllItems ? handleShowDueItems : handleShowAllItems} className="secondary" style={{ padding: '5px 10px', fontSize: '0.8rem' }}>
          {showAllItems ? <FaInbox/> : <FaList/>}
          {showAllItems ? ' Show Due' : ' Show All'}
        </button>
      </div>

      {isLoading && <p>Loading...</p>}
      <div className="sidebar-content">
          <ul>
            {(showAllItems ? allItems : dueItems).map(item => (
              <li
                key={item.id}
                onClick={() => handleSelectItem(item.id)}
                className={selectedItemId === item.id && !isTextInputOpen ? 'selected' : ''}
              >
                <span className="item-title">
                  {item.fileName || item.content.substring(0, 40) + (item.content.length > 40 ? '...' : '')}
                </span>
                <span className="item-meta">
                  Type: {item.type}
                  {(showAllItems || new Date(item.nextReviewDate) > Date.now() + 86400000) &&
                    <span className="due-date">Due: {new Date(item.nextReviewDate).toLocaleDateString()}</span>
                  }
                </span>
              </li>
            ))}
          </ul>
          {(showAllItems ? allItems.length === 0 : dueItems.length === 0) && !isLoading && (
            <p style={{ textAlign: 'center', padding: '20px', color: 'var(--secondary-text-color)' }}>No items {showAllItems ? 'found' : 'due'}.</p>
          )}
      </div>

      <div className="sidebar-actions">
          <button onClick={handleShowAddModal} className="menu-button">
              <FaPlus />
          </button>
      </div>
    </aside>
  );

  const CanvasComponent = ({ showBackButton }) => (
      <main className="main-canvas">
        {showBackButton && (
          <button onClick={handleBackToList} className="back-button" style={{ marginBottom: 'var(--spacing-unit)', background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <FaArrowLeft /> Back to List
          </button>
        )}
        {error && <div className="error-message">Error: {error}</div>}
        {isFileUploading && <div className="file-upload-overlay">Uploading file...</div>}
        {isTextInputOpen ? (
          <div className="new-item-canvas">
            <textarea
              placeholder="Enter your text note here... (Cmd/Ctrl+Enter to save)"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                      handleSaveNewItem();
                  }
              }}
              autoFocus
            />
            <div className="save-button-container">
                <button onClick={handleSaveNewItem} disabled={!textInput.trim()} className="save-button">
                    <FaSave />
                </button>
                 {isMobile && (
                    <button onClick={handleCloseTextInput} className="secondary" style={{ marginLeft: '8px' }}>Cancel</button>
                 )}
            </div>
          </div>
        ) : selectedItem ? (
          <ReaderView
            item={selectedItem}
            onMarkAsRead={handleMarkAsReadAction}
            onSchedule={handleScheduleAction}
            onDelete={handleDeleteAction}
          />
        ) : (
          <div className="canvas-placeholder">
            {isLoading ? 'Loading item...' : 'Select an item from the list to review or add a new one.'}
          </div>
        )}
      </main>
  );

  console.log('Rendering ReviewPage:', { isMobile, selectedItemId, isTextInputOpen });

  return (
    <>
        {isMobile ? (
            <> 
                {!selectedItemId && !isTextInputOpen && <SidebarComponent />} 
                {(selectedItemId || isTextInputOpen) && <CanvasComponent showBackButton={true} />} 
            </>
        ) : (
            <div className="review-layout">
                <SidebarComponent />
                <CanvasComponent showBackButton={false} />
            </div>
        )}

        <Modal isOpen={isAddModalOpen} onClose={handleCloseAddModal}>
            <h3>Add New Item</h3>
            <ul className="modal-action-list">
                <li><button onClick={handleAddTextNote}><FaFileAlt /> Add Text Note</button></li>
                <li><button onClick={handleUploadFile}><FaCloudUploadAlt /> Upload File</button></li>
            </ul>
        </Modal>

        <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: 'none' }}
        />
    </>
);
}

export default ReviewPage; 