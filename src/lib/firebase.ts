import { initializeApp } from "firebase/app";

import { getFirestore } from "firebase/firestore";

import { getAuth } from "firebase/auth";

import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyD7jNYJYynXgsBmRj6zLu9wg5ZZQsD1dk4",
    authDomain: "eshaareuae.firebaseapp.com",
    databaseURL:
        "https://eshaareuae-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "eshaareuae",
    storageBucket: "eshaareuae.firebasestorage.app",
    messagingSenderId: "229538172464",
    appId: "1:229538172464:web:f2ba1982d2ff7dcdc1a7f5",
    measurementId: "G-381NE299LL",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);

export const auth = getAuth(app);

export const storage = getStorage(app);