import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Driver Privacy Policy - Cabigo',
    description: 'Privacy Policy for Cabigo Driver Application',
};

export default function DriverPrivacy() {
    return (
        <main className="container mx-auto px-4 py-12 max-w-4xl">
            <h1 className="text-3xl font-bold mb-6 text-gray-800 border-b pb-4">Privacy Policy for Cabigo Driver App</h1>
            <p className="mb-4 text-gray-500 text-sm">Last updated: December 26, 2025</p>

            <section className="space-y-6 text-gray-700 leading-relaxed">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6">
                    <h2 className="text-lg font-semibold text-blue-800 mb-2">Prominent Disclosure: Background Location Access</h2>
                    <p className="text-sm text-blue-700">
                        Cabigo Driver collects location data to enable <strong>trip tracking, distance calculation, and efficient ride dispatching</strong> even when the app is closed or not in use. This data is essential for calculating fair fares and ensuring passenger safety during active trips.
                    </p>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-2 text-gray-900">1. Information We Collect</h2>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li><strong>Driver Information:</strong> Name, license details, vehicle information, and insurance documents.</li>
                        <li><strong>Location Data:</strong> We collect precise or approximate location data from your mobile device. We collect this data when the Cabigo app is running in the foreground (app open and on-screen) or background (app open but not on-screen) of your mobile device.</li>
                        <li><strong>Transaction Information:</strong> Trip details, earnings, and payment history.</li>
                        <li><strong>Usage Information:</strong> App interaction, crash logs, and performance data.</li>
                    </ul>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-2 text-gray-900">2. How We Use Information</h2>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li><strong>Ride Dispatching:</strong> To match you with nearby passengers efficiently.</li>
                        <li><strong>Trip Tracking:</strong> To calculate fares based on distance and time, and to show your location to passengers during a ride.</li>
                        <li><strong>Safety & Support:</strong> To enhance safety for both drivers and riders and provide customer support.</li>
                        <li><strong>Compliance:</strong> To verify your identity and eligibility to drive.</li>
                    </ul>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-2 text-gray-900">3. Information Sharing</h2>
                    <p>We may share your information:</p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>With passengers to identify you and your vehicle.</li>
                        <li>With third-party partners for background checks, payments, and analytics.</li>
                        <li>With law enforcement authorities if required by law.</li>
                    </ul>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-2 text-gray-900">4. Permissions Required</h2>
                    <p>The app requires the following permissions to function correctly:</p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li><strong>Location (Fine/Coarse):</strong> For navigation and trip tracking.</li>
                        <li><strong>Background Location:</strong> To track trips while the phone is locked or using other apps (e.g., Maps).</li>
                        <li><strong>Camera/Storage:</strong> To upload documents and profile photos.</li>
                        <li><strong>Phone State:</strong> To facilitate calls between driver and passenger.</li>
                    </ul>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-2 text-gray-900">5. Data Security</h2>
                    <p>We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction.</p>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-2 text-gray-900">6. Deleting Your Account</h2>
                    <p>Drivers can request account deletion by contacting support. Note that we may retain certain information as required by law or for legitimate business purposes.</p>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-2 text-gray-900">7. Contact Us</h2>
                    <p>If you have any questions about this Privacy Policy, please contact us at <a href="mailto:support@cabigo.in" className="text-blue-600 hover:underline">support@cabigo.in</a>.</p>
                </div>
            </section>
        </main>
    );
}
