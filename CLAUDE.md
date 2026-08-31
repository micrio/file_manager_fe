# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

React 18 single-page frontend for a Rails-backed file manager. Users browse folders and files, with real-time updates pushed over ActionCable. The UI structure mirrors the backend (a Rails API backed by Minio object storage).

## Commands

- `yarn dev` — start the Vite dev server on port 3300 (`vite --port 3300`).
- `yarn build` — runs `tsc` (type-check) then `vite build`.
- `yarn lint` — ESLint across `ts,tsx` with `--max-warnings 0`; the whole repo must stay warning-free.
- `yarn preview` — serve the production build locally.
- `npx tsc --noEmit` — type-check alone, faster than a full build.
- Tests: **no test framework is configured** (no jest/vitest, no test script). If tests are needed, add a runner (e.g. `yarn add -D vitest`) — there is no existing setup to extend.

## Architecture

**State — Zustand stores** (`src/store/`):

- `useAuthStore` — session/auth. Exposes an `api` object (`get`/`post`/`put`/`delete`) that injects the auth token and handles 401.
- `useFileStore` — file CRUD + the `files` slice, consumed by the Folders/trash page's `FileList`.
- `useFoldersStore` — folder CRUD + the `contents` slice — the list rendered by Storage/Trash.
- `useSocketStore` — a single `receivedData` buffer fed by the socket dispatcher.

**API layer** (`src/apis/`):

- `axiosConfig` (`src/apis/axiosConfig.ts`) is the singleton instance; base URL comes from `process.env.REACT_APP_BASE_URL` (see `constants/app.ts`).
- `useAuthStore().api.*` wraps `axiosConfig`, injecting the `Authorization` header from cookies and triggering a token refresh on 401.
- Backend wraps every response as `{ success, data, meta }`; `requestWithResult` in each store extracts `data` or surfaces `meta.error`/`meta.message`.

**Real-time** (`src/components/common/ActionCableSocket.tsx`):

- Rendered inside `PrivateRoute`. Subscribes to `FolderChannel` and `FileChannel` (see `hooks/useActionCable.ts`) and pushes each event into the single `useSocketStore().receivedData`.
- Components (UploadFile, CreateFolder, FolderFileList) react by inspecting `receivedData.action` (constants in `src/constants/socketActions.ts`: `folder_created`, `file_created`, `file_renamed`, …).

**Routing/pages** (`src/routes/routes.tsx`):

- `PrivateRoute` guards authenticated routes and redirects to signin otherwise; it also mounts `<ActionCableSocket />`.
- Storage & Trash render `<FolderFileList items={contents} />` (reads the folder store's `contents`).
- Home renders folders only; the Folders (trashed) page renders folders plus `FileList` (reads `useFileStore().files`).

## Key patterns & gotchas

- **`contents` vs `files` are different slices.** The Storage/Trash file list is rendered from `useFoldersStore().contents`, **not** `useFileStore().files`. Entries are discriminated by a `type` field (`type: 'file'` vs `type: 'folder'`). Writing a newly created item into the wrong slice makes it invisible — the common cause of "new item doesn't appear in the list" bugs.
- **No auto-refresh after mutations.** New items arrive **only** via the ActionCable broadcast. Creating/updating a folder/file must prepend the item into `contents` matching the current folder token (mirroring `addSingleFolderToList`); there is no list refresh after a POST.
- **Single `receivedData` buffer.** Both channels write the same field, so events race/clobber each other. Each consumer must filter by `action` — rely on the action, not on which channel fired.
- **Hardcoded WebSocket URL.** `useActionCable.ts` connects to `ws://localhost:3000/cable`. It will not work against a non-local backend without a change.
- **401 does not retry the request.** `api.*` refreshes the token on 401 but returns the error to the caller; the original request is not auto-retried — callers must re-issue if desired.
- **Use the constants.** API endpoints (`src/constants/apis.ts`), socket actions (`socketActions.ts`) and routes (`constants/routes.ts`) are centralized — don't hardcode URLs or action strings.
- **Env var typo.** `.env.example` keys it `REACT_APP_REQUST_TIMEOUT`, but `constants/app.ts` reads `REACT_APP_REQUEST_TIMEOUT` (correct spelling) — so the example's timeout value never applies. Fix the example.
- **Strict TypeScript.** `noUnusedLocals` / `noUnusedParameters` are on and the linter is `--max-warnings 0`; remove unused imports and variables.
- **Path alias.** `@/*` maps to `src/*` (in both `tsconfig.json` and `vite.config.ts`).
