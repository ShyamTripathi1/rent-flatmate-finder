import { Response } from 'express';
import prisma from '../lib/prisma';

const STATUS_PENDING  = 'PENDING';
const STATUS_ACCEPTED = 'ACCEPTED';
const STATUS_DECLINED = 'DECLINED';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { sendEmail } from '../services/emailService';
import { computeScore } from '../services/compatibilityService';

export async function sendInterest(req: AuthenticatedRequest, res: Response) {
  try {
    const tenantId = req.user?.userId;
    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    const { listingId } = req.body;
    if (!listingId) {
      return res.status(400).json({ error: 'Listing ID is required.' });
    }

    // 1. Verify listing exists and is active
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found.' });
    }

    if (listing.isFilled) {
      return res.status(400).json({ error: 'This room listing is already filled.' });
    }

    if (listing.ownerId === tenantId) {
      return res.status(400).json({ error: 'You cannot send an interest request to your own listing.' });
    }

    // 2. Check for existing interest request
    const existing = await prisma.interestRequest.findUnique({
      where: {
        tenantId_listingId: {
          tenantId,
          listingId,
        },
      },
    });

    if (existing) {
      return res.status(400).json({ error: 'You have already sent an interest request for this listing.' });
    }

    // 3. Fetch tenant profile to compute/fetch compatibility score
    const tenant = await prisma.user.findUnique({
      where: { id: tenantId },
      include: { tenantProfile: true },
    });

    if (!tenant || !tenant.tenantProfile) {
      return res.status(400).json({ error: 'Please set up your profile before sending interest.' });
    }

    // Retrieve or calculate score
    let scoreRecord = await prisma.compatibilityScore.findUnique({
      where: {
        tenantId_listingId: {
          tenantId,
          listingId,
        },
      },
    });

    let score = scoreRecord ? scoreRecord.score : 0;
    let explanation = scoreRecord ? scoreRecord.explanation : '';
    let scoringMethod = scoreRecord ? scoreRecord.scoringMethod : 'FALLBACK';

    if (!scoreRecord || scoreRecord.needsRescore) {
      try {
        const calculated = await computeScore(tenant.tenantProfile, listing);
        scoreRecord = await prisma.compatibilityScore.upsert({
          where: {
            tenantId_listingId: {
              tenantId,
              listingId,
            },
          },
          update: {
            score: calculated.score,
            explanation: calculated.explanation,
            scoringMethod: calculated.scoringMethod,
            needsRescore: false,
          },
          create: {
            tenantId,
            listingId,
            score: calculated.score,
            explanation: calculated.explanation,
            scoringMethod: calculated.scoringMethod,
            needsRescore: false,
          },
        });
        score = scoreRecord.score;
        explanation = scoreRecord.explanation;
        scoringMethod = scoreRecord.scoringMethod;
      } catch (err) {
        console.error('Failed to compute score in sendInterest flow:', err);
      }
    }

    // 4. Create Interest Request
    const interest = await prisma.interestRequest.create({
      data: {
        tenantId,
        listingId,
        status: STATUS_PENDING as any,
      },
    });

    // 5. High compatibility rule: email the owner immediately if score > 80
    if (score > 80) {
      const emailSubject = `🔥 High Compatibility Match! ${tenant.name} is interested in your listing`;
      const emailText = `Hello ${listing.owner.name},\n\nA tenant has expressed interest in your room listing at "${listing.location}" with a high compatibility score of ${score}%!\n\nTenant Profile Summary:\n- Name: ${tenant.name}\n- Preferred Location: ${tenant.tenantProfile.preferredLocation}\n- Budget Range: ₹${tenant.tenantProfile.budgetMin} - ₹${tenant.tenantProfile.budgetMax}\n- Lifestyle Notes: ${tenant.tenantProfile.lifestyleNotes || 'N/A'}\n\nAI Explanation:\n${explanation}\n\nPlease log in to the Rent & Flatmate Finder portal to review and accept/decline this match.\n\nBest regards,\nRent & Flatmate Finder Team`;
      
      // Send mail (ignores error to keep thread alive)
      await sendEmail({
        to: listing.owner.email,
        userId: listing.owner.id,
        type: 'EMAIL_OWNER_MATCH',
        subject: emailSubject,
        text: emailText,
      });
    }

    return res.status(201).json({
      interest,
      compatibility: { score, explanation, scoringMethod },
    });
  } catch (err: any) {
    console.error('Error expressing interest:', err);
    return res.status(500).json({ error: 'Internal server error processing interest.' });
  }
}

export async function respondInterest(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { status } = req.body; // ACCEPTED or DECLINED

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    if (status !== STATUS_ACCEPTED && status !== STATUS_DECLINED) {
      return res.status(400).json({ error: 'Status must be ACCEPTED or DECLINED.' });
    }

    // Fetch the interest request and include listing/owner details
    const interest = await prisma.interestRequest.findUnique({
      where: { id },
      include: {
        listing: true,
        tenant: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    if (!interest) {
      return res.status(404).json({ error: 'Interest request not found.' });
    }

    // Guard: only owner of the listing or admin can modify status
    if (interest.listing.ownerId !== userId && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied. You do not own this listing.' });
    }

    // Update status
    const updatedInterest = await prisma.interestRequest.update({
      where: { id },
      data: {
        status,
        respondedAt: new Date(),
      },
    });

    // Notify tenant of the owner's response
    const ownerName = req.user?.role === 'ADMIN' ? 'Platform Administrator' : 'The Room Owner';
    const responseText = status === STATUS_ACCEPTED ? 'ACCEPTED' : 'DECLINED';
    const emailSubject = `Update on your room interest request: ${responseText}`;
    
    let emailText = `Hello ${interest.tenant.name},\n\nWe have an update on your interest request for the room listing at "${interest.listing.location}".\n\n${ownerName} has ${responseText} your interest request.`;
    
    if (status === STATUS_ACCEPTED) {
      emailText += `\n\nCongratulations! A real-time chat channel has now been unlocked between you and the owner. Please log in to the portal and visit your chats page to start chatting.\n\nBest regards,\nRent & Flatmate Finder Team`;
    } else {
      emailText += `\n\nKeep searching! There are plenty of other options on the platform.\n\nBest regards,\nRent & Flatmate Finder Team`;
    }

    await sendEmail({
      to: interest.tenant.email,
      userId: interest.tenant.id,
      type: 'EMAIL_TENANT_DECISION',
      subject: emailSubject,
      text: emailText,
    });

    return res.json(updatedInterest);
  } catch (err: any) {
    console.error('Error responding to interest request:', err);
    return res.status(500).json({ error: 'Internal server error responding to interest.' });
  }
}

export async function getInterests(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    let interests: any[] = [];

    if (role === 'TENANT') {
      // Fetch interests + listing + scores in ONE query (no N+1)
      const raw = await prisma.interestRequest.findMany({
        where: { tenantId: userId },
        include: {
          listing: {
            include: {
              owner: { select: { name: true, email: true } },
              scores: {
                where: { tenantId: userId },
                take: 1,
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      interests = raw.map((item) => {
        const scoreRecord = item.listing.scores?.[0] ?? null;
        return {
          ...item,
          listing: { ...item.listing, scores: undefined },
          compatibility: scoreRecord
            ? { score: scoreRecord.score, explanation: scoreRecord.explanation }
            : null,
        };
      });

    } else if (role === 'OWNER') {
      // Fetch interests + listing + tenant + scores in ONE query (no N+1)
      const raw = await prisma.interestRequest.findMany({
        where: { listing: { ownerId: userId } },
        include: {
          listing: {
            include: {
              scores: true, // will filter per-item below
            },
          },
          tenant: {
            select: {
              name: true,
              email: true,
              tenantProfile: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      interests = raw.map((item) => {
        const scoreRecord =
          item.listing.scores?.find(
            (s) => s.tenantId === item.tenantId && s.listingId === item.listingId
          ) ?? null;
        return {
          ...item,
          listing: { ...item.listing, scores: undefined },
          compatibility: scoreRecord
            ? { score: scoreRecord.score, explanation: scoreRecord.explanation }
            : null,
        };
      });

    } else {
      // Admin: see all
      interests = await prisma.interestRequest.findMany({
        include: {
          listing: true,
          tenant: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    return res.json(interests);
  } catch (err: any) {
    console.error('Error fetching interest requests:', err);
    return res.status(500).json({ error: 'Internal server error fetching interests.' });
  }
}

