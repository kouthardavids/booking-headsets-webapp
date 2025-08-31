import express from 'express';
import { 
    handleBooking, 
    handleReturnHeadset, 
    fetchRequests, 
    fetchRequestsLimit 
} from '../controllers/requestController.js';

const router = express.Router();

router.post('/book', handleBooking);
router.post('/return', handleReturnHeadset);
router.get('/all', fetchRequests);
router.get('/recent', fetchRequestsLimit);

export default router;