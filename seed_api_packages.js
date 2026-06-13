import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

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

async function run() {
  console.log("Fetching packages from API...");
  const response = await fetch("https://eeshare-crm-backend.onrender.com/api/destinations");
  if (!response.ok) {
    throw new Error(`Failed to fetch from API: ${response.statusText}`);
  }
  const packages = await response.json();
  console.log(`Fetched ${packages.length} packages from API. Seeding into Firestore...`);
  
  for (const pkg of packages) {
    const { id, ...data } = pkg;
    // Ensure rating is float and reviewCount is integer
    const parsedData = {
      ...data,
      rating: parseFloat(pkg.rating) || 4.8,
      reviewCount: parseInt(pkg.reviewCount) || 100,
      active: true,   // Web dashboard checks where("active", "==", true)
      featured: pkg.featured || false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    console.log(`Seeding package "${id}" - "${pkg.title}"...`);
    await setDoc(doc(db, "packages", id), parsedData);
  }
  console.log("Seeding completed successfully!");
}

run().catch(console.error);
