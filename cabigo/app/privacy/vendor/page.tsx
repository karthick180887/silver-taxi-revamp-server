import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Vendor Privacy Policy - Cabigo',
    description: 'Privacy Policy for Cabigo Vendor Application',
};

export default function VendorPrivacy() {
    return (
        <main className="container mx-auto px-4 py-12 max-w-4xl">
            <h1 className="text-3xl font-bold mb-6 text-gray-800 border-b pb-4">Privacy Policy for Cabigo Vendor App</h1>
            <p className="mb-4 text-gray-500 text-sm">Last updated: December 26, 2025</p>

            <section className="space-y-6 text-gray-700 leading-relaxed">
                <div>
                    <h2 className="text-xl font-semibold mb-2 text-gray-900">1. Information We Collect</h2>
                    <p>We collect information necessary to manage fleet and driver operations:</p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li><strong>Business Information:</strong> Business name, contact details, and registration documents.</li>
                        <li><strong>Fleet Data:</strong> Vehicle details, driver information, and trip logs.</li>
                        <li><strong>Financial Information:</strong> Bank account details for payouts and transaction history.</li>
                    </ul>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-2 text-gray-900">2. How We Use Information</h2>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>To manage and dispatch your fleet efficiently.</li>
                        <li>To process payments and generate earnings reports.</li>
                        <li>To verify compliance with our platform standards.</li>
                        <li>To communicate important updates and operational information.</li>
                    </ul>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-2 text-gray-900">3. Information Sharing</h2>
                    <p>Your business information is primarily used internally. We may share limited data with:</p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>Drivers associated with your vendor account.</li>
                        <li>Third-party payment processors.</li>
                        <li>Legal authorities if required by law.</li>
                    </ul>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-2 text-gray-900">4. Data Security</h2>
                    <p>We prioritize the security of your business data and employ industry-standard measures to protect it from unauthorized access.</p>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-2 text-gray-900">5. Contact Us</h2>
                    <p>For any privacy-related inquiries, please contact us at <a href="mailto:support@cabigo.in" className="text-blue-600 hover:underline">support@cabigo.in</a>.</p>
                </div>
            </section>
        </main>
    );
}
