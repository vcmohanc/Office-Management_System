import mongoose from 'mongoose';

const TravelChargeSchema = new mongoose.Schema({
  departure: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Region',
    required: true,
    unique: true
  },
  charges: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

export default mongoose.model('TravelCharge', TravelChargeSchema);
