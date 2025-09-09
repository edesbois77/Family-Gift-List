import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import GiftCard from "@/components/GiftCard";
import AddGiftForm from "./AddGiftForm";

export default async function ListPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const list = await prisma.giftList.findUnique({
    where: { id: params.id },
    include: {
      gifts: { orderBy: { createdAt: "desc" } }, // returns all gift fields
    },
  });

  if (!list || list.userId !== user.id) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">{list.title}</h1>
          <Link href="/dashboard" className="text-sm underline">
            Back to Dashboard
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 grid lg:grid-cols-3 gap-8">
        {/* Gifts */}
        <div className="lg:col-span-2 space-y-3">
          {list.gifts.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <div className="text-3xl mb-2">🛍️</div>
              <p className="text-gray-600">No gifts yet, add your first below.</p>
            </div>
          ) : (
            list.gifts.map((g) => <GiftCard key={g.id} gift={g as any} />)
          )}
        </div>

        {/* Add Gift */}
        <div>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Add a gift</h2>
            <AddGiftForm listId={list.id} />
          </div>
        </div>
      </div>
    </div>
  );
}