import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema({
  department: { type: [String], required: true },
  location: { type: String, default: 'Tokyo Office' },
  joinDate: { type: Date, required: true },
  katakanaName: { type: String, required: true },
  romajiName: { type: String, required: true },
  nationality: { type: String, required: true },
  phone: { type: String },
  email: { type: String },
  photo: { type: String },
  dob: { type: Date, required: true },
  age: { type: Number, required: true },
  gender: { type: String, required: true },
  visaStatus: { type: String, required: true },
  joiningType: { type: String, required: true },
  visaStartDate: { type: Date, required: false },
  visaEndDate: { type: Date, required: false },
  visaRenewalDate: { type: Date, required: false },
  educationalQualifications: [{
    passingYear: String,
    qualification: String,
    institution: String
  }],
  workExperience: [{
    companyName: String,
    workPeriod: String,
    jobDescription: String
  }],
  personality: { type: String },
  languageFluency: {
    english: String,
    japanese: String,
    other: {
      name: String,
      level: String
    }
  },
  physicalAttributes: {
    height: Number,
    weight: Number,
    clothingSize: String,
    shoeSize: String
  },
  onboardingStatus: { type: String, default: 'Verification Pending' },
  assignedWorkPlace: { type: [String] },
  staffType: { type: String }
}, { timestamps: true });

export default mongoose.model('Employee', employeeSchema);
