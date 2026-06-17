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
  },
  {
    slug: "oman",
    imageUrl: "https://images.unsplash.com/photo-1621680696874-edd80ce57b72?auto=format&fit=crop&w=800&q=80",
    name: "Oman Visa",
    tagline: "Transit and tourist eVisas for road or air travelers from the UAE",
    isPublished: true,
    sortOrder: 10,
    heroStats: [
      { label: "Processing Time", value: "1-2 Days", icon: "Clock" },
      { label: "Success Rate", value: "99.8%", icon: "TrendingUp" },
      { label: "Required Documents", value: "3 Core Docs", icon: "FileText" },
      { label: "Submission Type", value: "100% Online", icon: "Globe" }
    ],
    overviewText: "Apply for your Oman tourist eVisa with Eshaare Tours. For UAE residents traveling to Muscat, Salalah, or driving through the Hatta border, we handle the entire eVisa application. We ensure your passport copies, residency cards, and personal photographs meet the Royal Oman Police requirements for instant approval.",
    requiredDocuments: [
      "Passport copy (minimum 6 months validity)",
      "UAE residency visa page copy (minimum 3 months validity)",
      "Passport-sized photograph with white background"
    ],
    processSteps: [
      { stepNumber: 1, title: "Submit Details & Photos", description: "Provide passport copy and personal photo through our secure client dashboard." },
      { stepNumber: 2, title: "Expert Document Audit", description: "Our team verifies photo dimensions, background specifications, and residency validity." },
      { stepNumber: 3, title: "Royal Oman Police Portal Submission", description: "We execute your eVisa submission directly through the official immigration gateway." },
      { stepNumber: 4, title: "eVisa Approved & Sent", description: "Track return updates. Your approved PDF eVisa is sent straight to your email or WhatsApp." }
    ],
    feeStructure: [
      { applicantType: "10-Day Single Entry", embassyFee: "100 AED", serviceFee: "100 AED" },
      { applicantType: "30-Day Single Entry", embassyFee: "250 AED", serviceFee: "100 AED" }
    ],
    faqs: [
      { question: "Do UAE residents get visa on arrival in Oman?", answer: "While some professions get visa on arrival, it is highly recommended to apply for an eVisa in advance to avoid long border queues or boarding issues." },
      { question: "How long does Oman eVisa take?", answer: "Oman eVisas are usually approved within 24 to 48 hours." }
    ],
    metaTitle: "Oman eVisa Dubai | Eshaare Tours",
    metaDescription: "Apply for Oman tourist visa in Dubai. 24-48 hour fast processing and 99.8% success rate.",
    showSupportPackages: true
  },
  {
    slug: "japan",
    imageUrl: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80",
    name: "Japan Visa",
    tagline: "Short-stay tourist visa assistance including travel plan and reservation compliance",
    isPublished: true,
    sortOrder: 11,
    heroStats: [
      { label: "Processing Time", value: "5-7 Days", icon: "Clock" },
      { label: "Success Rate", value: "98.7%", icon: "TrendingUp" },
      { label: "Required Documents", value: "5 Core Docs", icon: "FileText" },
      { label: "Submission Type", value: "eVisa / VFS", icon: "Calendar" }
    ],
    overviewText: "Apply for your Japan tourist or business visa with Eshaare Tours. Japan offers either electronic eVisa or standard sticker visas depending on applicant nationality and UAE residency profile. We prepare a detailed day-by-day travel itinerary (Schedule of Stay), confirm compliant bookings, and manage the submission to ensure a successful outcome.",
    requiredDocuments: [
      "Original Passport valid for at least 6 months",
      "Copy of UAE Residency Visa and Emirates ID",
      "3 months bank statement with original bank stamp",
      "No Objection Certificate (NOC) from UAE employer",
      "Detailed travel itinerary (Schedule of Stay)"
    ],
    processSteps: [
      { stepNumber: 1, title: "Intake & Profile Audit", description: "Review passenger background, passport validity, and financial transaction sheets." },
      { stepNumber: 2, title: "Drafting 'Schedule of Stay'", description: "Create a detailed day-by-day activity itinerary, required by the Japanese embassy." },
      { stepNumber: 3, title: "VFS / eVisa Submission", description: "Manage official submission and book biometrics appointment at VFS Dubai if needed." },
      { stepNumber: 4, title: "Approved Sticker/eVisa Delivery", description: "Receive passport back with approved Japanese visa or download approved eVisa PDF." }
    ],
    feeStructure: [
      { applicantType: "Single Entry Tourist", embassyFee: "100 AED", serviceFee: "200 AED" },
      { applicantType: "Multiple Entry Tourist", embassyFee: "200 AED", serviceFee: "250 AED" }
    ],
    faqs: [
      { question: "Can Indian nationals in UAE apply for Japan eVisa?", answer: "Yes, Indian nationals holding valid UAE residency can apply for the Japan eVisa online through our guided portal." },
      { question: "What is a 'Schedule of Stay' for Japan?", answer: "A mandatory document listing your day-by-day activities, accommodation details, and contact numbers in Japan. We draft this for you." }
    ],
    metaTitle: "Japan Tourist Visa Dubai | Eshaare Tours",
    metaDescription: "Apply for Japan tourist visa in Dubai. eVisa or VFS processing with detailed Schedule of Stay auditing.",
    showSupportPackages: true
  },
  {
    slug: "korea",
    imageUrl: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=800&q=80",
    name: "South Korea Visa",
    tagline: "Tourist visas and K-ETA application check-ins for UAE residents",
    isPublished: true,
    sortOrder: 12,
    heroStats: [
      { label: "Processing Time", value: "7-10 Days", icon: "Clock" },
      { label: "Success Rate", value: "96.2%", icon: "TrendingUp" },
      { label: "Required Documents", value: "5 Core Docs", icon: "FileText" },
      { label: "Submission Type", value: "KVAC Dubai / eVisa", icon: "Calendar" }
    ],
    overviewText: "Apply for your South Korea visitor visa with Eshaare Tours. Visas for South Korea are processed via the Korea Visa Application Center (KVAC) in Dubai. We audit your employment verification, salary history, bank statements, and complete the detailed K-ETA or visa application forms to meet the Korean consulate's strict standards.",
    requiredDocuments: [
      "Original passport with 6 months validity",
      "UAE residency visa and Emirates ID copy",
      "Certificate of Employment / NOC stating job title and salary",
      "3-6 months bank statement (original bank stamp)",
      "Hotel booking confirmation and daily travel plan"
    ],
    processSteps: [
      { stepNumber: 1, title: "Profile Screening", description: "Review applicant nationality, UAE visa details, and bank statements." },
      { stepNumber: 2, title: "Korea Visa Form Preparation", description: "Complete the comprehensive multi-page KVAC application form." },
      { stepNumber: 3, title: "KVAC Dossier Submission", description: "Submit documents to KVAC Dubai and pay the administrative fees." },
      { stepNumber: 4, title: "Visa Grant Notification", description: "Receive passport with Korea entry visa sticker." }
    ],
    feeStructure: [
      { applicantType: "Short Term Single Entry (under 90 days)", embassyFee: "150 AED", serviceFee: "250 AED" },
      { applicantType: "KVAC Handling Fee", embassyFee: "60 AED", serviceFee: "0 AED" }
    ],
    faqs: [
      { question: "Do I need a K-ETA or a regular Visa?", answer: "Passport holders of visa-exempt countries need a K-ETA. Other nationalities must apply for a regular tourist visa at KVAC. We assist with both." }
    ],
    metaTitle: "South Korea Visa Dubai | KVAC Specialists | Eshaare Tours",
    metaDescription: "Apply for South Korea tourist visa in Dubai via KVAC or K-ETA with expert document auditing.",
    showSupportPackages: true
  },
  {
    slug: "vietnam",
    imageUrl: "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=800&q=80",
    name: "Vietnam Visa",
    tagline: "Fast-track approval letters and tourist eVisas handled within 72 hours",
    isPublished: true,
    sortOrder: 13,
    heroStats: [
      { label: "Processing Time", value: "3-4 Days", icon: "Clock" },
      { label: "Success Rate", value: "99.0%", icon: "TrendingUp" },
      { label: "Required Documents", value: "3 Core Docs", icon: "FileText" },
      { label: "Submission Type", value: "100% Online", icon: "Globe" }
    ],
    overviewText: "Apply for your Vietnam tourist eVisa with Eshaare Tours. Vietnam has expanded its online eVisa facility to all nationalities, allowing up to 90 days stay. We audit your passport details, photo dimensions, entry/exit ports, and process the visa through the immigration department to ensure complete accuracy.",
    requiredDocuments: [
      "High-quality passport bio page photo (valid for 6+ months)",
      "Portrait photo (4x6 cm, white background, no glasses)",
      "Proposed entry and exit ports in Vietnam"
    ],
    processSteps: [
      { stepNumber: 1, title: "Submit Digital Files", description: "Upload a clean scan of your passport bio page and passport photograph." },
      { stepNumber: 2, title: "Port & Itinerary Check", description: "Audit chosen land border checkpoints or airports to prevent entry refusal." },
      { stepNumber: 3, title: "Vietnam Immigration Submission", description: "File the eVisa request on the Vietnam immigration platform." },
      { stepNumber: 4, title: "eVisa Receipt", description: "Receive your approved Vietnam eVisa PDF to print for immigration clearance." }
    ],
    feeStructure: [
      { applicantType: "30-Day Single Entry eVisa", embassyFee: "100 AED", serviceFee: "120 AED" },
      { applicantType: "90-Day Multiple Entry eVisa", embassyFee: "200 AED", serviceFee: "150 AED" }
    ],
    faqs: [
      { question: "How long does a Vietnam eVisa take?", answer: "Normally 3-4 working days. Express service is available for urgent travel." }
    ],
    metaTitle: "Vietnam eVisa Dubai | Eshaare Tours",
    metaDescription: "Apply for Vietnam eVisa online from Dubai. Express service options and 99% approval rating.",
    showSupportPackages: true
  },
  {
    slug: "australia",
    imageUrl: "https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?auto=format&fit=crop&w=800&q=80",
    name: "Australia Visa",
    tagline: "Visitor Visa (Subclass 600) audits for multi-entry tourism or business trips",
    isPublished: true,
    sortOrder: 14,
    heroStats: [
      { label: "Processing Time", value: "15-20 Days", icon: "Clock" },
      { label: "Success Rate", value: "95.5%", icon: "TrendingUp" },
      { label: "Required Documents", value: "6 Core Docs", icon: "FileText" },
      { label: "Submission Type", value: "ImmiAccount Online", icon: "Globe" }
    ],
    overviewText: "Apply for your Australia Subclass 600 Visitor Visa with Eshaare Tours. Australia requires a highly detailed online submission through the Department of Home Affairs ImmiAccount portal. We audit and translate your financial holdings, employment history, assets, and tie-backs to the UAE to build a robust visa application.",
    requiredDocuments: [
      "Scan of passport bio-page and all stamped pages",
      "UAE residency visa and Emirates ID scans",
      "NOC from employer showing salary, designation, and approved leave",
      "6 months personal bank statements with solid credit profile",
      "Detailed itinerary and flight details"
    ],
    processSteps: [
      { stepNumber: 1, title: "Dossier Screening", description: "Gather comprehensive financial, employment, and personal ties documentation." },
      { stepNumber: 2, title: "ImmiAccount File Creation", description: "Formulate the extensive Australian visitor visa profile questionnaire." },
      { stepNumber: 3, title: "Biometrics Appointment", description: "Book and complete biometrics capture at VFS Global Dubai/Abu Dhabi." },
      { stepNumber: 4, title: "E-Visa Grant Letter", description: "Your approved Australian Visitor Visa grant is delivered electronically." }
    ],
    feeStructure: [
      { applicantType: "Visitor Visa (Subclass 600)", embassyFee: "620 AED", serviceFee: "300 AED" }
    ],
    faqs: [
      { question: "Do I need to submit my physical passport for Australia Visa?", answer: "No, Australia visas are completely label-free/electronic. You only submit biometrics at VFS Global." }
    ],
    metaTitle: "Australia Visa Dubai | Subclass 600 | Eshaare Tours",
    metaDescription: "Apply for Australia Subclass 600 tourist visa in Dubai. Complete ImmiAccount documentation audits.",
    showSupportPackages: true
  },
  {
    slug: "new-zealand",
    imageUrl: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80",
    name: "New Zealand Visa",
    tagline: "Visitor Visa and NZeTA document verification for smooth travel entries",
    isPublished: true,
    sortOrder: 15,
    heroStats: [
      { label: "Processing Time", value: "15-25 Days", icon: "Clock" },
      { label: "Success Rate", value: "94.8%", icon: "TrendingUp" },
      { label: "Required Documents", value: "6 Core Docs", icon: "FileText" },
      { label: "Submission Type", value: "RealMe Portal Online", icon: "Globe" }
    ],
    overviewText: "Apply for your New Zealand Visitor Visa with Eshaare Tours. Navigating the RealMe immigration portal can be intricate. We verify your funds, employer details, flight itineraries, and complete the detailed declaration files to ensure compliance with Immigration New Zealand standards.",
    requiredDocuments: [
      "Passport bio-data page color scan",
      "UAE residency visa and Emirates ID copy",
      "No Objection Certificate (NOC) from employer",
      "6 months original bank statements",
      "Passport-sized digital photograph matching NZ specifications"
    ],
    processSteps: [
      { stepNumber: 1, title: "Profile Screening", description: "Examine applicant profile, residency history, and bank balances." },
      { stepNumber: 2, title: "RealMe Portal Upload", description: "Submit details and digital dossiers via the New Zealand Immigration system." },
      { stepNumber: 3, title: "Immigration Case Monitoring", description: "Liaise with immigration officers for any additional information requests." },
      { stepNumber: 4, title: "Electronic Visa Issuance", description: "Receive NZ Visitor Visa approval directly via email." }
    ],
    feeStructure: [
      { applicantType: "Visitor Visa", embassyFee: "550 AED", serviceFee: "300 AED" },
      { applicantType: "NZeTA (Visa-Exempt)", embassyFee: "130 AED", serviceFee: "80 AED" }
    ],
    faqs: [
      { question: "How long does a New Zealand tourist visa take?", answer: "Most tourist applications are processed in 3 to 4 weeks. Early planning is recommended." }
    ],
    metaTitle: "New Zealand Visa Dubai | Eshaare Tours",
    metaDescription: "Apply for New Zealand visitor visa in Dubai. Complete RealMe application and document compliance checks.",
    showSupportPackages: true
  },
  {
    slug: "spain",
    imageUrl: "https://images.unsplash.com/photo-1509840841025-9088ba78a826?auto=format&fit=crop&w=800&q=80",
    name: "Spain Schengen Visa",
    tagline: "Explore Madrid, Barcelona, and Andalucia with expert BLS Spain booking support",
    isPublished: true,
    sortOrder: 16,
    heroStats: [
      { label: "Processing Time", value: "10-15 Days", icon: "Clock" },
      { label: "Success Rate", value: "97.0%", icon: "TrendingUp" },
      { label: "Required Documents", value: "5 Core Docs", icon: "FileText" },
      { label: "Embassy Appointment", value: "BLS International Dubai", icon: "Calendar" }
    ],
    overviewText: "Apply for your Spain tourist or business visa with Eshaare Tours. Spain visa submissions from Dubai are managed by BLS International. Securing a BLS appointment slot requires constant monitoring. We assist you with document compilation, travel insurance, flight itineraries, and hotel bookings to ensure BLS compliance.",
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
      { stepNumber: 3, title: "BLS Slot Booking & Submission", description: "We secure an appointment slot at BLS Dubai, compile your document dossier, and assist you with submission." },
      { stepNumber: 4, title: "Visa Approved & Delivery", description: "Receive your passport back with your approved Spanish Schengen sticker." }
    ],
    feeStructure: [
      { applicantType: "Adult (12+ years)", embassyFee: "320 AED (€80)", serviceFee: "280 AED" },
      { applicantType: "Child (6-12 years)", embassyFee: "160 AED (€40)", serviceFee: "280 AED" }
    ],
    faqs: [
      { question: "How long does Spanish processing take?", answer: "Typically 10-15 working days post-submission." }
    ],
    metaTitle: "Spain Visa Dubai | BLS Spain Specialists | Eshaare Tours",
    metaDescription: "Apply for Spain Schengen visa in Dubai with expert support. BLS slot booking and document compliance audits.",
    showSupportPackages: true
  },
  {
    slug: "netherlands",
    imageUrl: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
    name: "Netherlands Schengen Visa",
    tagline: "Audit your financial statement & employment files for Dutch Schengen entry",
    isPublished: true,
    sortOrder: 17,
    heroStats: [
      { label: "Processing Time", value: "7-12 Days", icon: "Clock" },
      { label: "Success Rate", value: "98.0%", icon: "TrendingUp" },
      { label: "Required Documents", value: "5 Core Docs", icon: "FileText" },
      { label: "Embassy Appointment", value: "VFS Global Dubai", icon: "Calendar" }
    ],
    overviewText: "Apply for your Netherlands tourist or business visa with Eshaare Tours. Navigating the Dutch embassy rules and biometrics slots at VFS Global Dubai is simple with our documentation team. We review your financial statements, employment letters, and prepare compliant travel details.",
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
      { stepNumber: 3, title: "VFS Slot Booking & Submission", description: "We secure an appointment slot at VFS Dubai, compile your document dossier, and assist you with submission." },
      { stepNumber: 4, title: "Visa Approved & Delivery", description: "Receive your passport back with your approved Dutch Schengen sticker." }
    ],
    feeStructure: [
      { applicantType: "Adult (12+ years)", embassyFee: "320 AED (€80)", serviceFee: "280 AED" },
      { applicantType: "Child (6-12 years)", embassyFee: "160 AED (€40)", serviceFee: "280 AED" }
    ],
    faqs: [
      { question: "How long does Netherlands processing take?", answer: "Typically 7-12 working days post-submission." }
    ],
    metaTitle: "Netherlands Visa Dubai | VFS Dutch Specialists | Eshaare Tours",
    metaDescription: "Apply for Netherlands Schengen visa in Dubai with expert support. VFS slot booking and document compliance audits.",
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
