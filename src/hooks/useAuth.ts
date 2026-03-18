import { useState, useEffect } from 'react';
import { auth, googleProvider, db } from '../lib/firebase';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut, 
  signInWithRedirect, 
  getRedirectResult,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { User } from '../types';
import { handleFirestoreError, OperationType } from '../lib/error-handling';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isApiOk, setIsApiOk] = useState(!!localStorage.getItem('GEMINI_API_KEY'));
  const [isClaudeApiOk, setIsClaudeApiOk] = useState(!!localStorage.getItem('CLAUDE_API_KEY'));

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("onAuthStateChanged fired:", firebaseUser ? `User: ${firebaseUser.uid}` : "No user");
      
      if (!firebaseUser) {
        setUser(null);
        localStorage.removeItem('GEMINI_API_KEY');
        localStorage.removeItem('CLAUDE_API_KEY');
        setIsApiOk(false);
        setIsClaudeApiOk(false);
        setLoading(false);
        return;
      }

      // 1. Set user immediately to unblock UI
      const initialUser: User = {
        uid: firebaseUser.uid,
        name: firebaseUser.displayName,
        email: firebaseUser.email,
        picture: firebaseUser.photoURL,
      };
      setUser(initialUser);
      setLoading(false); // Unblock UI early

      // 2. Sync with Firestore in the background
      try {
        console.log("Starting Firestore sync for:", firebaseUser.uid);
        const userRef = doc(db, 'users', firebaseUser.uid);
        
        // Use getDoc to bypass cache and verify real connection
        const userDoc = await getDoc(userRef);
        
        const userDataToSave = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          photoURL: firebaseUser.photoURL || '',
          createdAt: userDoc.exists() ? userDoc.data()?.createdAt : serverTimestamp(),
          updatedAt: serverTimestamp()
        };

        if (!userDoc.exists()) {
          console.log("Creating new user document...");
          await setDoc(userRef, {
            ...userDataToSave,
            role: 'teacher'
          });
          // No need to update state again, initialUser is enough for now
        } else {
          console.log("Updating existing user document...");
          // Only update allowed fields
          const { createdAt, ...updateData } = userDataToSave;
          await setDoc(userRef, updateData, { merge: true });
          
          const existingData = userDoc.data() as any;
          // IMPORTANT: Don't use functional update with "prev ? ... : null" 
          // because it might be null if the first setUser hasn't processed yet.
          // Use the firebaseUser data as the base.
          setUser({ 
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: existingData.displayName || firebaseUser.displayName || initialUser.name,
            picture: existingData.photoURL || firebaseUser.photoURL || initialUser.picture,
            role: existingData.role || 'teacher',
            gemini_api_key: existingData.gemini_api_key,
            claude_api_key: existingData.claude_api_key
          });
          
          if (existingData.gemini_api_key) {
            setIsApiOk(true);
            localStorage.setItem('GEMINI_API_KEY', existingData.gemini_api_key);
          }
          if (existingData.claude_api_key) {
            setIsClaudeApiOk(true);
            localStorage.setItem('CLAUDE_API_KEY', existingData.claude_api_key);
          }
        }
        console.log("Firestore sync completed successfully");
      } catch (error: any) {
        console.error("Firestore user sync error:", {
          code: error.code,
          message: error.message
        });
        // We don't call handleFirestoreError here to avoid breaking the login flow
      }
    });

    getRedirectResult(auth).then((result) => {
      if (result?.user) {
        console.log("Redirect login successful", result.user.uid);
      }
    }).catch((error) => {
      console.error("Redirect result error:", error);
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    if (!auth || !googleProvider) return;
    try {
      console.log("Attempting login with popup...");
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error("Login popup error:", err);
      // Try redirect for most errors in iframe environment
      const redirectErrors = [
        'auth/popup-blocked',
        'auth/cancelled-popup-request',
        'auth/popup-closed-by-user',
        'auth/internal-error'
      ];
      
      if (redirectErrors.includes(err.code) || err.message?.includes('popup')) {
        console.log("Falling back to redirect login...");
        try {
          await signInWithRedirect(auth, googleProvider);
        } catch (redirErr) {
          console.error("Redirect login error:", redirErr);
          throw redirErr;
        }
      } else {
        throw err;
      }
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  return { user, setUser, loading, isApiOk, setIsApiOk, isClaudeApiOk, setIsClaudeApiOk, login, logout };
}
