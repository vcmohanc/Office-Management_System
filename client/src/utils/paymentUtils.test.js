import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isApprovedForPayment } from './paymentUtils.js';

describe('isApprovedForPayment', () => {
  it('rejects null, undefined, or deleted cases', () => {
    assert.equal(isApprovedForPayment(null), false);
    assert.equal(isApprovedForPayment(undefined), false);
    assert.equal(isApprovedForPayment({ status: 'APPROVED_FOR_PAYMENT', isDeleted: true }), false);
    assert.equal(isApprovedForPayment({ status: '' }), false);
    assert.equal(isApprovedForPayment({}), false);
  });

  it('rejects unapproved statuses', () => {
    const unapproved = [
      'Pending',
      'pending',
      '保留中',
      'Payment 保留中',
      'New',
      'new',
      'Registered',
      '新た',
      'REJECTED',
      'rejected',
      '拒否',
      '却下',
      'RETURNED_FOR_CORRECTION',
      '保留中 Correction',
      '修正依頼',
      'RESUBMITTED',
      'resubmitted',
      '再提出済み',
      'UnknownStatus'
    ];

    for (const status of unapproved) {
      assert.equal(
        isApprovedForPayment({ status }),
        false,
        `Expected status "${status}" to be rejected`
      );
    }
  });

  it('accepts approved payment statuses', () => {
    const approved = [
      'APPROVED_FOR_PAYMENT',
      'Approve for Payment',
      '承認済 for Payment',
      '支払承認',
      '支払承認済',
      '処理中',
      'Processing',
      'processing',
      '完了',
      'Completed',
      'completed',
      '期限切れ',
      'Overdue',
      'overdue'
    ];

    for (const status of approved) {
      assert.equal(
        isApprovedForPayment({ status }),
        true,
        `Expected status "${status}" to be approved`
      );
    }
  });
});
