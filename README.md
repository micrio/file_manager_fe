
# File Manager

## Overview
A File manager with React Frontend and [Rails Backend](https://github.com/voidzenn/file_manager). Allows users to manage their files and folders seamlessly. The app uses Minio for object storage, ensuring that the structure in the File Manager UI mirrors the structure in Minio, providing a reliable and intuitive user experience. Additionally, the app features real-time updates with ActionCable, allowing users to see changes immediately as they happen.

## Features
- **Authentication** — sign up & sign in with JWT session handling (auto refresh on expiry).
- **Folder Management** — create, create nested, rename, move (drag-and-drop or menu), trash, permanently delete, listing.
- **File Management** — upload (dialog & drag-and-drop, multiple files), rename, move, preview, trash, permanently delete.
- **Drag & Drop** — drop files anywhere on Storage to upload, and drag rows onto a folder to move them.
- **Upload Progress** — Google-Drive-style progress bar toast while uploading.
- **Thumbnails** — image and video thumbnails (small/medium) shown in list and grid views.
- **Media Support** — images, common video formats (mp4, mov, webm, ...) and PDF, with an in-app preview modal.
- **Layouts** — list and grid views (persisted).
- **Sorting & Filtering** — sort by name, size or created date (asc/desc) and filter all / folders / files.
- **File & Folder Size** — columns that show per-file size and recursive folder totals.
- **Storage Usage** — total storage used, shown in the sidebar and updated in real time.
- **Real-time Updates** — ActionCable keeps the UI in sync (create / rename / move / remove / share).
- **Sharing** — share a file or folder with a specific existing user (autocomplete by email) or with anyone via a secure link; a **Shared with me** page (list/grid) with browse & download.
- **Trash** — soft-deleted items with permanent delete.
- **Dark / Light theme.**

## Technology Stack
- **React 18**: Framework
- **Zustand**: State management library
- **Shadcn**: Component library
- **ActionCable**: Real-time updates
- **Zod**: Schema validation

## Preview
### Screenshots
<img width="1505" height="897" alt="Screenshot 2026-09-25 at 1 37 19 AM" src="https://github.com/user-attachments/assets/51c1d018-9e99-41a0-bf56-242d9467279f" />
<img width="1505" height="897" alt="Screenshot 2026-09-25 at 1 37 30 AM" src="https://github.com/user-attachments/assets/0b6d035f-cd53-439a-862f-0b4ccba44f57" />
<img width="1505" height="897" alt="Screenshot 2026-09-25 at 1 38 07 AM" src="https://github.com/user-attachments/assets/3f72de27-e749-43e2-8285-ae0eddade313" />
<img width="1505" height="897" alt="Screenshot 2026-09-25 at 1 38 55 AM" src="https://github.com/user-attachments/assets/c00782e6-7ebd-4f5c-bdf9-ad575e65c940" />
<img width="1505" height="897" alt="Screenshot 2026-09-25 at 1 39 13 AM" src="https://github.com/user-attachments/assets/fe6a1f03-3598-44ec-b555-e1c25a7f7131" />
<img width="1505" height="897" alt="Screenshot 2026-09-25 at 1 39 25 AM" src="https://github.com/user-attachments/assets/f8edc37c-98f9-4f41-8aff-2d338c9a88fa" />
<img width="1505" height="897" alt="Screenshot 2026-09-25 at 1 39 35 AM" src="https://github.com/user-attachments/assets/1e1657c3-953a-4012-a5ab-f2ff50ad9288" />
<img width="1505" height="897" alt="Screenshot 2026-09-25 at 1 39 52 AM" src="https://github.com/user-attachments/assets/6e9319eb-251b-4204-8abe-6b22f26b1e61" />
<img width="1505" height="897" alt="Screenshot 2026-09-25 at 2 26 10 AM" src="https://github.com/user-attachments/assets/f55764e7-b49a-43b9-90b6-62fad1dd3957" />

## Backend API Documentation
- When accessing BE documentation you need follow the [steps](https://github.com/voidzenn/file_manager?tab=readme-ov-file#setup)
![Screenshot from 2024-08-05 17-48-37](https://github.com/user-attachments/assets/0cf0fd63-f738-4b64-a5ea-d890b878b707)

## Setup

### Prerequisites
Dependencies installed on your machine
- Node.js version 14.0.0 or higher
- Npm or Yarn
### Installation Steps
1. **Clone the repository:**
   ```bash
   git clone https://github.com/voidzenn/file_manager_fe.git
   cd <repository-name>
   ```

2. **Rename .env.example to .env:**
   ```bash
   mv .env.example .env
   ```
3. **Install dependencies:**
   ```bash
   npm install
   # or 
   yarn install
   ```

4. **Run the app:**
   ```bash
   yarn dev
   ```

5. **Access the web application:**

   Open your browser and navigate to [http://localhost:3001](http://localhost:3001)
