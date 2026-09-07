import mongoose from 'mongoose';

const RegionSchema = new mongoose.Schema({
  name1: {
    type: String,
    required: true
  },
  name2: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

export default mongoose.model('Region', RegionSchema);
