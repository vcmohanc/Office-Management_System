import express from 'express';
import { z } from 'zod';
import Employee from '../models/Employee.js';
import VisaRenewal from '../models/VisaRenewal.js';
import { requireRole } from '../middleware/auth.js';

const router = express.Router();

const employeeSchemaZod = z.object({
  staffId: z.string().optional(),
  department: z.array(z.string()).optional(),
  location: z.string().optional(),
  joinDate: z.coerce.date(),
  katakanaName: z.string().min(1),
  romajiName: z.string().min(1),
  nationality: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().optional(),
  photo: z.string().optional(),
  dob: z.coerce.date(),
  age: z.coerce.number().min(0),
  gender: z.string().min(1),
  visaStatus: z.string().min(1),
  joiningType: z.string().min(1),
  visaStartDate: z.coerce.date().optional().nullable().or(z.literal('')),
  visaEndDate: z.coerce.date().optional().nullable().or(z.literal('')),
  visaRenewalDate: z.coerce.date().optional().nullable().or(z.literal('')),
  educationalQualifications: z.array(z.object({
    passingYear: z.string().optional(),
    qualification: z.string().optional(),
    institution: z.string().optional()
  })).optional(),
  workExperience: z.array(z.object({
    companyName: z.string().optional(),
    workPeriod: z.string().optional(),
    jobDescription: z.string().optional()
  })).optional(),
  personality: z.string().optional(),
  languageFluency: z.object({
    english: z.string().optional(),
    japanese: z.string().optional(),
    other: z.object({
      name: z.string().optional(),
      level: z.string().optional()
    }).optional()
  }).optional(),
  physicalAttributes: z.object({
    height: z.union([z.coerce.number(), z.string().length(0)]).optional(),
    weight: z.union([z.coerce.number(), z.string().length(0)]).optional(),
    clothingSize: z.string().optional(),
    shoeSize: z.string().optional()
  }).optional(),
  onboardingStatus: z.string().optional(),
  assignedWorkPlace: z.array(z.string()).optional(),
  office: z.array(z.string()).optional(),
  staffType: z.string().optional(),
  workingDays: z.array(z.coerce.date()).optional(),
  visaAppStatus: z.string().optional(),
  visaExpiryHistory: z.array(z.coerce.date().optional().nullable().or(z.literal(''))).optional(),
  visaRenewalHistory: z.array(z.object({
    startDate: z.coerce.date().optional().nullable().or(z.literal('')),
    endDate: z.coerce.date().optional().nullable().or(z.literal('')),
    status: z.string().optional(),
    appStatus: z.string().optional(),
    updatedAt: z.coerce.date().optional().nullable().or(z.string()).or(z.literal(''))
  })).optional(),
  pledgeDocument: z.string().optional()
});


// Only authorized staff roles can view employees.
// Non-HR/Admin roles (account, support) receive sanitized listings without sensitive personal PII.
router.get('/', requireRole('admin', 'hr', 'account', 'support'), async (req, res) => {
  try {
    const isHrOrAdmin = req.user && (req.user.role === 'admin' || req.user.role === 'hr');
    const projection = isHrOrAdmin 
      ? {} 
      : { 
          dob: 0, 
          age: 0, 
          nationality: 0, 
          pledgeDocument: 0, 
          educationalQualifications: 0, 
          workExperience: 0, 
          personality: 0, 
          physicalAttributes: 0, 
          phone: 0, 
          email: 0 
        };

    const employees = await Employee.find({}, projection).sort({ createdAt: -1 });
    res.json(employees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ message: 'Server error fetching employees' });
  }
});

router.post('/', requireRole('admin', 'hr'), async (req, res) => {
  try {
    const validatedData = employeeSchemaZod.parse(req.body);
    const newEmployee = new Employee(validatedData);
    const savedEmployee = await newEmployee.save();
    res.status(201).json(savedEmployee);
  } catch (error) {
    console.error('Error creating employee:', error);
    if (error?.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation error', errors: error.issues || error.errors });
    }
    res.status(500).json({ message: 'Server error creating employee' });
  }
});

router.put('/:id', requireRole('admin', 'hr'), async (req, res) => {
  try {
    const validatedData = employeeSchemaZod.partial().parse(req.body);
    const updatedEmployee = await Employee.findByIdAndUpdate(
      req.params.id,
      validatedData,
      { new: true, runValidators: true }
    );
    if (!updatedEmployee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json(updatedEmployee);
  } catch (error) {
    console.error('Error updating employee:', error);
    if (error?.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation error', errors: error.issues || error.errors });
    }
    res.status(500).json({ message: 'Server error updating employee' });
  }
});

router.post('/:id/visa-renewals', requireRole('admin', 'hr'), async (req, res) => {
  try {
    const { startDate, endDate, status, appStatus } = req.body;
    
    // Create the separate VisaRenewal document
    const newRenewal = new VisaRenewal({
      employeeId: req.params.id,
      startDate: startDate || null,
      endDate,
      status,
      appStatus
    });
    const savedRenewal = await newRenewal.save();
    
    // Also optionally update the main Employee record for easy filtering
    await Employee.findByIdAndUpdate(req.params.id, {
      visaStartDate: startDate || null,
      visaEndDate: endDate,
      visaステータス: status,
      visaAppステータス: appStatus
    });

    res.status(201).json(savedRenewal);
  } catch (error) {
    console.error('Error saving visa renewal:', error);
    res.status(500).json({ message: 'Server error saving visa renewal' });
  }
});

export default router;
