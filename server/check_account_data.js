import mongoose from 'mongoose';
import Case from './models/Case.js';
import Claim from './models/Claim.js';

async function check() {
  await mongoose.connect('mongodb://localhost:27017/office_manage_system');
  const advancerCats = await Case.distinct('advancer_category');
  const paymentTypes = await Case.distinct('payment_process_type');
  const bearingParties = await Case.distinct('bearing_party');
  const statuses = await Case.distinct('status');
  console.log('Case advancer_category:', advancerCats);
  console.log('Case payment_process_type:', paymentTypes);
  console.log('Case bearing_party:', bearingParties);
  console.log('Case status:', statuses);
  process.exit(0);
}
check();
