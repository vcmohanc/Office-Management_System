import os
with open('e:/OMS/client/src/components/account/PaymentEntry.jsx', 'r', encoding='utf-8') as f:
    d = f.read()

target = "new Date(r.originalCase.nextPaymentDate).toISOString().split('T')[0] === dateFilter"
replacement = "(r.originalCase.nextPaymentDate && new Date(r.originalCase.nextPaymentDate).toString() !== 'Invalid Date' && new Date(r.originalCase.nextPaymentDate).toISOString().split('T')[0] === dateFilter)"

d = d.replace(target, replacement)

with open('e:/OMS/client/src/components/account/PaymentEntry.jsx', 'w', encoding='utf-8') as f:
    f.write(d)
