import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Privacy Policy - Cabigo',
    description: 'Privacy Policies for Cabigo Customer, Driver, and Vendor applications.',
};

export default function PrivacyPolicyIndex() {
    return (
        <main className="container mx-auto px-4 py-12 max-w-4xl">
            <h1 className="text-4xl font-bold mb-8 text-center text-gray-800">Privacy Policies</h1>
            <div className="grid md:grid-cols-3 gap-6">
                <Link href="/privacy/customer" className="block group">
                    <div className="border rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow bg-white h-full">
                        <h2 className="text-2xl font-semibold mb-4 text-blue-600 group-hover:text-blue-800 text-center">Customer App</h2>
                        <p className="text-gray-600 text-center">Privacy Policy for the Cabigo Customer application.</p>
                    </div>
                </Link>
                <Link href="/privacy/driver" className="block group">
                    <div className="border rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow bg-white h-full">
                        <h2 className="text-2xl font-semibold mb-4 text-green-600 group-hover:text-green-800 text-center">Driver App</h2>
                        <p className="text-gray-600 text-center">Privacy Policy for the Cabigo Driver application.</p>
                    </div>
                </Link>
                <Link href="/privacy/vendor" className="block group">
                    <div className="border rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow bg-white h-full">
                        <h2 className="text-2xl font-semibold mb-4 text-purple-600 group-hover:text-purple-800 text-center">Vendor App</h2>
                        <p className="text-gray-600 text-center">Privacy Policy for the Cabigo Vendor application.</p>
                    </div>
                </Link>
            </div>
        </main>
    );
}
