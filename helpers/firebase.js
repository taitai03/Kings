// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAfZOcgXSxnsDRnSdEdqm_MEmzDByF1Vq8",
  authDomain: "kings-8c640.firebaseapp.com",
  projectId: "kings-8c640",
  storageBucket: "kings-8c640.firebasestorage.app",
  messagingSenderId: "240590936588",
  appId: "1:240590936588:web:27d048eb24bbddf4ccac29",
  measurementId: "G-FLHN6MMVV8",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
