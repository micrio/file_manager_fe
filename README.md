
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
### Demo
[Watch Video](https://drive.google.com/file/d/1sCuIr0_DZvcVsbu38O85gBYM-0qf9P_9/view?usp=sharing)
### Screenshots
![Screenshot from 2024-08-06 00-44-11](https://github.com/user-attachments/assets/354ecbc3-c895-49c3-b5f4-0139bd782bc3)
![Screenshot from 2024-08-06 00-43-59](https://github.com/user-attachments/assets/eebcab22-932a-4934-ba8a-113bb9c2dc02)
![Screenshot from 2024-08-05 17-49-49](https://github.com/user-attachments/assets/526ace27-cc08-4037-b754-dc5dfb15a803)
![Screenshot from 2024-08-05 17-50-25](https://github.com/user-attachments/assets/327fe08a-13ce-4d5c-9bf5-076900658301)
![Screenshot from 2024-08-05 17-50-28](https://github.com/user-attachments/assets/4ebdb208-39af-402c-9f79-4add5a83d14f)

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
