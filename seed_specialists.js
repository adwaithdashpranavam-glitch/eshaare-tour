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

const dummySpecialists = [
  {
    name: "Rakhi G Hari",
    email: "rakhi@eshaareuae.com",
    role: "manager",
    designation: "Managing Director",
    intro: "Coordinating premium custom holiday designs and ensuring absolute file compliance for high-net-worth travelers.",
    img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80",
    visasFiled: 2400,
    experienceYears: 12,
    successRate: 99,
    status: "Active"
  },
  {
    name: "Suresh Kumar",
    email: "suresh@eshaareuae.com",
    role: "visa_ops",
    designation: "Senior Visa Specialist",
    intro: "Expert in Schengen, UK, and USA document audits with deep knowledge of VFS visa operations and embassy protocols.",
    img: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=600&q=80",
    visasFiled: 1850,
    experienceYears: 9,
    successRate: 98,
    status: "Active"
  },
  {
    name: "Aisha Al-Mansoori",
    email: "aisha@eshaareuae.com",
    role: "sales",
    designation: "Luxury Tour Consultant",
    intro: "Crafting bespoke global itineraries for European tours, Japan escapes, and exotic destination getaways.",
    img: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=600&q=80",
    visasFiled: 950,
    experienceYears: 6,
    successRate: 100,
    status: "Active"
  },
  {
    name: "Hassan Ali",
    email: "hassan@eshaareuae.com",
    role: "sales",
    designation: "VFS Operations Lead",
    intro: "Managing slot bookings, biometric appointments, and rapid document dispatch for all Eshaare clients.",
    img: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=80",
    visasFiled: 3200,
    experienceYears: 11,
    successRate: 98,
    status: "Active"
  }
];

async function run() {
  console.log("Seeding dummy specialists into Firestore 'users' collection...");
  for (const spec of dummySpecialists) {
    const docId = `dummy_${spec.name.toLowerCase().replace(/\s+/g, "_")}`;
    console.log(`Writing specialist "${docId}" - "${spec.name}"...`);
    await setDoc(doc(db, "users", docId), spec);
  }
  console.log("Dummy specialists seeded successfully!");
}

run().catch(console.error);
