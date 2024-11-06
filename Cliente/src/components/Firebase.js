import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyDPoT-K53wESMM2L5M26Hskixpm-T9bShk",
    authDomain: "blog-notinhas.firebaseapp.com",
    projectId: "blog-notinhas",
    storageBucket: "blog-notinhas.firebasestorage.app",
    messagingSenderId: "832331889897",
    appId: "1:832331889897:web:a40765edb34006f9f74478"
  };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };
