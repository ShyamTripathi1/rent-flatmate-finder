import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

const prisma = new PrismaClient();

export async function getProfile(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    const profile = await prisma.tenantProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!profile) {
      return res.status(404).json({ error: 'Tenant profile not found.' });
    }

    return res.json(profile);
  } catch (err: any) {
    console.error('Error fetching tenant profile:', err);
    return res.status(500).json({ error: 'Internal server error fetching profile.' });
  }
}

export async function updateProfile(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    const { preferredLocation, budgetMin, budgetMax, moveInDate, lifestyleNotes } = req.body;

    if (preferredLocation === undefined || budgetMin === undefined || budgetMax === undefined || !moveInDate) {
      return res.status(400).json({ error: 'Missing required profile fields.' });
    }

    const parsedMin = parseFloat(budgetMin);
    const parsedMax = parseFloat(budgetMax);

    if (isNaN(parsedMin) || isNaN(parsedMax) || parsedMin < 0 || parsedMax < parsedMin) {
      return res.status(400).json({ error: 'Invalid budget range. Max must be >= Min.' });
    }

    // Update profile and invalidate existing compatibility scores in a transaction
    const profile = await prisma.$transaction(async (tx) => {
      const updatedProfile = await tx.tenantProfile.upsert({
        where: { userId },
        update: {
          preferredLocation: preferredLocation.trim(),
          budgetMin: parsedMin,
          budgetMax: parsedMax,
          moveInDate: new Date(moveInDate),
          lifestyleNotes: lifestyleNotes ? lifestyleNotes.trim() : null,
        },
        create: {
          userId,
          preferredLocation: preferredLocation.trim(),
          budgetMin: parsedMin,
          budgetMax: parsedMax,
          moveInDate: new Date(moveInDate),
          lifestyleNotes: lifestyleNotes ? lifestyleNotes.trim() : null,
        },
      });

      // Mark all compatibility scores for this tenant to be rescored
      await tx.compatibilityScore.updateMany({
        where: { tenantId: userId },
        data: { needsRescore: true },
      });

      return updatedProfile;
    });

    return res.json(profile);
  } catch (err: any) {
    console.error('Error updating tenant profile:', err);
    return res.status(500).json({ error: 'Internal server error updating profile.' });
  }
}
export default { getProfile, updateProfile };
