import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD7jNYJYynXgsBmRj6zLu9wg5ZZQsD1dk4",
  authDomain: "eshaareuae.firebaseapp.com",
  projectId: "eshaareuae",
  storageBucket: "eshaareuae.firebasestorage.app",
  messagingSenderId: "229538172464",
  appId: "1:229538172464:web:f2ba1982d2ff7dcdc1a7f5",
  measurementId: "G-381NE299LL"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function check() {
  try {
    console.log("--- Users ---");
    const usersSnap = await getDocs(collection(db, "users"));
    usersSnap.forEach(doc => {
      console.log(doc.id, "=>", JSON.stringify(doc.data()));
    });

    console.log("--- Visa Cases ---");
    const casesSnap = await getDocs(collection(db, "visa_cases"));
    casesSnap.forEach(doc => {
      console.log(doc.id, "=>", JSON.stringify(doc.data()));
    });
  } catch (e) {
    console.error(e);
  }
}

check();
