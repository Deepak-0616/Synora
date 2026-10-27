import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { requireRoles } from '../middleware/rbac.js';
import * as complaintCtrl from '../controllers/complaintController.js';
import * as notesCtrl from '../controllers/notesController.js';
import * as rfiCtrl from '../controllers/rfiController.js';
import * as resolutionCtrl from '../controllers/resolutionController.js';
import * as escalationCtrl from '../controllers/escalationController.js';
import * as docCtrl from '../controllers/documentController.js';

const router = Router();

router.use(authenticateToken);

// Core Complaint Endpoints
router.post('/', complaintCtrl.createComplaint);
router.get('/', complaintCtrl.listComplaints);
router.get('/:id', complaintCtrl.getComplaint);
router.get('/:id/timeline', complaintCtrl.getTimeline);
router.post('/:id/transitions', complaintCtrl.transitionStatus);
router.post('/:id/assignments', requireRoles('bureau_admin', 'system_admin'), complaintCtrl.assignComplaint);

// Internal Notes (Staff Only)
router.post('/:id/internal-notes', requireRoles('officer', 'bureau_admin', 'system_admin'), notesCtrl.addNote);
router.get('/:id/internal-notes', requireRoles('officer', 'bureau_admin', 'system_admin', 'reviewer'), notesCtrl.getNotes);

// Information Requests (RFI)
router.post('/:id/rfis', requireRoles('officer', 'bureau_admin', 'system_admin'), rfiCtrl.createRFI);
router.get('/:id/rfis', rfiCtrl.getRFIs);
router.post('/:id/rfis/:rfiId/respond', rfiCtrl.respondRFI);

// Resolutions
router.post('/:id/resolutions', requireRoles('officer', 'bureau_admin', 'system_admin'), resolutionCtrl.proposeResolution);
router.get('/:id/resolutions', resolutionCtrl.getResolution);
router.post('/:id/resolutions/:resolutionId/approve', requireRoles('bureau_admin', 'system_admin'), resolutionCtrl.approveResolution);

// Escalations
router.post('/:id/escalations', requireRoles('officer', 'bureau_admin', 'system_admin'), escalationCtrl.escalateCase);
router.get('/:id/escalations', escalationCtrl.getEscalations);

// Documents
router.post('/:id/documents', docCtrl.uploadMiddleware.single('file'), docCtrl.uploadDocument);
router.get('/:id/documents', docCtrl.getDocuments);
router.get('/documents/:docId/download', docCtrl.downloadDocument);

export default router;
