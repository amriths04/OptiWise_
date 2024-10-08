import express from 'express';
import { getPrescriptionIds,getPrescriptionById,getPrescriptionDetails,addPrescription } from '../controllers/prescriptionController.js';
const router = express.Router();

router.get('/prescriptions/patient/:patient_id', getPrescriptionIds);
router.get('/prescriptions/prescription/:id', getPrescriptionById);
router.get('/prescription/:id', getPrescriptionDetails);
router.post('/prescriptions/add', addPrescription);

export default router;
