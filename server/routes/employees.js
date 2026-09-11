import express from 'express';
import { z } from 'zod';
import Employee from '../models/Employee.js';
import { requireRole } from '../middleware/auth.js';

const router = express.Router();

const employeeSchemaZod = z.object({
  staffId: z.string().optional(),
  department: z.array(z.string()).min(1),
  location: z.string().optional(),
  joinDate: z.coerce.date(),
  katakanaName: z.string().min(1),
  romajiName: z.string().min(1),
  nationality: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().optional(),
  photo: z.string().optional(),
  dob: z.coerce.date(),
  age: z.number().min(0),
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
    height: z.number().optional(),
    weight: z.number().optional(),
    clothingSize: z.string().optional(),
    shoeSize: z.string().optional()
  }).optional(),
  onboardingStatus: z.string().optional(),
  assignedWorkPlace: z.array(z.string()).optional(),
  office: z.array(z.string()).optional(),
  staffType: z.string().optional(),
  workingDays: z.array(z.coerce.date()).optional(),
  visaAppStatus: z.string().optional(),
  visaExpiryHistory: z.array(z.coerce.date().optional().nullable().or(z.literal(''))).optional()
});


router.get('/', async (req, res) => {
  try {
    const employees = await Employee.find().sort({ createdAt: -1 });
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
    res.status(500).json({ message: 'Server error creating employee', error: error.message });
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
    res.status(500).json({ message: 'Server error updating employee' });
  }
});

export default router;
