import React, { useState, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { saveReviewItem, getSettings } from '../storage/storage';
import { readFileAsDataURL } from '../utils/file-helpers';
import { calculateInitialReviewState } from '../logic/scheduler';
import { FaPlus } from "react-icons/fa"; // Icon

// Basic URL validation regex (adjust as needed)
const URL_REGEX = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;

function ManualInputForm() {
  const [inputType, setInputType] = useState('note'); // 'note', 'link', or 'image'
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState(3); // Default priority
  const [tags, setTags] = useState(''); // Comma-separated tags
  const [selectedFile, setSelectedFile] = useState(null); // State for the selected image file
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null); // Ref for the file input

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setError(null); // Clear previous errors
    } else {
      setSelectedFile(null);
      if (file) { // Only show error if a file was selected but wasn't an image
         setError('Please select a valid image file.');
      }
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setError(null);

    // Input validation based on type
    if (inputType === 'note' && !content.trim()) {
      setError('Note content cannot be empty.');
      setIsSaving(false);
      return;
    }
    if (inputType === 'link' && !URL_REGEX.test(content)) {
      setError('Please enter a valid URL.');
      setIsSaving(false);
      return;
    }
    if (inputType === 'image' && !selectedFile) {
      setError('Please select an image file.');
      setIsSaving(false);
      return;
    }

    try {
      const settings = await getSettings();
      if (!settings) {
        throw new Error("Settings not available.");
      }
      const itemPriority = Number(priority);

      const { nextReviewDate, interval, easeFactor } = calculateInitialReviewState(settings, itemPriority);

      let itemContent = content.trim();
      let fileName = null;

      // Handle image file processing
      if (inputType === 'image' && selectedFile) {
        itemContent = await readFileAsDataURL(selectedFile);
        fileName = selectedFile.name;
      }

      const newItem = {
        id: uuidv4(),
        type: inputType,
        content: itemContent,
        fileName: fileName, // Store filename for images
        addedDate: Date.now(),
        nextReviewDate: nextReviewDate,
        interval: interval,
        easeFactor: easeFactor,
        priority: itemPriority,
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      };

      await saveReviewItem(newItem);
      alert(`${inputType.charAt(0).toUpperCase() + inputType.slice(1)} added successfully!`);

      // Reset form
      setContent('');
      setPriority(3);
      setTags('');
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Reset file input visually
      }
    } catch (err) {
      console.error(`Error saving ${inputType}:`, err);
      setError(`Failed to save ${inputType}. ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Reset content/file when type changes
  const handleTypeChange = (e) => {
    setInputType(e.target.value);
    setContent('');
    setSelectedFile(null);
    setError(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  }

  return (
    <div>
      <h2>Add New Item</h2>
      {error && <div className="error-message">Error: {error}</div>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>
            Type:
            <select value={inputType} onChange={handleTypeChange}>
              <option value="note">Note</option>
              <option value="link">Link</option>
              <option value="image">Image</option>
            </select>
          </label>
        </div>

        {inputType === 'note' && (
          <div>
            <label htmlFor="contentInput">Note Content:</label>
            <textarea
              id="contentInput"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              required
              placeholder='Enter your note here...'
            />
          </div>
        )}

        {inputType === 'link' && (
          <div>
            <label htmlFor="contentInput">URL:</label>
            <input
              type="url"
              id="contentInput"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              placeholder='https://example.com'
            />
          </div>
        )}

        {inputType === 'image' && (
          <div>
            <label htmlFor="imageInput">Select Image:</label>
            <input
              type="file"
              id="imageInput"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileChange}
              required
            />
            {selectedFile && <p><small>Selected: {selectedFile.name}</small></p>}
          </div>
        )}

        <div>
          <label htmlFor="priorityInput">Priority:</label>
          <select
            id="priorityInput"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            required
          >
              <option value={1}>1 (Highest)</option>
              <option value={2}>2</option>
              <option value={3}>3 (Default)</option>
              <option value={4}>4</option>
              <option value={5}>5 (Lowest)</option>
          </select>
        </div>
        <div>
          <label htmlFor="tagsInput">Tags (comma-separated):</label>
          <input
            type="text"
            id="tagsInput"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="e.g., programming, ideas, articles"
          />
        </div>
        <button type="submit" disabled={isSaving}>
          <FaPlus /> {isSaving ? 'Saving...' : 'Add Item'}
        </button>
      </form>
    </div>
  );
}

export default ManualInputForm; 