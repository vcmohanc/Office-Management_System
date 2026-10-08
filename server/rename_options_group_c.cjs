const mongoose = require('mongoose');
require('dotenv').config();
const optionSchema = new mongoose.Schema({ type: String, label: String, value: String }, { timestamps: true });
const Option = mongoose.model('Option', optionSchema);

async function renameOptions() {
  await mongoose.connect(process.env.MONGO_URI);
  await Option.updateOne({ type: 'ExpenseType', value: 'WIFI' }, { $set: { label: 'Wifi', value: 'Wifi' } });
  await Option.updateOne({ type: 'ExpenseType', value: 'Equipment/Supplies' }, { $set: { label: 'Equipment / Consumable Items', value: 'Equipment / Consumable Items' } });
  
  // also check bearing party / advancer category if 'Farme' needs to become 'Farm'
  await Option.updateMany({ value: 'Farme' }, { $set: { label: 'Farm', value: 'Farm' } });

  console.log("Renamed options for Group C in DB");
  process.exit(0);
}
renameOptions().catch(console.error);
