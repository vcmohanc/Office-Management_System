import mongoose from 'mongoose';

const TravelChargeSchema = new mongoose.Schema({
  departure: {
    type: String,
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

export default mongoose.model('TravelCharge', TravelChargeSchema);
