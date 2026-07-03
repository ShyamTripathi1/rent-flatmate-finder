import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

const prisma = new PrismaClient();

export async function getMessages(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const { interestId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    // 1. Fetch interest request and verify ownership
    const interest = await prisma.interestRequest.findUnique({
      where: { id: interestId },
      include: { listing: true },
    });

    if (!interest) {
      return res.status(404).json({ error: 'Chat session not found.' });
    }

    if (interest.status !== 'ACCEPTED') {
      return res.status(403).json({ error: 'Chat is locked until the owner accepts interest.' });
    }

    const isAuthorized = interest.tenantId === userId || interest.listing.ownerId === userId || req.user?.role === 'ADMIN';
    if (!isAuthorized) {
      return res.status(403).json({ error: 'You do not have access to this chat.' });
    }

    // 2. Fetch history
    const messages = await prisma.message.findMany({
      where: { interestRequestId: interestId },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // 3. Mark messages sent by the other user as read
    await prisma.message.updateMany({
      where: {
        interestRequestId: interestId,
        senderId: { not: userId },
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });

    return res.json(messages);
  } catch (err: any) {
    console.error('Error fetching chat history:', err);
    return res.status(500).json({ error: 'Internal server error loading messages.' });
  }
}
export default { getMessages };
