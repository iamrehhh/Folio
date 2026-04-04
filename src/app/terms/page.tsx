export const metadata = {
  title: 'Terms of Service | Folio',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#FAF8F4] text-[#1C1C1E] py-20 px-6 font-sans">
      <div className="max-w-3xl mx-auto bg-white p-10 md:p-16 rounded-3xl shadow-xl ring-1 ring-black/5 border border-[#E5E0D8]">
        <div className="mb-10 pb-10 border-b border-[#E5E0D8]">
          <h1 className="text-4xl font-serif font-bold text-[#8B6914] mb-4">Terms of Service</h1>
          <p className="text-[#6B6860] uppercase tracking-wider text-sm font-semibold">Last Updated: April 2024</p>
        </div>

        <div className="space-y-8 text-[#4A4742] leading-relaxed">
          <section>
            <h2 className="text-2xl font-serif font-semibold text-[#1C1C1E] mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing and using Folio (the "Service"), you accept and agree to be bound by the terms and provision of this agreement. 
              If you do not agree to abide by these terms, please do not use our Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-semibold text-[#1C1C1E] mb-4">2. Description of Service</h2>
            <p>
              Folio provides users with an EPUB reading platform equipped with AI assistance, vocabulary saving, highlights, 
              and reading statistics (the "Service"). You understand and agree that the Service is provided "AS-IS".
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-semibold text-[#1C1C1E] mb-4">3. User Conduct</h2>
            <p className="mb-4">
              You agree to use the Service in accordance with all applicable laws and regulations. You are solely responsible 
              for any content you upload, including but not limited to EPUB files. Folio does not moderate uploaded personal content 
              but reserves the right to terminate accounts that violate copyright laws or distribute illegal material.
            </p>
            <p>
              As outlined in our Upload Disclaimer, you certify that you have the legal right to upload and read any documents 
              placed in your library.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-semibold text-[#1C1C1E] mb-4">4. Privacy</h2>
            <p>
              Your use of the Service is also subject to Folio's Privacy Policy. Please review our Privacy Policy, 
              which also governs the Service and informs users of our data collection practices.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-semibold text-[#1C1C1E] mb-4">5. Disclaimer of Warranties</h2>
            <p>
              The Service is provided without any warranties, either express or implied. Folio disclaims all warranties, 
              including suitability for a particular purpose. We do not guarantee that the Service will function without 
              interruption or errors.
            </p>
          </section>
        </div>
        
        <div className="mt-16 text-center">
          <a href="/" className="inline-block px-8 py-3 rounded-xl bg-[#8B6914] text-white font-medium hover:opacity-90 transition-opacity">
            Return to Homepage
          </a>
        </div>
      </div>
    </div>
  );
}
