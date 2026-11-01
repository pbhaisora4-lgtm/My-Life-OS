import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  getDocFromServer,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase SDK with provisioned configuration
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData.map((provider) => ({
          providerId: provider.providerId,
          displayName: provider.displayName,
          email: provider.email,
          photoUrl: provider.photoURL,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate connection to Firestore at boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('the client is offline')
    ) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;

  // Ensure UserProfile document exists in /users/{uid}
  const userPath = `users/${user.uid}`;
  try {
    const userRef = doc(db, 'users', user.uid);
    const existing = await getDoc(userRef);
    const now = new Date().toISOString();
    if (!existing.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email || 'user@example.com',
        displayName: user.displayName || 'Life OS User',
        photoURL: user.photoURL || '',
        role: 'user',
        updatedAt: now,
      });
    } else {
      const currentData = existing.data();
      await setDoc(
        userRef,
        {
          uid: user.uid,
          email: user.email || currentData.email || 'user@example.com',
          displayName: user.displayName || currentData.displayName || 'Life OS User',
          photoURL: user.photoURL || currentData.photoURL || '',
          role: currentData.role || 'user',
          updatedAt: now,
        },
        { merge: true }
      );
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, userPath);
  }

  return user;
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

export async function pushCloudVaultSnapshot(
  uid: string,
  payloadJson: string,
  recordCount: number
): Promise<string> {
  const vaultPath = `users/${uid}/vault/primary`;
  const updatedAt = new Date().toISOString();
  try {
    const vaultRef = doc(db, 'users', uid, 'vault', 'primary');
    await setDoc(vaultRef, {
      uid,
      payloadJson,
      recordCount,
      updatedAt,
    });
    return updatedAt;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, vaultPath);
  }
}

export async function pullCloudVaultSnapshot(
  uid: string
): Promise<{ payloadJson: string; recordCount: number; updatedAt: string } | null> {
  const vaultPath = `users/${uid}/vault/primary`;
  try {
    const vaultRef = doc(db, 'users', uid, 'vault', 'primary');
    const snap = await getDoc(vaultRef);
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      payloadJson: data.payloadJson,
      recordCount: data.recordCount || 0,
      updatedAt: data.updatedAt || '',
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, vaultPath);
  }
}

export function subscribeToCloudVault(
  uid: string,
  onUpdate: (snapshot: { payloadJson: string; recordCount: number; updatedAt: string }) => void
): Unsubscribe {
  const vaultPath = `users/${uid}/vault/primary`;
  const vaultRef = doc(db, 'users', uid, 'vault', 'primary');
  return onSnapshot(
    vaultRef,
    (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        onUpdate({
          payloadJson: data.payloadJson,
          recordCount: data.recordCount || 0,
          updatedAt: data.updatedAt || '',
        });
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, vaultPath);
    }
  );
}

export { onAuthStateChanged };
export type { User };
