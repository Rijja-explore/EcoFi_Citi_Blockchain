// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, query, where, getDocs, orderBy, limit, serverTimestamp } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAgtXZuAsXqcjvV8MLN3I7pfQp1WD4wdeY",
  authDomain: "citi-blockchain-ecofi.firebaseapp.com",
  projectId: "citi-blockchain-ecofi",
  storageBucket: "citi-blockchain-ecofi.firebasestorage.app",
  messagingSenderId: "697378356133",
  appId: "1:697378356133:web:f87b49cd2c90df270d464c",
  measurementId: "G-YCELDHR4YT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Add a login event to the timeline
export const logUserLogin = async (walletAddress) => {
  try {
    const docRef = await addDoc(collection(db, "loginTimeline"), {
      walletAddress: walletAddress || 'unknown',
      action: 'login',
      timestamp: serverTimestamp()
    });
    console.log("Login event logged with ID: ", docRef.id);
    return docRef.id;
  } catch (e) {
    console.error("Error logging login event: ", e);
    return null;
  }
};

// Add a logout event to the timeline
export const logUserLogout = async (walletAddress) => {
  try {
    const docRef = await addDoc(collection(db, "loginTimeline"), {
      walletAddress: walletAddress || 'unknown',
      action: 'logout',
      timestamp: serverTimestamp()
    });
    console.log("Logout event logged with ID: ", docRef.id);
    return docRef.id;
  } catch (e) {
    console.error("Error logging logout event: ", e);
    return null;
  }
};

// Get login timeline for a specific wallet address
export const getWalletLoginTimeline = async (walletAddress, limit = 50) => {
  try {
    const q = query(
      collection(db, "loginTimeline"),
      where("walletAddress", "==", walletAddress),
      orderBy("timestamp", "desc"),
      limit(limit)
    );
    
    const querySnapshot = await getDocs(q);
    const timeline = [];
    
    querySnapshot.forEach((doc) => {
      timeline.push({
        id: doc.id,
        ...doc.data(),
        // Convert Firestore Timestamp to JavaScript Date
        time: doc.data().timestamp?.toDate?.() || new Date()
      });
    });
    
    return timeline;
  } catch (e) {
    console.error("Error getting login timeline: ", e);
    return [];
  }
};

// Add a transaction to the database
export const addTransaction = async (transaction) => {
  try {
    const docRef = await addDoc(collection(db, "transactions"), {
      ...transaction,
      timestamp: new Date(),
      walletAddress: transaction.walletAddress || 'unknown',
    });
    console.log("Transaction written with ID: ", docRef.id);
    return docRef.id;
  } catch (e) {
    console.error("Error adding transaction: ", e);
    return null;
  }
};

// Get transactions for a specific wallet
export const getTransactionsForWallet = async (walletAddress, limit = 50) => {
  try {
    const q = query(
      collection(db, "transactions"), 
      where("walletAddress", "==", walletAddress),
      orderBy("timestamp", "desc"),
      limit(limit)
    );
    
    const querySnapshot = await getDocs(q);
    const transactions = [];
    
    querySnapshot.forEach((doc) => {
      transactions.push({
        id: doc.id,
        ...doc.data(),
        // Convert Firestore Timestamp to JavaScript Date
        time: doc.data().timestamp.toDate().toLocaleTimeString()
      });
    });
    
    return transactions;
  } catch (e) {
    console.error("Error getting transactions: ", e);
    return [];
  }
};

export { db };

// Helper function to add a project to Firestore
export const addProject = async (project) => {
  try {
    const docRef = await addDoc(collection(db, "projects"), {
      ...project,
      createdAt: new Date(),
    });
    console.log("Project added with ID: ", docRef.id);
    return docRef.id;
  } catch (e) {
    console.error("Error adding project: ", e);
    return null;
  }
};

// Helper function to get all projects
export const getProjects = async () => {
  try {
    const q = query(
      collection(db, "projects"),
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    const projects = [];
    
    querySnapshot.forEach((doc) => {
      projects.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate()
      });
    });
    
    return projects;
  } catch (e) {
    console.error("Error getting projects: ", e);
    return [];
  }
};

// Add impact data to Firestore
export const addImpactData = async (impactData) => {
  try {
    const docRef = await addDoc(collection(db, "impactData"), {
      ...impactData,
      timestamp: serverTimestamp()
    });
    console.log("Impact data added with ID: ", docRef.id);
    return docRef.id;
  } catch (e) {
    console.error("Error adding impact data: ", e);
    return null;
  }
};

// Get the latest impact data
export const getLatestImpactData = async () => {
  try {
    const q = query(
      collection(db, "impactData"),
      orderBy("timestamp", "desc"),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return {
        co2Reduced: 0,
        treesPlanted: 0,
        energySaved: 0,
        waterConserved: 0
      };
    }
    
    return {
      id: querySnapshot.docs[0].id,
      ...querySnapshot.docs[0].data(),
      timestamp: querySnapshot.docs[0].data().timestamp?.toDate() || new Date()
    };
  } catch (e) {
    console.error("Error getting impact data: ", e);
    return {
      co2Reduced: 0,
      treesPlanted: 0,
      energySaved: 0,
      waterConserved: 0
    };
  }
};