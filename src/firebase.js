// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyCumzSz-e6tv4oL7n6GWgiwqN4gWqzA9Lg",
    authDomain: "gaurav-627ac.firebaseapp.com",
    projectId: "gaurav-627ac",
    storageBucket: "gaurav-627ac.firebasestorage.app",
    messagingSenderId: "71148888028",
    appId: "1:71148888028:web:cdd7da59aab2f911f27919",
    measurementId: "G-JK7H6V02PB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);