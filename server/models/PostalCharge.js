import mongoose from 'mongoose';

const PostalChargeSchema = new mongoose.Schema({
  departure: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Region',
    required: true,
    unique: true
  },
  charges: {
    type: Map,
    of: String
  }
}, {
  timestamps: true
});

export default mongoose.model('PostalCharge', PostalChargeSchema);
