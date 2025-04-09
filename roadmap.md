# Roadmap: Personal Knowledge Review PWA MVP & Enhancements

**Guiding Principles:**
- Prioritize a clean, distraction-free user experience.
- Abstract the SRS (Spaced Repetition System) behind a "magic curtain" to simplify user interaction.
- Focus on the inbox and adding new items to the system.

**Objective:** Build an MVP of a PWA allowing users to capture notes/links/images and review them based on a user-defined schedule and daily limit. Implement specific review actions (Postpone, Read, Delete) and basic state portability via JSON export/import. Enhance the rescheduling logic with a priority-aware algorithm for content resurfacing.

**Target Platform:** Web (MVP focus)
**Technology:** React, Service Workers, IndexedDB

---

## Phase 0: Project Setup & Foundation

- [ ] **Initialize React Project:**
  - [ ] Use ```create-react-app ReviewAppPWA``` with PWA template.
  - [ ] Set up basic project structure (e.g., ```src/pages```, ```src/components```, ```src/utils```, ```src/navigation```, ```src/storage```, ```src/logic```).

- [ ] **Install Core Dependencies:**
  - [ ] Routing: ```react-router-dom```.
  - [ ] Storage: ```idb``` for IndexedDB.
  - [ ] Unique IDs: ```uuid```.
  - [ ] Date Picker: ```react-datepicker```.
  - [ ] File Handling: ```file-saver``` for export functionality.

- [ ] **Setup Basic Navigation:**
  - [ ] Implement a basic router using ```react-router-dom```.
  - [ ] Create placeholder pages:
    - [ ] ```src/pages/ReviewPage.js```
    - [ ] ```src/pages/CatalogPage.js```
    - [ ] ```src/pages/SettingsPage.js```
  - [ ] Configure the router in ```App.js```.

---

## Phase 1: Data Model, Storage & Settings

- [ ] **Define Data Model (```ReviewItem```):**
  - [ ] Create a type/interface in ```src/types.js```.

- [ ] **Implement IndexedDB Utilities:**
  - [ ] Create ```src/storage/storage.js```.
  - [ ] Implement functions for saving, retrieving, and updating items and settings.

- [ ] **Implement Settings Page:**
  - [ ] In ```src/pages/SettingsPage.js```, add UI for settings like "Max Reviews Per Session" and "Initial Review Days".

---

## Phase 2: Input Mechanisms

- [ ] **Manual Input (Text/URL):**
  - [ ] Create a component (```src/components/ManualInputForm.js```) for adding new items.

- [ ] **Web Share API Input (Text, URL, Image):**
  - [ ] Implement share handling logic to receive and process shared data.

- [ ] **Manual Image Input:**
  - [ ] Add functionality to select and save images using ```<input type="file">```.

- [ ] **Basic PDF Input (Placeholder):**
  - [ ] Implement logic to store PDF file URIs.

---

## Phase 3: Review Page & MVP Actions

- [ ] **Fetch & Display Due Items:**
  - [ ] In ```src/pages/ReviewPage.js```, implement logic to fetch and display items due for review.

- [ ] **Implement Item Detail View/Modal:**
  - [ ] Create a component for viewing item details and actions.

- [ ] **Implement MVP Review Action Logic:**
  - [ ] Create ```src/logic/reviewActionsMvp.js``` for handling review actions like Postpone, Read, and Delete.

---

## Phase 4: Catalog Page

- [ ] **Fetch & Display All Items:**
  - [ ] In ```src/pages/CatalogPage.js```, implement logic to fetch and display all items.

- [ ] **Basic Sorting/Filtering:**
  - [ ] Add UI controls for sorting and filtering items.

- [ ] **View Item Details & Edit Priority:**
  - [ ] Enable viewing and editing item details, including changing review priority.

---

## Phase 5: Portable State Sync (JSON Export/Import)

- [ ] **Define Master JSON Structure:**
  - [ ] Ensure all SRS fields are included in the export.

- [ ] **Implement Export Functionality:**
  - [ ] Create a function to export data as a JSON file.

- [ ] **Implement Import Functionality:**
  - [ ] Create a function to import data from a JSON file.

---

## Phase 6: Advanced Scheduling & SRS Enhancements

- [ ] **Priority-Aware Rescheduling:**
  - [ ] Implement functions to calculate next review dates based on priority.

- [ ] **Robust SRS Implementation:**
  - [ ] Enhance the data model and implement features like interval capping and adaptive ease factors.

---

## Phase 7: Polish & Testing

- [ ] **Testing:**
  - [ ] Manually test all input methods and review actions.
  - [ ] Test export/import functionality and SRS robustness.

- [ ] **Basic Styling & UX:**
  - [ ] Apply consistent styling and improve user feedback.

- [ ] **Error Handling:**
  - [ ] Add error handling for storage, file I/O, and scheduling operations. 