export const dynamic = 'force-dynamic';

import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function Home() {
  const user = await getCurrentUser();
  
  if (user) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Gift List Manager
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Create and share gift lists with family and friends. Never give duplicate gifts again!
          </p>
        </div>

        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-3xl mb-4">🎁</div>
            <h3 className="text-xl font-semibold mb-2">Create Multiple Lists</h3>
            <p className="text-gray-600">
              Organize gifts for different occasions - birthdays, Christmas, anniversaries, and more.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-3xl mb-4">🔗</div>
            <h3 className="text-xl font-semibold mb-2">Easy Sharing</h3>
            <p className="text-gray-600">
              Share your lists with unique links. Family and friends can see what you want and reserve items.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-3xl mb-4">🛒</div>
            <h3 className="text-xl font-semibold mb-2">Reserve & Track</h3>
            <p className="text-gray-600">
              Reserve gifts to avoid duplicates. Track what's been purchased while keeping it a surprise.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-3xl mb-4">📱</div>
            <h3 className="text-xl font-semibold mb-2">Add from Anywhere</h3>
            <p className="text-gray-600">
              Add gifts while browsing online stores. Save product details, images, and prices automatically.
            </p>
          </div>
        </div>

        <div className="text-center space-y-4">
          <div className="space-x-4">
            <a
              href="/register"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 inline-block"
            >
              Get Started Free
            </a>
            <a
              href="/login"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold border-2 border-blue-600 hover:bg-blue-50 inline-block"
            >
              Sign In
            </a>
          </div>
          <p className="text-sm text-gray-500">
            No credit card required. Start creating lists in seconds.
          </p>
        </div>
      </div>
    </div>
  );
}