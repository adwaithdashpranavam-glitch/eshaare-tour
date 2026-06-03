export const ROLES = {
  SUPER_ADMIN: "super_admin",
  MANAGER: "manager",
  SALES: "sales",
  VISA_OPS: "visa_ops",
  FINANCE: "finance",
  SUPPORT: "support",
  CLIENT: "client"
};

export const LEAD_STAGES = {
  NEW: "New",
  CONTACTED: "Contacted",
  FOLLOW_UP: "Follow-up",
  QUALIFIED: "Qualified",
  WON: "Won",
  LOST: "Lost"
};

export const CASE_STAGES = {
  DOCS_PENDING: "Docs Pending",
  VERIFICATION: "Verification",
  SUBMITTED: "Submitted",
  AWAITING_DECISION: "Awaiting Decision",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn"
};

export const VISA_TYPES = {
  SCHENGEN: "Schengen",
  UK: "UK",
  USA: "USA",
  UAE: "UAE",
  SAUDI: "Saudi",
  JAPAN: "Japan",
  BUSINESS: "Business",
  TOURIST: "Tourist"
};

export const SOURCE_OPTIONS = {
  WHATSAPP: "WhatsApp",
  WEBSITE: "Website",
  INSTAGRAM: "Instagram",
  REFERRAL: "Referral",
  WALK_IN: "Walk-in"
};

export const SERVICE_TYPES = {
  SCHENGEN_VISA: "Schengen Visa Processing",
  UK_VISA: "UK Visa Processing",
  USA_VISA: "USA Visa Processing",
  UAE_VISA: "UAE Visa Processing",
  SAUDI_VISA: "Saudi Visa Processing",
  JAPAN_VISA: "Japan Visa Processing",
  BUSINESS_VISA: "Business Visa Assistance",
  VFS_BOOKING: "VFS Booking Assistance",
  TRAVEL_INSURANCE: "Travel Insurance"
};

export const VISA_REQUIREMENTS = {
  Schengen: [
    "Original Passport (valid for 6 months)",
    "UAE Residence Visa (valid for 3 months)",
    "Emirates ID copy",
    "NOC Letter from Employer (stating salary, designation, start date)",
    "3 Months Personal Bank Statement (stamped)",
    "2 Passport size photos (white background)",
    "Travel Insurance & Flight/Hotel booking"
  ],
  UK: [
    "Original Passport",
    "UAE Residence Visa copy",
    "Emirates ID copy",
    "6 Months Bank Statement (stamped)",
    "NOC Letter from Employer",
    "Copy of Trade License (for business owners)"
  ],
  USA: [
    "Original Passport",
    "UAE Residence Visa copy",
    "Emirates ID copy",
    "5x5 cm Digital Photo (white background)",
    "6 Months Bank Statement",
    "NOC Letter from Employer"
  ],
  UAE: [
    "Passport copy (valid for 6 months)",
    "Passport size photo (white background)",
    "Guarantor's passport & UAE visa copies"
  ],
  Saudi: [
    "Passport copy",
    "UAE Residence Visa copy",
    "Emirates ID copy",
    "1 Passport size photo"
  ],
  Japan: [
    "Original Passport",
    "UAE Residence Visa copy",
    "Emirates ID copy",
    "3 Months Bank Statement",
    "NOC Letter from Employer",
    "Detailed Travel Itinerary"
  ],
  Business: [
    "Passport copy",
    "UAE Residence Visa copy",
    "Emirates ID copy",
    "Company invitation letter",
    "NOC from employer"
  ],
  Tourist: [
    "Passport copy",
    "UAE Residence Visa copy",
    "Emirates ID copy",
    "Bank statements",
    "NOC letter"
  ]
};

export const MOCK_PACKAGES = [
  {
    slug: "classic-paris-rome",
    title: "Classic Paris & Rome Explorer",
    destination: "France & Italy",
    duration: "7 Nights / 8 Days",
    price: 4999,
    highlights: ["Eiffel Tower entry", "Colosseum tour", "Premium hotels", "Daily breakfast", "Airport transfers"],
    image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80"
  },
  {
    slug: "tokyo-kyoto-cultural",
    title: "Tokyo & Kyoto Cultural Escape",
    destination: "Japan",
    duration: "6 Nights / 7 Days",
    price: 6999,
    highlights: ["Shinkansen Bullet Train", "Mount Fuji day trip", "Historic temples", "Bullet train tickets", "Local guides"],
    image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80"
  },
  {
    slug: "magical-london-scotland",
    title: "Magical London & Edinburgh",
    destination: "United Kingdom",
    duration: "8 Nights / 9 Days",
    price: 5499,
    highlights: ["London Eye experience", "Edinburgh Castle entry", "Scenic Highlands tour", "Internal transfers", "Luxury hotels"],
    image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80"
  }
];
