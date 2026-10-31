import { Router } from 'express';
import { getMe, login, logout, register } from '../controllers/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validateMiddleware.js';
import { validateLoginInput, validateRegisterInput } from '../validators/authValidators.js';

const router = Router();

router.post('/register', validateBody(validateRegisterInput), register);
router.post('/login', validateBody(validateLoginInput), login);
router.post('/logout', logout);
router.get('/me', requireAuth, getMe);

export default router;
