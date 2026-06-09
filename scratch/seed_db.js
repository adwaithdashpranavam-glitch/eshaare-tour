import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import fs from "fs";
import path from "path";

// 1. Load and parse .env manually
const envPath = path.resolve(process.cwd(), ".env");
const envContent = fs.readFileSync(envPath, "utf-8");
const env = {};
envContent.split("\n").forEach(line => {
  const parts = line.split("=");
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts[1].trim();
  }
});

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID
};

// 2. Initialize Firebase
console.log("Initializing Firebase with project ID:", firebaseConfig.projectId);
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const SEED_VISA_TYPES = [
  {
    slug: "schengen",
    imageUrl: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=800&q=80",
    name: "Schengen Europe Visa",
    tagline: "Travel freely across 27 European member states with expert support",
    isPublished: true,
    sortOrder: 1,
    heroStats: [
      { label: "Processing Time", value: "5-10 Days", icon: "Clock" },
      { label: "Success Rate", value: "98.2%", icon: "TrendingUp" },
      { label: "Required Documents", value: "4 Core Docs", icon: "FileText" },
      { label: "Embassy Appointments", value: "Express Slots", icon: "Calendar" }
    ],
    overviewText: "The Schengen Visa allows short-term stays in any of the 27 member states for up to 90 days within any 180-day period. Navigating biometrics slots and document compliance at VFS Global in Dubai or Abu Dhabi can be challenging. Eshaare Tours takes care of your entire application flow, ensuring you get compliant flight bookings, hotel vouchers, NOC evaluation check-sheets, and an early biometrics appointment.",
    requiredDocuments: [
      "A passport valid for at least 6 months with two blank pages",
      "A valid UAE residency visa (valid for at least 3 months from the date of return)",
      "Passport-sized photographs (white background, taken within 6 months)",
      "3-6 months bank statements showing sufficient funds",
      "No Objection Certificate (NOC) from employer",
      "Confirmed flight reservation (return ticket)",
      "Hotel booking confirmation for entire stay"
    ],
    processSteps: [
      {
        stepNumber: 1,
        title: "Submit Details & NOC Checklist",
        description: "Fill in your travel information on our site. We generate custom NOC templates matching your specific UAE employer."
      },
      {
        stepNumber: 2,
        title: "Compliance Audit Check",
        description: "Our senior visa executives verify bank statement transactions, passport validity, photo dimensions, and itinerary matches."
      },
      {
        stepNumber: 3,
        title: "VFS Slot Booking & Submission",
        description: "We secure and schedule an appointment slot at VFS Dubai/Abu Dhabi, compile your complete document dossier, and accompany you through submission."
      },
      {
        stepNumber: 4,
        title: "Visa Approved & Delivery",
        description: "Track passport return in real-time inside our portal. Receive your passport back with your approved Schengen sticker."
      }
    ],
    feeStructure: [
      { applicantType: "Adult (12+ years)", embassyFee: "320 AED (€80)", serviceFee: "280 AED" },
      { applicantType: "Child (6-12 years)", embassyFee: "160 AED (€40)", serviceFee: "280 AED" },
      { applicantType: "Infant (under 6 years)", embassyFee: "Free", serviceFee: "200 AED" }
    ],
    faqs: [
      {
        question: "What documents are required for a Schengen visa?",
        answer: "Standard requirements include a valid passport, UAE residence visa, NOC from employer, 3-6 months bank statements, travel insurance, and flight/hotel bookings."
      },
      {
        question: "Can you guarantee my Schengen visa approval?",
        answer: "No agency can guarantee a visa as the decision rests solely with the embassy. However, we maximize your chances by ensuring 100% documentation compliance."
      },
      {
        question: "How long does Schengen processing take?",
        answer: "Schengen visas usually take 15 working days post-submission. We recommend starting at least 6-8 weeks before travel."
      },
      {
        question: "Which countries can I visit with a Schengen visa?",
        answer: "You can visit all 27 Schengen member states including France, Germany, Italy, Spain, Switzerland, Netherlands, Austria, and more."
      }
    ],
    metaTitle: "Schengen Visa Dubai | Eshaare Tours",
    metaDescription: "Apply for Schengen visa in Dubai with expert support. VFS slot booking, document audit, and 98% success rate. Contact Eshaare Tours today.",
    popularDestinations: [
      { name: "France", slug: "france", imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDUTE6qwMsjZv4h8snMW79pMTLBhrvVdmRTJWxFIDP_IulAiV8-9XYZCSpj7OiEf1QsFiKyGTXJDv_2aeM53IY5bc0kOghhy7q5nQurHzx7VuqbQz-7fzeACzoNSp72oZ7-tncwOvGFrvXVPrem90mKMA-4dqzAnPJJ-CzC3Ey_1pjH72rgIK_ofTii3Mysqq-_LxDURyoGxInQeVSSov9G1vNNGvyD_hfXq2b2aMftO45xtsmFCLm7Dj0ZoFTYbYUmhHQ5PU8RxkM" },
      { name: "Italy", slug: "italy", imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDzAOi0Aj0u8aY4kBNSMthGU5SsqvcU6B0rLy2Ms8-Bz0JMpSOmUUFjbRe1s_L_7RGIOPq0ZaM7IIk8iZeSOzMiMFxKaqGrolpVbnXXRzBhcFpG9X8q4robImyaXDJnu4Zt4-7Dlut0js2t5T0msX96LXXkQ5RH4LbkyJ5IhOqodY7bJkuzR1AGErX51s1svodAznliewfQ5AZTt89eDLlKiEPDRhFvsktc8W_YcT_bASCC2DkwuhO3Dcyl9ziRxFdJKWZGDWwpVh4" },
      { name: "Switzerland", slug: "switzerland", imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBu9KB76iwfBlS5Bij8R9O-skh7Ql5QOc3PZRGu_C0Cyrc8HlWudemG6hHFtDp9wElyBCxdmFpse9B1mk-s7ackGGJnH9lbYTNr_DfEZJdAsQ4OBTdh-T-4v-CiJvxBvbUXafq95fmCUdrgwAeMlDhVx6u0ZRqMgwGxZA6Y2WrOPA_F1sD9SmP962oZQm1-eMEGUzhVgtPHl4UWB2KEFlxSF-ou1t7y6j2bm4SWbzuOnKRUAGVSHWvZpVIrumvssEW9QhmgU2uZiyI" },
      { name: "Germany", slug: "germany", imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAEKbJi_fvHz3xNsLEWUDIBE6FSTnachmrBgRTsQlXg01noaPfxRtoxCi2bVbM4EmMaCTBq5uJvgbaw7aKu8MwDcWyFBReE_Z0tWJiru-nRImPxSq-JdrnpahzFKqqFbw32rZ9WIZbC6pTRmOfxIPL3C93N-8uWX5bqfd5CxaxguecE1djT2NJCjJszjcoGjFhzKg9k95zz1XVg6phjIIIywBHZvnshG8Oh8Lv1vAnrKhT68yRXtejp3NGCbyVIfIw_EWO9L7BlVdI" }
    ],
    showSupportPackages: true
  },
  {
    slug: "france",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDUTE6qwMsjZv4h8snMW79pMTLBhrvVdmRTJWxFIDP_IulAiV8-9XYZCSpj7OiEf1QsFiKyGTXJDv_2aeM53IY5bc0kOghhy7q5nQurHzx7VuqbQz-7fzeACzoNSp72oZ7-tncwOvGFrvXVPrem90mKMA-4dqzAnPJJ-CzC3Ey_1pjH72rgIK_ofTii3Mysqq-_LxDURyoGxInQeVSSov9G1vNNGvyD_hfXq2b2aMftO45xtsmFCLm7Dj0ZoFTYbYUmhHQ5PU8RxkM",
    name: "France Schengen Visa",
    tagline: "Expert document preparation and VFS slot assistance for France",
    isPublished: true,
    sortOrder: 6,
    heroStats: [
      { label: "Processing Time", value: "10-15 Days", icon: "Clock" },
      { label: "Success Rate", value: "98.9%", icon: "TrendingUp" },
      { label: "Required Documents", value: "5 Core Docs", icon: "FileText" },
      { label: "Embassy Appointment", value: "VFS Global Dubai", icon: "Calendar" }
    ],
    overviewText: "Apply for your France tourist or business visa with Eshaare Tours. As one of the most popular Schengen destinations, securing appointments at the French consulate in WAFI Mall Dubai requires diligent slot tracking. We audit your employment contracts, bank transactions, and construct compliant itineraries for your French journey.",
    requiredDocuments: [
      "A passport valid for at least 6 months with two blank pages",
      "A valid UAE residency visa (valid for at least 3 months from the date of return)",
      "Passport-sized photographs (white background, taken within 6 months)",
      "3-6 months bank statements showing sufficient funds",
      "No Objection Certificate (NOC) from employer",
      "Confirmed flight reservation (return ticket)",
      "Hotel booking confirmation for entire stay"
    ],
    processSteps: [
      { stepNumber: 1, title: "Submit Details & NOC Checklist", description: "Provide passport copy and complete travel questionnaire." },
      { stepNumber: 2, title: "Compliance Audit Check", description: "Our senior visa executives verify bank statement transactions, passport validity, and photo dimensions." },
      { stepNumber: 3, title: "VFS Slot Booking & Submission", description: "We secure an appointment slot at VFS Dubai/Abu Dhabi, compile your document dossier, and accompany you." },
      { stepNumber: 4, title: "Visa Approved & Delivery", description: "Receive your passport back with your approved French Schengen sticker." }
    ],
    feeStructure: [
      { applicantType: "Adult (12+ years)", embassyFee: "320 AED (€80)", serviceFee: "280 AED" },
      { applicantType: "Child (6-12 years)", embassyFee: "160 AED (€40)", serviceFee: "280 AED" }
    ],
    faqs: [
      { question: "How long does French processing take?", answer: "Typically 10-15 working days post-submission." }
    ],
    metaTitle: "France Visa Dubai | Schengen Visa Specialists | Eshaare Tours",
    metaDescription: "Apply for France Schengen visa in Dubai with expert support. VFS slot booking and document compliance audits.",
    showSupportPackages: true
  },
  {
    slug: "italy",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDzAOi0Aj0u8aY4kBNSMthGU5SsqvcU6B0rLy2Ms8-Bz0JMpSOmUUFjbRe1s_L_7RGIOPq0ZaM7IIk8iZeSOzMiMFxKaqGrolpVbnXXRzBhcFpG9X8q4robImyaXDJnu4Zt4-7Dlut0js2t5T0msX96LXXkQ5RH4LbkyJ5IhOqodY7bJkuzR1AGErX51s1svodAznliewfQ5AZTt89eDLlKiEPDRhFvsktc8W_YcT_bASCC2DkwuhO3Dcyl9ziRxFdJKWZGDWwpVh4",
    name: "Italy Schengen Visa",
    tagline: "Fast-track Schengen visa processing for Italy from Dubai",
    isPublished: true,
    sortOrder: 7,
    heroStats: [
      { label: "Processing Time", value: "12-15 Days", icon: "Clock" },
      { label: "Success Rate", value: "98.5%", icon: "TrendingUp" },
      { label: "Required Documents", value: "5 Core Docs", icon: "FileText" },
      { label: "Embassy Appointment", value: "VFS Global Dubai", icon: "Calendar" }
    ],
    overviewText: "Travel to Rome, Milan, Venice, or the Amalfi coast. Applying for an Italian Schengen visa involves submitting your biometrics at VFS Global in Dubai or Abu Dhabi. Eshaare Tours ensures that your medical insurance, flight bookings, and hotel vouchers are embassy-compliant.",
    requiredDocuments: [
      "Passport valid for at least 6 months",
      "UAE residence visa copy",
      "Passport photos",
      "3-6 months bank statements showing regular income",
      "Employer NOC or business setup papers",
      "Travel insurance compliant with Schengen rules"
    ],
    processSteps: [
      { stepNumber: 1, title: "Submit Details & NOC Checklist", description: "Provide passport copy and complete travel questionnaire." },
      { stepNumber: 2, title: "Compliance Audit Check", description: "Our senior visa executives verify bank statement transactions, passport validity, and photo dimensions." },
      { stepNumber: 3, title: "VFS Slot Booking & Submission", description: "We secure an appointment slot at VFS Dubai/Abu Dhabi, compile your document dossier, and accompany you." },
      { stepNumber: 4, title: "Visa Approved & Delivery", description: "Receive your passport back with your approved Italian Schengen sticker." }
    ],
    feeStructure: [
      { applicantType: "Adult (12+ years)", embassyFee: "320 AED (€80)", serviceFee: "280 AED" },
      { applicantType: "Child (6-12 years)", embassyFee: "160 AED (€40)", serviceFee: "280 AED" }
    ],
    faqs: [
      { question: "How long does Italian processing take?", answer: "Typically 12-15 working days post-submission." }
    ],
    metaTitle: "Italy Visa Dubai | Schengen Visa Specialists | Eshaare Tours",
    metaDescription: "Apply for Italy Schengen visa in Dubai with expert support. VFS slot booking and document compliance audits.",
    showSupportPackages: true
  },
  {
    slug: "switzerland",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBu9KB76iwfBlS5Bij8R9O-skh7Ql5QOc3PZRGu_C0Cyrc8HlWudemG6hHFtDp9wElyBCxdmFpse9B1mk-s7ackGGJnH9lbYTNr_DfEZJdAsQ4OBTdh-T-4v-CiJvxBvbUXafq95fmCUdrgwAeMlDhVx6u0ZRqMgwGxZA6Y2WrOPA_F1sD9SmP962oZQm1-eMEGUzhVgtPHl4UWB2KEFlxSF-ou1t7y6j2bm4SWbzuOnKRUAGVSHWvZpVIrumvssEW9QhmgU2uZiyI",
    name: "Switzerland Schengen Visa",
    tagline: "Complete Swiss visa application and document guidance from Dubai",
    isPublished: true,
    sortOrder: 8,
    heroStats: [
      { label: "Processing Time", value: "8-12 Days", icon: "Clock" },
      { label: "Success Rate", value: "99.1%", icon: "TrendingUp" },
      { label: "Required Documents", value: "5 Core Docs", icon: "FileText" },
      { label: "Embassy Appointment", value: "VFS Global Dubai", icon: "Calendar" }
    ],
    overviewText: "Securing a Swiss tourist visa requires precise proof of itinerary and accommodation across the Alps. Eshaare Tours coordinates your flight vouchers, hotel bookings, and NOC employer letters, submitting to VFS Global for rapid Swiss embassy approvals.",
    requiredDocuments: [
      "Passport valid for at least 6 months",
      "UAE residence visa copy",
      "Passport photos",
      "3-6 months bank statements showing regular income",
      "Employer NOC or business setup papers",
      "Travel insurance compliant with Schengen rules"
    ],
    processSteps: [
      { stepNumber: 1, title: "Submit Details & NOC Checklist", description: "Provide passport copy and complete travel questionnaire." },
      { stepNumber: 2, title: "Compliance Audit Check", description: "Our senior visa executives verify bank statement transactions, passport validity, and photo dimensions." },
      { stepNumber: 3, title: "VFS Slot Booking & Submission", description: "We secure an appointment slot at VFS Dubai/Abu Dhabi, compile your document dossier, and accompany you." },
      { stepNumber: 4, title: "Visa Approved & Delivery", description: "Receive your passport back with your approved Swiss Schengen sticker." }
    ],
    feeStructure: [
      { applicantType: "Adult (12+ years)", embassyFee: "320 AED (€80)", serviceFee: "280 AED" },
      { applicantType: "Child (6-12 years)", embassyFee: "160 AED (€40)", serviceFee: "280 AED" }
    ],
    faqs: [
      { question: "How long does Swiss processing take?", answer: "Typically 8-12 working days post-submission." }
    ],
    metaTitle: "Switzerland Visa Dubai | Schengen Visa Specialists | Eshaare Tours",
    metaDescription: "Apply for Swiss Schengen visa in Dubai with expert support. VFS slot booking and document compliance audits.",
    showSupportPackages: true
  },
  {
    slug: "germany",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAEKbJi_fvHz3xNsLEWUDIBE6FSTnachmrBgRTsQlXg01noaPfxRtoxCi2bVbM4EmMaCTBq5uJvgbaw7aKu8MwDcWyFBReE_Z0tWJiru-nRImPxSq-JdrnpahzFKqqFbw32rZ9WIZbC6pTRmOfxIPL3C93N-8uWX5bqfd5CxaxguecE1djT2NJCjJszjcoGjFhzKg9k95zz1XVg6phjIIIywBHZvnshG8Oh8Lv1vAnrKhT68yRXtejp3NGCbyVIfIw_EWO9L7BlVdI",
    name: "Germany Schengen Visa",
    tagline: "Expert document check and appointment assistance for Germany",
    isPublished: true,
    sortOrder: 9,
    heroStats: [
      { label: "Processing Time", value: "10-15 Days", icon: "Clock" },
      { label: "Success Rate", value: "98.0%", icon: "TrendingUp" },
      { label: "Required Documents", value: "5 Core Docs", icon: "FileText" },
      { label: "Embassy Appointment", value: "VFS Global Dubai", icon: "Calendar" }
    ],
    overviewText: "Applying for a German Schengen Visa is a highly structured process. The German Consulate in Dubai maintains strict document audit guidelines. Eshaare Tours verifies that your travel history, bank statements, and cover letters are perfect before submission.",
    requiredDocuments: [
      "Passport valid for at least 6 months",
      "UAE residence visa copy",
      "Passport photos",
      "3-6 months bank statements showing regular income",
      "Employer NOC or business setup papers",
      "Travel insurance compliant with Schengen rules"
    ],
    processSteps: [
      { stepNumber: 1, title: "Submit Details & NOC Checklist", description: "Provide passport copy and complete travel questionnaire." },
      { stepNumber: 2, title: "Compliance Audit Check", description: "Our senior visa executives verify bank statement transactions, passport validity, and photo dimensions." },
      { stepNumber: 3, title: "VFS Slot Booking & Submission", description: "We secure an appointment slot at VFS Dubai/Abu Dhabi, compile your document dossier, and accompany you." },
      { stepNumber: 4, title: "Visa Approved & Delivery", description: "Receive your passport back with your approved German Schengen sticker." }
    ],
    feeStructure: [
      { applicantType: "Adult (12+ years)", embassyFee: "320 AED (€80)", serviceFee: "280 AED" },
      { applicantType: "Child (6-12 years)", embassyFee: "160 AED (€40)", serviceFee: "280 AED" }
    ],
    faqs: [
      { question: "How long does German processing take?", answer: "Typically 10-15 working days post-submission." }
    ],
    metaTitle: "Germany Visa Dubai | Schengen Visa Specialists | Eshaare Tours",
    metaDescription: "Apply for Germany Schengen visa in Dubai with expert support. VFS slot booking and document compliance audits.",
    showSupportPackages: true
  }
];

// 3. Write data to Firestore
const seed = async () => {
  try {
    for (const item of SEED_VISA_TYPES) {
      console.log(`Writing visa type [${item.slug}] to database...`);
      const itemRef = doc(db, "visa_types", item.slug);
      
      const defaultSupportPackages = {
        supportPackages: {
          standard: {
            title: item.slug === "schengen" ? "Standard Schengen Support" : `${item.name} Standard Support`,
            subtitle: "Ideal for travelers who already have an appointment slot.",
            price: "299",
            features: [
              { text: "Document Checklist", included: true },
              { text: "Form Filling (Online)", included: true },
              { text: "Cover Letter Drafting", included: true },
              { text: "Slot Tracking", included: false }
            ]
          },
          premium: {
            title: item.slug === "schengen" ? "Premium Fast-Track Appointment Booking" : `${item.name} Premium Fast-Track`,
            subtitle: "Comprehensive end-to-end management with appointment tracking.",
            price: "549",
            recommended: true,
            features: [
              { text: "All Standard Features", included: true },
              { text: "Appointment Slot Tracking", included: true, highlighted: true },
              { text: "Travel Insurance", included: true },
              { text: "Flight & Hotel Vouchers", included: true },
              { text: "In-person Document Pickup", included: true }
            ]
          }
        }
      };

      await setDoc(itemRef, {
        ...defaultSupportPackages,
        ...item,
        updatedAt: new Date(),
        updatedBy: "node-seeder"
      }, { merge: true });
    }
    console.log("Database seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Database seeding failed:", error);
    process.exit(1);
  }
};

seed();
