"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

// Create a context to hold the current user state
const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("AuthProvider: Initializing auth listener");
    
    // Timeout fallback in case auth never responds
    const timeout = setTimeout(() => {
      console.warn("AuthProvider: Auth state timeout, setting loading to false");
      setLoading(false);
    }, 3000);

    // Listen for auth state changes (sign in, sign out)
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log("AuthProvider: Auth state changed", currentUser);
      clearTimeout(timeout);
      setUser(currentUser);
      setLoading(false);
    });
    
    // Clean up the listener when the component unmounts
    return () => {
      clearTimeout(timeout);
      unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook for easy access to auth state
export const useAuth = () => useContext(AuthContext);