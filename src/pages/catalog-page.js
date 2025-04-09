import React, { useState, useEffect, useMemo } from 'react';
import { getAllReviewItems, getReviewItem, saveReviewItem } from '../storage/storage';
// Removed unused ItemDetailView import
// import ItemDetailView from '../components/item-detail-view';
import { postponeItem, markItemAsRead, deleteReviewItem } from '../logic/review-actions-mvp';
import { FaCalendarPlus, FaCalendarCheck, FaTrashAlt } from 'react-icons/fa';

// Define sort options
const SORT_OPTIONS = {
  DATE_ADDED_DESC: 'dateAddedDesc',
  DATE_ADDED_ASC: 'dateAddedAsc',
  NEXT_REVIEW_ASC: 'nextReviewAsc',
  NEXT_REVIEW_DESC: 'nextReviewDesc',
  PRIORITY_DESC: 'priorityDesc',
  PRIORITY_ASC: 'priorityAsc',
};

function CatalogPage() {
  const [allItems, setAllItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [sortBy, setSortBy] = useState(SORT_OPTIONS.DATE_ADDED_DESC);

  // Fetch all items on mount
  useEffect(() => {
    async function loadAllItems() {
      setIsLoading(true); setError(null); setActionError(null);
      try { const items = await getAllReviewItems(); setAllItems(items); }
      catch (err) { console.error("Error loading catalog:", err); setError('Failed to load catalog.'); }
      finally { setIsLoading(false); }
    }
    loadAllItems();
  }, []);

  // Memoized sorted items
  const sortedItems = useMemo(() => {
    const itemsToSort = [...allItems];
    switch (sortBy) {
      case SORT_OPTIONS.DATE_ADDED_ASC: itemsToSort.sort((a, b) => a.addedDate - b.addedDate); break;
      case SORT_OPTIONS.NEXT_REVIEW_ASC: itemsToSort.sort((a, b) => a.nextReviewDate - b.nextReviewDate); break;
      case SORT_OPTIONS.NEXT_REVIEW_DESC: itemsToSort.sort((a, b) => b.nextReviewDate - a.nextReviewDate); break;
      case SORT_OPTIONS.PRIORITY_ASC: itemsToSort.sort((a, b) => a.priority - b.priority); break;
      case SORT_OPTIONS.PRIORITY_DESC: itemsToSort.sort((a, b) => b.priority - a.priority); break;
      default: itemsToSort.sort((a, b) => b.addedDate - a.addedDate); break;
    }
    return itemsToSort;
  }, [allItems, sortBy]);

  // Action Handlers
  const handlePostpone = async (itemId) => {
    setActionError(null);
    try {
      await postponeItem(itemId);
      setAllItems(prev => prev.map(i => i.id === itemId ? { ...i, nextReviewDate: Date.now() + 24*60*60*1000 } : i));
    } catch (err) { setActionError(`Failed to postpone: ${err.message}`); }
  };
  const handleRead = async (itemId) => {
    setActionError(null);
    try {
      const updated = await markItemAsRead(itemId);
      setAllItems(prev => prev.map(i => i.id === itemId ? updated : i));
    } catch (err) { setActionError(`Failed to mark read: ${err.message}`); }
  };
  const handleDelete = async (itemId) => {
    if (!window.confirm("Delete?")) return;
    setActionError(null);
    try {
      await deleteReviewItem(itemId);
      setAllItems(prev => prev.filter(i => i.id !== itemId));
    } catch (err) { setActionError(`Failed to delete: ${err.message}`); }
  };
  const handleUpdatePriority = async (itemId, newPriority) => {
    if (newPriority < 1 || newPriority > 5) return;
    setActionError(null);
    try {
      const item = await getReviewItem(itemId);
      if (!item) throw new Error(`Item ${itemId} not found.`);
      const updated = { ...item, priority: newPriority };
      await saveReviewItem(updated);
      setAllItems(prev => prev.map(i => i.id === itemId ? updated : i));
    } catch (err) { setActionError(`Failed to update priority: ${err.message}`); }
  };

  return (
    <div>
      <h1>Catalog</h1>
      <p>Showing all {allItems.length} items.</p>

      <div style={{ marginBottom: 'var(--spacing-unit)' }}>
        <label htmlFor="sortSelect">Sort by: </label>
        <select id="sortSelect" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value={SORT_OPTIONS.DATE_ADDED_DESC}>Date Added (Newest)</option>
          <option value={SORT_OPTIONS.DATE_ADDED_ASC}>Date Added (Oldest)</option>
          <option value={SORT_OPTIONS.NEXT_REVIEW_ASC}>Next Review (Soonest)</option>
          <option value={SORT_OPTIONS.NEXT_REVIEW_DESC}>Next Review (Latest)</option>
          <option value={SORT_OPTIONS.PRIORITY_DESC}>Priority (High-Low)</option>
          <option value={SORT_OPTIONS.PRIORITY_ASC}>Priority (Low-High)</option>
        </select>
      </div>

      {isLoading && <p>Loading catalog...</p>}
      {error && <div className="error-message">Error: {error}</div>}
      {actionError && <div className="error-message">Action Error: {actionError}</div>}

      {!isLoading && !error && (
        <>
          {sortedItems.length === 0 ? (
            <p>No items found.</p>
          ) : (
            <div>
              {sortedItems.map(item => (
                <div key={item.id} className="item-summary-view">
                    <div className="content-preview">
                        {item.type === 'note' && item.content}
                        {item.type === 'link' && item.content}
                        {(item.type === 'image' || item.type === 'pdf') && (item.fileName || item.type)}
                    </div>
                    <div className="metadata">
                        <span>Added: {new Date(item.addedDate).toLocaleDateString()}</span>
                        <span>Next: {new Date(item.nextReviewDate).toLocaleDateString()}</span>
                         <span>
                            Priority:
                            <select value={item.priority} onChange={(e) => handleUpdatePriority(item.id, Number(e.target.value))} style={{ width: 'auto', marginLeft: '5px', padding: '0px 3px', fontSize: '0.8em'}} >
                                <option value={1}>1</option>
                                <option value={2}>2</option>
                                <option value={3}>3</option>
                                <option value={4}>4</option>
                                <option value={5}>5</option>
                            </select>
                         </span>
                         {item.tags && item.tags.length > 0 && <span>Tags: {item.tags.join(', ')}</span>}
                    </div>
                     <div className="actions">
                        <button onClick={() => handlePostpone(item.id)} className="secondary"><FaCalendarPlus /> Postpone</button>
                        <button onClick={() => handleRead(item.id)} className="secondary"><FaCalendarCheck /> Mark Read</button>
                        <button onClick={() => handleDelete(item.id)} className="danger"><FaTrashAlt /> Delete</button>
                     </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default CatalogPage; 