/**
 * Represents an item to be reviewed.
 */
export interface ReviewItem {
  id: string;                 // Unique identifier (UUID)
  type: 'note' | 'link' | 'image' | 'pdf'; // Type of the content
  content: string;            // Text content, URL, or data URI for images/PDFs
  fileName?: string;          // Optional: Original filename for images/PDFs
  addedDate: number;          // Timestamp when the item was added (Date.now())
  nextReviewDate: number;     // Timestamp for the next scheduled review
  lastReviewedDate?: number;  // Optional: Timestamp of the last review
  interval: number;           // Current review interval in days
  easeFactor: number;         // Factor affecting how quickly the interval grows (default: 2.5)
  priority: number;           // User-defined priority (e.g., 1-5)
  tags?: string[];            // Optional: User-defined tags for organization
}

/**
 * Represents application settings.
 */
export interface AppSettings {
  maxReviewsPerSession: number; // Maximum items to review in one go
  initialReviewDays: number;    // Default interval for the first review
  // Add other settings as needed
} 