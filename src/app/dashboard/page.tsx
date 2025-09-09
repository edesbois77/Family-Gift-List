export const dynamic = 'force-dynamic';

import { getCurrentUser } from '@/lib/auth';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const user = await getCurrentUser(cookieStore);
  
  if (!user) {
    redirect('/login');
  }

  const lists = await prisma.giftList.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { gifts: true }
      }
    }
  });

  const recentReservations = await prisma.reservation.findMany({
    where: { userId: user.id },
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      gift: {
        include: {
          giftList: {
            include: {
              user: {
                select: { name: true, email: true }
              }
            }
          }
        }
      }
    }
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {user.name || user.email}!
            </h1>
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="text-gray-600 hover:text-gray-900"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* My Lists */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">My Gift Lists</h2>
              <Link
                href="/lists/new"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Create New List
              </Link>
            </div>

            {lists.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <div className="text-4xl mb-4">🎁</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No gift lists yet
                </h3>
                <p className="text-gray-600 mb-4">
                  Create your first gift list to get started!
                </p>
                <Link
                  href="/lists/new"
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 inline-block"
                >
                  Create Your First List
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {lists.map((list) => (
                  <div key={list.id} className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {list.title}
                        </h3>
                        {list.description && (
                          <p className="text-gray-600 text-sm mb-2">{list.description}</p>
                        )}
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>{list._count.gifts} gifts</span>
                          {list.eventDate && (
                            <span>
                              Event: {new Date(list.eventDate).toLocaleDateString()}
                            </span>
                          )}
                          <span className={list.isPublic ? 'text-green-600' : 'text-gray-500'}>
                            {list.isPublic ? 'Public' : 'Private'}
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <Link
                          href={`/lists/${list.id}`}
                          className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm hover:bg-blue-200"
                        >
                          View
                        </Link>
                        <Link
                          href={`/lists/${list.id}/edit`}
                          className="bg-gray-100 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-200"
                        >
                          Edit
                        </Link>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Share link:</span>
                        <div className="flex items-center space-x-2">
                          <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                            {`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/share/${list.shareCode}`}
                          </code>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(
                                `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/share/${list.shareCode}`
                              );
                            }}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Reservations</h2>
            
            {recentReservations.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="text-2xl mb-2">📋</div>
                <p className="text-gray-600 text-sm">
                  No reservations yet. Browse shared lists to reserve gifts!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentReservations.map((reservation) => (
                  <div key={reservation.id} className="bg-white rounded-lg shadow-md p-4">
                    <h4 className="font-medium text-gray-900 text-sm mb-1">
                      {reservation.gift.title}
                    </h4>
                    <p className="text-xs text-gray-600 mb-2">
                      From {reservation.gift.giftList.user.name || reservation.gift.giftList.user.email}'s list
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        Qty: {reservation.quantity}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        reservation.isPurchased 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {reservation.isPurchased ? 'Purchased' : 'Reserved'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6">
              <Link
                href="/reservations"
                className="block text-center bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200"
              >
                View All Reservations
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}