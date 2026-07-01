import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

export default function PrivacyPolicyPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <Helmet>
        <title>Privacy Policy | ESHAARE Tours & Visas</title>
        <meta 
          name="description" 
          content="Privacy Policy for ESHAARE Tours & Visas. Learn how we collect, use, and protect your personal information when you use our services." 
        />
      </Helmet>

      <main className="min-h-screen bg-gray-50 pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl mb-4">Privacy Policy</h1>
            <p className="text-lg text-gray-600">
              Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12 prose prose-blue max-w-none text-gray-700">
            
            <section className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                  <span className="material-symbols-outlined">shield</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 m-0">1. Introduction</h2>
              </div>
              <p>
                Welcome to ESHAARE Tours & Visas ("we", "our", or "us"). We are committed to protecting your personal information and your right to privacy. If you have any questions or concerns about our policy, or our practices with regards to your personal information, please contact us.
              </p>
              <p>
                When you visit our website <strong>eshaareuae.com</strong>, and use our services, you trust us with your personal information. We take your privacy very seriously. In this privacy notice, we describe our privacy policy. We seek to explain to you in the clearest way possible what information we collect, how we use it and what rights you have in relation to it.
              </p>
            </section>

            <section className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                  <span className="material-symbols-outlined">database</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 m-0">2. Information We Collect</h2>
              </div>
              <p>
                We collect personal information that you voluntarily provide to us when expressing an interest in obtaining information about us or our products and services, when participating in activities on the Website or otherwise contacting us.
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li><strong>Personal Data:</strong> Name, email address, phone number, and passport details necessary for visa processing.</li>
                <li><strong>Travel Information:</strong> Travel dates, destinations, and accommodation preferences.</li>
                <li><strong>Derivative Data:</strong> Information our servers automatically collect when you access the Website, such as your IP address, your browser type, your operating system, your access times, and the pages you have viewed directly before and after accessing the Website.</li>
              </ul>
            </section>

            <section className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                  <span className="material-symbols-outlined">settings_accessibility</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 m-0">3. How We Use Your Information</h2>
              </div>
              <p>
                We use personal information collected via our Website for a variety of business purposes described below. We process your personal information for these purposes in reliance on our legitimate business interests, in order to enter into or perform a contract with you, with your consent, and/or for compliance with our legal obligations.
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>To facilitate visa applications and travel bookings.</li>
                <li>To send you administrative information, such as booking confirmations and travel updates.</li>
                <li>To respond to your inquiries and offer support relating to our services.</li>
                <li>To request feedback and to contact you about your use of our Website.</li>
                <li>For marketing and promotional purposes, with your consent where required by law. (e.g. Google Ads tracking)</li>
              </ul>
            </section>

            <section className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                  <span className="material-symbols-outlined">lock</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 m-0">4. Keeping Your Information Safe</h2>
              </div>
              <p>
                We have implemented appropriate technical and organizational security measures designed to protect the security of any personal information we process. However, please also remember that we cannot guarantee that the internet itself is 100% secure. Although we will do our best to protect your personal information, transmission of personal information to and from our Website is at your own risk. You should only access the services within a secure environment.
              </p>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                  <span className="material-symbols-outlined">mail</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 m-0">5. Contact Us</h2>
              </div>
              <p>
                If you have questions or comments about this policy, you may email us at <strong>info@eshaaretours.com</strong> or by post to:
              </p>
              <address className="not-italic mt-4 p-4 bg-gray-50 rounded-lg text-gray-600 border border-gray-100">
                <strong>ESHAARE Tours & Visas</strong><br />
                Executive Business Center, 14th Floor<br />
                Business Bay, Sheikh Zayed Road<br />
                Dubai, United Arab Emirates
              </address>
            </section>

          </div>
        </div>
      </main>
    </>
  );
}
