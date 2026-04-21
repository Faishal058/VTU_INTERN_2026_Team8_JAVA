/**
 * WealthWise Documentation PDF Generator
 * Run from: frontend directory using: node generate_pdf.cjs
 */

const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

// Docs are in the sibling 'docs' directory
const DOCS_DIR = path.resolve(__dirname, '..', 'docs');

// ── Simple Markdown → HTML converter ─────────────────────────────────────────
function mdToHtml(md) {
  // We'll do a simplified but reasonably complete conversion
  let lines = md.split('\n');
  let html = '';
  let inPre = false;
  let preBuffer = '';
  let inTable = false;
  let tableRows = [];

  const flushTable = () => {
    if (tableRows.length === 0) return '';
    let out = '<table>';
    const headers = tableRows[0].split('|').filter((c,i,a) => i > 0 && i < a.length - 1 || (a.length === 1));
    // Actually split properly
    const parseRow = (row) => row.split('|').map(c => c.trim()).filter((c, i, a) => i > 0 && i < a.length - 1);
    
    const headerCells = parseRow(tableRows[0]).map(c => `<th>${c}</th>`).join('');
    out += `<thead><tr>${headerCells}</tr></thead><tbody>`;
    for (let i = 2; i < tableRows.length; i++) {
      const cells = parseRow(tableRows[i]).map(c => `<td>${c}</td>`).join('');
      out += `<tr>${cells}</tr>`;
    }
    out += '</tbody></table>';
    tableRows = [];
    return out;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Fenced code blocks
    if (line.startsWith('```')) {
      if (!inPre) {
        inPre = true;
        preBuffer = '';
      } else {
        inPre = false;
        html += `<pre><code>${preBuffer.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</code></pre>`;
      }
      continue;
    }
    if (inPre) { preBuffer += line + '\n'; continue; }

    // Tables
    if (line.startsWith('|')) {
      if (inTable === false) inTable = true;
      tableRows.push(line);
      continue;
    } else if (inTable) {
      html += flushTable();
      inTable = false;
    }

    // Process inline markdown
    let l = line
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '<span class="link">$1</span>');

    // Headings
    if (/^#{1,6} /.test(l)) {
      const level = l.match(/^(#+)/)[1].length;
      const text = l.replace(/^#+\s+/, '');
      html += `<h${level}>${text}</h${level}>\n`;
      continue;
    }

    // Horizontal rule
    if (l.trim() === '---' || l.trim() === '***' || l.trim() === '___') {
      html += '<hr>\n';
      continue;
    }

    // Blockquote
    if (l.startsWith('&gt; ') || l.startsWith('&gt;&gt;')) {
      html += `<blockquote>${l.replace(/^&gt;\s*/, '')}</blockquote>\n`;
      continue;
    }

    // Unordered list items
    if (/^[\*\-\+] /.test(l)) {
      html += `<li>${l.replace(/^[\*\-\+]\s+/, '')}</li>\n`;
      continue;
    }

    // Ordered list items
    if (/^\d+\. /.test(l)) {
      html += `<li>${l.replace(/^\d+\.\s+/, '')}</li>\n`;
      continue;
    }

    // Empty line → paragraph break
    if (l.trim() === '') {
      html += '<br>\n';
      continue;
    }

    // Normal paragraph line
    html += `<p>${l}</p>\n`;
  }

  // Flush any remaining table
  if (inTable) html += flushTable();

  return html;
}

// ── Read all doc files ────────────────────────────────────────────────────────
const docFiles = [
  '01_SYNOPSIS.md',
  '02_SRS.md',
  '03_SYSTEM_DESIGN.md',
  '04_API_DOCUMENTATION.md',
  '05_USER_MANUAL.md',
];

const docTitles = [
  'Project Synopsis',
  'Software Requirements Specification',
  'System Design (HLD + LLD)',
  'REST API Documentation',
  'User Manual',
];

function buildHtml() {
  console.log(`Reading docs from: ${DOCS_DIR}`);
  const sections = docFiles.map((file, idx) => {
    const filePath = path.join(DOCS_DIR, file);
    console.log(`  Reading: ${filePath}`);
    const content = fs.readFileSync(filePath, 'utf8');
    return mdToHtml(content);
  });

  const sectionBlocks = sections.map((content, idx) => `
<div class="doc-section">
  <div class="section-header" data-number="${idx+1}">
    <div class="section-number">Document 0${idx+1}</div>
    <div class="section-title">${docTitles[idx]}</div>
  </div>
  <div class="content-area">
${content}
  </div>
</div>`).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>WealthWise — Complete Technical Documentation</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Inter',-apple-system,sans-serif;font-size:10.5pt;line-height:1.7;color:#1a1f2e;background:#fff}

  /* Cover */
  .cover-page{page-break-after:always;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(135deg,#0f1624 0%,#1a2640 50%,#0d1f3c 100%);color:#fff;text-align:center;padding:60px 40px}
  .cover-logo{font-size:22pt;font-weight:700;letter-spacing:4px;text-transform:uppercase;color:#b4ff45;margin-bottom:16px}
  .cover-logo span{color:rgba(180,255,69,0.5)}
  .cover-divider{width:80px;height:3px;background:linear-gradient(90deg,#b4ff45,#3b82f6);margin:20px auto;border-radius:2px}
  .cover-title{font-size:28pt;font-weight:700;color:#fff;line-height:1.2;margin-bottom:16px}
  .cover-subtitle{font-size:12pt;color:rgba(255,255,255,0.6);margin-bottom:32px;max-width:600px}
  .cover-badge{display:inline-block;background:rgba(180,255,69,0.15);border:1px solid rgba(180,255,69,0.3);color:#b4ff45;font-size:8pt;padding:5px 14px;border-radius:999px;margin:5px 3px;font-weight:500}
  .cover-badges{margin:28px auto;max-width:550px}
  .cover-meta{display:flex;gap:36px;justify-content:center;flex-wrap:wrap;margin-top:28px}
  .cover-meta-label{font-size:7pt;text-transform:uppercase;letter-spacing:1.5px;color:rgba(255,255,255,0.4);margin-bottom:3px}
  .cover-meta-value{font-size:10pt;font-weight:600;color:rgba(255,255,255,0.9)}

  /* TOC */
  .toc-page{page-break-after:always;padding:50px 56px}
  .toc-title{font-size:22pt;font-weight:700;color:#0f1624;border-bottom:3px solid #b4ff45;padding-bottom:12px;margin-bottom:6px}
  .toc-subtitle{font-size:9.5pt;color:#6b7280;margin-bottom:30px}
  .toc-section{margin-bottom:22px}
  .toc-section-title{font-size:11pt;font-weight:700;color:#0f1624;border-left:4px solid #b4ff45;padding-left:12px;margin-bottom:8px}
  .toc-item{display:flex;align-items:baseline;padding:3px 0 3px 20px;border-bottom:1px dotted #e5e7eb}
  .toc-item-name{font-size:9.5pt;color:#374151}
  .toc-dots{flex:1;border-bottom:1px dotted #d1d5db;margin:0 8px;position:relative;top:-2px}
  .toc-item-page{font-size:8.5pt;color:#6b7280;font-weight:500}

  /* Sections */
  .doc-section{page-break-before:always;padding:0}
  .section-header{background:linear-gradient(135deg,#0f1624 0%,#1a2640 100%);color:#fff;padding:28px 48px;margin-bottom:32px;position:relative;overflow:hidden}
  .section-header::after{content:attr(data-number);position:absolute;right:40px;top:50%;transform:translateY(-50%);font-size:72pt;font-weight:800;opacity:0.06;color:#fff;line-height:1}
  .section-number{font-size:8.5pt;font-weight:600;text-transform:uppercase;letter-spacing:2px;color:#b4ff45;margin-bottom:8px}
  .section-title{font-size:22pt;font-weight:700;color:#fff;line-height:1.2}
  .content-area{padding:0 48px 48px}

  /* Typography */
  h1{font-size:19pt;font-weight:700;color:#0f1624;margin:26px 0 12px;padding-bottom:8px;border-bottom:2px solid #e5e7eb}
  h2{font-size:14.5pt;font-weight:700;color:#1e3a5f;margin:22px 0 10px;padding-bottom:6px;border-bottom:1px solid #e5e7eb}
  h3{font-size:12pt;font-weight:600;color:#1f2937;margin:16px 0 8px}
  h4{font-size:10.5pt;font-weight:600;color:#374151;margin:14px 0 6px}
  h5,h6{font-size:10pt;font-weight:600;color:#4b5563;margin:10px 0 5px}
  p{margin-bottom:8px;color:#374151;line-height:1.75}
  strong{font-weight:600;color:#111827}
  em{font-style:italic;color:#4b5563}
  .link{color:#2563eb;text-decoration:underline}

  /* Code */
  code{font-family:'JetBrains Mono','Consolas',monospace;font-size:8.5pt;background:#f3f4f6;color:#1f2937;padding:1px 5px;border-radius:3px;border:1px solid #e5e7eb}
  pre{background:#0f1624;border:1px solid #1e3a5f;border-radius:8px;padding:16px 20px;overflow-x:auto;margin:12px 0;page-break-inside:avoid}
  pre code{font-family:'JetBrains Mono','Consolas',monospace;font-size:7.5pt;background:transparent;color:#a5f3fc;padding:0;border:none;white-space:pre;line-height:1.6}

  /* Tables */
  table{width:100%;border-collapse:collapse;margin:12px 0;font-size:9pt;page-break-inside:avoid}
  thead{background:linear-gradient(135deg,#0f1624 0%,#1e3a5f 100%)}
  th{padding:9px 13px;text-align:left;font-weight:600;font-size:8.5pt;color:#fff;text-transform:uppercase;letter-spacing:0.3px}
  td{padding:8px 13px;color:#374151;border-bottom:1px solid #f3f4f6;vertical-align:top;line-height:1.5}
  tbody tr:last-child td{border-bottom:none}
  tbody tr:nth-child(even){background:#f9fafb}

  /* Lists */
  ul,ol{margin:8px 0 8px 20px;padding:0;color:#374151}
  li{margin-bottom:4px;line-height:1.65}

  /* Blockquotes */
  blockquote{border-left:4px solid #b4ff45;background:#f0fdf4;padding:10px 16px;margin:12px 0;border-radius:0 6px 6px 0;color:#1f2937;font-size:9.5pt}

  /* HR */
  hr{border:none;border-top:1px solid #e5e7eb;margin:20px 0}

  /* Print */
  @page{size:A4;margin:20mm 18mm 22mm}
  @page:first{margin:0}
</style>
</head>
<body>

<!-- COVER -->
<div class="cover-page">
  <div class="cover-logo">Wealth<span>Wise</span></div>
  <div class="cover-divider"></div>
  <div class="cover-title">Complete Technical<br>Documentation</div>
  <div class="cover-subtitle">AI-Augmented Smart Mutual Fund Management &amp; Financial Intelligence Platform</div>
  <div class="cover-badges">
    <span class="cover-badge">Synopsis</span>
    <span class="cover-badge">SRS v2.0</span>
    <span class="cover-badge">HLD + LLD</span>
    <span class="cover-badge">REST API Reference</span>
    <span class="cover-badge">User Manual</span>
  </div>
  <div class="cover-meta">
    <div><div class="cover-meta-label">Version</div><div class="cover-meta-value">1.0 MVP</div></div>
    <div><div class="cover-meta-label">Date</div><div class="cover-meta-value">April 2026</div></div>
    <div><div class="cover-meta-label">Status</div><div class="cover-meta-value">Approved</div></div>
    <div><div class="cover-meta-label">Domain</div><div class="cover-meta-value">FinTech / MF</div></div>
    <div><div class="cover-meta-label">Tech Stack</div><div class="cover-meta-value">React 19 + Spring Boot 3.2</div></div>
  </div>
</div>

<!-- TOC -->
<div class="toc-page">
  <div class="toc-title">Table of Contents</div>
  <div class="toc-subtitle">WealthWise Complete Technical Documentation — Five Core Documents</div>

  <div class="toc-section">
    <div class="toc-section-title">1. Project Synopsis</div>
    <div class="toc-item"><span class="toc-item-name">1.1 Project Title &amp; Context</span><span class="toc-dots"></span><span class="toc-item-page">§1</span></div>
    <div class="toc-item"><span class="toc-item-name">1.2 Problem Statement (Real-World Financial Challenges)</span><span class="toc-dots"></span><span class="toc-item-page">§1</span></div>
    <div class="toc-item"><span class="toc-item-name">1.3 Objectives — Short-term &amp; Long-term</span><span class="toc-dots"></span><span class="toc-item-page">§1</span></div>
    <div class="toc-item"><span class="toc-item-name">1.4 Scope of the System</span><span class="toc-dots"></span><span class="toc-item-page">§1</span></div>
    <div class="toc-item"><span class="toc-item-name">1.5 Key Features Overview</span><span class="toc-dots"></span><span class="toc-item-page">§1</span></div>
    <div class="toc-item"><span class="toc-item-name">1.6 Technology Stack (Frontend, Backend, DB, APIs)</span><span class="toc-dots"></span><span class="toc-item-page">§1</span></div>
  </div>

  <div class="toc-section">
    <div class="toc-section-title">2. Software Requirements Specification (SRS)</div>
    <div class="toc-item"><span class="toc-item-name">2.1 Introduction — Purpose, Scope, Definitions &amp; Glossary</span><span class="toc-dots"></span><span class="toc-item-page">§2</span></div>
    <div class="toc-item"><span class="toc-item-name">2.2 Overall Description — Architecture, User Classes, OS Environment</span><span class="toc-dots"></span><span class="toc-item-page">§2</span></div>
    <div class="toc-item"><span class="toc-item-name">2.3 Functional Requirements — Auth, Transactions, Holdings, Goals, Analytics, Alerts</span><span class="toc-dots"></span><span class="toc-item-page">§2</span></div>
    <div class="toc-item"><span class="toc-item-name">2.4 Non-Functional Requirements — Performance, Security, Scalability, Usability</span><span class="toc-dots"></span><span class="toc-item-page">§2</span></div>
    <div class="toc-item"><span class="toc-item-name">2.5 Business Rules (BR-01 to BR-14)</span><span class="toc-dots"></span><span class="toc-item-page">§2</span></div>
    <div class="toc-item"><span class="toc-item-name">2.6 Use Cases — UC-01 to UC-05 (Full Flows)</span><span class="toc-dots"></span><span class="toc-item-page">§2</span></div>
  </div>

  <div class="toc-section">
    <div class="toc-section-title">3. System Design (HLD + LLD)</div>
    <div class="toc-item"><span class="toc-item-name">3.1 Three-Tier Architecture Diagram</span><span class="toc-dots"></span><span class="toc-item-page">§3</span></div>
    <div class="toc-item"><span class="toc-item-name">3.2 Data Flow Diagrams — Level 0 &amp; Level 1</span><span class="toc-dots"></span><span class="toc-item-page">§3</span></div>
    <div class="toc-item"><span class="toc-item-name">3.3 Sequence Diagrams — Login, Transaction Entry, Report Generation</span><span class="toc-dots"></span><span class="toc-item-page">§3</span></div>
    <div class="toc-item"><span class="toc-item-name">3.4 Use Case Diagram (Textual)</span><span class="toc-dots"></span><span class="toc-item-page">§3</span></div>
    <div class="toc-item"><span class="toc-item-name">3.5 Class Diagram — Domain Model + Services</span><span class="toc-dots"></span><span class="toc-item-page">§3</span></div>
    <div class="toc-item"><span class="toc-item-name">3.6 Module Breakdown — Frontend, Backend, DB Layer</span><span class="toc-dots"></span><span class="toc-item-page">§3</span></div>
    <div class="toc-item"><span class="toc-item-name">3.7 Technology Choices Justification</span><span class="toc-dots"></span><span class="toc-item-page">§3</span></div>
    <div class="toc-item"><span class="toc-item-name">3.8 Core Function Logic — FIFO, XIRR, Monte Carlo, SIP PMT</span><span class="toc-dots"></span><span class="toc-item-page">§3</span></div>
    <div class="toc-item"><span class="toc-item-name">3.9 Cross-Layer Data Flow Explanation</span><span class="toc-dots"></span><span class="toc-item-page">§3</span></div>
  </div>

  <div class="toc-section">
    <div class="toc-section-title">4. REST API Documentation</div>
    <div class="toc-item"><span class="toc-item-name">4.1 Authentication APIs — Register, Login, OTP Reset</span><span class="toc-dots"></span><span class="toc-item-page">§4</span></div>
    <div class="toc-item"><span class="toc-item-name">4.2 Profile APIs</span><span class="toc-dots"></span><span class="toc-item-page">§4</span></div>
    <div class="toc-item"><span class="toc-item-name">4.3 Transaction APIs — CRUD + CSV Import</span><span class="toc-dots"></span><span class="toc-item-page">§4</span></div>
    <div class="toc-item"><span class="toc-item-name">4.4 Holdings APIs — Aggregate + Lot Drill-down</span><span class="toc-dots"></span><span class="toc-item-page">§4</span></div>
    <div class="toc-item"><span class="toc-item-name">4.5 Goals APIs — CRUD, Links, Monte Carlo Simulation</span><span class="toc-dots"></span><span class="toc-item-page">§4</span></div>
    <div class="toc-item"><span class="toc-item-name">4.6 Analytics &amp; Tax APIs — Timeline, STCG/LTCG</span><span class="toc-dots"></span><span class="toc-item-page">§4</span></div>
    <div class="toc-item"><span class="toc-item-name">4.7 Scheme &amp; Fund Search APIs — Trigram Search, NAV</span><span class="toc-dots"></span><span class="toc-item-page">§4</span></div>
    <div class="toc-item"><span class="toc-item-name">4.8–4.9 Alerts &amp; Settings APIs</span><span class="toc-dots"></span><span class="toc-item-page">§4</span></div>
    <div class="toc-item"><span class="toc-item-name">4.10 Error Reference — Status Codes &amp; Error Envelopes</span><span class="toc-dots"></span><span class="toc-item-page">§4</span></div>
  </div>

  <div class="toc-section">
    <div class="toc-section-title">5. User Manual</div>
    <div class="toc-item"><span class="toc-item-name">5.1–5.2 System Overview &amp; Getting Started</span><span class="toc-dots"></span><span class="toc-item-page">§5</span></div>
    <div class="toc-item"><span class="toc-item-name">5.3 Dashboard Navigation</span><span class="toc-dots"></span><span class="toc-item-page">§5</span></div>
    <div class="toc-item"><span class="toc-item-name">5.4 Transactions — Add, Filter, CSV Import</span><span class="toc-dots"></span><span class="toc-item-page">§5</span></div>
    <div class="toc-item"><span class="toc-item-name">5.5 Portfolio &amp; Analytics — Holdings, Timeline, Tax Summary</span><span class="toc-dots"></span><span class="toc-item-page">§5</span></div>
    <div class="toc-item"><span class="toc-item-name">5.6 Financial Goals — Wizard, Monte Carlo, Fund Linking</span><span class="toc-dots"></span><span class="toc-item-page">§5</span></div>
    <div class="toc-item"><span class="toc-item-name">5.7–5.10 Investments, Notifications, Settings, Profile</span><span class="toc-dots"></span><span class="toc-item-page">§5</span></div>
    <div class="toc-item"><span class="toc-item-name">5.11 FAQs</span><span class="toc-dots"></span><span class="toc-item-page">§5</span></div>
  </div>
</div>

${sectionBlocks}

</body>
</html>`;
}

// ── Generate PDF ──────────────────────────────────────────────────────────────
(async () => {
  console.log('📄 WealthWise Documentation PDF Generator');
  console.log('─'.repeat(52));

  const outputPath = path.join(DOCS_DIR, 'WealthWise_Complete_Documentation.pdf');
  const htmlPath   = path.join(DOCS_DIR, 'WealthWise_Documentation.html');

  console.log('📝 Building HTML from markdown files...');
  let htmlContent;
  try {
    htmlContent = buildHtml();
  } catch (err) {
    console.error('❌ Failed to build HTML:', err.message);
    process.exit(1);
  }

  fs.writeFileSync(htmlPath, htmlContent, 'utf8');
  console.log(`✅ HTML written to: ${htmlPath}`);

  console.log('🚀 Launching Chromium via Playwright...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.setContent(htmlContent, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  console.log('🖨️  Generating PDF (A4)...');
  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '20mm', right: '18mm', bottom: '22mm', left: '18mm' },
    displayHeaderFooter: true,
    headerTemplate: `<div style="font-size:8px;color:#9ca3af;width:100%;padding:0 18mm;display:flex;justify-content:space-between;font-family:sans-serif"><span>WealthWise Technical Documentation</span><span>Confidential | April 2026</span></div>`,
    footerTemplate: `<div style="font-size:8px;color:#9ca3af;width:100%;padding:0 18mm;display:flex;justify-content:space-between;font-family:sans-serif"><span>© 2026 WealthWise. All Rights Reserved.</span><span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span></div>`,
  });

  await browser.close();

  const fileSizeKB = (fs.statSync(outputPath).size / 1024).toFixed(0);
  console.log('─'.repeat(52));
  console.log(`✅ PDF generated successfully!`);
  console.log(`📁 Location: ${outputPath}`);
  console.log(`📊 File size: ${fileSizeKB} KB`);
  console.log('─'.repeat(52));
})();
