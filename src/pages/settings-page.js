import React, { useState, useEffect, useRef } from 'react';
import { getSettings, saveSettings } from '../storage/storage';
import { generateExportJson, importFromJson } from '../utils/sync-helpers';
import { saveAs } from 'file-saver';
// Icons
import { FaSave, FaFileExport, FaFileImport } from 'react-icons/fa';

function SettingsPage() {
  const [maxReviews, setMaxReviews] = useState(10); // Default value
  const [initialDays, setInitialDays] = useState(1); // Default value
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [syncError, setSyncError] = useState(null);
  const [syncSuccess, setSyncSuccess] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const importFileRef = useRef(null);

  useEffect(() => {
    async function loadSettings() {
      setIsLoading(true);
      setError(null);
      try {
        const settings = await getSettings();
        if (settings) {
          setMaxReviews(settings.maxReviewsPerSession);
          setInitialDays(settings.initialReviewDays);
        }
      } catch (err) {
        console.error("Error loading settings:", err);
        setError('Failed to load settings.');
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setSyncError(null);
    setSyncSuccess(null);
    try {
      const currentSettings = await getSettings() || {};
      const newSettings = {
        ...currentSettings,
        id: 'defaultSettings',
        maxReviewsPerSession: Number(maxReviews),
        initialReviewDays: Number(initialDays),
      };
      await saveSettings(newSettings);
      setSyncSuccess('Settings saved successfully!');
    } catch (err) {
      console.error("Error saving settings:", err);
      setError('Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    setSyncError(null);
    setSyncSuccess(null);
    try {
      const jsonString = await generateExportJson();
      const blob = new Blob([jsonString], { type: "application/json;charset=utf-8" });
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      saveAs(blob, `remindful-pwa-backup-${timestamp}.json`);
      setSyncSuccess('Data exported successfully!');
    } catch (err) {
      console.error("Export failed:", err);
      setSyncError(`Export failed: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) {
      return;
    }

    if (!window.confirm("Importing will replace all current data. Are you sure you want to proceed?")) {
        if (importFileRef.current) {
            importFileRef.current.value = '';
        }
        return;
    }

    setIsImporting(true);
    setSyncError(null);
    setSyncSuccess(null);
    try {
      const jsonString = await file.text();
      const result = await importFromJson(jsonString);
      setSyncSuccess(`Import successful! ${result.itemsImported} items and settings imported. The page might reload or require a manual refresh to show changes everywhere.`);
      const newSettings = await getSettings();
      if (newSettings) {
          setMaxReviews(newSettings.maxReviewsPerSession);
          setInitialDays(newSettings.initialReviewDays);
      }

    } catch (err) {
      console.error("Import failed:", err);
      setSyncError(`Import failed: ${err.message}`);
    } finally {
      setIsImporting(false);
      if (importFileRef.current) {
          importFileRef.current.value = '';
      }
    }
  };

  const triggerImport = () => {
    if (importFileRef.current) {
      importFileRef.current.click();
    }
  };

  if (isLoading) {
    return <div>Loading settings...</div>;
  }

  return (
    <div>
      <h1>Settings</h1>

      {/* Display general errors using class */}
      {error && <div className="error-message">Error: {error}</div>}
      {/* Display sync status using classes */}
      {syncSuccess && <div className="success-message">{syncSuccess}</div>}
      {syncError && <div className="error-message">Sync Error: {syncError}</div>}

      {/* --- Settings Form Section --- */}
      <section className="settings-section">
          <form onSubmit={handleSave}>
            <h3>Review Schedule</h3>
            <div>
              <label htmlFor="maxReviews">Max Reviews Per Session:</label>
              <input type="number" id="maxReviews" value={maxReviews} onChange={(e) => setMaxReviews(e.target.value)} min="1" required />
            </div>
            <div>
              <label htmlFor="initialDays">Initial Review Interval (days):</label>
              <input type="number" id="initialDays" value={initialDays} onChange={(e) => setInitialDays(e.target.value)} min="1" required />
            </div>
            <button type="submit" disabled={isSaving}>
              <FaSave /> {isSaving ? 'Saving...' : 'Save Schedule Settings'}
            </button>
          </form>
      </section>

      {/* --- Sync Section --- */}
      <section className="settings-section">
          <h3>Data Sync</h3>
          <div>
            <button onClick={handleExport} disabled={isExporting || isImporting}>
              <FaFileExport /> {isExporting ? 'Exporting...' : 'Export All Data'}
            </button>
            <p><small>Save all settings and review items to a backup file.</small></p>
          </div>

          <div style={{ marginTop: '15px' }}>
            <input type="file" ref={importFileRef} onChange={handleImportFileChange} accept=".json,application/json" style={{ display: 'none' }} disabled={isImporting || isExporting} />
            <button onClick={triggerImport} disabled={isImporting || isExporting}>
              <FaFileImport /> {isImporting ? 'Importing...' : 'Import Data'}
            </button>
            <p><small>Load data from a backup file. <strong>Warning:</strong> Replaces current data.</small></p>
          </div>
      </section>

    </div>
  );
}

export default SettingsPage; 