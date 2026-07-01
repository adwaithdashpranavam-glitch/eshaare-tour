// Enhanced Conversion Helpers

const normalizeEmail = (email) => {
  return email ? email.toLowerCase().trim() : undefined;
};

const normalizePhone = (phone) => {
  if (!phone) return undefined;
  let cleaned = phone.trim().replace(/(?!^\+)[^\d]/g, '');
  if (!cleaned.startsWith('+')) {
    // Default to UAE +971 if no country code is provided
    if (cleaned.startsWith('0')) cleaned = cleaned.substring(1);
    cleaned = `+971${cleaned}`;
  }
  return cleaned;
};

const hashData = async (value) => {
  if (!value || typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    return undefined;
  }
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(value);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (error) {
    console.warn("Hashing failed, falling back to basic conversion");
    return undefined;
  }
};

export const trackConversion = async (data = {}, userData = {}) => {
  if (typeof window === 'undefined' || !window.gtag) return;

  if (
    !data.send_to ||
    data.send_to.includes('REAL_LABEL_FROM_GOOGLE_ADS') ||
    data.send_to.includes('YOUR_CONVERSION_LABEL') ||
    !data.send_to.startsWith('AW-18089559443/')
  ) {
    console.warn("Invalid Google Ads conversion config");
    return;
  }

  // Enhanced Conversions (user_data)
  if (userData.email || userData.phone) {
    try {
      const email_address = await hashData(normalizeEmail(userData.email));
      const phone_number = await hashData(normalizePhone(userData.phone));

      const enhancedData = {};
      if (email_address) enhancedData.email_address = email_address;
      if (phone_number) enhancedData.phone_number = phone_number;

      if (Object.keys(enhancedData).length > 0) {
        window.gtag('set', 'user_data', enhancedData);
      }
    } catch (e) {
      // Ignore errors to ensure basic conversion fires
    }
  }

  window.gtag('event', 'conversion', data);
};

export const trackWhatsAppClick = () => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'whatsapp_click', {
      event_category: 'engagement',
      event_label: 'WhatsApp Contact'
    });
  }
};
