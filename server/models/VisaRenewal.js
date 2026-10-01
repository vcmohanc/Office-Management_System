import mongoose from 'mongoose';

const visaRenewalSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  startDate: { type: Date },
  endDate: { type: Date, required: true },
  status: { type: String, required: true },
  appStatus: { type: String, required: true },
}, { timestamps: true });

export default mongoose.model('VisaRenewal', visaRenewalSchema);
