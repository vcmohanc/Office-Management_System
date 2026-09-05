import mongoose from 'mongoose';

const expenseSetupSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['postal', 'travel'],
    unique: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
    default: {}
  }
}, { timestamps: true });

export default mongoose.model('ExpenseSetup', expenseSetupSchema);
