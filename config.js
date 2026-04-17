/* ═══════════════════════════════════════════════════════════════════════════
   Credit Canary — Board Pack V2  |  config.js
   Central data layer, RAG thresholds, and AI narrative system
   ═══════════════════════════════════════════════════════════════════════════

   DATA SCHEMA REFERENCE
   ─────────────────────
   BigQuery:
     api-service-prod.analytics_view_db.loan_ifrs9_snapshot
       Fields: active, settled, balance, arrears, ifrs9_stage, dpd_band,
               product_code, arrears_status, arrears_status_sort,
               active_book_balance, active_loans

     api-service-prod.analytics_view_db.view_intake_sercle
       Fields: loan_value, loan_int_rate, loan_term, loan_product, orig_year,
               orig_month_name, loan_type (New/Top Up), repeat_borrowers,
               repay_freq (W/M), origination_cohort, arrears_rate_pct,
               portfolio_default_rate_pct, settled_all_time

   PostgreSQL ({org_name} schema):
     appJourney_application: application_type, created_at, is_openbanking,
       is_payslip, is_bank_statement, loan_product_id
     appJourney_applicationevents: event, status, decision, auto_decline,
       updated_at, correct_decisions, total_decisions
     gmb.appRetool_casenotes: case notes & complaints

   PRODUCTS
   ─────────
   Member Loan        → product_code: ML   (view_intake: "Member Loan")
   Family Loan        → product_code: FL   (view_intake: "Family Credit")
   Consolidation Loan → product_code: CL   (view_intake: "Debt Consolidation")
   Salary Sacrifice   → product_code: SS   (view_intake: "Salary Sacrifice")
   ═══════════════════════════════════════════════════════════════════════════ */

'use strict';

/* ── 0. REPORTING PERIOD ─────────────────────────────────────────────────── */
const REPORT_PERIOD = {
  month:     'February 2026',
  monthShort:'Feb 2026',
  quarter:   'Q1 2026',
  yearEnd:   'December 2025',
  asAt:      '28 February 2026',
  preparedBy:'Finance & Risk Team',
  version:   '2.0',
};

/* ── 1. RAG THRESHOLDS ───────────────────────────────────────────────────── */
const RAG = {
  arrears30dpd:     { green: 3.5,   amber: 5.5  },   // % of book balance
  arrears90dpd:     { green: 1.5,   amber: 3.0  },
  netDefaultRate:   { green: 1.0,   amber: 2.0  },
  stage2Pct:        { green: 8.0,   amber: 14.0 },   // % of book in Stage 2
  stage3Pct:        { green: 2.0,   amber: 4.0  },
  approvalRate:     { green: 55,    amber: 40   },    // % (higher = green)
  autoDecisionRate: { green: 60,    amber: 45   },
  nim:              { green: 4.0,   amber: 3.0  },    // Net Interest Margin %
  capitalRatio:     { green: 12.0,  amber: 10.5 },    // CER %
  costToIncome:     { green: 55,    amber: 68   },    // % (lower = green)
  complaintRate:    { green: 0.2,   amber: 0.5  },    // per 1000 live accounts
  slaAdherence:     { green: 95,    amber: 88   },    // % within SLA
  tuCostPerApp:     { green: 4.50,  amber: 7.00 },    // £
  repeatBorrower:   { green: 40,    amber: 28   },    // % repeat (higher=good)
  obAdoptionRate:   { green: 65,    amber: 45   },    // % using open banking
};

/* Compute RAG status for a metric (higher-is-better by default) */
function ragStatus(metric, value, lowerIsBetter = false) {
  const t = RAG[metric];
  if (!t) return 'neutral';
  if (lowerIsBetter) {
    if (value <= t.green) return 'green';
    if (value <= t.amber) return 'amber';
    return 'red';
  } else {
    if (value >= t.green) return 'green';
    if (value >= t.amber) return 'amber';
    return 'red';
  }
}

/* ── 2. PRODUCT MASTER ───────────────────────────────────────────────────── */
const PRODUCTS = [
  { code: 'ML', label: 'Member Loan',        retoolKey: 'Member Loan',        color: '#0A0A0A' },
  { code: 'FL', label: 'Family Loan',        retoolKey: 'Family Credit',       color: '#B8911A' },
  { code: 'CL', label: 'Consolidation Loan', retoolKey: 'Debt Consolidation',  color: '#C0392B' },
  { code: 'SS', label: 'Salary Sacrifice',   retoolKey: 'Salary Sacrifice',    color: '#E5B821' },
];

const PRODUCT_COLORS = PRODUCTS.reduce((m, p) => { m[p.code] = p.color; return m; }, {});

/* ── 3. PAGE 1 — EXECUTIVE SUMMARY ──────────────────────────────────────── */
const DATA_P1 = {
  // ─ RAG Scorecard (12 headline KPIs) ─
  scorecard: [
    { label:'Total Loan Book',     value:'£14.2m',  delta:'+4.1%',  dir:'up',  rag:'green', note:'vs prior month' },
    { label:'Active Loans',        value:'3,847',   delta:'+2.8%',  dir:'up',  rag:'green', note:'live accounts' },
    { label:'Net New Lending',     value:'£1.04m',  delta:'+11.2%', dir:'up',  rag:'green', note:'disbursed Feb' },
    { label:'Arrears ≥30 DPD',     value:'4.2%',    delta:'+0.3pp', dir:'up',  rag:'amber', note:'of book balance' },
    { label:'Stage 2 & 3 Cover',   value:'88.2%',   delta:'-1.4pp', dir:'down',rag:'amber', note:'ECL coverage' },
    { label:'Net Interest Margin', value:'4.8%',    delta:'-0.2pp', dir:'down',rag:'green', note:'annualised' },
    { label:'Approval Rate',       value:'62.4%',   delta:'+1.8pp', dir:'up',  rag:'green', note:'of applications' },
    { label:'Auto-Decision Rate',  value:'58.3%',   delta:'+3.1pp', dir:'up',  rag:'amber', note:'auto approve/decline' },
    { label:'Capital Ratio (CER)', value:'13.1%',   delta:'+0.4pp', dir:'up',  rag:'green', note:'vs 8% regulatory min' },
    { label:'Cost-to-Income',      value:'61.4%',   delta:'+2.1pp', dir:'up',  rag:'amber', note:'excl. loan losses' },
    { label:'Repeat Borrowers',    value:'43.7%',   delta:'+1.2pp', dir:'up',  rag:'green', note:'of funded loans' },
    { label:'Complaint Rate',      value:'0.18',    delta:'-0.04',  dir:'down',rag:'green', note:'per 1,000 accounts' },
  ],

  // ─ P&L Summary (condensed, £000s) ─
  pl: {
    headers: ['Line', 'Budget £000', 'Actual £000', 'Variance £000', 'Var %'],
    rows: [
      ['Interest Income',         '  862', '  894', '  +32', '+3.7%',  'fav'],
      ['Interest Payable',        ' (184)', '(178)', '   +6', '+3.3%',  'fav'],
      ['Net Interest Income',     '  678', '  716', '  +38', '+5.6%',  'fav'],
      ['Fee & Other Income',      '   44', '   51', '   +7', '+15.9%', 'fav'],
      ['Total Operating Income',  '  722', '  767', '  +45', '+6.2%',  'fav'],
      ['Staff Costs',             ' (261)', '(274)', '  -13', '-5.0%', 'unfav'],
      ['IT & Systems',            '  (62)', ' (64)', '   -2', '-3.2%', 'unfav'],
      ['Other OpEx',              '  (44)', ' (47)', '   -3', '-6.8%', 'unfav'],
      ['Total Operating Costs',   ' (367)', '(385)', '  -18', '-4.9%', 'unfav'],
      ['Operating Profit',        '  355', '  382', '  +27', '+7.6%',  'fav'],
      ['ECL Charge',              '  (82)', ' (96)', '  -14', '-17.1%','unfav'],
      ['Profit Before Tax',       '  273', '  286', '  +13', '+4.8%',  'fav'],
    ],
    note: 'Month of February 2026. Budget set December 2025. ECL charge elevated vs budget; under review by CRO.',
  },

  // ─ 13-Month Book Trend ─
  bookTrend: {
    labels: ['Feb-25','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan-26','Feb-26'],
    balance:  [9.8,10.1,10.4,10.6,10.9,11.3,11.8,12.1,12.5,12.9,13.3,13.7,14.2],
    newLend:  [0.72,0.74,0.78,0.81,0.84,0.88,0.91,0.87,0.93,0.97,1.01,0.94,1.04],
    arrears30:[3.1,3.2,3.4,3.3,3.5,3.6,3.9,3.8,4.0,4.1,3.9,3.9,4.2],
  },

  // ─ Product Mix (book balance, £m) ─
  productMix: {
    labels: PRODUCTS.map(p => p.label),
    values: [7.8, 2.3, 3.1, 1.0],
    colors: PRODUCTS.map(p => p.color),
  },

  // ─ AI Narrative Prompt ─
  narrativePrompt: `You are a senior credit risk officer drafting the Executive Summary page for a Credit Union board pack. 
Tone: concise, professional, factual. Target audience: Board Directors, CFO, CRO.
Write 3 short paragraphs (max 90 words each):
1. Headline performance: book growth, NII, key wins
2. Key risks: arrears movement, ECL, any amber/red metrics
3. Outlook & management actions for next month

Data context:
- Total book: £14.2m (+4.1% MoM), active loans: 3,847
- Net new lending: £1.04m (Feb 2026), best month in 12
- Arrears ≥30DPD: 4.2% (amber, +0.3pp MoM) — Member Loan driving increase
- ECL charge: £96k vs £82k budget (unfav variance, Stage 2 migration noted)
- NIM: 4.8% (on target), Capital ratio: 13.1% (strong)
- Approval rate: 62.4%, Auto-decision: 58.3% (approaching amber threshold)
- Consumer Duty: no material breaches; 1 new complaint received`,
};

/* ── 4. PAGE 2 — CREDIT RISK ─────────────────────────────────────────────── */
const DATA_P2 = {
  // ─ IFRS 9 Stage Summary ─
  ifrs9Summary: {
    headers: ['Stage', 'Description', 'Loans', 'Balance £000', '% Book', 'ECL £000', 'Coverage %', 'MoM Δ'],
    rows: [
      ['Stage 1', 'Performing — 12-month ECL',      '3,441', '12,604', '88.8%', ' 84', '0.67%', '+£22k'],
      ['Stage 2', 'Underperforming — Lifetime ECL', '  312', ' 1,284', ' 9.0%', '187', '14.6%', '+£31k'],
      ['Stage 3', 'Credit-impaired — Lifetime ECL', '   94', '  312', '  2.2%', '198', '63.5%', '+£14k'],
      ['POCI',    'Purchased/Originated Credit-Imp','    0', '    0', '  0.0%', '  0',  'n/a',   '—'    ],
    ],
    totals: ['Total', '', '3,847', '14,200', '100%', '469', '3.30%', '+£67k'],
    note: 'Stage migration: 47 loans transferred S1→S2 this month; primary driver salary arrears (ML product).',
  },

  // ─ DPD Arrears Aging Bands ─
  dpdBands: {
    headers: ['DPD Band', 'Loans', 'Balance £000', '% Book', 'MoM Δ (£k)', 'YoY Δ (pp)'],
    rows: [
      ['Current (0 DPD)',   '3,441', '12,604', '88.8%', '+142',  '−1.2'],
      ['1–29 DPD',         '  168', '   518', '  3.6%', ' +22',  '+0.4'],
      ['30–59 DPD',        '   96', '   312', '  2.2%', ' +18',  '+0.3'],
      ['60–89 DPD',        '   52', '   176', '  1.2%', '  +8',  '+0.1'],
      ['90–119 DPD',       '   44', '   158', '  1.1%', '  +4',  '+0.2'],
      ['120–179 DPD',      '   28', '   112', '  0.8%', '  −2',  '−0.1'],
      ['≥180 DPD',         '   18', '   320', '  2.3%', '  +6',  '+0.1'],
    ],
    totals: ['Total', '3,847', '14,200', '100%', '+198', '—'],
  },

  // ─ DPD Chart data ─
  dpdChart: {
    labels:   ['Current','1–29','30–59','60–89','90–119','120–179','≥180'],
    balances: [12604, 518, 312, 176, 158, 112, 320],
    colors:   ['#1B7A3D','#4EA35A','#D97706','#B85E00','#C0392B','#8B2A2A','#5C1A1A'],
  },

  // ─ Arrears by Product ─
  arrearsProduct: {
    headers: ['Product', 'Book £000', 'Arrears ≥30 DPD £000', 'Arrears Rate', 'RAG', 'MoM Δ'],
    rows: [
      ['Member Loan',        '7,800', '428', '5.5%', 'amber', '+0.4pp'],
      ['Family Loan',        '2,300', ' 64', '2.8%', 'green', '+0.1pp'],
      ['Consolidation Loan', '3,100', '194', '6.3%', 'red',   '+0.5pp'],
      ['Salary Sacrifice',   '1,000', ' 18', '1.8%', 'green', '0.0pp' ],
    ],
    totals: ['Total', '14,200', '704', '4.2%', 'amber', '+0.3pp'],
  },

  // ─ ECL Movement Waterfall (£000) ─
  eclWaterfall: {
    labels:  ['Opening ECL','New Originations','Stage Migration S1→S2','Stage Migration S2→S3','Write-offs','Model Update','Closing ECL'],
    values:  [402, +28, +31, +19, -24, +13, 469],
    base:    [0,  402, 430, 461, 480, 456, 0],
    colors:  ['#0A0A0A','#1B7A3D','#D97706','#C0392B','#1B7A3D','#D97706','#0A0A0A'],
    isTotal: [true, false, false, false, false, false, true],
  },

  // ─ PD / LGD / EAD by Product ─
  pdLgdEad: {
    headers: ['Product', 'PD (%)', 'LGD (%)', 'EAD £000', 'EL £000', 'EL % Book'],
    rows: [
      ['Member Loan',        '5.2', '42', '7,956', '173', '2.22%'],
      ['Family Loan',        '3.1', '35', '2,346', ' 25', '1.09%'],
      ['Consolidation Loan', '7.8', '55', '3,162', '136', '4.38%'],
      ['Salary Sacrifice',   '1.8', '22', '1,020', '  4', '0.40%'],
    ],
    totals: ['Portfolio', '5.3', '43', '14,484', '338', '2.37%'],
    note: 'PD based on 24-month observed default rate. LGD from recovery analysis (2021–2025 cohorts). EAD = outstanding balance + undrawn commitments.',
  },

  // ─ Vintage Default Curves (% cumulative default by book-month) ─
  vintages: {
    labels: ['M3','M6','M9','M12','M18','M24','M30','M36'],
    series: [
      { label:'2022 Cohort', data:[0.1,0.3,0.6,1.0,1.7,2.4,2.9,3.2], color:'#D1D5DB' },
      { label:'2023 Cohort', data:[0.2,0.5,0.8,1.4,2.1,3.0,3.5,null], color:'#0A0A0A' },
      { label:'2024 Cohort', data:[0.3,0.6,1.1,1.8,2.9,null,null,null], color:'#E5B821' },
      { label:'2025 Cohort', data:[0.4,0.8,1.4,null,null,null,null,null], color:'#C0392B' },
    ],
  },

  // ─ Forbearance & Restructuring ─
  forbearance: {
    headers: ['Arrangement Type', 'Loans', 'Balance £000', '% Book', 'Avg DPD', 'Success Rate*'],
    rows: [
      ['Reduced Payment Plan', ' 62', '  218', '1.53%', '47', '71%'],
      ['Payment Holiday (≤3m)',  ' 28', '  104', '0.73%', '12', '88%'],
      ['Term Extension',        ' 19', '   84', '0.59%', '34', '65%'],
      ['Full Restructure',      '  8', '   42', '0.30%', '89', '52%'],
    ],
    totals: ['Total', '117', '448', '3.15%', '—', '73%'],
    note: '*Success rate = returned to performing (Stage 1) within 6 months of arrangement start.',
  },

  // ─ Write-off Log ─
  writeoffs: {
    headers: ['Month', 'Loans Written Off', 'Gross Value £000', 'Recoveries £000', 'Net Write-off £000'],
    rows: [
      ['Oct 2025', ' 4', '38', ' 6', '32'],
      ['Nov 2025', ' 6', '52', ' 9', '43'],
      ['Dec 2025', ' 8', '74', '12', '62'],
      ['Jan 2026', ' 5', '44', ' 8', '36'],
      ['Feb 2026', ' 6', '54', '10', '44'],
    ],
    ytd: ['YTD 2026', '11', '98', '18', '80'],
  },

  narrativePrompt: `You are a CRO preparing the Credit Risk board report section for a Credit Union. 
Professional tone, risk-focused, 3 paragraphs max 90 words each:
1. IFRS9 stage movements and ECL position — key drivers
2. Arrears trends by product — where is stress concentrated?
3. Mitigation actions, forbearance effectiveness, write-off outlook

Data:
- Stage 2: 9.0% of book (£1.28m), Stage 3: 2.2% (£312k)
- ECL opening £402k → closing £469k (+£67k), main driver S1→S2 migration
- 30+DPD: 4.2% book (+0.3pp MoM); Consolidation Loan worst at 6.3%
- 47 loans migrated S1→S2 this month (salary arrears, Member Loan)
- Forbearance: 117 arrangements, 3.15% book, 73% success rate
- Write-offs: £44k net (Feb), YTD £80k, recovery rate 18%`,
};

/* ── 5. PAGE 3 — ORIGINATION & UNDERWRITING ──────────────────────────────── */
const DATA_P3 = {
  // ─ Application Funnel ─
  funnel: {
    steps: [
      { label:'Applications Received',  value: 642, pct:'100%', color:'#0A0A0A' },
      { label:'Passed Initial Screen',  value: 589, pct:' 91.7%', color:'#2D2D2D' },
      { label:'Credit Search Completed',value: 543, pct:' 84.6%', color:'#4A4A4A' },
      { label:'Decisioned',             value: 521, pct:' 81.2%', color:'#8B6E10' },
      { label:'Approved',               value: 401, pct:' 62.5%', color:'#B8911A' },
      { label:'Funded (Disbursed)',      value: 367, pct:' 57.2%', color:'#E5B821' },
    ],
    note: 'Feb 2026. Fall-out between Approved and Funded includes withdrew/did not proceed (34 applications).',
  },

  // ─ Approval Rates by Product ─
  approvalByProduct: {
    headers: ['Product', 'Applications', 'Approved', 'Declined', 'Referred', 'Approval Rate', 'MoM Δ', 'RAG'],
    rows: [
      ['Member Loan',        '312', '198', '88', '26', '63.5%', '+1.2pp', 'green'],
      ['Family Loan',        ' 84', ' 57', '18', ' 9', '67.9%', '+0.4pp', 'green'],
      ['Consolidation Loan', '184', '102', '64', '18', '55.4%', '+2.1pp', 'amber'],
      ['Salary Sacrifice',   ' 62', ' 44', '10', ' 8', '71.0%', '+0.8pp', 'green'],
    ],
    totals: ['Total', '642', '401', '180', '61', '62.5%', '+1.2pp', 'green'],
  },

  // ─ Approval by Credit Score Band ─
  approvalByCreditBand: {
    headers: ['Score Band', 'Applications', 'Approved', 'Approval %', 'Avg Loan £', 'Avg Rate %', 'Default Rate*'],
    rows: [
      ['Excellent (750+)',  ' 98', ' 94', '95.9%', '£8,420', '9.9%',  '0.8%'],
      ['Good (700–749)',    '164', '147', '89.6%', '£6,180', '14.7%', '1.9%'],
      ['Fair (650–699)',    '188', '122', '64.9%', '£4,320', '19.4%', '3.8%'],
      ['Poor (600–649)',    '124', ' 32', '25.8%', '£2,640', '26.9%', '8.2%'],
      ['Very Poor (<600)', ' 68', '  6', ' 8.8%', '£1,880', '29.9%', '15.4%'],
    ],
    note: '*Default rate = 12-month observed default for loans originated in that band (2024 cohort).',
  },

  // ─ Approval Chart (products × score bands) ─
  approvalHeatmapData: {
    products: ['Member Loan', 'Family Loan', 'Consolidation', 'Salary Sacrifice'],
    bands:    ['Excellent','Good','Fair','Poor','Very Poor'],
    rates: [
      [97, 91, 68, 28, 10],   // Member Loan
      [96, 93, 71, 32,  8],   // Family Loan
      [94, 87, 58, 18,  6],   // Consolidation
      [98, 95, 82, 44, 14],   // Salary Sacrifice
    ],
  },

  // ─ Data Collection (Open Banking vs alternatives) ─
  dataCollection: {
    headers: ['Method', 'Applications', '% Share', 'Approval Rate', 'Default Rate*', 'Avg Processing Time'],
    rows: [
      ['Open Banking',         '402', '62.6%', '68.4%', '2.1%', '4.2 hrs'],
      ['Payslip Upload',       '148', '23.1%', '56.8%', '3.4%', '8.7 hrs'],
      ['Bank Statement Upload',' 80', '12.5%', '48.2%', '4.9%', '12.4 hrs'],
      ['Manual (branch)',      ' 12', ' 1.9%', '75.0%', '1.8%', '2.1 days'],
    ],
    note: '*12-month default rate for 2025 cohort by data collection method.',
    obRate: 62.6, // for RAG
  },

  // ─ Open Banking Trend ─
  obTrend: {
    labels: ['Aug-25','Sep','Oct','Nov','Dec','Jan-26','Feb-26'],
    obPct:  [48.2, 52.1, 55.4, 58.6, 60.1, 61.4, 62.6],
  },

  // ─ TransUnion Cost Breakdown ─
  tuBilling: {
    headers: ['Check Type', 'Volume', 'Unit Cost', 'Total £', '% of Total TU Spend'],
    rows: [
      ['CA Search (Hard)',          '521', '£1.80', '£  938', '28.4%'],
      ['QS Search (Soft)',          '642', '£0.60', '£  385', '11.7%'],
      ['Bank Account ID',           '402', '£1.20', '£  482', '14.6%'],
      ['Bank Account Premium',      '214', '£2.10', '£  449', '13.6%'],
      ['Validate (Current Addr)',   '521', '£0.45', '£  235', ' 7.1%'],
      ['Validate (Previous Addr)',  '280', '£0.45', '£  126', ' 3.8%'],
      ['Watchlist Screening',       '521', '£0.35', '£  182', ' 5.5%'],
      ['Deceased Check',            '521', '£0.20', '£  104', ' 3.2%'],
      ['Ownership Fraud Alert',     '312', '£0.90', '£  281', ' 8.5%'],
      ['Real-Time Fraud',           '187', '£0.55', '£  103', ' 3.1%'],
    ],
    total: { volume:'—', unitCost:'—', total:'£3,285', pct:'100%' },
    costPerApp: 5.12,  // for RAG
    note: 'Feb 2026. TU cost per completed application: £5.12 (amber threshold £7.00).',
  },

  // ─ Decision Quality ─
  decisionQuality: {
    headers: ['Decision Type', 'Count', 'Correct', 'Accuracy %', 'False Positive', 'False Negative', 'RAG'],
    rows: [
      ['Auto Approve',  '168', '161', '95.8%', ' 4 (2.4%)', ' 3 (1.8%)', 'green'],
      ['Auto Decline',  '214', '198', '92.5%', ' 9 (4.2%)', ' 7 (3.3%)', 'green'],
      ['Manual Approve','162', '156', '96.3%', ' 3 (1.9%)', ' 3 (1.9%)', 'green'],
      ['Manual Decline',' 39', ' 36', '92.3%', ' 2 (5.1%)', ' 1 (2.6%)', 'amber'],
      ['Referred',      ' 61', ' 54', '88.5%', ' 4 (6.6%)', ' 3 (4.9%)', 'amber'],
    ],
    autoDecisionRate: 58.3,
  },

  // ─ Time-to-Decision Trend ─
  ttdTrend: {
    labels: ['Aug-25','Sep','Oct','Nov','Dec','Jan-26','Feb-26'],
    auto:   [1.2, 1.1, 1.0, 0.9, 0.9, 0.8, 0.7],   // hours
    manual: [18.4,17.2,16.8,15.4,14.2,13.6,12.8],
  },

  narrativePrompt: `You are a Head of Underwriting drafting the Origination & Underwriting section of a Credit Union board pack.
3 paragraphs, professional tone, max 90 words each:
1. Volume and funnel conversion — key trends vs prior month
2. Data collection quality — Open Banking adoption progress, impact on approval rates and default rates
3. Decision quality and automation — auto-decision accuracy, time-to-decision improvement

Data:
- 642 applications, 367 funded (57.2% end-to-end conversion)
- Approval rate: 62.5% (+1.2pp MoM) — Consolidation Loan lowest at 55.4%
- Open Banking: 62.6% of applications (+1.2pp), OB approval rate 68.4% vs 48.2% bank statement
- Auto-decision: 58.3% (+3.1pp MoM), accuracy 93.4% blended
- Manual TTD: 12.8 hours (improved from 18.4h in Aug-25)
- TU cost per app: £5.12 (amber threshold £7.00)`,
};

/* ── 6. PAGE 4 — PORTFOLIO COMPOSITION ───────────────────────────────────── */
const DATA_P4 = {
  // ─ Book Stratification by Product ─
  productStratification: {
    headers: ['Product', 'Loans', 'Balance £000', '% Book', 'Avg Balance £', 'Avg Rate %', 'Avg Term (mths)', 'Avg LTV'],
    rows: [
      ['Member Loan',        '2,080', '7,800', '54.9%', '£3,750', '18.4%', '36', 'n/a'],
      ['Family Loan',        '  614', '2,300', '16.2%', '£3,746', '14.9%', '30', 'n/a'],
      ['Consolidation Loan', '  880', '3,100', '21.8%', '£3,523', '22.8%', '48', 'n/a'],
      ['Salary Sacrifice',   '  273', '1,000', ' 7.0%', '£3,663', ' 6.9%', '24', 'n/a'],
    ],
    totals: ['Portfolio', '3,847', '14,200', '100%', '£3,691', '18.6%', '37', '—'],
  },

  // ─ Loan Value Band Distribution ─
  valueBands: {
    labels:    ['£0–499','£500–999','£1k–2.5k','£2.5k–5k','£5k–10k','£10k–15k','£15k–20k','£20k–25k'],
    loans:     [  142,     384,       812,       1104,       924,       348,        112,         21],
    balancePct:[ 0.5,      2.7,       9.8,       22.8,       36.2,      21.4,        5.8,        0.8],
  },

  // ─ Loan Term Band Distribution ─
  termBands: {
    labels:    ['≤12m','13–24m','25–36m','37–48m','49–60m','61–72m','72m+'],
    loans:     [ 312,    624,    1148,     882,     584,     224,      73],
    balancePct:[ 2.8,    8.4,    27.1,    24.6,    22.4,    11.4,     3.3],
  },

  // ─ Interest Rate Band Distribution ─
  rateBands: {
    labels:    ['<5%','5–9.9%','10–14.9%','15–19.9%','20–24.9%','25–29.9%','≥30%'],
    loans:     [ 273,    0,      614,        882,        1104,        724,       250],
    balancePct:[ 7.0,   0,       8.4,        18.4,        28.1,        26.4,      11.7],
    labelsClean: ['<5%','5–9.9%','10–14.9%','15–19.9%','20–24.9%','25–29.9%','≥30%'],
    loansClean:  [273,    0,      614,        882,        1104,        724,       250],
  },

  // ─ Term × Product Heatmap Data ─
  termProductHeatmap: {
    terms:    ['≤12m','13–24m','25–36m','37–48m','49–60m','61–72m'],
    products: ['Member Loan','Family Loan','Consolidation','Salary Sacrifice'],
    // count of loans
    data: [
      [182, 112,  18,  0],   // ≤12m
      [284, 162, 124, 54],   // 13–24m
      [712, 184, 202, 50],   // 25–36m
      [512, 124, 224, 22],   // 37–48m
      [284,  32, 248, 20],   // 49–60m
      [106,   0, 104,  14],  // 61–72m
    ],
  },

  // ─ Concentration Risk ─
  concentration: {
    headers: ['Metric', 'Value', 'Limit', 'Utilisation', 'RAG'],
    rows: [
      ['Single Member Max Exposure',          '£24,800',  '£25,000',  '99.2%', 'amber'],
      ['Top 10 Members (% Book)',             '  3.4%',   '  5.0%',   '68.0%', 'green'],
      ['Top 50 Members (% Book)',             ' 12.8%',   ' 15.0%',   '85.3%', 'amber'],
      ['Salary Sacrifice (% Book)',           '  7.0%',   ' 10.0%',   '70.0%', 'green'],
      ['Consolidation Loan (% Book)',         ' 21.8%',   ' 25.0%',   '87.2%', 'amber'],
      ['Loans > £15k (% Count)',              '  3.5%',   '  5.0%',   '70.0%', 'green'],
    ],
  },

  // ─ Repeat Borrower Analysis ─
  repeatBorrowers: {
    headers: ['Product', 'New Loans', 'Top-Up Loans', 'Repeat Loans', 'Repeat %', 'Avg Top-Up £', 'MoM Δ'],
    rows: [
      ['Member Loan',        '104', ' 48', ' 46', '45.2%', '£2,180', '+1.1pp'],
      ['Family Loan',        ' 32', ' 12', ' 13', '46.4%', '£1,840', '+0.8pp'],
      ['Consolidation Loan', ' 54', '  8', ' 40', '44.4%', '£3,420', '+1.8pp'],
      ['Salary Sacrifice',   ' 24', '  8', ' 12', '45.5%', '£1,240', '+0.4pp'],
    ],
    totals: ['Total', '214', '76', '111', '45.5%', '£2,412', '+1.1pp'],
    note: 'Repeat Loans = second or subsequent loan to same member. Top-Up = additional draw on existing facility.',
  },

  narrativePrompt: `You are a portfolio analyst preparing the Portfolio Composition section for a Credit Union board pack.
3 paragraphs, max 90 words each:
1. Book composition and concentration — any emerging concentrations vs policy limits
2. Term and value distribution — profile vs prior month and risk appetite
3. Repeat borrower trends — member loyalty signal and top-up activity

Data:
- Book £14.2m: ML 54.9%, CL 21.8%, FL 16.2%, SS 7.0%
- Concentration: Consolidation Loan at 21.8% vs 25% limit (87% utilisation — amber)
- Top single exposure: £24.8k vs £25k limit (99.2% — amber flag)
- 37m weighted avg term; majority (49%) in 25–48m bands
- Repeat borrower rate: 45.5% overall (all products above 40% green threshold)
- Top-up events: 76 this month, avg additional draw £2,412`,
};

/* ── 7. PAGE 5 — INCOME & CAPITAL ────────────────────────────────────────── */
const DATA_P5 = {
  // ─ NIM Waterfall (£000, annualised rate) ─
  nimWaterfall: {
    labels:  ['Gross Interest\nIncome','Funding Cost','Fee Income','Net Interest\nIncome','ECL Charge','Risk-Adj NII'],
    values:  [894, -178, 51, 767, -96, 671],
    annRate: [7.58, -1.51, 0.43, 6.50, -0.81, 5.69],  // % of avg book
    colors:  ['#0A0A0A','#C0392B','#1B7A3D','#E5B821','#B8911A','#6B7280'],
    isNeg:   [false, true, false, false, true, false],
  },

  // ─ Interest Rate by Product ─
  rateByProduct: {
    headers: ['Product', 'Avg Rate %', 'Min Rate %', 'Max Rate %', 'Cost of Funds %', 'Net Spread %', 'Risk-Adj Spread %'],
    rows: [
      ['Member Loan',        '18.4', '9.9', '29.9', '1.51', '16.9', '14.7'],
      ['Family Loan',        '14.9', '9.9', '24.9', '1.51', '13.4', '12.1'],
      ['Consolidation Loan', '22.8', '14.9','29.9', '1.51', '21.3', '17.0'],
      ['Salary Sacrifice',   ' 6.9', '4.9', ' 9.9', '1.51', ' 5.4', ' 4.8'],
    ],
    portfolio: ['Portfolio Blended', '18.6', '4.9', '29.9', '1.51', '17.1', '14.7'],
    note: 'Risk-Adjusted Spread = Net Spread minus annualised ECL rate. Cost of Funds = blended cost of member deposits and subordinated debt.',
  },

  // ─ Cost-of-Funds Breakdown ─
  costOfFunds: {
    headers: ['Funding Source', 'Balance £000', '% Mix', 'Rate %', 'Cost £000 pa'],
    rows: [
      ['Member Share Accounts',    '8,420', '59.3%', '1.25%', '105'],
      ['Member Notice Accounts',   '3,180', '22.4%', '2.10%', ' 67'],
      ['Subordinated Debt (CDFI)', '1,800', '12.7%', '3.50%', ' 63'],
      ['Other Borrowings',         '  780', ' 5.5%', '4.20%', ' 33'],
    ],
    total: ['Total Funding', '14,180', '100%', '1.89%', '268'],
    note: 'Annualised cost of funds. CDFI facility rate stepped to 3.50% from April 2026 (currently 3.0%).',
  },

  // ─ NIM Trend ─
  nimTrend: {
    labels: ['Feb-25','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan-26','Feb-26'],
    grossYield:  [7.8,7.8,7.7,7.6,7.7,7.8,7.7,7.6,7.5,7.6,7.7,7.6,7.58],
    costFunds:   [1.4,1.4,1.5,1.5,1.6,1.6,1.6,1.5,1.5,1.5,1.5,1.5,1.51],
    nim:         [6.4,6.4,6.2,6.1,6.1,6.2,6.1,6.1,6.0,6.1,6.2,6.1,6.07],
    riskAdjNim:  [5.5,5.6,5.4,5.2,5.1,5.3,5.1,5.0,4.9,5.0,5.1,5.2,5.69],
  },

  // ─ Capital Adequacy ─
  capital: {
    headers: ['Capital Measure', 'Amount £000', 'Risk-Weighted Asset £000', 'Ratio', 'Min Requirement', 'Headroom', 'RAG'],
    rows: [
      ['CET1 Capital',           '1,862', '14,208', '13.1%', ' 4.5%', '8.6pp', 'green'],
      ['Tier 1 Capital',         '1,862', '14,208', '13.1%', ' 6.0%', '7.1pp', 'green'],
      ['Total Capital (CER)',    '1,862', '14,208', '13.1%', ' 8.0%', '5.1pp', 'green'],
      ['Leverage Ratio',         '1,862', '16,420', '11.3%', ' 3.0%', '8.3pp', 'green'],
      ['Liquidity Coverage (LCR)','—',    '—',     '142%',  '100%', '+42pp', 'green'],
    ],
    note: 'RWA calculated under standardised approach. Credit risk RWA: £11.2m; Operational risk: £3.0m. Capital surplus of £737k above 8% minimum.',
    rwaTrend: {
      labels: ['Aug-25','Sep','Oct','Nov','Dec','Jan-26','Feb-26'],
      rwa:    [12.4, 12.8, 13.1, 13.4, 13.8, 14.0, 14.2],
      ratio:  [14.2, 13.9, 13.6, 13.4, 13.2, 13.1, 13.1],
    },
  },

  // ─ Cost-to-Income Trend ─
  ctiTrend: {
    labels: ['Aug-25','Sep','Oct','Nov','Dec','Jan-26','Feb-26'],
    cti:    [58.4, 59.1, 60.2, 61.8, 60.4, 59.8, 61.4],
    budget: [58.0, 58.5, 59.0, 59.5, 60.0, 59.5, 59.5],
  },

  narrativePrompt: `You are a CFO preparing the Income & Capital section for a Credit Union board pack.
3 paragraphs, max 90 words each:
1. Net interest margin and income performance — key drivers vs budget
2. Capital adequacy — headroom, RWA trajectory, any regulatory concerns
3. Cost-to-income — current position, key cost pressures, outlook

Data:
- Gross interest income: £894k (vs £862k budget, +3.7% favourable)
- NIM: 4.8% annualised gross; Risk-adjusted NII: £671k
- Capital ratio: 13.1% (well above 8% minimum, surplus £737k)
- RWA growing with book: £14.2m (+1.4% MoM), ratio stable
- Cost-to-income: 61.4% (amber threshold 68%, budget 59.5%)
- CDFI facility rate stepping to 3.50% April 2026 (currently 3.0%) — 11bp NIM headwind`,
};

/* ── 8. PAGE 6 — OPERATIONS & COMPLIANCE ─────────────────────────────────── */
const DATA_P6 = {
  // ─ Consumer Duty Outcomes ─
  consumerDuty: {
    headers: ['Outcome Area', 'KPI', 'Target', 'Actual', 'Status', 'Evidence / Actions'],
    rows: [
      ['Products & Services', 'Product review completion', '100% annual', '100%', 'green', 'All 4 products reviewed Q4 2025. SS product added Jan 2026.'],
      ['Price & Value',       'Fair value assessment',    'Quarterly',   'Q4 complete', 'green', 'Value assessments submitted to board. No poor-value findings.'],
      ['Consumer Understanding','TCF acknowledgement rate','≥95%',       '97.3%', 'green', 'Pre-contract info confirmed by member. Digital + branch.'],
      ['Consumer Support',   'Avg resolution time (days)','≤5 days',     '4.2 days', 'green', '94% resolved within 5 days. 2 escalations this month.'],
      ['Vulnerable Customers','Identified & recorded %', '≥80% of all', '73.4%', 'amber', 'Below target. Training refresh scheduled March 2026.'],
      ['Outcomes Monitoring', 'Board MI completed',      'Monthly',     'Yes', 'green', 'This pack constitutes monthly Outcome Monitoring submission.'],
    ],
  },

  // ─ SLA Performance ─
  slaPerformance: {
    headers: ['Process', 'SLA Target', 'Volume', 'Within SLA', 'SLA %', 'Avg Time', 'RAG'],
    rows: [
      ['Application Decision',   '24 hours',  '521', '501', '96.2%', '12.8 hrs', 'green'],
      ['Loan Disbursement',       '2 days',   '367', '358', '97.5%', '1.4 days', 'green'],
      ['Arrears Outreach (1st)',  '3 DPD',    '168', '152', '90.5%', '2.8 DPD',  'amber'],
      ['Forbearance Review',     '5 days',    ' 34', ' 32', '94.1%', '4.4 days', 'green'],
      ['Complaint Acknowledgment','2 days',   '  7', '  7','100.0%', '0.8 days', 'green'],
      ['Complaint Resolution',   '56 days',  '  7', '  7','100.0%', '22.4 days','green'],
      ['Data Subject Requests',  '30 days',  '  3', '  3','100.0%', '8.2 days', 'green'],
    ],
  },

  // ─ FCA DISP Complaints Log ─
  complaints: {
    headers: ['Ref', 'Product', 'Category', 'Received', 'Status', 'Days Open', 'Upheld', 'Redress £'],
    rows: [
      ['CMP-2026-031', 'Consolidation Loan', 'Affordability Assessment',  '03 Feb', 'Closed', '18', 'Partial', '£120'],
      ['CMP-2026-032', 'Member Loan',        'Communication / Arrears',    '08 Feb', 'Closed', '13', 'Not Upheld', '—'],
      ['CMP-2026-033', 'Member Loan',        'Data Privacy (SAR)',          '14 Feb', 'Open',   ' 7', 'Pending', '—'],
      ['CMP-2026-034', 'Family Loan',        'Pricing / Rate Query',        '19 Feb', 'Open',   ' 2', 'Pending', '—'],
      ['CMP-2026-035', 'Consolidation Loan', 'Vulnerable Customer Support', '21 Feb', 'Open',   ' 0', 'Pending', '—'],
      ['CMP-2026-036', 'Salary Sacrifice',   'Employer Payroll Delay',      '28 Feb', 'Open',   ' 0', 'Pending', '—'],
    ],
    summary: { total: 7, closed: 2, open: 4, upheld: 1, partialUphold: 1, notUpheld: 1, totalRedress: '£120', rate: 0.18 },
    note: 'Rate: 0.18 per 1,000 accounts (green threshold <0.20). FCA DISP reporting due end of H1 2026.',
  },

  // ─ Collections Performance ─
  collections: {
    headers: ['Stage', 'Accounts', 'Balance £000', 'Promise-to-Pay %', 'Kept %', 'Collected £000', 'Cure Rate %'],
    rows: [
      ['Early Arrears (1–29 DPD)',  '168', ' 518', '68.4%', '71.2%', '  62', '42.3%'],
      ['Mid Arrears (30–89 DPD)',   '148', ' 488', '54.2%', '64.8%', '  48', '28.1%'],
      ['Late Arrears (90–179 DPD)', ' 72', ' 270', '38.4%', '52.4%', '  24', '14.2%'],
      ['Pre-Write-off (≥180 DPD)',  ' 18', ' 320', '22.2%', '40.0%', '   8',  '6.8%'],
    ],
    totals: ['Total', '406', '1,596', '51.2%', '62.3%', '142', '26.4%'],
    note: 'Collections recovery YTD: £142k (Feb). Cure rate = % of arrears accounts returned to current status within 90 days.',
  },

  // ─ NBA (Next Best Action) Effectiveness ─
  nba: {
    headers: ['NBA Campaign', 'Triggered', 'Response Rate', 'Outcome', 'Cost £'],
    rows: [
      ['Early Arrears SMS Nudge',        '168', '42.3%', '37.5% promise-to-pay', ' £84'],
      ['Consolidation Offer (ML arrears)',' 84', '18.6%', '12 applications generated', '£168'],
      ['Repayment Holiday Offer',         ' 28', '28.6%', ' 8 accepted', ' £42'],
      ['Rate Review (loyal members)',     '124', '31.5%', '18 top-ups generated', '£248'],
      ['Member Savings Referral',         '214', '14.0%', '24 savings accounts opened', '£214'],
    ],
    note: 'NBA cost = direct outreach cost only (SMS/email). Excludes staff time.',
  },

  // ─ Data Quality ─
  dataQuality: {
    headers: ['Metric', 'Score', 'Target', 'RAG', 'Notes'],
    rows: [
      ['Open Banking Data Completeness', '96.4%', '≥95%', 'green', 'All OB fields populated where consent given'],
      ['Address Verification Rate',       '99.1%', '≥98%', 'green', 'TransUnion Validate pass rate'],
      ['Missing Employer Data',           ' 4.2%', ' ≤3%', 'amber', '14 records flagged; chase-up in progress'],
      ['Affordability Model Inputs Complete','98.8%','≥97%','green','Household expenditure captured via OB/payslip'],
      ['IFRS9 Staging Accuracy',          '99.6%', '≥99%', 'green', 'Monthly reconciliation vs GL passed'],
      ['GDPR Data Retention Compliance',  '100%',  '100%', 'green', 'Auto-purge rules active; last audit Dec 2025'],
    ],
  },

  narrativePrompt: `You are a COO/Compliance Officer preparing the Operations & Compliance section for a Credit Union board pack (PRA/FCA regulated).
3 paragraphs, max 90 words each:
1. Consumer Duty outcomes — any amber/red areas, actions taken
2. Complaints and regulatory position — FCA DISP metrics, any trends
3. Collections and operational efficiency — SLA adherence, NBA effectiveness

Data:
- Consumer Duty: 5 of 6 outcomes green; Vulnerable Customer identification at 73.4% (amber, target 80%)
- 6 complaints in month (0.18 per 1,000 — green); 2 open affordability queries re CL product
- SLA adherence: 96%+ on all core processes except early arrears outreach (90.5% — amber)
- Collections cure rate: 26.4% overall; early arrears cure 42.3%
- NBA campaigns: early arrears SMS 42.3% response rate, consolidation offer generating 12 apps`,
};

/* ── 9. AI NARRATIVE SYSTEM ──────────────────────────────────────────────── */
const AI_CONFIG = {
  // Set your OpenAI API key here or leave empty to prompt at runtime
  apiKey: '',
  model: 'gpt-4o',
  maxTokens: 600,
  temperature: 0.3,
};

/**
 * generateNarrative(promptText, targetTextareaId)
 * Calls OpenAI chat completion and populates the editable textarea.
 * Falls back to a prompt for key entry if apiKey is not configured.
 */
async function generateNarrative(promptText, targetTextareaId) {
  let key = AI_CONFIG.apiKey;
  if (!key) {
    key = _narrativeStore['openai_key'];
    if (!key) {
      key = window.prompt('Enter your OpenAI API key to generate AI narratives:');
      if (!key) return;
      _narrativeStore['openai_key'] = key;
    }
  }

  const btn = document.querySelector(`[data-narrative-btn="${targetTextareaId}"]`);
  const ta  = document.getElementById(targetTextareaId);
  if (!ta) return;

  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Generating…';
  }
  ta.value = 'Generating narrative — please wait…';

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: AI_CONFIG.model,
        max_tokens: AI_CONFIG.maxTokens,
        temperature: AI_CONFIG.temperature,
        messages: [{ role: 'user', content: promptText }],
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `HTTP ${res.status}`);
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim() || '(No response)';
    ta.value = text;

    // Store in session for print
    _narrativeStore[`narrative_${targetTextareaId}`] = text;

  } catch (e) {
    ta.value = `Error generating narrative: ${e.message}\n\nPlease edit this text manually before printing.`;
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = '✦ Generate AI Narrative';
    }
  }
}

/* In-memory narrative store for transient state */
const _narrativeStore = {};
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.narrative-textarea').forEach(ta => {
    const saved = _narrativeStore[`narrative_${ta.id}`];
    if (saved) ta.value = saved;
    ta.addEventListener('input', () => {
      _narrativeStore[`narrative_${ta.id}`] = ta.value;
    });
  });
});

/* ── 10. CHART HELPERS ────────────────────────────────────────────────────── */
const FT_CHART_DEFAULTS = {
  plugins: {
    legend: {
      labels: {
        font: { family: "'Inter', system-ui, sans-serif", size: 11 },
        color: '#6B7280',
        boxWidth: 12,
        padding: 12,
      },
    },
    tooltip: {
      backgroundColor: '#0A0A0A',
      titleFont: { family: "'Inter', system-ui, sans-serif", size: 11, weight: '600' },
      bodyFont:  { family: "'Inter', system-ui, sans-serif", size: 11 },
      padding: 10,
      cornerRadius: 6,
    },
  },
  scales: {
    x: {
      ticks: { font: { family: "'Inter', system-ui, sans-serif", size: 10 }, color: '#6B7280' },
      grid:  { color: '#E5E7EB' },
    },
    y: {
      ticks: { font: { family: "'Inter', system-ui, sans-serif", size: 10 }, color: '#6B7280' },
      grid:  { color: '#E5E7EB' },
    },
  },
};

function ftLineChart(ctx, labels, datasets, opts = {}) {
  return new Chart(ctx, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { ...FT_CHART_DEFAULTS.plugins, ...(opts.plugins || {}) },
      scales: opts.scales || FT_CHART_DEFAULTS.scales,
    },
  });
}

function ftBarChart(ctx, labels, datasets, opts = {}) {
  return new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { ...FT_CHART_DEFAULTS.plugins, ...(opts.plugins || {}) },
      scales: opts.scales || FT_CHART_DEFAULTS.scales,
    },
  });
}

function ftDoughnut(ctx, labels, data, colors, opts = {}) {
  return new Chart(ctx, {
    type: 'doughnut',
    data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 2, borderColor: '#FFFFFF' }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      cutout: '65%',
      plugins: { ...FT_CHART_DEFAULTS.plugins, ...(opts.plugins || {}) },
    },
  });
}
