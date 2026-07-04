import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { computeScore } from '../services/compatibilityService';

export async function createListing(req: AuthenticatedRequest, res: Response) {
  try {
    const ownerId = req.user?.userId;
    if (!ownerId) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    const {
      location,
      lat,
      lng,
      rent,
      availableFrom,
      roomType,
      furnishingStatus,
      photos,
      description,
    } = req.body;

    if (!location || !rent || !availableFrom || !roomType || !furnishingStatus || !description) {
      return res.status(400).json({ error: 'Missing required listing fields.' });
    }

    const parsedRent = parseFloat(rent);
    const parsedLat = lat ? parseFloat(lat) : null;
    const parsedLng = lng ? parseFloat(lng) : null;

    if (isNaN(parsedRent) || parsedRent <= 0) {
      return res.status(400).json({ error: 'Rent must be a positive number.' });
    }

    const listing = await prisma.listing.create({
      data: {
        ownerId,
        location: location.trim(),
        lat: parsedLat,
        lng: parsedLng,
        rent: parsedRent,
        availableFrom: new Date(availableFrom),
        roomType: roomType.toLowerCase().trim(),
        furnishingStatus: furnishingStatus.toLowerCase().trim(),
        photos: Array.isArray(photos) ? JSON.stringify(photos) : '[]',
        description: description.trim(),
      },
    });

    return res.status(201).json({
      ...listing,
      photos: JSON.parse(listing.photos),
    });
  } catch (err: any) {
    console.error('Error creating listing:', err);
    return res.status(500).json({ error: 'Internal server error creating listing.' });
  }
}

export async function getListings(req: AuthenticatedRequest, res: Response) {
  try {
    const ownerId = req.query.ownerId as string;
    const whereClause: any = {};

    if (ownerId) {
      whereClause.ownerId = ownerId;
    }

    const listings = await prisma.listing.findMany({
      where: whereClause,
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: {
        owner: {
          select: {
            name: true,
            email: true,
          },
        },
        reviews: {
          select: { rating: true },
        },
      },
    });

    const mapped = listings.map((l) => {
      const ratings = l.reviews.map(r => r.rating);
      const avgRating = ratings.length > 0
        ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
        : 0;
      return {
        ...l,
        photos: JSON.parse(l.photos),
        reviews: undefined,
        avgRating,
        totalReviews: ratings.length,
      };
    });

    return res.json(mapped);
  } catch (err: any) {
    console.error('Error fetching listings:', err);
    return res.status(500).json({ error: 'Internal server error fetching listings.' });
  }
}

export async function getListingById(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found.' });
    }

    return res.json({
      ...listing,
      photos: JSON.parse(listing.photos),
    });
  } catch (err: any) {
    console.error('Error fetching listing details:', err);
    return res.status(500).json({ error: 'Internal server error fetching listing details.' });
  }
}

export async function updateListing(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found.' });
    }

    if (listing.ownerId !== userId && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied. You do not own this listing.' });
    }

    const {
      location,
      lat,
      lng,
      rent,
      availableFrom,
      roomType,
      furnishingStatus,
      photos,
      description,
    } = req.body;

    const parsedRent = rent ? parseFloat(rent) : undefined;
    const parsedLat = lat !== undefined ? (lat ? parseFloat(lat) : null) : undefined;
    const parsedLng = lng !== undefined ? (lng ? parseFloat(lng) : null) : undefined;

    if (parsedRent !== undefined && (isNaN(parsedRent) || parsedRent <= 0)) {
      return res.status(400).json({ error: 'Rent must be a positive number.' });
    }

    const isLocationChanged = location && location.trim() !== listing.location;
    const isRentChanged = parsedRent !== undefined && parsedRent !== listing.rent;
    const isAvailabilityChanged = availableFrom && new Date(availableFrom).getTime() !== listing.availableFrom.getTime();

    const updatedListing = await prisma.$transaction(async (tx) => {
      const result = await tx.listing.update({
        where: { id },
        data: {
          location: location ? location.trim() : undefined,
          lat: parsedLat,
          lng: parsedLng,
          rent: parsedRent,
          availableFrom: availableFrom ? new Date(availableFrom) : undefined,
          roomType: roomType ? roomType.toLowerCase().trim() : undefined,
          furnishingStatus: furnishingStatus ? furnishingStatus.toLowerCase().trim() : undefined,
          photos: Array.isArray(photos) ? JSON.stringify(photos) : undefined,
          description: description ? description.trim() : undefined,
        },
      });

      if (isLocationChanged || isRentChanged || isAvailabilityChanged) {
        await tx.compatibilityScore.updateMany({
          where: { listingId: id },
          data: { needsRescore: true },
        });
      }

      return result;
    });

    return res.json({
      ...updatedListing,
      photos: JSON.parse(updatedListing.photos),
    });
  } catch (err: any) {
    console.error('Error updating listing:', err);
    return res.status(500).json({ error: 'Internal server error updating listing.' });
  }
}

export async function deleteListing(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found.' });
    }

    if (listing.ownerId !== userId && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied. You do not own this listing.' });
    }

    await prisma.listing.delete({ where: { id } });
    return res.json({ message: 'Listing deleted successfully.' });
  } catch (err: any) {
    console.error('Error deleting listing:', err);
    return res.status(500).json({ error: 'Internal server error deleting listing.' });
  }
}

export async function fillListing(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found.' });
    }

    if (listing.ownerId !== userId && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied. You do not own this listing.' });
    }

    const updatedListing = await prisma.listing.update({
      where: { id },
      data: { isFilled: !listing.isFilled },
    });

    return res.json({
      ...updatedListing,
      photos: JSON.parse(updatedListing.photos),
    });
  } catch (err: any) {
    console.error('Error marking listing as filled:', err);
    return res.status(500).json({ error: 'Internal server error marking listing as filled.' });
  }
}

export async function browseListings(req: AuthenticatedRequest, res: Response) {
  try {
    const tenantId = req.user?.userId;
    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    const location = req.query.location as string;
    const budgetMin = req.query.budgetMin as string;
    const budgetMax = req.query.budgetMax as string;
    const roomType = req.query.roomType as string;
    const furnishing = req.query.furnishing as string;
    const sort = (req.query.sort as string) || 'compatibility';

    const profile = await prisma.tenantProfile.findUnique({ where: { userId: tenantId } });

    const whereClause: any = {
      isFilled: false,
    };

    if (location) {
      whereClause.location = {
        contains: location,
      };
    }

    const filterMin = budgetMin ? parseFloat(budgetMin) : undefined;
    const filterMax = budgetMax ? parseFloat(budgetMax) : undefined;

    if (filterMin !== undefined || filterMax !== undefined) {
      whereClause.rent = {};
      if (filterMin !== undefined && !isNaN(filterMin)) {
        whereClause.rent.gte = filterMin;
      }
      if (filterMax !== undefined && !isNaN(filterMax)) {
        whereClause.rent.lte = filterMax;
      }
    }

    if (roomType) {
      whereClause.roomType = roomType.toLowerCase().trim();
    }

    if (furnishing) {
      whereClause.furnishingStatus = furnishing.toLowerCase().trim();
    }

    const listings = await prisma.listing.findMany({
      where: whereClause,
      take: 50,
      include: {
        owner: {
          select: {
            name: true,
            email: true,
          },
        },
        scores: {
          where: { tenantId },
        },
        reviews: {
          select: { rating: true },
        },
      },
    });

    // ─── Concurrency-limited scoring ──────────────────────────────────────
    // Running all 50 LLM calls at once saturates memory & causes timeouts.
    // We process in batches of 5 to keep latency low without overloading.
    const CONCURRENCY = 5;
    const scoredListings: any[] = [];

    async function scoreOne(listing: typeof listings[0]) {
      let scoreObj = listing.scores[0];

      if (!profile) {
        return {
          ...listing,
          photos: JSON.parse(listing.photos),
          avgRating: (() => {
            const ratings = (listing as any).reviews?.map((r: any) => r.rating) || [];
            return ratings.length > 0
              ? Math.round((ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length) * 10) / 10
              : 0;
          })(),
          totalReviews: (listing as any).reviews?.length || 0,
          compatibility: {
            score: 0,
            explanation: 'Please set up your Tenant Profile to view compatibility scoring.',
            scoringMethod: 'FALLBACK',
          },
        };
      }

      if (!scoreObj || scoreObj.needsRescore) {
        try {
          const calculated = await computeScore(profile, {
            location: listing.location,
            rent: listing.rent,
            availableFrom: listing.availableFrom,
            roomType: listing.roomType,
            furnishingStatus: listing.furnishingStatus,
            description: listing.description,
          });
          scoreObj = await prisma.compatibilityScore.upsert({
            where: { tenantId_listingId: { tenantId, listingId: listing.id } },
            update: {
              score: calculated.score,
              explanation: calculated.explanation,
              scoringMethod: calculated.scoringMethod,
              needsRescore: false,
            },
            create: {
              tenantId,
              listingId: listing.id,
              score: calculated.score,
              explanation: calculated.explanation,
              scoringMethod: calculated.scoringMethod,
              needsRescore: false,
            },
          });
        } catch (scoreErr) {
          console.error(`Failed to compute compatibility score for listing ${listing.id}:`, scoreErr);
          scoreObj = {
            id: 'temp',
            tenantId,
            listingId: listing.id,
            score: 0,
            explanation: 'Failed to compute score. System fallback.',
            scoringMethod: 'FALLBACK',
            needsRescore: false,
            computedAt: new Date(),
          };
        }
      }

      return {
        ...listing,
        scores: undefined,
        reviews: undefined,
        photos: JSON.parse(listing.photos),
        avgRating: (() => {
          const ratings = (listing as any).reviews?.map((r: any) => r.rating) || [];
          return ratings.length > 0
            ? Math.round((ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length) * 10) / 10
            : 0;
        })(),
        totalReviews: (listing as any).reviews?.length || 0,
        compatibility: {
          score: scoreObj.score,
          explanation: scoreObj.explanation,
          scoringMethod: scoreObj.scoringMethod,
        },
      };
    }

    // Process in chunks of CONCURRENCY
    for (let i = 0; i < listings.length; i += CONCURRENCY) {
      const chunk = listings.slice(i, i + CONCURRENCY);
      const results = await Promise.all(chunk.map(scoreOne));
      scoredListings.push(...results);
    }

    scoredListings.sort((a, b) => {
      if (sort === 'price_asc') {
        return a.rent - b.rent;
      } else if (sort === 'price_desc') {
        return b.rent - a.rent;
      } else if (sort === 'date') {
        return b.createdAt.getTime() - a.createdAt.getTime();
      } else {
        const scoreDiff = b.compatibility.score - a.compatibility.score;
        if (scoreDiff !== 0) return scoreDiff;
        return b.createdAt.getTime() - a.createdAt.getTime();
      }
    });

    return res.json(scoredListings);
  } catch (err: any) {
    console.error('Error browsing listings:', err);
    return res.status(500).json({ error: 'Internal server error browsing listings.' });
  }
}
