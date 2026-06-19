import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createLead } from "../../lib/firestore";
import { generateLeadNo, formatWhatsAppPhone } from "../../utils/helpers";
import { serverTimestamp } from "../../lib/firebase";
import toast from "react-hot-toast";

export const CustomisePackagePage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    destination: "",
    travelDate: "",
    duration: 7,
    travellers: 2,
    budget: "5,000 - 10,000 AED",
    includeFlights: true,
    includeHotels: true,
    includeVisas: false,
    includeTransfers: true,
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const generatedNo = await generateLeadNo();
      
      const notesString = `
Custom Tour Package Request Details:
----------------------------------
Duration: ${formData.duration} Nights
Number of Travellers: ${formData.travellers}
Estimated Budget: ${formData.budget}
Included Preferences: ${[
        formData.includeFlights && "Flights",
        formData.includeHotels && "Hotels",
        formData.includeVisas && "Visa Assistance",
        formData.includeTransfers && "Local Transfers"
      ].filter(Boolean).join(", ")}

Special Requests:
${formData.message}
      `.trim();

      const submission = {
        leadNo: generatedNo,
        contactName: formData.name,
        contactPhone: formatWhatsAppPhone(formData.phone),
        contactEmail: formData.email,
        nationality: "Unknown",
        destinationCountry: formData.destination,
        serviceType: "Tour",
        travelStart: formData.travelDate,
        source: "website",
        stage: "New",
        priority: "Medium",
        ownerId: null,
        notes: notesString,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await createLead(submission);
      toast.success(`Custom package request submitted! Ref: ${generatedNo}`);
      navigate("/");
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit custom package request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-surface min-h-screen py-16 px-margin-mobile md:px-margin-desktop font-sans">
      <div className="max-w-3xl mx-auto space-y-10">
        
        {/* Header Title */}
        <div className="text-center space-y-3">
          <h1 className="font-headline-lg text-3xl md:text-headline-lg text-primary font-bold">
            Customise Your Holiday Package
          </h1>
          <p className="text-on-surface-variant text-body-md max-w-xl mx-auto">
            Tell us about your dream trip. We build custom boutique itineraries catering to your budget, travel group, and preferred dates.
          </p>
        </div>

        {/* Glassmorphic Form Card */}
        <div className="bg-surface-container-lowest/50 backdrop-blur-md rounded-3xl p-8 md:p-12 border border-outline-variant/15 premium-shadow">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Contact Details Section */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-secondary mb-4">
                1. Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="font-label-md text-label-md text-on-surface-variant">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="e.g. Jane Doe"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full bg-surface-container border border-outline-variant/15 rounded-lg px-4 py-3 text-body-sm focus:outline-none focus:ring-1 focus:ring-secondary/35 text-on-surface"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-label-md text-label-md text-on-surface-variant">WhatsApp Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    placeholder="e.g. 501234567"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full bg-surface-container border border-outline-variant/15 rounded-lg px-4 py-3 text-body-sm focus:outline-none focus:ring-1 focus:ring-secondary/35 text-on-surface"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-label-md text-label-md text-on-surface-variant">Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="e.g. jane.doe@example.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full bg-surface-container border border-outline-variant/15 rounded-lg px-4 py-3 text-body-sm focus:outline-none focus:ring-1 focus:ring-secondary/35 text-on-surface"
                  />
                </div>
              </div>
            </div>

            {/* Tour Preferences Section */}
            <hr className="border-outline-variant/10" />
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-secondary mb-4">
                2. Your Dream Destination & Dates
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="font-label-md text-label-md text-on-surface-variant">Where would you like to travel? *</label>
                  <input
                    type="text"
                    name="destination"
                    required
                    placeholder="e.g. Switzerland (Zurich, Interlaken), Italy"
                    value={formData.destination}
                    onChange={handleInputChange}
                    className="w-full bg-surface-container border border-outline-variant/15 rounded-lg px-4 py-3 text-body-sm focus:outline-none focus:ring-1 focus:ring-secondary/35 text-on-surface"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-label-md text-label-md text-on-surface-variant">Tentative Travel Date</label>
                  <input
                    type="date"
                    name="travelDate"
                    value={formData.travelDate}
                    onChange={handleInputChange}
                    className="w-full bg-surface-container border border-outline-variant/15 rounded-lg px-4 py-3 text-body-sm focus:outline-none focus:ring-1 focus:ring-secondary/35 text-on-surface"
                  />
                </div>
              </div>
            </div>

            {/* Trip Specifics */}
            <hr className="border-outline-variant/10" />
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-secondary mb-4">
                3. Trip Specifics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="font-label-md text-label-md text-on-surface-variant">Duration (Nights) *</label>
                  <input
                    type="number"
                    name="duration"
                    required
                    min={1}
                    value={formData.duration}
                    onChange={handleInputChange}
                    className="w-full bg-surface-container border border-outline-variant/15 rounded-lg px-4 py-3 text-body-sm focus:outline-none focus:ring-1 focus:ring-secondary/35 text-on-surface"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-label-md text-label-md text-on-surface-variant">Number of Travellers *</label>
                  <input
                    type="number"
                    name="travellers"
                    required
                    min={1}
                    value={formData.travellers}
                    onChange={handleInputChange}
                    className="w-full bg-surface-container border border-outline-variant/15 rounded-lg px-4 py-3 text-body-sm focus:outline-none focus:ring-1 focus:ring-secondary/35 text-on-surface"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-label-md text-label-md text-on-surface-variant">Estimated Budget (Per Person) *</label>
                  <select
                    name="budget"
                    value={formData.budget}
                    onChange={handleInputChange}
                    className="w-full bg-surface-container border border-outline-variant/15 rounded-lg px-4 py-3 text-body-sm focus:outline-none focus:ring-1 focus:ring-secondary/35 text-on-surface"
                  >
                    <option value="Below 5,000 AED">Below 5,000 AED</option>
                    <option value="5,000 - 10,000 AED">5,000 - 10,000 AED</option>
                    <option value="10,000 - 20,000 AED">10,000 - 20,000 AED</option>
                    <option value="Above 20,000 AED">Above 20,000 AED</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Custom package options toggles */}
            <hr className="border-outline-variant/10" />
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-secondary mb-4">
                4. What should be included?
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <label className="flex items-center gap-3 p-4 bg-surface-container rounded-xl cursor-pointer border border-outline-variant/10 hover:border-secondary/20 transition-all select-none">
                  <input
                    type="checkbox"
                    name="includeFlights"
                    checked={formData.includeFlights}
                    onChange={handleInputChange}
                    className="size-4 accent-secondary rounded"
                  />
                  <span className="text-body-sm font-medium text-on-surface">Flights</span>
                </label>

                <label className="flex items-center gap-3 p-4 bg-surface-container rounded-xl cursor-pointer border border-outline-variant/10 hover:border-secondary/20 transition-all select-none">
                  <input
                    type="checkbox"
                    name="includeHotels"
                    checked={formData.includeHotels}
                    onChange={handleInputChange}
                    className="size-4 accent-secondary rounded"
                  />
                  <span className="text-body-sm font-medium text-on-surface">Hotels</span>
                </label>

                <label className="flex items-center gap-3 p-4 bg-surface-container rounded-xl cursor-pointer border border-outline-variant/10 hover:border-secondary/20 transition-all select-none">
                  <input
                    type="checkbox"
                    name="includeVisas"
                    checked={formData.includeVisas}
                    onChange={handleInputChange}
                    className="size-4 accent-secondary rounded"
                  />
                  <span className="text-body-sm font-medium text-on-surface">Visa Support</span>
                </label>

                <label className="flex items-center gap-3 p-4 bg-surface-container rounded-xl cursor-pointer border border-outline-variant/10 hover:border-secondary/20 transition-all select-none">
                  <input
                    type="checkbox"
                    name="includeTransfers"
                    checked={formData.includeTransfers}
                    onChange={handleInputChange}
                    className="size-4 accent-secondary rounded"
                  />
                  <span className="text-body-sm font-medium text-on-surface">Transfers & Tours</span>
                </label>
              </div>
            </div>

            {/* Special Request message */}
            <hr className="border-outline-variant/10" />
            <div className="flex flex-col gap-2">
              <label className="font-label-md text-label-md text-on-surface-variant">Describe your preferred itinerary or special requests</label>
              <textarea
                name="message"
                rows={4}
                placeholder="e.g. Prefer 4-star boutique hotels close to train stations. Need a day trip to Mt. Titlis. Traveling with an infant so need slow pace itinerary..."
                value={formData.message}
                onChange={handleInputChange}
                className="w-full bg-surface-container border border-outline-variant/15 rounded-lg px-4 py-3 text-body-sm focus:outline-none focus:ring-1 focus:ring-secondary/35 text-on-surface"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary text-on-primary py-4 rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-primary/25"
            >
              <span>{isSubmitting ? "Submitting Request..." : "Request Custom Itinerary"}</span>
              <span className="material-symbols-outlined text-lg">send</span>
            </button>

          </form>
        </div>

      </div>
    </div>
  );
};

export default CustomisePackagePage;
