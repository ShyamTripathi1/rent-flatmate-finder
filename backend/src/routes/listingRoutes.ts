import { Router } from 'express';
import {
  createListing,
  getListings,
  getListingById,
  updateListing,
  deleteListing,
  fillListing,
  browseListings
} from '../controllers/listingController';
import { upsertReview, getReviews } from '../controllers/reviewController';
import { authMiddleware } from '../middleware/authMiddleware';
import { roleMiddleware } from '../middleware/roleMiddleware';

const router = Router();

// Mounted at /
router.get('/listings', authMiddleware, getListings);
router.get('/listings/browse', authMiddleware, roleMiddleware(['TENANT']), browseListings);
router.get('/listings/:id', authMiddleware, getListingById);

router.post('/listings', authMiddleware, roleMiddleware(['OWNER']), createListing);
router.put('/listings/:id', authMiddleware, roleMiddleware(['OWNER', 'ADMIN']), updateListing);
router.delete('/listings/:id', authMiddleware, roleMiddleware(['OWNER', 'ADMIN']), deleteListing);
router.patch('/listings/:id/fill', authMiddleware, roleMiddleware(['OWNER', 'ADMIN']), fillListing);

// Review routes
router.get('/listings/:id/reviews', authMiddleware, getReviews);
router.post('/listings/:id/reviews', authMiddleware, roleMiddleware(['TENANT']), upsertReview);

export default router;
