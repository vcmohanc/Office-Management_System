import mongoose from 'mongoose';

const resignationSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  status: {
    type: String,
    enum: ['In Progress', '完了', 'キャンセル'],
    default: 'In Progress'
  },
  reasonType: {
    type: String,
    required: true
  },
  reasonDetail: String,
  submitDate: Date,
  resignationDate: Date,
  lastWorkingDate: Date,
  usePaidLeave: Boolean,
  
  // Fire info
  fireReason: String,
  fireNoticeDate: Date,
  payFireAllowance: Boolean,
  
  // Visa info
  visaNoticeDate: Date,
  returnDate: Date,
  departureDate: Date,
  
  // Clearance
  accountStopDate: Date,
  
  // Interview
  interviewEnabled: Boolean,
  interviewDate: String,
  interviewTime: String,
  interviewPerson: String,
  interviewType: String,
  interviewUrl: String,
  interviewMemo: String,
  
  // Settlement
  finalPayDate: Date,
  hasSeverance: Boolean,
  severanceAmount: Number,
  
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

export default mongoose.model('Resignation', resignationSchema);
