# Review App PWA MVP

A personal knowledge review app built as a Progressive Web App (PWA) that allows users to capture notes, links, and images and review them based on a spaced repetition schedule.

## Features

- Capture text notes, URLs, images, and PDFs for later review
- Schedule reviews based on priority and spaced repetition algorithm
- Set daily review limits
- Filter and browse all saved items in a catalog view
- Export/import data for backup and transfer

## Getting Started

### Prerequisites

- Node.js (v14 or newer)
- npm or Yarn package manager
- Modern web browser

### Installation

1. Clone the repository
2. Install dependencies with npm or Yarn:

```bash
npm install
```

or

```bash
yarn install
```

3. Start the development server:

```bash
npm start
```

or

```bash
yarn start
```

## Project Structure

- ```/src/pages``` - Main app pages
- ```/src/components``` - Reusable UI components
- ```/src/navigation``` - Navigation configuration
- ```/src/storage``` - IndexedDB data persistence
- ```/src/logic``` - Business logic for review scheduling
- ```/src/utils``` - Helper functions and utilities

## Development Roadmap

See [roadmap.md](roadmap.md) for detailed development plan and progress.

---

This checklist format provides a clear and organized view of the tasks needed to develop the PWA, focusing on a minimal and engaging user experience. 