// Simple in-memory database for demo purposes
// This avoids all the Prisma engine issues

type User = {
  id: string;
  email: string;
  name: string | null;
  password: string;
  createdAt: Date;
};

type GiftList = {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  eventDate: Date | null;
  shareCode: string;
  isPublic: boolean;
  createdAt: Date;
};

type Gift = {
  id: string;
  giftListId: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  price: number | null;
  deliveryCost: number | null;
  size: string | null;
  productUrl: string | null;
  quantity: number;
  priority: number;
  createdAt: Date;
};

type Reservation = {
  id: string;
  giftId: string;
  userId: string;
  quantity: number;
  isPurchased: boolean;
  notes: string | null;
  createdAt: Date;
};

type ListAccess = {
  id: string;
  giftListId: string;
  userId: string;
  accessedAt: Date;
};

// In-memory storage
const users: User[] = [];
const giftLists: GiftList[] = [];
const gifts: Gift[] = [];
const reservations: Reservation[] = [];
const listAccess: ListAccess[] = [];

// Simple database interface that mimics Prisma
export const prisma = {
  user: {
    findUnique: async ({ where }: { where: { id?: string; email?: string } }) => {
      return users.find(u => u.id === where.id || u.email === where.email) || null;
    },
    create: async ({ data }: { data: Omit<User, 'id' | 'createdAt'> }) => {
      const user: User = {
        id: Math.random().toString(36).substr(2, 9),
        ...data,
        createdAt: new Date()
      };
      users.push(user);
      return user;
    }
  },
  giftList: {
    findMany: async ({ where, orderBy, include }: any = {}) => {
      let filtered = giftLists;
      if (where?.userId) {
        filtered = filtered.filter(list => list.userId === where.userId);
      }
      if (where?.shareCode) {
        filtered = filtered.filter(list => list.shareCode === where.shareCode);
      }
      
      return filtered.map(list => ({
        ...list,
        ...(include?._count ? { _count: { gifts: gifts.filter(g => g.giftListId === list.id).length } } : {}),
        ...(include?.user ? { user: users.find(u => u.id === list.userId) } : {}),
        ...(include?.gifts ? { 
          gifts: gifts.filter(g => g.giftListId === list.id).map(gift => ({
            ...gift,
            ...(include.gifts.include?.reservations ? {
              reservations: reservations.filter(r => r.giftId === gift.id)
            } : {})
          }))
        } : {})
      }));
    },
    findUnique: async ({ where, include }: any) => {
      const list = giftLists.find(l => l.id === where.id || l.shareCode === where.shareCode);
      if (!list) return null;
      
      return {
        ...list,
        ...(include?.user ? { user: users.find(u => u.id === list.userId) } : {}),
        ...(include?.gifts ? { 
          gifts: gifts.filter(g => g.giftListId === list.id).map(gift => ({
            ...gift,
            ...(include.gifts.include?.reservations ? {
              reservations: reservations.filter(r => r.giftId === gift.id)
            } : {})
          }))
        } : {})
      };
    },
    create: async ({ data }: { data: Omit<GiftList, 'id' | 'createdAt'> }) => {
      const list: GiftList = {
        id: Math.random().toString(36).substr(2, 9),
        ...data,
        createdAt: new Date()
      };
      giftLists.push(list);
      return list;
    },
    update: async ({ where, data }: any) => {
      const index = giftLists.findIndex(l => l.id === where.id);
      if (index === -1) throw new Error('List not found');
      giftLists[index] = { ...giftLists[index], ...data };
      return giftLists[index];
    },
    delete: async ({ where }: any) => {
      const index = giftLists.findIndex(l => l.id === where.id);
      if (index === -1) throw new Error('List not found');
      return giftLists.splice(index, 1)[0];
    }
  },
  gift: {
    findUnique: async ({ where, include }: any) => {
      const gift = gifts.find(g => g.id === where.id);
      if (!gift) return null;
      
      return {
        ...gift,
        ...(include?.giftList ? { giftList: giftLists.find(l => l.id === gift.giftListId) } : {})
      };
    },
    create: async ({ data }: { data: Omit<Gift, 'id' | 'createdAt'> }) => {
      const gift: Gift = {
        id: Math.random().toString(36).substr(2, 9),
        ...data,
        createdAt: new Date()
      };
      gifts.push(gift);
      return gift;
    },
    update: async ({ where, data }: any) => {
      const index = gifts.findIndex(g => g.id === where.id);
      if (index === -1) throw new Error('Gift not found');
      gifts[index] = { ...gifts[index], ...data };
      return gifts[index];
    },
    delete: async ({ where }: any) => {
      const index = gifts.findIndex(g => g.id === where.id);
      if (index === -1) throw new Error('Gift not found');
      return gifts.splice(index, 1)[0];
    }
  },
  reservation: {
    findMany: async ({ where, include, orderBy }: any = {}) => {
      let filtered = reservations;
      if (where?.userId) {
        filtered = filtered.filter(r => r.userId === where.userId);
      }
      
      return filtered.map(reservation => ({
        ...reservation,
        ...(include?.gift ? { 
          gift: {
            ...gifts.find(g => g.id === reservation.giftId),
            ...(include.gift.include?.giftList ? {
              giftList: {
                ...giftLists.find(l => l.id === gifts.find(g => g.id === reservation.giftId)?.giftListId),
                ...(include.gift.include.giftList.include?.user ? {
                  user: users.find(u => u.id === giftLists.find(l => l.id === gifts.find(g => g.id === reservation.giftId)?.giftListId)?.userId)
                } : {})
              }
            } : {})
          }
        } : {})
      }));
    },
    findUnique: async ({ where }: any) => {
      if (where.id) {
        return reservations.find(r => r.id === where.id) || null;
      }
      if (where.userId_giftId) {
        return reservations.find(r => r.userId === where.userId_giftId.userId && r.giftId === where.userId_giftId.giftId) || null;
      }
      return null;
    },
    create: async ({ data }: { data: Omit<Reservation, 'id' | 'createdAt'> }) => {
      const reservation: Reservation = {
        id: Math.random().toString(36).substr(2, 9),
        ...data,
        createdAt: new Date()
      };
      reservations.push(reservation);
      return reservation;
    },
    update: async ({ where, data }: any) => {
      const index = reservations.findIndex(r => r.id === where.id);
      if (index === -1) throw new Error('Reservation not found');
      reservations[index] = { ...reservations[index], ...data };
      return reservations[index];
    },
    delete: async ({ where }: any) => {
      const index = reservations.findIndex(r => r.id === where.id);
      if (index === -1) throw new Error('Reservation not found');
      return reservations.splice(index, 1)[0];
    }
  },
  listAccess: {
    upsert: async ({ where, update, create }: any) => {
      const existing = listAccess.find(la => 
        la.userId === where.userId_giftListId.userId && 
        la.giftListId === where.userId_giftListId.giftListId
      );
      
      if (existing) {
        Object.assign(existing, update);
        return existing;
      } else {
        const newAccess: ListAccess = {
          id: Math.random().toString(36).substr(2, 9),
          ...create,
          accessedAt: new Date()
        };
        listAccess.push(newAccess);
        return newAccess;
      }
    }
  }
};