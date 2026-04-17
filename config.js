/* ═══════════════════════════════════════════════════════════════════════════
   United Trust Bank — Board Pack V2  |  config.js
   Central data layer, RAG thresholds, and AI narrative system

   Data sourced from UTB Report & Accounts 2025 (FY ending 31 Dec 2025).
   Monthly (Feb 2026) and interim figures are internally consistent extrapolations
   from the full-year disclosed position, used for illustrative board MI.

   DIVISIONS
   ─────────
   Property Finance        → PF  (Structured Property Solutions, Dev Finance)
   Bridging                → BR  (Bridging Finance, Short-term Property Lending)
   Mortgages               → MT  (First charge, BTL, Second charge)
   Asset Finance           → AF  (Hire purchase, Finance lease, Block Finance)
   ═══════════════════════════════════════════════════════════════════════════ */

'use strict';

/* ── 0. REPORTING PERIOD ─────────────────────────────────────────────────── */
const REPORT_PERIOD = {
  month:     'February 2026',
  monthShort:'Feb 2026',
  quarter:   'Q1 2026',
  yearEnd:   'December 2025',
  asAt:      '28 February 2026',
  preparedBy:'Finance & Risk',
  version:   '2.0',
};

/* ── 1. RAG THRESHOLDS ───────────────────────────────────────────────────── */
const RAG = {
  arrears30dpd:     { green: 5.0,   amber: 8.5  },   // % of book balance
  arrears90dpd:     { green: 2.0,   amber: 3.5  },
  netDefaultRate:   { green: 0.5,   amber: 1.0  },
  stage2Pct:        { green: 10.0,  amber: 15.0 },
  stage3Pct:        { green: 2.5,   amber: 4.0  },
  approvalRate:     { green: 55,    amber: 40   },
  autoDecisionRate: { green: 60,    amber: 45   },
  nim:              { green: 4.0,   amber: 3.0  },
  capitalRatio:     { green: 13.0,  amber: 11.0 },   // Total Capital %
  costToIncome:     { green: 48,    amber: 55   },   // (lower = green)
  complaintRate:    { green: 0.3,   amber: 0.6  },
  slaAdherence:     { green: 95,    amber: 88   },
  obAdoptionRate:   { green: 65,    amber: 45   },
};

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

/* ── 2. DIVISION MASTER ──────────────────────────────────────────────────── */
const PRODUCTS = [
  { code: 'PF', label: 'Property Finance',  retoolKey: 'Structured Property', color: '#0A0A0A' },
  { code: 'BR', label: 'Bridging',          retoolKey: 'Bridging Finance',    color: '#B8911A' },
  { code: 'MT', label: 'Mortgages',         retoolKey: 'Mortgages',           color: '#E5B821' },
  { code: 'AF', label: 'Asset Finance',     retoolKey: 'Asset Finance',       color: '#6B7280' },
];

const PRODUCT_COLORS = PRODUCTS.reduce((m, p) => { m[p.code] = p.color; return m; }, {});

/* ── 3. PAGE 1 — EXECUTIVE SUMMARY ──────────────────────────────────────── */
const DATA_P1 = {
  // ─ RAG Scorecard (12 headline KPIs) ─
  scorecard: [
    { label:'Loan Book',           value:'£3,895m', delta:'+12.0%',  dir:'up',   rag:'green', note:'vs FY24 £3,487m' },
    { label:'Total Assets',        value:'£4.45bn', delta:'+13.7%',  dir:'up',   rag:'green', note:'vs FY24 £3.91bn' },
    { label:'Gross New Lending',   value:'£165m',   delta:'+7.0%',   dir:'up',   rag:'green', note:'Feb run-rate' },
    { label:'Operating Income',    value:'£14.7m',  delta:'+7.0%',   dir:'up',   rag:'green', note:'Feb, YoY' },
    { label:'Profit Before Tax',   value:'£6.6m',   delta:'-8.9%',   dir:'down', rag:'amber', note:'margin compression' },
    { label:'Net Interest Margin', value:'4.05%',   delta:'-0.22pp', dir:'down', rag:'green', note:'annualised' },
    { label:'Cost-to-Income',      value:'47.7%',   delta:'+1.1pp',  dir:'up',   rag:'green', note:'FY25 ratio' },
    { label:'Cost of Risk',        value:'37 bps',  delta:'+32 bps', dir:'up',   rag:'amber', note:'vs 5 bps FY24' },
    { label:'Return on Equity',    value:'14.1%',   delta:'-6.0pp',  dir:'down', rag:'amber', note:'FY25 avg equity' },
    { label:'CET1 Ratio',          value:'14.0%',   delta:'+1.0pp',  dir:'up',   rag:'green', note:'vs 4.5% regulatory min' },
    { label:'Total Capital Ratio', value:'17.4%',   delta:'+1.5pp',  dir:'up',   rag:'green', note:'vs 8.0% min' },
    { label:'Trustpilot Score',    value:'4.7 / 5', delta:'+0.1',    dir:'up',   rag:'green', note:'24 industry awards' },
  ],

  // ─ P&L Summary (Feb 2026 month, £'000) ─
  pl: {
    headers: ['Line', 'Budget £000', 'Actual £000', 'Variance £000', 'Var %'],
    rows: [
      ['Interest Receivable',     '28,200', '28,567', '  +367', '+1.3%',  'fav'],
      ['Interest Payable',        '(13,600)','(13,866)','-266', '-2.0%',  'unfav'],
      ['Net Interest Income',     '14,600', '14,701', '  +101', '+0.7%',  'fav'],
      ['Other Income',            '     0', '     2', '    +2', 'n/m',    'fav'],
      ['Total Operating Income',  '14,600', '14,703', '  +103', '+0.7%',  'fav'],
      ['Staff Costs',             '(4,820)', '(4,829)', '   -9', '-0.2%', 'unfav'],
      ['IT, Premises & Other',    '(2,180)', '(2,033)', ' +147', '+6.7%', 'fav'],
      ['Depreciation',            '  (147)', '  (147)', '    0', '0.0%',  'flat'],
      ['Total Operating Costs',   '(7,147)', '(7,009)', ' +138', '+1.9%', 'fav'],
      ['Operating Profit',        ' 7,453', ' 7,694', '  +241', '+3.2%',  'fav'],
      ['Impairment Charge',       '(1,050)', '(1,136)', ' -86', '-8.2%',  'unfav'],
      ['Profit Before Tax',       ' 6,403', ' 6,558', '  +155', '+2.4%',  'fav'],
    ],
    note: 'Feb 2026 run-rate consistent with FY25 delivery of £78.7m PBT. Cost of risk normalising after FY25 property portfolio provisions.',
  },

  // ─ 13-Month Book Trend (£m, month-end balance) ─
  bookTrend: {
    labels: ['Feb-25','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan-26','Feb-26'],
    balance:  [3520,3565,3612,3654,3701,3743,3780,3814,3845,3867,3895,3912,3948],
    newLend:  [142, 158, 172, 165, 171, 158, 149, 162, 168, 175, 184, 151, 165],
    arrears30:[7.8, 7.9, 8.0, 8.1, 8.3, 8.5, 8.6, 8.7, 8.8, 8.9, 8.8, 8.7, 8.6],
  },

  // ─ Division Mix (book balance, £m as at Feb 2026) ─
  productMix: {
    labels: PRODUCTS.map(p => p.label),
    values: [988, 975, 1385, 600],   // PF, BR, MT, AF; totals £3,948m
    colors: PRODUCTS.map(p => p.color),
  },

  // ─ AI Narrative Prompt ─
  narrativePrompt: `You are the CFO of United Trust Bank drafting the Executive Summary for the Feb 2026 board pack.
Tone: concise, professional, factual. Audience: Board Directors, CEO, CRO.
Write 3 short paragraphs (max 90 words each):
1. Headline performance: book growth, operating income, strategic capital actions
2. Key risks: margin compression, cost of risk (property concentration), RoE moderation
3. Outlook & management actions: Warburg Pincus value add, Stance Asset Finance launch, Basel 3.1 readiness

Data context:
- Loan book £3,895m (+12% YoY), Total assets £4.45bn (+13.7%)
- FY25 operating income £176m (+7%), PBT £78.7m (-9%), Cost-Income 47.7%
- NIM compression as lending rates fell faster than deposit rates
- Cost of risk 37bps (FY24: 5bps) concentrated in a small property cohort
- CET1 14.0%, Total capital 17.4% (FY24: 13.0% / 15.9%) — £50m AT1 issued, Warburg Pincus equity completed
- Trustpilot 4.7, 24 industry awards, 600+ digital enhancements (+8% YoY)`,
};

/* ── 4. PAGE 2 — CREDIT RISK ─────────────────────────────────────────────── */
const DATA_P2 = {
  // ─ IFRS 9-style Stage Summary (proxy from FRS 102 disclosures, £'000) ─
  ifrs9Summary: {
    headers: ['Stage', 'Description', 'Loans', 'Balance £m', '% Book', 'ECL £m', 'Coverage %', 'MoM Δ'],
    rows: [
      ['Stage 1', 'Performing — 12-month ECL',      '~7,480', ' 3,459', '88.8%', ' 3.2',  '0.09%', '+£0.1m'],
      ['Stage 2', 'Past due / watchlist — Lifetime','~  820', '   350', ' 9.0%', ' 2.1',  '0.60%', '+£0.2m'],
      ['Stage 3', 'Credit-impaired — Lifetime ECL', '~  180', '    86', ' 2.2%', '14.0',  '16.3%', '+£0.3m'],
      ['POCI',    'Purchased/Originated Credit-Imp','     0', '     0', ' 0.0%', ' 0.0',  'n/a',   '—'    ],
    ],
    totals: ['Total', '', '~8,480', '3,895', '100%', '19.3', '0.49%', '+£0.6m'],
    note: 'ECL split: Individual £16.1m (Property £14.0m, Mortgages £1.5m, Finance lease £0.5m, AF £0.1m); Collective £3.2m. Watchlist £45m within Stage 1.',
  },

  // ─ Past-Due Ageing Bands (£'000, per credit quality table) ─
  dpdBands: {
    headers: ['Ageing Band', 'Balance £m', '% Book', 'MoM Δ (£m)', 'YoY Δ (pp)'],
    rows: [
      ['Neither past due nor impaired', '3,459', '88.8%', '+42.3', '+0.3'],
      ['≤ 1 month past due',            '   85', ' 2.2%', ' +2.1', '+0.4'],
      ['1–3 months past due',           '   97', ' 2.5%', ' +3.4', '+0.7'],
      ['3–12 months past due',          '  131', ' 3.4%', ' +5.7', '+1.1'],
      ['> 12 months past due',          '   57', ' 1.5%', ' +1.2', '+0.8'],
      ['Individually impaired',         '   86', ' 2.2%', ' +4.1', '+0.7'],
      ['Less: provision',               '  (19)','(0.5%)','(-1.4)', '+0.3'],
    ],
    totals: ['Total net of provisions', '3,895', '100%', '+57.4', '—'],
  },

  // ─ Past-due distribution for chart (£m) ─
  dpdChart: {
    labels:   ['Performing','≤1m','1–3m','3–12m','>12m','Impaired'],
    balances: [3459, 85, 97, 131, 57, 86],
    colors:   ['#1B7A3D','#4EA35A','#D97706','#B85E00','#C0392B','#8B2A2A'],
  },

  // ─ Arrears by Division (£'000) ─
  arrearsProduct: {
    headers: ['Division', 'Book £m', 'Past-Due £m', 'Past-Due Rate', 'RAG', 'MoM Δ'],
    rows: [
      ['Property Finance',  ' 988', ' 121', '12.3%', 'red',   '+0.6pp'],
      ['Bridging',          ' 975', ' 104', '10.7%', 'amber', '+0.4pp'],
      ['Mortgages',         '1,385', '  68', ' 4.9%', 'green', '+0.1pp'],
      ['Asset Finance',     ' 600', '  28', ' 4.7%', 'green', '+0.2pp'],
    ],
    totals: ['Portfolio',   '3,948', ' 321', ' 8.1%', 'amber', '+0.3pp'],
  },

  // ─ ECL Movement Waterfall (£'000) ─
  eclWaterfall: {
    labels:  ['Opening ECL\n1 Jan 25','New Originations','Stage Migrations','Model Update','Property Specific','Releases & Recoveries','Write-offs','Closing ECL'],
    values:  [8318, 1450, 1985, 320, 10500, -989, -2689, 19259],
    base:    [0, 8318, 9768, 11753, 12073, 22573, 21584, 0],
    colors:  ['#0A0A0A','#B8911A','#D97706','#6B7280','#C0392B','#1B7A3D','#1B7A3D','#0A0A0A'],
    isTotal: [true, false, false, false, false, false, false, true],
  },

  // ─ PD / LGD / EAD by Division ─
  pdLgdEad: {
    headers: ['Division', 'PD (%)', 'LGD (%)', 'EAD £m', 'EL £m', 'EL % Book'],
    rows: [
      ['Property Finance',  '2.8', '32', '1,018', '9.1', '0.89%'],
      ['Bridging',          '2.2', '28', '  990', '6.1', '0.62%'],
      ['Mortgages',         '0.9', '18', '1,390', '2.3', '0.16%'],
      ['Asset Finance',     '1.4', '42', '  615', '3.6', '0.58%'],
    ],
    totals: ['Portfolio', '1.7', '28', '4,013', '21.1', '0.54%'],
    note: 'PD based on 36-month observed default experience. LGD derived from recovery & collateral analysis. EAD = drawn + committed undrawn. Property cohorts reflect elevated 2025 provisioning.',
  },

  // ─ Vintage Default Curves (% cumulative default by origination year) ─
  vintages: {
    labels: ['M6','M12','M18','M24','M30','M36','M42','M48'],
    series: [
      { label:'2022 Cohort', data:[0.1,0.3,0.6,0.9,1.2,1.5,1.7,1.8], color:'#D1D5DB' },
      { label:'2023 Cohort', data:[0.1,0.2,0.5,0.8,1.1,1.4,null,null], color:'#0A0A0A' },
      { label:'2024 Cohort', data:[0.2,0.4,0.7,1.2,null,null,null,null], color:'#E5B821' },
      { label:'2025 Cohort', data:[0.3,0.8,null,null,null,null,null,null], color:'#C0392B' },
    ],
  },

  // ─ Forbearance & Restructuring (FY25 forborne exposures £19.4m + watchlist) ─
  forbearance: {
    headers: ['Arrangement Type', 'Loans', 'Balance £m', '% Book', 'Avg Days', 'Success Rate*'],
    rows: [
      ['Revised Contractual Terms', ' 38', '19.4', '0.50%', '128', '68%'],
      ['Payment Deferral (≤3m)',    ' 24', '12.8', '0.33%',  '42', '82%'],
      ['Term Extension',             ' 31', '22.4', '0.57%', ' 94', '61%'],
      ['Watch & Recoveries List',   ' 64', '45.2', '1.16%', '172', '54%'],
    ],
    totals: ['Total', '157', '99.8', '2.56%', '—', '64%'],
    note: '*Success rate = returned to performing status within 12 months. Watchlist exposures continue to perform but receive enhanced oversight.',
  },

  // ─ Write-off / Impairment Charge Log ─
  writeoffs: {
    headers: ['Month', 'Loans Written Off', 'Gross Value £m', 'Recoveries £m', 'Net Charge £m'],
    rows: [
      ['Oct 2025', '  3', ' 1.2', '0.4', ' 0.8'],
      ['Nov 2025', '  5', ' 2.1', '0.6', ' 1.5'],
      ['Dec 2025', '  4', ' 1.8', '0.5', ' 1.3'],
      ['Jan 2026', '  2', ' 0.9', '0.3', ' 0.6'],
      ['Feb 2026', '  3', ' 1.4', '0.4', ' 1.0'],
    ],
    ytd: ['YTD 2026', '  5', ' 2.3', ' 0.7', ' 1.6'],
  },

  narrativePrompt: `You are the Chief Risk Officer of United Trust Bank preparing the Credit Risk section of the Feb 2026 board pack.
Professional tone, risk-focused, 3 paragraphs max 90 words each:
1. Credit quality and Stage 2/3 movements — property concentration
2. Cost of risk trajectory — FY25 jump from 5bps to 37bps and normalisation outlook
3. Mitigation actions: Watch & Recoveries committee, forbearance effectiveness, property development oversight

Data:
- Stage 2 £350m (9.0%), Stage 3 £86m (2.2%), Watchlist £45m within Stage 1
- Impairment provision £19.3m (FY24: £8.3m) — Property portfolio drives £14.0m of individual provisions
- Past-due ageing: £370m total (9.5% of book), concentrated in Property Development
- FY25 impairment charge £13.6m vs £1.7m prior year — a small cohort of property loans
- Forbearance: £99.8m (2.56% book), 64% blended success rate
- Feb 2026 net charge £1.0m, YTD £1.6m (in line with FY26 plan of ~£15m)`,
};

/* ── 5. PAGE 3 — ORIGINATION & UNDERWRITING ──────────────────────────────── */
const DATA_P3 = {
  // ─ Application Funnel (Feb 2026 new lending £165m, ~1,200 cases) ─
  funnel: {
    steps: [
      { label:'Applications Received',   value: 1214, pct:'100%',  color:'#0A0A0A' },
      { label:'Passed Eligibility',      value: 1085, pct:' 89.4%', color:'#2D2D2D' },
      { label:'Full Credit Assessment',  value:  948, pct:' 78.1%', color:'#4A4A4A' },
      { label:'Credit Decisioned',       value:  892, pct:' 73.5%', color:'#8B6E10' },
      { label:'Approved / Offered',       value:  624, pct:' 51.4%', color:'#B8911A' },
      { label:'Drawn (Completed)',        value:  478, pct:' 39.4%', color:'#E5B821' },
    ],
    note: 'Feb 2026. Approved → Drawn fall-out (146 cases) includes customers who secured finance elsewhere or paused plans ahead of Spring Budget.',
  },

  // ─ Approval Rates by Division ─
  approvalByProduct: {
    headers: ['Division', 'Applications', 'Approved', 'Declined', 'Referred', 'Approval Rate', 'MoM Δ', 'RAG'],
    rows: [
      ['Property Finance',  ' 186', ' 102', ' 62', '22', '54.8%', '+1.4pp', 'green'],
      ['Bridging',          ' 248', ' 146', ' 78', '24', '58.9%', '+2.0pp', 'green'],
      ['Mortgages',         ' 542', ' 298', '194', '50', '55.0%', '+0.8pp', 'green'],
      ['Asset Finance',     ' 238', ' 168', ' 54', '16', '70.6%', '+0.6pp', 'green'],
    ],
    totals: ['Total', '1,214', '714', '388', '112', '58.8%', '+1.2pp', 'green'],
    note: 'Decision totals include 90 Approved cases that later withdrew or were re-decisioned; funded = 624 net.',
  },

  // ─ Approval by Borrower Quality Band (Mortgages & Asset Finance only) ─
  approvalByCreditBand: {
    headers: ['Score Band', 'Applications', 'Approved', 'Approval %', 'Avg Loan £', 'Avg Rate %', 'Default Rate*'],
    rows: [
      ['Prime (Gold)',   ' 248', ' 238', '96.0%', '£285,400', '5.49%', '0.4%'],
      ['Near Prime',     ' 194', ' 172', '88.7%', '£218,600', '6.49%', '0.9%'],
      ['Complex Prime',  ' 168', ' 126', '75.0%', '£184,200', '7.29%', '1.6%'],
      ['Specialist',     ' 124', '  84', '67.7%', '£142,800', '8.19%', '2.8%'],
      ['Heavy Adverse',  '  46', '  18', '39.1%', '£ 98,400', '9.49%', '5.4%'],
    ],
    note: '*12-month observed default rate (2024 origination cohort). Prime dominates UTB first-charge book.',
  },

  // ─ Approval heatmap (divisions × bands) ─
  approvalHeatmapData: {
    products: ['Property Finance', 'Bridging', 'Mortgages', 'Asset Finance'],
    bands:    ['Prime','Near Prime','Complex Prime','Specialist','Heavy Adverse'],
    rates: [
      [82, 74, 62, 48, 28],   // Property Finance (more complex)
      [84, 77, 64, 52, 34],   // Bridging
      [96, 89, 75, 68, 39],   // Mortgages
      [94, 88, 79, 64, 42],   // Asset Finance
    ],
  },

  // ─ Data Collection & Digital Onboarding ─
  dataCollection: {
    headers: ['Method', 'Applications', '% Share', 'Approval Rate', 'Avg Time-to-Offer', 'Default Rate*'],
    rows: [
      ['Broker Portal (Digital)',  ' 814', '67.1%', '61.2%', ' 2.8 days', '1.4%'],
      ['Direct Online',            ' 248', '20.4%', '52.8%', ' 3.6 days', '2.1%'],
      ['Broker (Manual)',          ' 124', '10.2%', '48.4%', ' 8.2 days', '2.7%'],
      ['Relationship Manager',     '  28', ' 2.3%', '78.6%', ' 1.4 days', '0.7%'],
    ],
    note: '*12-month default rate by origination channel (2024 cohort). Broker Portal digitalisation drives material approval & time-to-offer improvements.',
    obRate: 67.1,
  },

  // ─ Digital Channel Adoption Trend ─
  obTrend: {
    labels: ['Aug-25','Sep','Oct','Nov','Dec','Jan-26','Feb-26'],
    obPct:  [54.2, 57.8, 60.6, 62.4, 64.8, 66.1, 67.1],
  },

  // ─ Credit Reference / External Data Cost Breakdown (£/month) ─
  tuBilling: {
    headers: ['Check Type', 'Volume', 'Unit Cost', 'Total £', '% of Total Spend'],
    rows: [
      ['Hard Credit Search',         ' 892', '£2.40', '£ 2,141', '23.8%'],
      ['Soft Search / Quotation',    '1,214', '£0.80', '£   971', '10.8%'],
      ['Open Banking (Enrich)',      ' 814', '£1.60', '£ 1,302', '14.5%'],
      ['AML / PEP / Sanctions',      '1,214', '£0.55', '£   668', ' 7.4%'],
      ['Commercial Data (Property)', ' 434', '£4.80', '£ 2,083', '23.1%'],
      ['Fraud Consortium Screen',    '1,214', '£0.75', '£   911', '10.1%'],
      ['Director / Beneficial Owner',' 186', '£3.20', '£   595', ' 6.6%'],
      ['Valuation Tracker Data',     ' 142', '£2.40', '£   341', ' 3.8%'],
    ],
    total: { volume:'—', unitCost:'—', total:'£9,012', pct:'100%' },
    costPerApp: 7.42,
    note: 'Feb 2026. Blended credit bureau cost per completed application: £7.42.',
  },

  // ─ Decision Quality ─
  decisionQuality: {
    headers: ['Decision Type', 'Count', 'Correct', 'Accuracy %', 'False Positive', 'False Negative', 'RAG'],
    rows: [
      ['Auto Approve (Mortgage/AF)',  '284', '272', '95.8%', ' 6 (2.1%)', ' 6 (2.1%)', 'green'],
      ['Auto Decline (Eligibility)',  '129', '122', '94.6%', ' 4 (3.1%)', ' 3 (2.3%)', 'green'],
      ['Manual Approve',              '340', '326', '95.9%', ' 8 (2.4%)', ' 6 (1.8%)', 'green'],
      ['Manual Decline',              '259', '246', '95.0%', ' 8 (3.1%)', ' 5 (1.9%)', 'green'],
      ['Referred to Credit Committee','112', '106', '94.6%', ' 4 (3.6%)', ' 2 (1.8%)', 'green'],
    ],
    autoDecisionRate: 47.6,
  },

  // ─ Time-to-Decision Trend ─
  ttdTrend: {
    labels: ['Aug-25','Sep','Oct','Nov','Dec','Jan-26','Feb-26'],
    auto:   [1.8, 1.7, 1.5, 1.3, 1.1, 1.0, 0.9],
    manual: [72.4, 68.8, 64.2, 58.6, 54.8, 52.4, 48.6],
  },

  narrativePrompt: `You are the Director of Origination at United Trust Bank preparing the Origination & Underwriting section of the Feb 2026 board pack.
3 paragraphs, professional tone, max 90 words each:
1. Volume and funnel conversion — 7% FY25 growth, broker digitalisation traction
2. Credit quality of new origination — approval rate, band mix, early default indicators
3. Decision quality and time-to-offer — ongoing digital platform investment impact

Data:
- 1,214 applications Feb 2026; 478 drawn (39.4% end-to-end conversion)
- Blended approval 58.8% (+1.2pp MoM); Asset Finance strongest at 70.6%
- Broker Portal channel 67.1% of volume (+1.0pp), default rate 1.4% vs 2.7% manual
- Digital decision time improved to 0.9 hours (from 1.8h Aug-25)
- Manual underwriting time 48.6h (improved from 72.4h Aug-25 through workflow reform)
- Credit bureau cost per app: £7.42 (within £8 amber threshold)`,
};

/* ── 6. PAGE 4 — PORTFOLIO COMPOSITION ───────────────────────────────────── */
const DATA_P4 = {
  // ─ Book Stratification by Division ─
  productStratification: {
    headers: ['Division', 'Loans', 'Balance £m', '% Book', 'Avg Balance £', 'Avg Rate %', 'Avg Term (mths)', 'Avg LTV'],
    rows: [
      ['Property Finance',  ' 412',  '988',  '25.0%', '£2.4m',   '7.8%',  '18', '62%'],
      ['Bridging',          ' 648',  '975',  '24.7%', '£1.5m',   '8.4%',  '11', '64%'],
      ['Mortgages',         '5,820', '1,385','35.1%', '£238k',   '6.1%', '252', '66%'],
      ['Asset Finance',     '1,600', '600',  '15.2%', '£375k',   '7.4%',  '48', 'n/a'],
    ],
    totals: ['Portfolio', '8,480', '3,948', '100%', '£466k', '7.2%', '148', '65%'],
  },

  // ─ Loan Value Band Distribution (£ thousands) ─
  valueBands: {
    labels:    ['£0–100k','£100–250k','£250–500k','£500k–1m','£1–2.5m','£2.5–5m','£5–10m','£10m+'],
    loans:     [ 1840,     2960,       2120,       840,        488,      148,       62,       22],
    balancePct:[ 4.1,      10.8,       19.4,       16.2,       20.6,     13.4,      10.2,     5.3],
  },

  // ─ Loan Term Band Distribution ─
  termBands: {
    labels:    ['≤6m','7–12m','13–24m','25–60m','61–120m','121–240m','241m+'],
    loans:     [ 384,   524,    884,     1648,    512,      2140,       2388],
    balancePct:[ 6.4,   11.2,   14.8,    18.6,    8.4,      20.1,       20.5],
  },

  // ─ Interest Rate Band Distribution ─
  rateBands: {
    labels:    ['<5%','5–5.99%','6–6.99%','7–7.99%','8–8.99%','9–9.99%','≥10%'],
    loans:     [ 1240,  2280,     1870,     1410,     884,       512,      284],
    balancePct:[ 8.4,   24.2,     28.6,     18.9,     11.2,      5.8,      2.9],
    labelsClean: ['<5%','5–5.99%','6–6.99%','7–7.99%','8–8.99%','9–9.99%','≥10%'],
    loansClean:  [1240,  2280,     1870,     1410,     884,       512,      284],
  },

  // ─ Term × Division Heatmap (count of loans) ─
  termProductHeatmap: {
    terms:    ['≤12m','13–24m','25–60m','61–120m','121–240m','241m+'],
    products: ['Property Finance','Bridging','Mortgages','Asset Finance'],
    data: [
      [ 98, 524,   0,   0],   // ≤12m   (Bridging dominates)
      [148, 102,  12,  56],   // 13–24m
      [112,  22, 284, 984],   // 25–60m (AF + Mortgages starter)
      [ 28,   0, 512,   0],   // 61–120m (Mortgages)
      [ 18,   0,2140,   0],   // 121–240m
      [  8,   0,2388,   0],   // 241m+
    ],
  },

  // ─ Concentration Risk ─
  concentration: {
    headers: ['Metric', 'Value', 'Limit', 'Utilisation', 'RAG'],
    rows: [
      ['Single Borrower Max Exposure',    '£48.2m',   '£50.0m',   '96.4%', 'amber'],
      ['Top 10 Borrowers (% Book)',       '  8.2%',   ' 10.0%',   '82.0%', 'amber'],
      ['Top 50 Borrowers (% Book)',       ' 21.8%',   ' 25.0%',   '87.2%', 'amber'],
      ['Property Sector (% Book)',        ' 49.7%',   ' 55.0%',   '90.4%', 'amber'],
      ['Single Region (Greater London)',  ' 38.4%',   ' 45.0%',   '85.3%', 'green'],
      ['Loans > £10m (% Balance)',        '  5.3%',   '  8.0%',   '66.3%', 'green'],
    ],
  },

  // ─ Repeat / Relationship Borrower Analysis ─
  repeatBorrowers: {
    headers: ['Division', 'New Relationships', 'Repeat Borrower Facilities', 'Top-Up / Extension', 'Repeat %', 'Avg Top-Up £m', 'MoM Δ'],
    rows: [
      ['Property Finance',  ' 18', ' 38', ' 46', '82.4%', '£2.8m', '+1.4pp'],
      ['Bridging',          ' 42', ' 78', ' 26', '71.2%', '£0.9m', '+2.2pp'],
      ['Mortgages',         '184', '  0', ' 114', '38.3%', '£0.06m','+0.6pp'],
      ['Asset Finance',     ' 34', ' 94', '  40', '79.7%', '£0.28m','+1.1pp'],
    ],
    totals: ['Total', '278', '210', '226', '61.1%', '£1.0m', '+1.2pp'],
    note: 'Repeat = second or subsequent facility to existing borrower. Top-Up = increase on live facility. UTB specialist model thrives on broker relationships & returning borrowers.',
  },

  narrativePrompt: `You are the Head of Portfolio Management at United Trust Bank preparing the Portfolio Composition section for the Feb 2026 board pack.
3 paragraphs, max 90 words each:
1. Book composition and sector concentration — property at 49.7% vs 55% limit
2. Term and value distribution — long-dated mortgage book balance vs short bridging
3. Relationship borrower dynamics — broker-led model, repeat borrower share

Data:
- Book £3,948m: Mortgages 35.1%, PF 25.0%, Bridging 24.7%, Asset Finance 15.2%
- Property sector exposure 49.7% (PF + Bridging) vs 55% appetite — amber flag
- Greater London concentration 38.4% (green, within 45% limit)
- Single borrower max £48.2m vs £50m hard limit — amber, review due March
- Avg ticket size: Property £2.4m, Bridging £1.5m, Mortgages £238k, AF £375k
- Repeat borrower share: 61.1% of new facilities excluding mortgages (broker-led model benefit)`,
};

/* ── 7. PAGE 5 — INCOME & CAPITAL ────────────────────────────────────────── */
const DATA_P5 = {
  // ─ NIM Waterfall (£'000, Feb 2026 month) ─
  nimWaterfall: {
    labels:  ['Interest\nReceivable','Interest\nPayable','Other\nIncome','Net Interest\nIncome','Impairment\nCharge','Risk-Adj NII'],
    values:  [28567, -13866, 2, 14703, -1136, 13567],
    annRate: [8.74, -4.24, 0.00, 4.50, -0.35, 4.15],
    colors:  ['#0A0A0A','#C0392B','#1B7A3D','#E5B821','#B8911A','#6B7280'],
    isNeg:   [false, true, false, false, true, false],
  },

  // ─ Interest Rate by Division ─
  rateByProduct: {
    headers: ['Division', 'Avg Rate %', 'Min Rate %', 'Max Rate %', 'Cost of Funds %', 'Net Spread %', 'Risk-Adj Spread %'],
    rows: [
      ['Property Finance',  '7.8', '6.5', '10.9', '4.24', '3.56', '2.67'],
      ['Bridging',          '8.4', '7.2', '11.4', '4.24', '4.16', '3.54'],
      ['Mortgages',         '6.1', '4.5', ' 9.1', '4.24', '1.86', '1.70'],
      ['Asset Finance',     '7.4', '5.9', ' 9.9', '4.24', '3.16', '2.58'],
    ],
    portfolio: ['Portfolio Blended', '7.2', '4.5', '11.4', '4.24', '2.96', '2.42'],
    note: 'Risk-Adjusted Spread = Net Spread – annualised expected loss rate. Cost of funds reflects blended deposit & wholesale pricing; compressed FY25 as base rate eased more slowly than savings rates.',
  },

  // ─ Cost-of-Funds Breakdown (£m, proportional to £3,928m deposit book) ─
  costOfFunds: {
    headers: ['Funding Source', 'Balance £m', '% Mix', 'Rate %', 'Cost £m pa'],
    rows: [
      ['Fixed Term Deposits',       '2,652',  '66.6%', '4.60%', '122.0'],
      ['Notice Accounts',           '  824',  '20.7%', '4.35%', ' 35.8'],
      ['Easy Access (launched 25)',  '  392',  ' 9.8%', '3.95%', ' 15.5'],
      ['BoE Schemes (TFSME/ILTR)',  '   81',  ' 2.0%', '4.25%', '  3.4'],
      ['Subordinated Debt / AT1',    '   80',  ' 2.0%', '9.20%', '  7.4'],
    ],
    total: ['Total Funding', '4,029', '100%', '4.58%', '184.1'],
    note: 'TFSME remaining £50m repaid Jan 2025, 9 months ahead of maturity. £50m AT1 issued Q1 2025 via UTB Partners Plc. Easy Access now c.10% of deposit book.',
  },

  // ─ NIM Trend (annualised %) ─
  nimTrend: {
    labels: ['Feb-25','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan-26','Feb-26'],
    grossYield:  [8.95,8.94,8.90,8.86,8.82,8.78,8.76,8.74,8.72,8.70,8.72,8.70,8.74],
    costFunds:   [4.12,4.18,4.22,4.24,4.26,4.28,4.30,4.28,4.26,4.24,4.22,4.24,4.24],
    nim:         [4.83,4.76,4.68,4.62,4.56,4.50,4.46,4.46,4.46,4.46,4.50,4.46,4.50],
    riskAdjNim:  [4.76,4.68,4.58,4.48,4.38,4.26,4.18,4.14,4.10,4.08,4.12,4.14,4.15],
  },

  // ─ Capital Adequacy ─
  capital: {
    headers: ['Capital Measure', 'Amount £m', 'Risk-Weighted Asset £m', 'Ratio', 'Min Requirement', 'Headroom', 'RAG'],
    rows: [
      ['CET1 Capital',            '342',  '2,443',  '14.0%', ' 4.5%',  ' 9.5pp', 'green'],
      ['Tier 1 Capital',          '408',  '2,443',  '16.7%', ' 6.0%', '10.7pp', 'green'],
      ['Total Capital',           '425',  '2,443',  '17.4%', ' 8.0%', ' 9.4pp', 'green'],
      ['Leverage Ratio',          '408',  '4,451',  ' 9.2%', ' 3.0%', ' 6.2pp', 'green'],
      ['Liquidity Coverage (LCR)', '—',    '—',     '186%',  '100%',  '+86pp',  'green'],
    ],
    note: 'Warburg Pincus minority investment completed March 2025. £50m AT1 issued via UTBP. Countercyclical Buffer maintained at 2% throughout 2025. Basel 3.1 rules published Jan 2026, effective 1 Jan 2027.',
    rwaTrend: {
      labels: ['Aug-25','Sep','Oct','Nov','Dec','Jan-26','Feb-26'],
      rwa:    [2282, 2310, 2352, 2388, 2424, 2443, 2478],
      ratio:  [16.4, 16.6, 17.1, 17.2, 17.4, 17.4, 17.2],
    },
  },

  // ─ Cost-to-Income Trend ─
  ctiTrend: {
    labels: ['Aug-25','Sep','Oct','Nov','Dec','Jan-26','Feb-26'],
    cti:    [46.8, 47.1, 47.4, 47.6, 47.7, 47.6, 47.7],
    budget: [47.0, 47.0, 47.0, 47.0, 47.0, 47.2, 47.2],
  },

  narrativePrompt: `You are the CFO of United Trust Bank preparing the Income & Capital section of the Feb 2026 board pack.
3 paragraphs, max 90 words each:
1. Net interest margin and income — FY25 margin compression, rate cycle, funding mix
2. Capital adequacy — Warburg Pincus equity + AT1 impact, Basel 3.1 readiness
3. Cost-to-income — 47.7% FY25, investment in technology & talent

Data:
- NIM 4.5% Feb 2026 (FY25 avg 4.7%); compression from aggressive deposit pricing through 2025
- FY25 operating income £176m (+7%); margin compression offset by 12% book growth
- CET1 14.0% (+1.0pp); Total Capital 17.4% (+1.5pp) after Warburg Pincus + £50m AT1
- Cost-Income 47.7% FY25 (FY24: 46.6%); staff +9% on tech/talent investment
- Deposit mix diversifying: Easy Access to c.10%, Notice 20.7%, Fixed Term 66.6%
- Basel 3.1 effective 1 Jan 2027 — impact modelled, RWA uplift contained`,
};

/* ── 8. PAGE 6 — OPERATIONS & COMPLIANCE ─────────────────────────────────── */
const DATA_P6 = {
  // ─ Consumer Duty Outcomes ─
  consumerDuty: {
    headers: ['Outcome Area', 'KPI', 'Target', 'Actual', 'Status', 'Evidence / Actions'],
    rows: [
      ['Products & Services', 'Product review completion', '100% annual', '100%', 'green', 'All 4 divisions reviewed Q4 2025. Stance Asset Finance launched Q1 2026.'],
      ['Price & Value',       'Fair value assessment',    'Quarterly',   'Q4 complete', 'green', 'FY25 value assessments approved; no poor-value findings across divisions.'],
      ['Consumer Understanding','KFI acknowledgement rate','≥95%',       '97.8%', 'green', 'Pre-contract information confirmed via broker portal & direct digital flow.'],
      ['Consumer Support',   'Avg resolution time (days)','≤5 days',     '3.8 days', 'green', '96% resolved within SLA; 3 complex cases escalated to Customer Experience Cmt.'],
      ['Vulnerable Customers','Identified & flagged %',    '≥5% portfolio','5.4%', 'green', 'Enhanced processes + training rolled out in 2025. Monthly reporting to Board.'],
      ['Outcomes Monitoring', 'Board MI completed',        'Monthly',     'Yes', 'green', 'This pack constitutes monthly Outcome Monitoring submission for the Board.'],
    ],
  },

  // ─ SLA Performance ─
  slaPerformance: {
    headers: ['Process', 'SLA Target', 'Volume', 'Within SLA', 'SLA %', 'Avg Time', 'RAG'],
    rows: [
      ['Mortgage Offer Issued',     '3 days',   '298', '284', '95.3%', '2.2 days', 'green'],
      ['Bridging Drawdown',          '5 days',   '146', '143', '97.9%', '3.4 days', 'green'],
      ['Property Finance Decision', '10 days',   '102', ' 96', '94.1%', '7.2 days', 'green'],
      ['Asset Finance Decision',    '2 days',    '168', '164', '97.6%', '1.1 days', 'green'],
      ['Complaint Acknowledgment',   '2 days',   ' 18', ' 18','100.0%', '0.6 days', 'green'],
      ['Complaint Resolution',       '56 days',  ' 18', ' 18','100.0%', '22.4 days','green'],
      ['Broker Query Response',      '4 hours', '1,842','1,762','95.7%', '2.3 hrs', 'green'],
    ],
  },

  // ─ FCA DISP Complaints Log ─
  complaints: {
    headers: ['Ref', 'Division', 'Category', 'Received', 'Status', 'Days Open', 'Upheld', 'Redress £'],
    rows: [
      ['CMP-2026-094', 'Bridging',          'Fee Transparency',           '03 Feb', 'Closed', '18', 'Partial',    '£450'],
      ['CMP-2026-095', 'Mortgages',         'Offer Withdrawal',            '06 Feb', 'Closed', '14', 'Not Upheld', '—'],
      ['CMP-2026-096', 'Property Finance',  'Valuation Discrepancy',       '11 Feb', 'Closed', '11', 'Not Upheld', '—'],
      ['CMP-2026-097', 'Mortgages',         'Communication / Arrears',     '14 Feb', 'Open',   ' 9', 'Pending',    '—'],
      ['CMP-2026-098', 'Asset Finance',     'Broker Conduct',              '18 Feb', 'Closed',' 6', 'Upheld',     '£1,200'],
      ['CMP-2026-099', 'Bridging',          'Extension Fee Query',         '22 Feb', 'Open',   ' 6', 'Pending',    '—'],
      ['CMP-2026-100', 'Mortgages',         'Affordability Assessment',    '25 Feb', 'Open',   ' 3', 'Pending',    '—'],
      ['CMP-2026-101', 'Mortgages',         'Data Subject Access Request', '27 Feb', 'Open',   ' 1', 'Pending',    '—'],
    ],
    summary: { total: 8, closed: 4, open: 4, upheld: 1, partialUphold: 1, notUpheld: 2, totalRedress: '£1,650', rate: 0.22 },
    note: 'Rate: 0.22 per 1,000 accounts (green threshold <0.30). All complaints managed within FCA DISP 8-week clock.',
  },

  // ─ Collections / Watch & Recoveries Performance ─
  collections: {
    headers: ['Stage', 'Accounts', 'Balance £m', 'Promise-to-Pay %', 'Kept %', 'Collected £m', 'Cure Rate %'],
    rows: [
      ['Pre-Arrears Watch',         ' 240',  '142', '—',     '—',      '—',    '—'],
      ['Early Arrears (1–30 DPD)',  ' 380',  ' 85', '74.2%', '81.4%', '28.4',  '58.6%'],
      ['Mid Arrears (31–90 DPD)',   ' 284',  ' 97', '62.8%', '71.2%', '22.8',  '38.4%'],
      ['Late Arrears (90–365 DPD)', ' 186',  '131', '41.8%', '54.6%', '16.4',  '21.2%'],
      ['Impaired (Watchlist/Rec.)',  ' 138', '131', '24.2%', '42.4%', ' 9.2',  ' 8.4%'],
    ],
    totals: ['Total', '1,228', '586', '52.8%', '66.4%', '76.8', '29.8%'],
    note: 'Collections Feb 2026: £76.8m recovered across stages. Cure rate = returned to performing within 90 days. Property cases subject to bespoke recovery plans in Watch & Recoveries Committee.',
  },

  // ─ Next Best Action / Relationship Campaigns ─
  nba: {
    headers: ['NBA Campaign', 'Triggered', 'Response Rate', 'Outcome', 'Cost £'],
    rows: [
      ['Early Arrears Outreach',          ' 380', '72.1%', '282 promise-to-pay arrangements','£  760'],
      ['Pre-Maturity Retention (Mortg.)', ' 214', '38.4%', ' 82 Pipeline retention cases',   '£1,070'],
      ['Bridging Exit Planning',          ' 164', '52.4%', ' 86 refinanced onto Term',       '£  820'],
      ['Broker Re-engagement',            '1,824','24.1%', '440 broker activations',         '£2,190'],
      ['Asset Finance Top-Up Offer',      ' 680', '18.7%', '127 incremental facilities',     '£1,360'],
    ],
    note: 'NBA cost = direct outreach only (broker portal / email / SMS). Excludes RM time.',
  },

  // ─ Data Quality & Regulatory ─
  dataQuality: {
    headers: ['Metric', 'Score', 'Target', 'RAG', 'Notes'],
    rows: [
      ['Valuation Data Completeness',       '98.6%', '≥98%',  'green', 'All new Property / Mortgages cases valued at drawdown'],
      ['KYC / Sanctions Refresh Currency',  '99.4%', '≥99%',  'green', 'Watchlist re-screen weekly across live book'],
      ['Missing Employer / Source of Funds',' 1.8%', ' ≤2%',  'green', '22 records flagged; broker chase-up in progress'],
      ['Affordability Model Inputs',        '97.9%', '≥97%',  'green', 'Household + business affordability captured via broker portal'],
      ['Provisioning Accuracy',             '99.8%', '≥99%',  'green', 'Monthly reconciliation vs core banking system'],
      ['GDPR Data Retention',               '100%',  '100%',  'green', 'Auto-purge rules validated Dec 2025; ICO audit clean'],
    ],
  },

  narrativePrompt: `You are the COO / Chief Compliance Officer of United Trust Bank preparing the Operations & Compliance section for the Feb 2026 board pack.
3 paragraphs, max 90 words each:
1. Consumer Duty outcomes — all six areas green, evidence package ready for FCA
2. Complaints, SLAs and operational resilience — cyber investment, third party risk
3. Collections and Watch & Recoveries — property-led focus, NBA effectiveness

Data:
- Consumer Duty: all 6 outcomes green; vulnerable customer identification at 5.4%
- Complaints: 8 received (0.22 per 1,000 accounts — green); total redress £1.65k
- SLA adherence: ≥95% on all core processes including Broker Query Response
- Cyber & ops resilience: significant investment in 2025 (advanced security, resilience testing, third-party risk)
- Watch & Recoveries committee: 240 pre-arrears cases under enhanced oversight
- NBA: early arrears outreach 72.1% response; Bridging exit planning converting 52% to term`,
};

/* ── 9. AI NARRATIVE SYSTEM ──────────────────────────────────────────────── */
const AI_CONFIG = {
  apiKey: '',
  model: 'gpt-4o',
  maxTokens: 600,
  temperature: 0.3,
};

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
