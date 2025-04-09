import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ReaderView from '../components/reader-view';
import Modal from '../components/modal';
import { getDueReviewItems, getSettings, saveReviewItem, getAllReviewItems } from '../storage/storage';
import { markItemAsRead, deleteReviewItem, scheduleItemForDate } from '../logic/review-actions-mvp';
import { FaPlus, FaFileAlt, FaLink, FaCloudUploadAlt, FaInbox, FaList, FaSave } from 'react-icons/fa';
import { v4 as uuidv4 } from 'uuid';

function ReviewPage() {
  const [dueItems, setDueItems] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTextInputOpen, setIsTextInputOpen] = useState(true);
  const [showAllItems, setShowAllItems] = useState(false);
  const [allItems, setAllItems] = useState([]);
  const [textInput, setTextInput] = useState('');

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
    } catch (err) {
      console.error("Error loading data:", err);
      setError('Failed to load review items.');
    } finally {
      setIsLoading(false);
    }
  }, []);

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

  const handleActionComplete = useCallback(async () => {
    await loadData();
    setSelectedItemId(null);
    setIsTextInputOpen(true);
  }, [loadData]);

  const handleBackToQueueAction = useCallback(async () => {
    if (!selectedItem) return;
    setError(null);
    try {
      await markItemAsRead(selectedItem.id);
      handleActionComplete();
    } catch (err) {
      console.error("Error returning item to queue:", err);
      setError(`Failed to return item to queue: ${err.message}`);
    }
  }, [selectedItem, handleActionComplete]);

  const handleScheduleAction = useCallback(async (dateTimestamp) => {
    if (!selectedItem) return;
    setError(null);
    try {
      await scheduleItemForDate(selectedItem.id, dateTimestamp);
      handleActionComplete();
    } catch (err) {
      console.error("Error scheduling item:", err);
      setError(`Failed to schedule item: ${err.message}`);
    }
  }, [selectedItem, handleActionComplete]);

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

  const handleAddTextNote = () => {
    setIsAddModalOpen(false);
    setIsTextInputOpen(true);
    setSelectedItemId(null);
    setTextInput('');
  };

  const handleCloseTextInput = () => {
    setIsTextInputOpen(false);
    setTextInput('');
  };

  const handleSaveNewItem = useCallback(async () => {
    if (!textInput.trim()) return;
    setError(null);
    try {
      const newItem = {
        id: uuidv4(),
        type: 'note',
        content: textInput,
        priority: 5,
        addedDate: Date.now(),
        nextReviewDate: Date.now(),
        interval: 1,
        easeFactor: 2.5
      };
      await saveReviewItem(newItem);
      await loadData();
      handleCloseTextInput();
    } catch (err) {
      console.error("Error saving new item:", err);
      setError('Failed to save item.');
    }
  }, [loadData, textInput, handleCloseTextInput]);

  const handleAddLink = () => {
    alert('Add link functionality coming soon!');
    setIsAddModalOpen(false);
  };

  const handleUploadFile = () => {
    alert('File upload functionality coming soon!');
    setIsAddModalOpen(false);
  };

  const handleShowAllItems = useCallback(async () => {
    try {
      const items = await getAllReviewItems();
      setAllItems(items);
      setShowAllItems(true);
    } catch (err) {
      console.error("Error loading all items:", err);
      setError('Failed to load all items.');
    }
  }, []);

  const handleShowDueItems = useCallback(async () => {
    setShowAllItems(false);
    await loadData();
  }, [loadData]);

  const renderSidebarItem = (item) => (
    <li
      key={item.id}
      onClick={() => handleSelectItem(item.id)}
      className={selectedItemId === item.id && !isTextInputOpen ? 'selected' : ''}
    >
      <span className="item-title">
        {item.type === 'link' ? (item.content.substring(0, 40) + '...') : (item.fileName || item.content.substring(0, 40) + '...')}
      </span>
      <span className="item-meta">
        Priority: {item.priority} | Type: {item.type}
        {showAllItems && <span className="due-date">Due: {new Date(item.nextReviewDate).toLocaleDateString()}</span>}
      </span>
    </li>
  );

  return (
    <div className="review-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>{showAllItems ? 'All Items' : `Review Inbox (${dueItems.length})`}</h2>
        </div>
        <div className="sidebar-content">
          {isLoading && <p>Loading...</p>}
          {error && <div className="error-message">Error: {error}</div>}
          {!isLoading && !error && (
            <ul>
              {(showAllItems ? allItems : dueItems).length > 0 ?
                (showAllItems ? allItems : dueItems).map(renderSidebarItem) :
                <li><p>No items found.</p></li>
              }
            </ul>
          )}
        </div>
        <div className="sidebar-actions">
          <button onClick={showAllItems ? handleShowDueItems : handleShowAllItems} title={showAllItems ? "Show Due Items" : "Show All Items"} className="menu-button">
            {showAllItems ? <FaInbox /> : <FaList />}
          </button>
          <button onClick={handleShowAddModal} title="Add New Content" className="new-item-button">
            <FaPlus />
          </button>
        </div>
      </aside>

      <main className="main-canvas">
        {isTextInputOpen ? (
          <div className="text-input-container">
            <textarea
              className="text-input"
              placeholder="Enter your text note here..."
              rows={10}
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
            />
            <div className="text-input-actions">
              <button onClick={handleSaveNewItem} title="Save">
                <FaSave />
              </button>
            </div>
          </div>
        ) : selectedItem ? (
          <ReaderView
            item={selectedItem}
            onBackToQueue={handleBackToQueueAction}
            onSchedule={handleScheduleAction}
            onDelete={handleDeleteAction}
            isItemFromAllItems={showAllItems}
          />
        ) : (
          <div className="canvas-placeholder">
            <p>Select an item to review or add new content.</p>
          </div>
        )}
      </main>

      <Modal
        isOpen={isAddModalOpen}
        onClose={handleCloseAddModal}
        title="Add New Content"
      >
        <ul className="modal-action-list">
          <li><button onClick={handleAddTextNote}><FaFileAlt /> Add Text Note</button></li>
          <li><button onClick={handleAddLink}><FaLink /> Add Link</button></li>
          <li><button onClick={handleUploadFile}><FaCloudUploadAlt /> Upload File</button></li>
        </ul>
      </Modal>
    </div>
  );
}

export default ReviewPage; 