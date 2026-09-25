import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../../utils/apiFetch.js';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';
import { toastConfirm } from '../../utils/toastConfirm.jsx';

import { Landmark, Users, Briefcase, ArrowRight, ArrowLeft, Building2, Building, AlertTriangle, Trash2, Download, Printer, Search, Calendar, ChevronDown, Filter } from 'lucide-react';

// Removed mockPaymentRecords
export default function PaymentEntry() {
  const { caseId, termNumber } = useParams();
  const navigate = useNavigate();
  const [selectedEntryType, setSelectedEntryType] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  // Settlement Form State
  const [selectedCaseToProcess, setSelectedCaseToProcess] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [deductions, setDeductions] = useState(0);
  const [destinationDetails, set目的地Details] = useState({});
  const [transactionRefId, setTransactionRefId] = useState('');
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [is送信ting, setIs送信ting] = useState(false);

  // Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [expenseTypeFilter, setExpenseTypeFilter] = useState('All');
  const [statusFilter, setステータスFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');

  const generateGlobalPDF = (action = 'download', currentFilteredRecords = []) => {
    setTimeout(() => {
      try {
        const recordsToエクスポート = selectedRows.length > 0
          ? currentFilteredRecords.filter(r => selectedRows.includes(r.rawId))
          : currentFilteredRecords;

        if (recordsToエクスポート.length === 0) return toast.error('いいえ records to export.');

        const doc = new jsPDF({ orientation: 'portrait' });
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
        const primaryColor = [22, 45, 80];   // #162D50 navy
        const accentColor  = [59, 130, 246]; // blue-500
        const lightBg      = [241, 245, 249]; // slate-100

        // ── HEADER BAND ──────────────────────────────────────────
        doc.setFillColor(...primaryColor);
        doc.rect(0, 0, pageWidth, 28, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(17);
        doc.setTextColor(255, 255, 255);
        doc.text('OFFICE MANAGEMENT SYSTEM', 14, 12);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(180, 200, 230);
        doc.text('Payment Tracking Report', 14, 20);

        // Right side: date + record count
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(200, 215, 240);
        const dateStr   = `Generated: ${new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })}`;
        const countStr  = `総レコード数: ${recordsToエクスポート.length}`;
        doc.text(dateStr,  pageWidth - 14 - doc.getTextWidth(dateStr),  11);
        doc.text(countStr, pageWidth - 14 - doc.getTextWidth(countStr), 20);

        // ── SUMMARY STATS BAR ────────────────────────────────────
        const total支払済    = recordsToエクスポート.filter(r => r.status === '支払済' || r.status === '完了').length;
        const total期限切れ = recordsToエクスポート.filter(r => r.status === '期限切れ').length;
        const totalAmt     = recordsToエクスポート.reduce((s, r) => s + (r.originalCase.finalTotal || r.originalCase.totalExpense || 0), 0);

        doc.setFillColor(...lightBg);
        doc.rect(0, 28, pageWidth, 14, 'F');
        doc.setDrawColor(220, 228, 240);
        doc.setLineWidth(0.3);
        doc.line(0, 42, pageWidth, 42);

        const stats = [
          { label: '総案件数', value: String(recordsToエクスポート.length) },
          { label: '支払済',        value: String(total支払済) },
          { label: '期限切れ',     value: String(total期限切れ) },
          { label: '合計金額',value: `JPY ${totalAmt.toLocaleString()}` },
        ];
        const colW = pageWidth / stats.length;
        stats.forEach((s, i) => {
          const cx = colW * i + colW / 2;
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10);
          doc.setTextColor(...primaryColor);
          doc.text(s.value, cx, 36, { align: 'center' });
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7);
          doc.setTextColor(100, 116, 139);
          doc.text(s.label, cx, 41, { align: 'center' });
        });

        // ── DATA TABLE ───────────────────────────────────────────
        const tableData = recordsToエクスポート.map(r => [
          r.id,
          r.name,
          r.staffId,
          r.workPlace,
          r.expenseType,
          `${r.startDate}\n${r.endDate}`,
          `${r.paidTerms} / ${r.totalTerms}`,
          `JPY ${r.remainingBalance.toLocaleString()}`,
          r.status
        ]);

        autoTable(doc, {
          startY: 46,
          margin: { left: 10, right: 10 },
          head: [['案件ID', 'Name', 'スタッフID', 'Work Place', '経費の種類', '期間', '進捗', '残り', 'ステータス']],
          body: tableData,
          theme: 'grid',
          styles: {
            font: 'helvetica',
            fontSize: 6.5,
            textColor: [30, 40, 55],
            lineColor: [210, 220, 235],
            lineWidth: 0.15,
            cellPadding: { top: 2, bottom: 2, left: 2, right: 2 },
            overflow: 'linebreak',
          },
          headStyles: {
            fillColor: primaryColor,
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 7,
            halign: 'center',
            cellPadding: { top: 3, bottom: 3, left: 2, right: 2 },
          },
          alternateRowStyles: { fillColor: [248, 250, 253] },
          columnStyles: {
            0: { fontStyle: 'bold', textColor: primaryColor, cellWidth: 'auto' },
            6: { halign: 'center' },
            7: { halign: 'right', fontStyle: 'bold' },
            8: { halign: 'center', fontStyle: 'bold' }
          },
          didParseCell: (hookData) => {
            if (hookData.section === 'body' && hookData.column.index === 8) {
              const val = hookData.cell.raw;
              if (val === '支払済' || val === '完了')      { hookData.cell.styles.textColor = [22, 163, 74];  hookData.cell.styles.fontStyle = 'bold'; }
              else if (val === '期限切れ')                      { hookData.cell.styles.textColor = [220, 38, 38];  hookData.cell.styles.fontStyle = 'bold'; }
              else if (val === 'Near Completion')              { hookData.cell.styles.textColor = [59, 130, 246]; hookData.cell.styles.fontStyle = 'bold'; }
            }
          },
          didDrawPage: () => {
            // Footer
            doc.setFillColor(...primaryColor);
            doc.rect(0, pageHeight - 10, pageWidth, 10, 'F');
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(7);
            doc.setTextColor(180, 200, 230);
            const pageStr = `Page ${doc.getNumberOfPages()}`;
            doc.text(pageStr, pageWidth / 2, pageHeight - 3.5, { align: 'center' });
            doc.text('Office Management System — Confidential', 12, pageHeight - 3.5);
          }
        });

        const saveBlob = (blob, filename) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url; a.download = filename;
          document.body.appendChild(a); a.click(); document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        };

        if (action === 'print') {
          doc.autoPrint();
          const blobUrl = doc.output('bloburl');
          const iframe = document.createElement('iframe');
          iframe.style.display = 'none';
          iframe.src = blobUrl;
          document.body.appendChild(iframe);
          iframe.onload = () => {
            setTimeout(() => {
              if (iframe.contentWindow) {
                iframe.contentWindow.print();
              }
            }, 100);
          };
        } else {
          saveBlob(doc.output('blob'), 'payment_tracking_export.pdf');
        }
      } catch (err) {
        console.error('Error generating PDF:', err);
        toast.error('Failed to generate PDF: ' + (err.message || 'Unknown error'));
      }
    }, 50);
  };

  useEffect(() => {
    if (selectedCaseToProcess) {
      const totalTerms = selectedCaseToProcess.installmentPlan ? (selectedCaseToProcess.installmentPlan.match(/\d+/) ? parseInt(selectedCaseToProcess.installmentPlan.match(/\d+/)[0], 10) : 1) : 1;
      const claim金額 = selectedCaseToProcess.nextPayment金額 || Math.round((selectedCaseToProcess.finalTotal || selectedCaseToProcess.totalExpense || 0) / totalTerms);
      const advanceToRecover = selectedCaseToProcess.previousBalance || 0;
      
      if (paymentMethod === 'Payroll Deduction') {
        // If it's a payroll deduction, the entire claim amount is a deduction
        setDeductions(claim金額);
      } else if (advanceToRecover > 0) {
        setDeductions(Math.round(advanceToRecover / totalTerms));
      } else {
        setDeductions(0);
      }
    }
  }, [selectedCaseToProcess, paymentMethod]);

  const handleForm送信 = async (e) => {
    e.preventDefault();
    if (!selectedCaseToProcess || !isConfirmed) return;

    setIs送信ting(true);
    const totalTerms = selectedCaseToProcess.installmentPlan ? (selectedCaseToProcess.installmentPlan.match(/\d+/) ? parseInt(selectedCaseToProcess.installmentPlan.match(/\d+/)[0], 10) : 1) : 1;
    const claim金額 = selectedCaseToProcess.nextPayment金額 || 
                        Math.round((selectedCaseToProcess.finalTotal || selectedCaseToProcess.totalExpense || 0) / totalTerms);
    
    const payload = {
      processedBy: 'AdminUser', // In a real app, this would be the logged in user
      payeeName: selectedCaseToProcess.staffName || selectedCaseToProcess.advancerName || 'N/A',
      paymentMethod,
      destinationDetails,
      financials: {
        claim金額,
        deductions,
        netPayable: claim金額 - deductions
      },
      transactionRefId,
      paymentDate: e.target[e.target.length - 3].value, // Getting date from form
      isConfirmed
    };

    try {
      const response = await apiFetch(`/api/cases/${selectedCaseToProcess._id}/settle`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        // Success
        toast.success('Settlement processed successfully!');
        
        // Update local cases list to reflect settled status and increment paid terms
        setCases(cases.map(c => {
          if (c._id === selectedCaseToProcess._id) {
            const new支払済Terms = (c.paidTerms || 0) + 1;
            const totalTerms = c.installmentPlan ? (c.installmentPlan.match(/\d+/) ? parseInt(c.installmentPlan.match(/\d+/)[0], 10) : 1) : 1;
            const newステータス = new支払済Terms >= totalTerms ? '完了' : '処理中';
            return { ...c, paidTerms: new支払済Terms, status: newステータス };
          }
          return c;
        }));
        
        // Reset form
        setSelectedCaseToProcess(null);
        setPaymentMethod('');
        setDeductions(0);
        set目的地Details({});
        setTransactionRefId('');
        setIsConfirmed(false);
      } else {
        const errorData = await response.json();
        toast.error(`Error: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error processing settlement:', error);
      toast.error('Network error while processing settlement');
    } finally {
      setIs送信ting(false);
    }
  };

  const handle削除Record = async (record) => {
    const confirmed = await toastConfirm(`Are you sure you want to delete ${record.id}?`);
    if (!confirmed) return;
    try {
      const endpoint = record.originalCase.advancerCategory === 'Staff' ? `/api/claims/${record.rawId}` : `/api/cases/${record.rawId}`;
      const response = await apiFetch(endpoint, { method: 'DELETE' });
      if (response.ok) {
        setCases(cases.filter(c => c._id !== record.rawId));
        toast.success('Record deleted successfully');
      } else {
        const err = await response.json();
        toast.error(`Error: ${err.message}`);
      }
    } catch (e) {
      toast.error('Network error during deletion');
    }
  };

  const handleDownloadPDF = async (record, action = 'download') => {
    try {
      // 1. Fetch ledger terms
      const ledgerRes = await apiFetch(`/api/cases/${record.rawId}/ledger`);
      const data = ledgerRes.ok ? await ledgerRes.json() : null;
      const terms = data?.payments || [];

      // 2. Auto-scale: estimate row count → pick a scale factor (0.7–1.0)
      const txCount     = Math.max(terms.length, 1);
      const totalRows   = 10 + 1 + 2 + txCount; // detail + summary + settle + tx
      // Scale factor: compact when many rows, comfortable when few
      const scale = totalRows <= 20 ? 1.0
                  : totalRows <= 28 ? 0.85
                  : 0.72;

      // 3. Derived sizes — all driven by scale
      const fs        = (base) => +(base * scale).toFixed(1);  // font size
      const pad       = (base) => +(base * scale).toFixed(1);  // cell padding
      const gap       = (base) => +(base * scale).toFixed(1);  // section gap
      const headerH   = Math.round(26 * scale);                // header band height
      const statusH   = Math.round(14 * scale);                // status bar height

      const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
      const pageWidth  = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const primaryColor = [22, 45, 80];
      const lightBg     = [241, 245, 249];
      const margin      = { left: 10, right: 10 };

      const drawFooter = () => {
        doc.setFillColor(...primaryColor);
        doc.rect(0, pageHeight - 8, pageWidth, 8, 'F');
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(fs(6.5));
        doc.setTextColor(180, 200, 230);
        doc.text('Office Management System — Confidential', 10, pageHeight - 2.8);
        const pg = `Page ${doc.getNumberOfPages()}`;
        doc.text(pg, pageWidth - 10 - doc.getTextWidth(pg), pageHeight - 2.8);
      };

      // ── HEADER BAND ───────────────────────────────────────────
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, pageWidth, headerH, 'F');
      doc.setFillColor(59, 130, 246);
      doc.rect(0, 0, 3.5, headerH, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(fs(13));
      doc.setTextColor(255, 255, 255);
      doc.text('OFFICE MANAGEMENT SYSTEM', 11, headerH * 0.42);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(fs(8));
      doc.setTextColor(180, 200, 230);
      const title = record.originalCase?.advancerCategory === 'Staff' ? 'Reimbursement Receipt' : 'Individual Payment Record';
      doc.text(title, 11, headerH * 0.78);

      doc.setFontSize(fs(7));
      doc.setTextColor(200, 215, 240);
      const dateStr = `Generated: ${new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })}`;
      doc.text(dateStr, pageWidth - 10 - doc.getTextWidth(dateStr), headerH * 0.42);
      const caseStr = `Case: ${record.id}`;
      doc.text(caseStr, pageWidth - 10 - doc.getTextWidth(caseStr), headerH * 0.78);

      // ── STATUS BAR ────────────────────────────────────────────
      const statusTop = headerH;
      doc.setFillColor(...lightBg);
      doc.rect(0, statusTop, pageWidth, statusH, 'F');
      doc.setDrawColor(210, 220, 235);
      doc.setLineWidth(0.25);
      doc.line(0, statusTop + statusH, pageWidth, statusTop + statusH);

      const statusColor = record.status === '支払済' || record.status === '完了'
        ? [22, 163, 74] : record.status === '期限切れ'
        ? [220, 38, 38] : [59, 130, 246];

      const statusMidY = statusTop + statusH * 0.62;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(fs(9.5));
      doc.setTextColor(...statusColor);
      doc.text(`ステータス: ${record.status}`, 11, statusMidY);

      const progressPct = record.totalTerms > 0
        ? Math.round((record.paidTerms / record.totalTerms) * 100) : 0;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(fs(7.5));
      doc.setTextColor(100, 116, 139);
      doc.text(
        `進捗: ${record.paidTerms}/${record.totalTerms} payments (${progressPct}%)`,
        pageWidth / 2, statusMidY, { align: 'center' }
      );
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(fs(8.5));
      doc.setTextColor(...primaryColor);
      const remStr = `残り: JPY ${record.remainingBalance.toLocaleString()}`;
      doc.text(remStr, pageWidth - 10 - doc.getTextWidth(remStr), statusMidY);

      // ── SHARED TABLE STYLES ───────────────────────────────────
      const cp = pad(2.8); // cell padding
      const sharedStyles = {
        font: 'helvetica',
        fontSize: fs(8),
        textColor: [30, 40, 55],
        lineColor: [210, 220, 235],
        lineWidth: 0.15,
        cellPadding: { top: cp, bottom: cp, left: cp + 1, right: cp + 1 },
        overflow: 'linebreak',
        minCellHeight: 0,
      };
      const headS = {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: fs(8),
        cellPadding: { top: cp, bottom: cp, left: cp + 1, right: cp + 1 },
      };
      const secGap = gap(5);   // gap before section title
      const titleGap = gap(3); // gap between title and table

      let curY = statusTop + statusH + gap(3);

      // ── CASE DETAIL TABLE ─────────────────────────────────────
      autoTable(doc, {
        startY: curY,
        margin,
        head: [['Field', 'Details']],
        body: [
          ['案件ID',          record.id],
          ['スタッフ名',       record.name],
          ['スタッフID',         record.staffId || '—'],
          ['Work Place',       record.workPlace],
          ['経費の種類',     record.expenseType],
          ['Payment 期間',   `${record.startDate} → ${record.endDate}`],
          ['Installment Plan', `${record.paidTerms} of ${record.totalTerms} payments completed`],
          ['残り Balance',`JPY ${record.remainingBalance.toLocaleString()}`],
          ['ステータス',           record.status],
          ['エクスポート 日付',      new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })],
        ],
        theme: 'grid',
        styles: sharedStyles,
        headStyles: headS,
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 46, fillColor: lightBg, textColor: [50, 70, 100] },
          1: { cellWidth: 'auto' },
        },
        didParseCell: (h) => {
          if (h.section === 'body' && h.row.index === 8) {
            h.cell.styles.textColor = statusColor;
            h.cell.styles.fontStyle = 'bold';
          }
        },
        didDrawPage: drawFooter,
      });

      // ── FINANCIAL & PROGRESS SUMMARY ──────────────────────────
      const baseClaimAmt = record.originalCase.finalTotal || record.originalCase.totalExpense || 0;
      const installPlanLabel = record.originalCase.installmentPlan || `${record.totalTerms} Month${record.totalTerms !== 1 ? 's' : ''}`;

      curY = doc.lastAutoTable.finalY + secGap;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(fs(8.5));
      doc.setTextColor(...primaryColor);
      doc.text('FINANCIAL & PROGRESS SUMMARY', 10, curY);

      autoTable(doc, {
        startY: curY + titleGap,
        margin,
        head: [['Base Claim 金額', 'ステータス', 'Installment Plan', 'Terms 支払済', '残り Balance']],
        body: [[
          `JPY ${baseClaimAmt.toLocaleString()}`,
          record.status,
          installPlanLabel,
          `${record.paidTerms} / ${record.totalTerms}`,
          `JPY ${record.remainingBalance.toLocaleString()}`,
        ]],
        theme: 'grid',
        styles: sharedStyles,
        headStyles: headS,
        alternateRowStyles: { fillColor: lightBg },
        didParseCell: (h) => {
          if (h.section === 'body' && h.column.index === 1) {
            h.cell.styles.textColor = statusColor;
            h.cell.styles.fontStyle = 'bold';
          }
          if (h.section === 'body' && h.column.index === 4) {
            h.cell.styles.fontStyle = 'bold';
            h.cell.styles.textColor = record.remainingBalance === 0 ? [22, 163, 74] : primaryColor;
          }
        },
        didDrawPage: drawFooter,
      });

      // ── SETTLEMENT DETAILS ────────────────────────────────────
      const settlementMethod = (terms.length > 0 ? terms[0].paymentMethod : null)
        || record.originalCase.settlement_method
        || record.originalCase.settlementMethod
        || 'N/A';
      const startMonth = record.originalCase.expense期間Start
        ? new Date(record.originalCase.expense期間Start).toLocaleDateString('en-GB', { year: 'numeric', month: '2-digit' })
        : record.startDate || 'N/A';

      curY = doc.lastAutoTable.finalY + secGap;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(fs(8.5));
      doc.setTextColor(...primaryColor);
      doc.text('SETTLEMENT DETAILS', 10, curY);

      autoTable(doc, {
        startY: curY + titleGap,
        margin,
        body: [
          ['Settlement Method:', settlementMethod],
          ['Start Month:', startMonth],
        ],
        theme: 'plain',
        styles: { ...sharedStyles, cellPadding: { top: cp - 0.5, bottom: cp - 0.5, left: cp + 1, right: cp + 1 } },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 46, textColor: [50, 70, 100] },
          1: { fontStyle: 'bold', textColor: [30, 40, 55] },
        },
        didDrawPage: drawFooter,
      });

        // Fetch actual settlements to get dynamic bank/transaction details
        const stlResponse = await apiFetch(`/api/settlements/case/${record.rawId}`);
        const settlements = stlResponse.ok ? await stlResponse.json() : [];
        // sort by date ascending
        settlements.sort((a, b) => new Date(a.paymentDate) - new Date(b.paymentDate));

        // ── TRANSACTION DETAILS ───────────────────────────────────
        const txRows = [];
        const totalTermsCount = Math.max(record.totalTerms || 1, terms.length);

        let pMethod = 'Bank Transfer';
        if (settlements && settlements.length > 0 && settlements[0].paymentMethod) {
          pMethod = settlements[0].paymentMethod;
        } else if (record.paymentMethod) {
          pMethod = record.paymentMethod;
        }

        let txHead = [];
        if (pMethod === 'Pay in Salary' || pMethod === 'Payroll Deduction') {
          txHead = ['Term', '日付', 'Net Payable', 'ステータス', 'Payroll 期間', 'Ref いいえ.'];
        } else if (pMethod === 'Company Check') {
          txHead = ['Term', '日付', 'Net Payable', 'ステータス', 'Check いいえ', 'Delivery', 'Ref いいえ.'];
        } else if (pMethod === 'Corporate Card') {
          txHead = ['Term', '日付', 'Net Payable', 'ステータス', 'Card Last 4', 'Cardholder Name', 'Ref いいえ.'];
        } else {
          txHead = ['Term', '日付', 'Net Payable', 'ステータス', 'Bank', 'Branch', 'Account', 'Ref いいえ.'];
        }

        for (let i = 0; i < totalTermsCount; i++) {
          const s = terms[i];
          const actualSettlement = settlements[i];
          const totalTerms = record.originalCase.installment_count || (record.originalCase.installmentPlan ? (record.originalCase.installmentPlan.match(/\d+/) ? parseInt(record.originalCase.installmentPlan.match(/\d+/)[0], 10) : 1) : 1);
          const fallbackAmt = Math.round((record.originalCase.finalTotal || record.originalCase.totalExpense || 0) / totalTerms);
          
          let amt = fallbackAmt;
          const totalAmt = (record.originalCase.finalTotal || record.originalCase.totalExpense || 0);
          
          if (actualSettlement?.financials?.netPayable) {
            // If the saved settlement accidentally saved the full amount for a multi-term plan (due to a previous bug), ignore it.
            if (totalTerms > 1 && actualSettlement.financials.netPayable >= totalAmt) {
              amt = s?.scheduled金額 ?? fallbackAmt;
            } else {
              amt = actualSettlement.financials.netPayable;
            }
          } else if (s?.scheduled金額) {
            amt = s.scheduled金額;
          }
          
          let txDate = '—';
          const dateSource = actualSettlement?.paymentDate || s?.paymentDate;
          if (dateSource) {
            const d = new Date(dateSource);
            if (!isNaN(d)) {
              txDate = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
            }
          }

          const status = actualSettlement || s?.status === 'PAID' ? '支払済' : '保留中';
          const dest = actualSettlement?.destinationDetails || s?.bankDetails || {};
          const refいいえ = actualSettlement?.transactionRefId || s?.transactionRef || '—';

          let txRow = [
            `Term ${i + 1}/${record.totalTerms || totalTermsCount}`,
            txDate,
            `JPY ${amt.toLocaleString()}`,
            status
          ];

          if (pMethod === 'Pay in Salary' || pMethod === 'Payroll Deduction') {
            txRow.push(dest.payroll期間 || '—', refいいえ);
          } else if (pMethod === 'Company Check') {
            txRow.push(dest.checkNumber || '—', dest.checkDelivery || '—', refいいえ);
          } else if (pMethod === 'Corporate Card') {
            txRow.push(dest.cardLast4 || '—', dest.cardholderName || '—', refいいえ);
          } else {
            txRow.push(dest.bankName || dest.bank_name || '—', dest.branchCode || dest.branch_code || '—', dest.accountNumber || dest.account_number || '—', refいいえ);
          }

          txRows.push(txRow);
        }

      if (txRows.length === 0) {
        txRows.push(txHead.map((_, i) => i === txHead.length - 1 ? 'いいえ transactions recorded' : '—'));
      }

      curY = doc.lastAutoTable.finalY + secGap;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(fs(8.5));
      doc.setTextColor(...primaryColor);
      doc.text('TRANSACTION DETAILS', 10, curY);

      autoTable(doc, {
        startY: curY + titleGap,
        margin,
        head: [txHead],
        body: txRows,
        theme: 'grid',
        styles: { ...sharedStyles, fontSize: fs(7.5) },
        headStyles: { ...headS, fontSize: fs(7.5) },
        alternateRowStyles: { fillColor: lightBg },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 20 },
          2: { halign: 'right', fontStyle: 'bold' },
          3: { halign: 'center', cellWidth: 18 },
        },
        didParseCell: (h) => {
          if (h.section === 'body' && h.column.index === 3) {
            h.cell.styles.textColor = h.cell.raw === '支払済' ? [22, 163, 74] : [220, 38, 38];
            h.cell.styles.fontStyle = 'bold';
          }
        },
        didDrawPage: drawFooter,
      });

      // Final footer on last page
      drawFooter();

      if (action === 'print') {
        doc.autoPrint();
        const blobUrl = doc.output('bloburl');
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = blobUrl;
        document.body.appendChild(iframe);
        iframe.onload = () => {
          setTimeout(() => {
            if (iframe.contentWindow) {
              iframe.contentWindow.print();
            }
          }, 100);
        };
      } else {
        const safeId = record.id ? record.id.replace(/#/g, '') : 'Record';
        doc.save(`${safeId}_Payment_Record.pdf`);
      }
    } catch (e) {
      console.error('Error generating PDF:', e);
      toast.error('Error generating PDF: ' + (e.message || 'Unknown error'));
    }
  };



  useEffect(() => {
    Promise.all([
      apiFetch('/api/cases').then(res => res.json()).catch(() => []),
      apiFetch('/api/claims').then(res => res.json()).catch(() => []),
      apiFetch('/api/employees').then(res => res.json()).catch(() => [])
    ]).then(([casesData, claimsData, employeesData]) => {
      // Map employees for quick lookup by staffId or name
      const employeeMap = {};
      employeesData.forEach(emp => {
        const workplace = (emp.department && emp.department.length > 0) ? emp.department.join(', ') : 'N/A';
        if (emp.staffId) employeeMap[emp.staffId.toLowerCase()] = workplace;
        if (emp.romajiName) employeeMap[emp.romajiName.toLowerCase()] = workplace;
        if (emp.katakanaName) employeeMap[emp.katakanaName.toLowerCase()] = workplace;
      });

      const getWorkPlace = (staffId, name) => {
        if (staffId && employeeMap[staffId.toLowerCase()]) return employeeMap[staffId.toLowerCase()];
        if (name && employeeMap[name.toLowerCase()]) return employeeMap[name.toLowerCase()];
        return 'N/A';
      };

      const mappedCases = casesData.map(c => ({
        ...c,
        advancerCategory: c.advancerCategory || 'Office',
        finalTotal: c.finalTotal || c.totalExpense || c.final_total_amount || 0,
        staffId: c.staffId || c.staff_id || 'N/A',
        staffName: c.staffName || c.staff_name || 'N/A',
        expenseType: c.expenseType || c.expense_type || 'N/A',
        workPlace: getWorkPlace(c.staffId || c.staff_id, c.staffName || c.staff_name)
      }));

      const mappedClaims = claimsData.map(c => ({
        ...c,
        advancerCategory: 'Staff',
        finalTotal: c.totalExpense金額 || c.total_expense_amount || 0,
        staffId: c.staffId || c.staff_id || 'N/A',
        staffName: c.fullName || c.full_name || 'N/A',
        expenseType: c.expenseType || c.expense_type || 'Claim',
        expense期間Start: c.expense期間Start || c.expense_period_start || c.createdAt,
        expense期間End: c.expense期間End || c.expense_period_end || c.createdAt,
        workPlace: getWorkPlace(c.staffId || c.staff_id, c.fullName || c.full_name)
      }));

      setCases([...mappedCases, ...mappedClaims]);
      setLoading(false);
    }).catch(err => {
      console.error('Error fetching data:', err);
      setLoading(false);
    });
  }, []);

  const paymentOptions = [
    {
      id: 'client',
      title: 'クライアント支払',
      description: '提供したサービスに対するクライアントからの入金を記録します。',
      icon: Users,
      color: 'bg-blue-100 text-blue-700',
      borderColor: 'border-blue-200 hover:border-blue-500',
      categoryMatch: 'Office' // Map to Office for now
    },
    {
      id: 'staff',
      title: 'スタッフ支払 / 仮払い',
      description: 'スタッフの給与、仮払い、または経費精算を処理します。',
      icon: Briefcase,
      color: 'bg-green-100 text-green-700',
      borderColor: 'border-green-200 hover:border-green-500',
      categoryMatch: 'Staff'
    },
    {
      id: 'vc_fund',
      title: 'VC資金振替',
      description: 'VC資金管理に関連する資金の振替と回収を記録します。',
      icon: Landmark,
      color: 'bg-purple-100 text-purple-700',
      borderColor: 'border-purple-200 hover:border-purple-500',
      categoryMatch: 'VC Fund' // Specific type mapping if available
    },
    {
      id: 'vendor',
      title: 'ベンダー / ホスト企業',
      description: '外部ベンダーまたはホスト企業への支払いを処理します。',
      icon: Building,
      color: 'bg-orange-100 text-orange-700',
      borderColor: 'border-orange-200 hover:border-orange-500',
      categoryMatch: 'Host Company'
    }
  ];

  if (caseId) {
    return <PaymentEntryForm caseId={caseId} termNumber={termNumber} navigate={navigate} />;
  }

  if (selectedEntryType) {
    const selectedOption = paymentOptions.find(opt => opt.id === selectedEntryType);
    const Icon = selectedOption.icon;
    
    // Filter cases by matching category
    // Assuming 'client' = 'Office', 'staff' = 'Staff', 'vendor' = 'Host Company'
    // This logic can be refined based on actual data
    const relatedCases = cases.filter(c => 
      c.advancerCategory === selectedOption.categoryMatch || 
      (!c.advancerCategory && selectedOption.categoryMatch === 'Office')
    );

    const mappedRecords = relatedCases.map(c => {
      const totalTerms = c.installment_count || (c.installmentPlan ? (c.installmentPlan.match(/\d+/) ? parseInt(c.installmentPlan.match(/\d+/)[0], 10) : 1) : 1);
      const paidTerms = c.paidTerms || 0;
      const nextPayment金額 = c.nextPayment金額 || (c.finalTotal || c.totalExpense || 0) / totalTerms;
      const remainingBalance = (c.finalTotal || c.totalExpense || 0) - (paidTerms * nextPayment金額);

      // ステータス mapping based on overdue logic
      let status = 'On Track';
      if (c.bouncedCount > 0) status = '期限切れ';
      else if (paidTerms === totalTerms) status = '支払済';
      else if (paidTerms >= totalTerms - 1 && totalTerms > 1) status = 'Near Completion';
      
      const startDate = c.expense期間Start ? new Date(c.expense期間Start).toLocaleDateString() : (c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'N/A');
      
      let lastInstallmentDate = 'N/A';
      if (c.installment_records && c.installment_records.length > 0) {
        lastInstallmentDate = new Date(c.installment_records[c.installment_records.length - 1].due_date).toLocaleDateString();
      } else if (c.expected_settlement_date) {
        lastInstallmentDate = new Date(c.expected_settlement_date).toLocaleDateString();
      } else {
        lastInstallmentDate = c.expense期間End ? new Date(c.expense期間End).toLocaleDateString() : (c.nextPaymentDate ? new Date(c.nextPaymentDate).toLocaleDateString() : 'N/A');
      }
      const endDate = lastInstallmentDate;

      return {
        id: `${c.advancerCategory === 'Staff' ? '#CLM-' : '#CAS-'}${c._id.slice(-6).toUpperCase()}`,
        rawId: c._id,
        staffId: c.staffId || 'N/A',
        name: c.staffName || c.advancerName || 'Unknown',
        startDate,
        endDate,
        workPlace: c.workPlace || 'N/A',
        paidTerms,
        totalTerms,
        nextPaymentDate: c.nextPaymentDate ? new Date(c.nextPaymentDate).toLocaleDateString() : 'TBD',
        nextPayment金額,
        bouncedCount: c.bouncedCount || 0,
        remainingBalance: Math.max(0, remainingBalance),
        status,
        expenseType: c.expenseType || 'N/A',
        originalCase: c
      };
    }).filter(r => r.paidTerms > 0);

    const filteredRecords = mappedRecords.filter(r => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        r.id.toLowerCase().includes(searchLower) || 
        r.staffId.toLowerCase().includes(searchLower) || 
        r.name.toLowerCase().includes(searchLower);
      
      const matchesExpense = expenseTypeFilter === 'All' || r.expenseType === expenseTypeFilter;
      const matchesステータス = statusFilter === 'All' || r.status === statusFilter;
      const matchesDate = !dateFilter || r.nextPaymentDate === new Date(dateFilter).toLocaleDateString() || new Date(r.originalCase.nextPaymentDate).toISOString().split('T')[0] === dateFilter;

      return matchesSearch && matchesExpense && matchesステータス && matchesDate;
    });
    
    const hasBouncedPayments = filteredRecords.some(r => r.bouncedCount > 0);

    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 pb-10">
        <button 
          onClick={() => {
            setSelectedEntryType(null);
            setSelectedCaseToProcess(null);
          }}
          className="flex items-center text-[#162D50] hover:underline font-medium mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Selection
        </button>

        {/* Modern Premium Header */}
        <div className="relative overflow-hidden bg-white border border-gray-200 rounded-2xl shadow-sm mb-8 group transition-all duration-300 hover:shadow-md">
          {/* Subtle background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-50 via-blue-50/20 to-transparent rounded-full blur-3xl opacity-70 pointer-events-none" />
          
          <div className="relative p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6">
            <div className={`flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center ${selectedOption.color} shadow-sm ring-4 ring-gray-50 transition-transform duration-500 group-hover:scale-105`}>
              <Icon className="w-8 h-8" strokeWidth={1.5} />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1.5">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                  {selectedOption.title} Entry
                </h2>
                <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 uppercase tracking-wider">
                  Module
                </span>
              </div>
              <p className="text-base text-gray-500 leading-relaxed max-w-2xl">
                {selectedOption.description}
              </p>
            </div>
          </div>
          
          {/* Bottom decorative accent line */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#162D50] to-blue-400 opacity-90" />
        </div>

        {/* Modern Payment Tracking Data Table */}
        <div className="bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200 bg-[#F8F9FA] flex justify-between items-center">
            <h3 className="text-lg font-bold text-[#162D50]">Installment / Payment Tracking</h3>
            <span className="text-sm text-gray-500">{filteredRecords.length} records found</span>
          </div>
          
          {/* アクション Toolbar */}
          <div className="px-6 py-3 border-b border-gray-200 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col md:flex-row gap-3 flex-1">
              {/* Search */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search by 案件ID, スタッフID, or Name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 w-full md:w-80"
                />
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2">
                <div className="relative flex items-center">
                  <div className="absolute left-3 pointer-events-none">
                    <Calendar className="w-4 h-4 text-gray-500" />
                  </div>
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="relative">
                  <select 
                    value={expenseTypeFilter}
                    onChange={(e) => setExpenseTypeFilter(e.target.value)}
                    className="appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                  >
                    <option value="All">All 経費の種類s</option>
                    <option value="Waiting Dormitory Fee">Waiting Dormitory Fee</option>
                    <option value="WIFI">WIFI</option>
                    <option value="Travel">Travel</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-500 absolute right-2.5 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                </div>

                <div className="relative">
                  <select 
                    value={statusFilter}
                    onChange={(e) => setステータスFilter(e.target.value)}
                    className="appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                  >
                    <option value="All">All ステータス</option>
                    <option value="支払済">支払済</option>
                    <option value="保留中">保留中</option>
                    <option value="期限切れ">期限切れ</option>
                    <option value="On Track">On Track</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-500 absolute right-2.5 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {selectedRows.length > 0 && (
                <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
                  {selectedRows.length} items selected
                </span>
              )}
              <button onClick={() => generateGlobalPDF('download', filteredRecords)} className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 bg-white transition-colors">
                <Download className="w-4 h-4" />
                エクスポート
              </button>
              <button onClick={() => generateGlobalPDF('print', filteredRecords)} className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 bg-white transition-colors">
                <Printer className="w-4 h-4" />
                Print
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 sticky top-0">
                <tr className="border-b border-gray-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-4 px-6 w-12">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 text-[#162D50] focus:ring-[#162D50]"
                      checked={selectedRows.length === filteredRecords.length && filteredRecords.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedRows(filteredRecords.map(r => r.rawId));
                        else setSelectedRows([]);
                      }}
                    />
                  </th>
                  <th className="py-4 px-6">案件ID</th>
                  <th className="py-4 px-6">スタッフID & Name</th>
                  <th className="py-4 px-6">Work Place</th>
                  <th className="py-4 px-6">経費の種類</th>
                  <th className="py-4 px-6">Payment 日付 (Start - End)</th>
                  <th className="py-4 px-6">進捗</th>
                  <th className="py-4 px-6">Next Payment / Total 支払済</th>
                  {hasBouncedPayments && <th className="py-4 px-6 text-center">Bounced</th>}
                  <th className="py-4 px-6 text-right">残り Balance</th>
                  <th className="py-4 px-6 text-center">ステータス</th>
                  <th className="py-4 px-6 text-right">アクション</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan="12" className="py-8 text-center text-gray-500">
                      いいえ records found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((record, index) => {
                    const isSelected = selectedRows.includes(record.rawId);
                    const is期限切れ = record.status === '期限切れ';
                    const isアクションRequired = record.status === 'アクション Required';
                    const isNearCompletion = record.status === 'Near Completion';
                    const isOnTrack = record.status === 'On Track';
                    
                    let rowBg = 'bg-white hover:bg-gray-50';
                    if (isSelected) rowBg = 'bg-blue-50/50 border-l-4 border-[#162D50]';
                    else if (is期限切れ) rowBg = 'bg-amber-50/50 hover:bg-amber-50';
                    else if (isアクションRequired) rowBg = 'bg-rose-50/50 hover:bg-rose-50';
                    else if (index % 2 !== 0) rowBg = 'bg-[#FAFAFA] hover:bg-gray-50';

                    const progressPct = record.totalTerms > 0 ? Math.round((record.paidTerms / record.totalTerms) * 100) : 0;
                    let progressColor = 'bg-green-500';
                    if (is期限切れ) progressColor = 'bg-amber-500';
                    if (isアクションRequired) progressColor = 'bg-rose-500';
                    if (isNearCompletion) progressColor = 'bg-blue-500';

                    let statusBadge = '';
                    if (isOnTrack) statusBadge = 'bg-green-100 text-green-700';
                    else if (is期限切れ) statusBadge = 'bg-amber-100 text-amber-700';
                    else if (isNearCompletion) statusBadge = 'bg-blue-100 text-blue-700';
                    else if (isアクションRequired) statusBadge = 'bg-rose-100 text-rose-700';
                    else if (record.status === '支払済' || record.status === '完了') statusBadge = 'bg-gray-100 text-gray-700';

                    return (
                      <tr key={record.rawId} className={`${rowBg} transition-colors ${isSelected ? 'border-l-4 border-l-[#162D50]' : 'border-l-4 border-l-transparent'}`}>
                        <td className="py-4 px-6">
                          <input 
                            type="checkbox" 
                            className="rounded border-gray-300 text-[#162D50] focus:ring-[#162D50]"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedRows([...selectedRows, record.rawId]);
                              else setSelectedRows(selectedRows.filter(id => id !== record.rawId));
                            }}
                          />
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-bold text-[#162D50]">{record.id}</div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-sm font-semibold text-gray-800">{record.staffId}</div>
                          <div className="text-xs text-gray-500 mt-1">{record.name}</div>
                        </td>
                        <td className="py-4 px-6 text-gray-700 font-medium">
                          {record.workPlace}
                        </td>
                        <td className="py-4 px-6 text-gray-700 font-medium">
                          {record.expenseType}
                        </td>
                      <td className="py-4 px-6">
                        <div className="text-sm text-gray-800 font-medium">{record.startDate}</div>
                        <div className="text-xs text-gray-500 flex items-center mt-1">
                          <ArrowRight className="w-3 h-3 text-gray-400 mr-1" />
                          {record.endDate}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-full bg-gray-200 rounded-full h-2 max-w-[100px]">
                            <div className={`${progressColor} h-2 rounded-full`} style={{ width: `${progressPct}%` }}></div>
                          </div>
                          <span className="text-xs text-gray-500 font-medium w-10 text-right">{record.paidTerms} / {record.totalTerms}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {record.status === '支払済' ? (
                          <>
                            <div className="font-medium text-green-600 font-bold">
                              ¥{(record.originalCase.finalTotal || record.originalCase.totalExpense || 0).toLocaleString()}
                            </div>
                            <div className="text-xs mt-0.5 text-green-500 font-bold uppercase tracking-wider">
                              Total 支払済
                            </div>
                          </>
                        ) : (
                          <>
                            <div className={`font-medium ${is期限切れ || isアクションRequired ? 'text-rose-600 font-bold' : 'text-gray-700'}`}>
                              ¥{Math.round(record.nextPayment金額).toLocaleString()}
                            </div>
                            <div className={`text-xs mt-0.5 ${is期限切れ || isアクションRequired ? 'text-rose-500' : 'text-gray-500'}`}>
                              {record.nextPaymentDate}
                            </div>
                          </>
                        )}
                      </td>
                      {hasBouncedPayments && (
                        <td className="py-4 px-6 text-center">
                          {record.bouncedCount === 0 ? (
                            <span className="text-gray-400">-</span>
                          ) : (
                            <div className="inline-flex items-center px-2 py-1 bg-red-50 border border-red-100 rounded-md text-red-600 text-xs font-bold">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              {record.bouncedCount} item(s)
                            </div>
                          )}
                        </td>
                      )}
                      <td className="py-4 px-6 text-right font-bold text-[#162D50]">
                        ¥{record.remainingBalance.toLocaleString()}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusBadge}`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        {record.status === '支払済' ? (
                          <div className="flex items-center justify-end space-x-2">
                            <button 
                              onClick={() => handleDownloadPDF(record)}
                              title="Download PDF Receipt"
                              className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDownloadPDF(record, 'print')}
                              title="Print Record"
                              className="p-1.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handle削除Record(record)}
                              title="削除 Record"
                              className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  );
                })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 space-y-6 pb-10">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-2xl font-bold text-[#162D50] mb-2">支払済 ステータス Selection</h2>
          <p className="text-gray-500 text-sm">Please select the type of paid status you want to process.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {paymentOptions.map((option) => {
          const Icon = option.icon;
          
          const relatedCount = cases.filter(c => 
            c.advancerCategory === option.categoryMatch || 
            (!c.advancerCategory && option.categoryMatch === 'Office')
          ).length;

          return (
            <div 
              key={option.id}
              onClick={() => setSelectedEntryType(option.id)}
              className={`bg-white rounded-xl border ${option.borderColor} p-6 cursor-pointer shadow-sm hover:shadow-md transition-all group flex flex-col relative`}
            >
              <div className="flex items-start justify-between mb-4 mt-2">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${option.color} group-hover:scale-110 transition-transform`}>
                  <Icon className="w-7 h-7" />
                </div>
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-[#162D50] transition-colors">
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                </div>
              </div>
              
              <h3 className="text-lg font-bold text-[#162D50] mb-2">{option.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                {option.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}



function PaymentEntryForm({ caseId, termNumber, navigate }) {
  const [caseData, setCaseData] = useState(null);
  const [ledgerData, setLedgerData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [paymentMethod, setPaymentMethod] = useState('');
  const [deductions, setDeductions] = useState(0);
  const [destinationDetails, set目的地Details] = useState({});
  const [transactionRefId, setTransactionRefId] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [is送信ting, setIs送信ting] = useState(false);
  const [has保存d, setHas保存d] = useState(false);
  const [pay残りBalance, setPay残りBalance] = useState(false);
  
  // Consent
  const [consentGiven, setConsentGiven] = useState(false);

  useEffect(() => {
    // Fetch case data
    Promise.all([
      apiFetch(`/api/cases`).then(res => res.json()).catch(() => []),
      apiFetch(`/api/cases/${caseId}/ledger`).then(res => res.json()).catch(() => null),
      apiFetch(`/api/claims`).then(res => res.json()).catch(() => [])
    ]).then(([casesObj, ledgerObj, claimsObj]) => {
      const actualCase = (casesObj && Array.isArray(casesObj) ? casesObj.find(c => c._id === caseId || c.case_id === caseId) : null) || 
                         (claimsObj && Array.isArray(claimsObj) ? claimsObj.find(c => c._id === caseId || c.claim_id === caseId) : null);
      setCaseData(actualCase);
      setLedgerData(ledgerObj);
      if (actualCase) {
        const method = actualCase.settlement_method || actualCase.settlementMethod || actualCase.collection_method || actualCase.collectionMethod || '';
        setPaymentMethod(method === 'Cash' ? 'Petty Cash' : method);
      }
      setLoading(false);
    });
  }, [caseId]);

  if (loading) return <div className="p-8 text-center">Loading payment details...</div>;
  if (!caseData) return <div className="p-8 text-center">Case not found.</div>;

  const totalTerms = caseData.installment_count || (caseData.installmentPlan ? (caseData.installmentPlan.match(/\d+/) ? parseInt(caseData.installmentPlan.match(/\d+/)[0], 10) : 1) : 1);
  const paidTerms = caseData.paidTerms || 0;
  
  // Calculate next payment amount
  let nextPayment金額 = caseData.nextPayment金額 || Math.round((caseData.finalTotal || caseData.totalExpense金額 || caseData.totalExpense || 0) / totalTerms);
  let termLabel = `Term ${Math.min(paidTerms + 1, totalTerms)} of ${totalTerms}`;
  
  if (ledgerData && ledgerData.payments) {
    const pendingTerms = ledgerData.payments.filter(p => p.status !== 'paid');
    if (pendingTerms.length > 0) {
      let termToPay = pendingTerms[0];
      if (termNumber) {
        const t = pendingTerms.find(p => p.termNumber === parseInt(termNumber));
        if (t) termToPay = t;
      }
      nextPayment金額 = termToPay.expected金額 || termToPay.netPayable || nextPayment金額;
      termLabel = `Term ${termToPay.termNumber} of ${totalTerms}`;
    }
  }

  let remainingBalance = caseData.finalTotal || caseData.totalExpense金額 || caseData.totalExpense || 0;
  if (ledgerData && ledgerData.payments) {
    const paid金額 = ledgerData.payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + (p.expected金額 || 0), 0);
    remainingBalance -= paid金額;
  }

  if (pay残りBalance) {
    nextPayment金額 = remainingBalance;
    termLabel = 'Full 残り Balance';
  }

  const handleForm送信 = async (e) => {
    e.preventDefault();
    if (!isConfirmed) return;
    if (paymentMethod === 'Payroll Deduction' && !consentGiven) {
      toast.error('Consent is required for Payroll Deduction (Labor Standards Act Art. 24).');
      return;
    }

    setIs送信ting(true);
    
    const payload = {
      processedBy: 'AdminUser',
      payeeName: caseData.staffName || caseData.advancerName || caseData.fullName || 'N/A',
      paymentMethod,
      destinationDetails,
      financials: {
        claim金額: nextPayment金額,
        deductions,
        netPayable: nextPayment金額 - deductions
      },
      transactionRefId,
      paymentDate,
      isConfirmed,
      consentGiven
    };

    try {
      const endpoint = (caseData.advancerCategory === 'Staff' || caseData.expenseType) ? `/api/claims/${caseId}/settle` : `/api/cases/${caseId}/settle`;
      const response = await apiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success('Settlement processed successfully!');
        setHas保存d(true);
        setTimeout(() => navigate('/payments/status'), 2000);
      } else {
        const errorData = await response.json();
        toast.error(`Error: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error processing settlement:', error);
      toast.error('Network error while processing settlement');
    } finally {
      setIs送信ting(false);
    }
  };

  const isPayrollDeduction = paymentMethod === 'Payroll Deduction' || paymentMethod === 'Pay in Salary';

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 pb-10 flex justify-center">
      <div className="w-full max-w-3xl mt-4">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center text-[#162D50] hover:underline font-medium mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Selection
        </button>

        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          <div className="bg-[#162D50] text-white px-8 py-6 flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold tracking-wide">Record Payment</h3>
              <p className="text-blue-100 text-sm mt-1">Case #{caseId.slice(-6).toUpperCase()} • {caseData.staffName || caseData.advancerName || caseData.fullName || 'Unknown Payee'}</p>
            </div>
            <div className="text-right">
              <span className="text-sm text-blue-200 uppercase font-semibold tracking-wider block mb-1">Term</span>
              <span className="font-bold">{termLabel}</span>
            </div>
          </div>

          <form className="p-8 space-y-6" on送信={(e) => { setIsConfirmed(true); handleForm送信(e); }}>
            
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">支払方法 <span className="text-red-500">*</span></label>
                <select 
                  value={paymentMethod} 
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-700 focus:ring-2 focus:ring-[#162D50] focus:border-[#162D50] outline-none"
                  required
                >
                  <option value="" disabled>Select Method</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Pay in Salary">Pay in Salary</option>
                  <option value="Petty Cash">Petty Cash</option>
                  <option value="Company Check">Company Check</option>
                  <option value="Corporate Card">Corporate Card</option>
                  <option value="Cash">Cash</option>
                  <option value="Payroll Deduction">Payroll Deduction</option>
                </select>
              </div>
              
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Payment 日付 <span className="text-red-500">*</span></label>
                <input 
                  type="date" 
                  required 
                  value={paymentDate} 
                  onChange={(e) => setPaymentDate(e.target.value)} 
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-700 focus:ring-2 focus:ring-[#162D50] focus:border-[#162D50] outline-none" 
                />
              </div>
            </div>

            {paymentMethod === 'Bank Transfer' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 bg-gray-50 p-5 rounded-lg border border-gray-100">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">Bank Name <span className="text-red-500">*</span></label>
                  <input type="text" onChange={(e) => set目的地Details({...destinationDetails, bankName: e.target.value})} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-[#162D50] focus:border-[#162D50] outline-none" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">Branch Code <span className="text-red-500">*</span></label>
                  <input type="text" onChange={(e) => set目的地Details({...destinationDetails, branchCode: e.target.value})} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-[#162D50] focus:border-[#162D50] outline-none" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">Account いいえ <span className="text-red-500">*</span></label>
                  <input type="text" onChange={(e) => set目的地Details({...destinationDetails, accountNumber: e.target.value})} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-[#162D50] focus:border-[#162D50] outline-none" required />
                </div>
              </div>
            )}

            {isPayrollDeduction && (
              <div className="space-y-4 bg-red-50 p-5 rounded-lg border border-red-100">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">Target Payroll 期間 <span className="text-red-500">*</span></label>
                  <input type="month" onChange={(e) => set目的地Details({...destinationDetails, payroll期間: e.target.value})} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-red-600 focus:border-red-600 outline-none" required />
                </div>
                <div className="flex items-start space-x-3 mt-2">
                  <input 
                    type="checkbox" 
                    id="consent" 
                    checked={consentGiven}
                    onChange={(e) => setConsentGiven(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-red-600 focus:ring-red-500 border-gray-300 rounded cursor-pointer" 
                    required
                  />
                  <label htmlFor="consent" className="text-xs font-semibold text-red-900 cursor-pointer">
                    I confirm that explicit consent has been obtained for this payroll deduction in compliance with Labor Standards Act Article 24.
                  </label>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-6">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Transaction Ref</label>
                <input 
                  type="text" 
                  value={transactionRefId} 
                  onChange={(e) => setTransactionRefId(e.target.value)} 
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-700 focus:ring-2 focus:ring-[#162D50] focus:border-[#162D50] outline-none" 
                  placeholder="Optional"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Less Deductions</label>
                <div className="relative">
                  <span className="absolute left-4 top-2.5 text-gray-500 font-medium">¥</span>
                  <input 
                    type="number" 
                    value={deductions} 
                    onChange={(e) => setDeductions(Number(e.target.value) || 0)} 
                    className="w-full pl-9 border border-gray-300 rounded-lg px-4 py-2.5 text-red-600 font-medium focus:ring-2 focus:ring-[#162D50] focus:border-[#162D50] outline-none" 
                  />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mt-6 flex flex-col sm:flex-row justify-between items-center">
              <div>
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Net Payable 金額</p>
                {remainingBalance > 0 && remainingBalance !== nextPayment金額 && (
                  <div className="flex items-center space-x-2 mt-2">
                    <input 
                      type="checkbox" 
                      id="pay残り" 
                      checked={pay残りBalance}
                      onChange={(e) => setPay残りBalance(e.target.checked)}
                      className="w-4 h-4 text-[#162D50] focus:ring-[#162D50] border-gray-300 rounded cursor-pointer" 
                    />
                    <label htmlFor="pay残り" className="text-xs font-semibold text-gray-700 cursor-pointer">
                      Pay Full 残り (¥{remainingBalance.toLocaleString()})
                    </label>
                  </div>
                )}
              </div>
              <div className="text-3xl font-bold text-[#162D50] mt-4 sm:mt-0">
                ¥{Math.max(0, nextPayment金額 - deductions).toLocaleString()}
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <button 
                type="button" 
                onClick={() => navigate(-1)}
                className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
              >
                キャンセル
              </button>
              <div className="relative">
                <button 
                  type="submit" 
                  disabled={is送信ting || !paymentMethod || (isPayrollDeduction && !consentGiven) || has保存d}
                  className="px-8 py-2.5 rounded-lg bg-[#162D50] text-white font-semibold hover:bg-[#0F1E36] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {is送信ting ? '処理中...' : 'Record Payment'}
                </button>
                {has保存d && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-green-100 text-green-700 border border-green-300 px-6 py-2 rounded-md text-sm font-bold shadow-sm">
                      SUCCESS
                    </div>
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
