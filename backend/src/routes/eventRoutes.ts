import { Router } from 'express';
import {
  createEvent, getEvents, getEvent, updateEvent,
  deleteEvent, toggleSaveEvent, getCategories,
} from '../controllers/eventController';
import { protect, authorize } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

router.get('/categories', getCategories);
router.get('/', getEvents);
router.get('/:id', getEvent);

router.post('/', protect, authorize('organizer', 'admin'), upload.single('coverImage'), createEvent);
router.put('/:id', protect, upload.single('coverImage'), updateEvent);
router.delete('/:id', protect, deleteEvent);
router.post('/:id/save', protect, toggleSaveEvent);

export default router;
