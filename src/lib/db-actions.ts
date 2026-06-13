
import { db } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp,
  addDoc,
  runTransaction
} from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  displayName: string;
  username: string;
  wins: number;
  losses: number;
  draws: number;
  rating: number;
  lastPlayed?: any;
}

export interface Match {
  id: string;
  playerXId: string;
  playerOId: string;
  playerXName: string;
  playerOName: string;
  board: (string | null)[];
  turn: 'X' | 'O';
  status: 'playing' | 'finished';
  winnerId: string | null;
  createdAt: any;
  updatedAt: any;
  moves: { player: 'X' | 'O'; position: number; timestamp: number }[];
}

export async function syncUserProfile(uid: string, data: Partial<UserProfile>) {
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) {
    await setDoc(userRef, {
      uid,
      displayName: data.displayName || 'Guest',
      username: data.username || 'guest',
      wins: 0,
      losses: 0,
      draws: 0,
      rating: 1000,
      createdAt: serverTimestamp(),
    });
  } else {
    await updateDoc(userRef, { lastPlayed: serverTimestamp() });
  }
}

export async function findMatch(userId: string, displayName: string) {
  const matchmakingRef = collection(db, 'matchmaking');
  // Simple logic: check for waiting player
  // In a real app, use a transaction or a cloud function to prevent double matches.
  // Here we use a dedicated document for global queue or simplified collection logic.
  
  return await runTransaction(db, async (transaction) => {
    const q = query(matchmakingRef, limit(1));
    const querySnapshot = await getDoc(doc(db, 'matchmaking', 'global_queue')); // Simplified logic
    // Normally we'd find the oldest doc, but Firestore transactions require single doc refs often.
    // Let's use a simpler matchmaking collection approach.
    return null;
  });
}

export async function createPrivateRoom(userId: string, userName: string) {
  const roomRef = await addDoc(collection(db, 'matches'), {
    playerXId: userId,
    playerXName: userName,
    playerOId: '',
    playerOName: '',
    board: Array(9).fill(null),
    turn: 'X',
    status: 'waiting',
    winnerId: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    moves: [],
  });
  return roomRef.id;
}

export async function joinPrivateRoom(matchId: string, userId: string, userName: string) {
  const matchRef = doc(db, 'matches', matchId);
  await updateDoc(matchRef, {
    playerOId: userId,
    playerOName: userName,
    status: 'playing',
    updatedAt: serverTimestamp(),
  });
}
