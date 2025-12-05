import Link from "next/link";
import Header from "./components/Header";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Authentication Event Logging
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Track and monitor authentication events across your applications using Clerk webhooks.
          </p>

          <div className="bg-white rounded-lg shadow-md p-8 mb-8">
            <h3 className="text-2xl font-semibold mb-4">Getting Started</h3>
            <div className="text-left space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">1</span>
                </div>
                <div className="ml-4">
                  <h4 className="font-medium">Create an Application</h4>
                  <p className="text-gray-600">Add your application to start receiving authentication events.</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">2</span>
                </div>
                <div className="ml-4">
                  <h4 className="font-medium">Configure Webhooks</h4>
                  <p className="text-gray-600">Set up Clerk webhooks to send events to your application&apos;s endpoint.</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">3</span>
                </div>
                <div className="ml-4">
                  <h4 className="font-medium">Monitor Events</h4>
                  <p className="text-gray-600">View authentication events and user activity in real-time.</p>
                </div>
              </div>
            </div>
          </div>

          <Link
            href="/applications"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Get Started
          </Link>
        </div>
      </main>
    </div>
  );
}
