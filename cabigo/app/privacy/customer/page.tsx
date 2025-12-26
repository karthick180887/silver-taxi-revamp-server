import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Customer Privacy Policy - Cabigo',
    description: 'Privacy Policy for Cabigo Customer Application',
};

export default function CustomerPrivacy() {
    return (
        <main className="container mx-auto px-4 py-12 max-w-4xl">
            <h1 className="text-3xl font-bold mb-6 text-gray-800 border-b pb-4">Privacy Policy for Cabigo Customer App</h1>
            <p className="mb-4 text-gray-500 text-sm">Last updated: December 26, 2025</p>

            <section className="space-y-6 text-gray-700 leading-relaxed">
                <div>
                    <h2 className="text-xl font-semibold mb-2 text-gray-900">1. Information We Collect</h2>
                    <p>We collect information to provide better services to all our users. This includes:</p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li><strong>Personal Information:</strong> Name, email address, phone number, and profile picture.</li>
                        <li><strong>Location Information:</strong> Precise location data to enable ride booking, tracking, and safety features.</li>
                        <li><strong>Transaction Information:</strong> Details about your trips, including date, time, distance, and payment amount.</li>
                        <li><strong>Device Information:</strong> Information about the device you use to access our app, including hardware model and operating system.</li>
                    </ul>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-2 text-gray-900">2. How We Use Information</h2>
                    <p>We use the information we collect to:</p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>Provide, maintain, and improve our services, including facilitating payments and ride matching.</li>
                        <li>Send you receipts, updates, security alerts, and support messages.</li>
                        <li>Respond to your comments, questions, and customer service requests.</li>
                        <li>Monitor and analyze trends, usage, and activities in connection with our services.</li>
                    </ul>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-2 text-gray-900">3. Information Sharing</h2>
                    <p>We may share the information we collect:</p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>With drivers to enable them to provide the services you request.</li>
                        <li>With third-party service providers for payment processing, data analysis, and other services.</li>
                        <li>In response to a request for information if we believe disclosure is in accordance with any applicable law, regulation, or legal process.</li>
                    </ul>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-2 text-gray-900">4. Data Security</h2>
                    <p>We take reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access, disclosure, alteration and destruction.</p>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-2 text-gray-900">5. Your Choices</h2>
                    <p>You may update, correct, or delete information about you at any time by logging into your account or emailing us at support@cabigo.in. You may also disable location services through your device settings, though this may impact app functionality.</p>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-2 text-gray-900">6. Contact Us</h2>
                    <p>If you have any questions about this Privacy Policy, please contact us at <a href="mailto:support@cabigo.in" className="text-blue-600 hover:underline">support@cabigo.in</a>.</p>
                </div>
            </section>
        </main>
    );
}
