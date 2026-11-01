# Firestore Security Specification — MY LIFE OS

## 1. Access Patterns & Threat Model
- **Default Deny**: All paths not explicitly matched are denied (`allow read, write: if false;`).
- **Authentication**: Only authenticated users (`request.auth != null`) can access any data.
- **User Isolation**: Each user's profile is stored at `/users/{userId}` and their personal Life OS cloud sync vault is stored at `/users/{userId}/vault/{vaultId}`.
- **Ownership Verification**: Users may only read, create, update, or delete documents where `request.auth.uid == userId` AND the document's `uid` field matches `request.auth.uid`.
- **Immutability**: `uid` cannot be mutated on `update`.
- **Role Protection**: Regular users can only set `role == 'user'` on creation and cannot escalate their role on update unless `isAdmin()`.
- **Schema & Size Bounds**:
  - `UserProfile`: `uid`, `email`, `role`, `updatedAt` required; bounded string lengths.
  - `CloudVaultSnapshot`: `uid`, `payloadJson` (max 950,000 chars to stay within 1MB document limit), `recordCount` (non-negative number), `updatedAt` (ISO string).
