'use client';

import { useState } from 'react';

type Gift = {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  productUrl?: string;
  price?: number;
  deliveryCost?: number;
  size?: string;
  quantity: number;
  priority: number;
  reservations: Array<{
    id: string;
    quantity: number;
    isPurchased: boolean;
    userId: string;
  }>;
};

type GiftCardProps = {
  gift: Gift;
  isOwner: boolean;
  currentUserId?: string;
  onReserve?: (giftId: string, quantity: number) => void;
  onEdit?: (gift: Gift) => void;
  onDelete?: (giftId: string) => void;
};

export default function GiftCard({ 
  gift, 
  isOwner, 
  currentUserId, 
  onReserve, 
  onEdit, 
  onDelete 
}: GiftCardProps) {
  const [reserveQuantity, setReserveQuantity] = useState(1);
  const [showReserveForm, setShowReserveForm] = useState(false);

  const totalReserved = gift.reservations.reduce((sum, res) => sum + res.quantity, 0);
  const availableQuantity = gift.quantity - totalReserved;
  const userReservation = gift.reservations.find(res => res.userId === currentUserId);
  const isPurchased = gift.reservations.some(res => res.isPurchased);

  const priorityColors = {
    1: 'bg-gray-100 text-gray-800',
    2: 'bg-blue-100 text-blue-800',
    3: 'bg-yellow-100 text-yellow-800',
    4: 'bg-orange-100 text-orange-800',
    5: 'bg-red-100 text-red-800'
  };

  const priorityLabels = {
    1: 'Low',
    2: 'Medium',
    3: 'Normal',
    4: 'High',
    5: 'Must Have!'
  };

  const handleReserve = () => {
    if (onReserve) {
      onReserve(gift.id, reserveQuantity);
      setShowReserveForm(false);
      setReserveQuantity(1);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {gift.imageUrl && (
        <div className="aspect-[4/3] w-full bg-gray-100">
          <img
            src={gift.imageUrl}
            alt={gift.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900">{gift.title}</h3>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${priorityColors[gift.priority as keyof typeof priorityColors]}`}>
            {priorityLabels[gift.priority as keyof typeof priorityLabels]}
          </span>
        </div>

        {gift.description && (
          <p className="text-gray-600 text-sm mb-3">{gift.description}</p>
        )}

        <div className="space-y-2 text-sm text-gray-500 mb-4">
          {gift.price && (
            <div className="flex justify-between">
              <span>Price:</span>
              <span className="font-medium">£{gift.price.toFixed(2)}</span>
            </div>
          )}
          {gift.deliveryCost && (
            <div className="flex justify-between">
              <span>Delivery:</span>
              <span className="font-medium">£{gift.deliveryCost.toFixed(2)}</span>
            </div>
          )}
          {gift.size && (
            <div className="flex justify-between">
              <span>Size:</span>
              <span className="font-medium">{gift.size}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Quantity needed:</span>
            <span className="font-medium">{gift.quantity}</span>
          </div>
          {!isOwner && (
            <div className="flex justify-between">
              <span>Available:</span>
              <span className={`font-medium ${availableQuantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {availableQuantity}
              </span>
            </div>
          )}
        </div>

        {/* Reservation status for non-owners */}
        {!isOwner && (
          <div className="mb-4">
            {userReservation ? (
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <p className="text-green-800 text-sm font-medium">
                  ✓ You've reserved {userReservation.quantity} of this item
                  {userReservation.isPurchased && ' (Purchased)'}
                </p>
              </div>
            ) : isPurchased ? (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-blue-800 text-sm font-medium">
                  ✓ Someone has purchased this item
                </p>
              </div>
            ) : availableQuantity > 0 ? (
              <div className="space-y-2">
                {!showReserveForm ? (
                  <button
                    onClick={() => setShowReserveForm(true)}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                  >
                    Reserve This Gift
                  </button>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <label className="text-sm font-medium">Quantity:</label>
                      <select
                        value={reserveQuantity}
                        onChange={(e) => setReserveQuantity(Number(e.target.value))}
                        className="border border-gray-300 rounded px-2 py-1 text-sm"
                      >
                        {Array.from({ length: Math.min(availableQuantity, 5) }, (_, i) => (
                          <option key={i + 1} value={i + 1}>
                            {i + 1}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={handleReserve}
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 text-sm"
                      >
                        Confirm Reserve
                      </button>
                      <button
                        onClick={() => setShowReserveForm(false)}
                        className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                <p className="text-gray-600 text-sm">
                  This item is fully reserved
                </p>
              </div>
            )}
          </div>
        )}

        {/* Owner actions */}
        {isOwner && (
          <div className="flex space-x-2">
            <button
              onClick={() => onEdit?.(gift)}
              className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 text-sm"
            >
              Edit
            </button>
            <button
              onClick={() => onDelete?.(gift.id)}
              className="flex-1 bg-red-100 text-red-700 py-2 px-4 rounded-md hover:bg-red-200 text-sm"
            >
              Delete
            </button>
          </div>
        )}

        {/* Product link */}
        {gift.productUrl && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <a
              href={gift.productUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-sm"
            >
              View Product →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}