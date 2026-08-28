import mongoose from 'mongoose';

// ケースIDの自動採番用カウンタ（年ごとに連番） §1-1
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

export default mongoose.model('Counter', counterSchema);
