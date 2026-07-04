import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

export async function getStats(req: AuthenticatedRequest, res: Response) {
  try {
    // Collect stats from database
    const totalUsers = await prisma.user.count();
    const tenants = await prisma.user.count({ where: { role: 'TENANT' } });
    const owners = await prisma.user.count({ where: { role: 'OWNER' } });
    const admins = await prisma.user.count({ where: { role: 'ADMIN' } });

    const totalListings = await prisma.listing.count();
    const filledListings = await prisma.listing.count({ where: { isFilled: true } });
    const activeListings = totalListings - filledListings;

    const totalInterests = await prisma.interestRequest.count();
    const acceptedInterests = await prisma.interestRequest.count({ where: { status: 'ACCEPTED' } });
    const pendingInterests = await prisma.interestRequest.count({ where: { status: 'PENDING' } });
    const declinedInterests = await prisma.interestRequest.count({ where: { status: 'DECLINED' } });

    const totalMessages = await prisma.message.count();

    return res.json({
      users: {
        total: totalUsers,
        tenants,
        owners,
        admins,
      },
      listings: {
        total: totalListings,
        active: activeListings,
        filled: filledListings,
      },
      interests: {
        total: totalInterests,
        accepted: acceptedInterests,
        pending: pendingInterests,
        declined: declinedInterests,
      },
      messages: {
        total: totalMessages,
      },
    });
  } catch (err: any) {
    console.error('Error fetching admin stats:', err);
    return res.status(500).json({ error: 'Internal server error fetching stats.' });
  }
}

export async function getUsers(req: AuthenticatedRequest, res: Response) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        createdAt: true,
        tenantProfile: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(users);
  } catch (err: any) {
    console.error('Error fetching users:', err);
    return res.status(500).json({ error: 'Internal server error fetching users.' });
  }
}

export async function deleteUser(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    // Prevent deleting oneself
    if (req.user?.userId === id) {
      return res.status(400).json({ error: 'You cannot delete your own admin account.' });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Cascade is set up on DB level (onDelete: Cascade)
    await prisma.user.delete({ where: { id } });

    return res.json({ message: 'User and all associated data deleted successfully.' });
  } catch (err: any) {
    console.error('Error deleting user:', err);
    return res.status(500).json({ error: 'Internal server error deleting user.' });
  }
}

export async function deleteListing(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found.' });
    }

    await prisma.listing.delete({ where: { id } });

    return res.json({ message: 'Listing deleted successfully.' });
  } catch (err: any) {
    console.error('Error deleting listing (admin):', err);
    return res.status(500).json({ error: 'Internal server error deleting listing.' });
  }
}
export async function getAllChats(req: AuthenticatedRequest, res: Response) {
  try {
    const chats = await prisma.interestRequest.findMany({
      where: { status: 'ACCEPTED' },
      include: {
        tenant: {
          select: { id: true, name: true, email: true }
        },
        listing: {
          include: {
            owner: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      },
      orderBy: { respondedAt: 'desc' },
    });

    return res.json(chats);
  } catch (err: any) {
    console.error('Error fetching admin chats:', err);
    return res.status(500).json({ error: 'Internal server error fetching chats.' });
  }
}

export async function getChatMessages(req: AuthenticatedRequest, res: Response) {
  try {
    const { interestId } = req.params;

    const messages = await prisma.message.findMany({
      where: { interestRequestId: interestId },
      include: {
        sender: {
          select: { id: true, name: true, role: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    return res.json(messages);
  } catch (err: any) {
    console.error('Error fetching admin chat messages:', err);
    return res.status(500).json({ error: 'Internal server error fetching chat messages.' });
  }
}

export default { getStats, getUsers, deleteUser, deleteListing, getAllChats, getChatMessages };
