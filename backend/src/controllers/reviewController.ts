import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

/**
 * POST /listings/:id/reviews
 * Tenant submits or updates their review for a listing.
 */
export async function upsertReview(req: AuthenticatedRequest, res: Response) {
  try {
    const tenantId = req.user?.userId;
    if (!tenantId) return res.status(401).json({ error: 'Unauthorized.' });

    const { id: listingId } = req.params;
    const { rating, comment } = req.body;

    if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be a number between 1 and 5.' });
    }

    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) return res.status(404).json({ error: 'Listing not found.' });

    const review = await prisma.review.upsert({
      where: { tenantId_listingId: { tenantId, listingId } },
      update: { rating, comment: comment || null },
      create: { tenantId, listingId, rating, comment: comment || null },
      include: {
        tenant: { select: { id: true, name: true } },
      },
    });

    return res.status(200).json(review);
  } catch (err: any) {
    console.error('Error upserting review:', err);
    return res.status(500).json({ error: 'Internal server error submitting review.' });
  }
}

/**
 * GET /listings/:id/reviews
 * Fetch all reviews for a listing (public).
 */
export async function getReviews(req: AuthenticatedRequest, res: Response) {
  try {
    const { id: listingId } = req.params;

    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) return res.status(404).json({ error: 'Listing not found.' });

    const reviews = await prisma.review.findMany({
      where: { listingId },
      orderBy: { createdAt: 'desc' },
      include: {
        tenant: { select: { id: true, name: true } },
      },
    });

    // Compute aggregate stats
    const total = reviews.length;
    const avgRating = total > 0
      ? Math.round((reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / total) * 10) / 10
      : 0;

    return res.json({ reviews, avgRating, totalReviews: total });
  } catch (err: any) {
    console.error('Error fetching reviews:', err);
    return res.status(500).json({ error: 'Internal server error fetching reviews.' });
  }
}

export default { upsertReview, getReviews };
