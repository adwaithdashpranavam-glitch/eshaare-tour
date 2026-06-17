import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyD7jNYJYynXgsBmRj6zLu9wg5ZZQsD1dk4",
    authDomain: "eshaareuae.firebaseapp.com",
    projectId: "eshaareuae",
    storageBucket: "eshaareuae.firebasestorage.app",
    messagingSenderId: "229538172464",
    appId: "1:229538172464:web:f2ba1982d2ff7dcdc1a7f5"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const COLLECTIONS = [
  "packages",
  "app_packages",
  "holiday_packages",
  "tour_packages",
  "offers",
  "hotels",
  "visas",
  "visa_types",
  "bookings",
  "tours"
];

async function run() {
  console.log("Checking collections...");
  for (const collName of COLLECTIONS) {
    try {
      const snap = await getDocs(collection(db, collName));
      console.log(`Collection "${collName}": ${snap.size} documents found.`);
      if (snap.size > 0) {
        console.log(`  Sample doc IDs: ${snap.docs.map(d => d.id).slice(0, 5).join(", ")}`);
        // Print fields of first document
        const firstDoc = snap.docs[0].data();
        console.log(`  Sample doc keys: ${Object.keys(firstDoc).join(", ")}`);
        if (firstDoc.title) console.log(`  Sample doc title: "${firstDoc.title}"`);
        else if (firstDoc.name) console.log(`  Sample doc name: "${firstDoc.name}"`);
      }
    } catch (err) {
      console.log(`Collection "${collName}" check failed: ${err.message}`);
    }
  }
}

run().catch(console.error);
