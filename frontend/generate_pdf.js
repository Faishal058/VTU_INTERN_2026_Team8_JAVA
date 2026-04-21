/**
 * WealthWise Documentation PDF Generator
 * Uses Playwright (already installed) to render HTML → beautiful PDF
 * Run: node generate_pdf.js
 */

const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

// ── Simple Markdown → HTML converter ─────────────────────────────────────────
function mdToHtml(md) {
  let html = md
    // Escapes
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

    // Code blocks (fenced)
    .replace(/```[\s\S]*?```/g, m => {
      const inner = m.replace(/```[a-z]*\n?/, '').replace(/```$/, '');
      return `<pre><code>${inner}</code></pre>`;
    })

    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')

    // Horizontal rule
    .replace(/^---$/gm, '<hr>')

    // ATX Headings
    .replace(/^###### (.+)$/gm, '<h6>$1</h6>')
    .replace(/^##### (.+)$/gm, '<h5>$1</h5>')
    .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')

    // Bold + Italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')

    // Blockquotes
    .replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>')

    // Tables
    .replace(/(\|.+\|\n)(\|[-| :]+\|\n)((\|.+\|\n)*)/g, (match) => {
      const rows = match.trim().split('\n').filter(r => r.trim());
      const headers = rows[0].split('|').filter(c => c.trim()).map(c => `<th>${c.trim()}</th>`).join('');
      const bodyRows = rows.slice(2).map(row => {
        const cells = row.split('|').filter(c => c.trim() !== undefined && row.includes('|'))
          .filter((_, i, arr) => i > 0 && i < arr.length - 0)
          .map(c => `<td>${c.trim()}</td>`).join('');
        return `<tr>${cells}</tr>`;
      }).join('');
      return `<table><thead><tr>${headers}</tr></thead><tbody>${bodyRows}</tbody></table>`;
    })

    // Unordered lists
    .replace(/((?:^[*\-+] .+\n?)+)/gm, match => {
      const items = match.trim().split('\n').map(i => `<li>${i.replace(/^[*\-+] /, '')}</li>`).join('');
      return `<ul>${items}</ul>`;
    })

    // Ordered lists
    .replace(/((?:^\d+\. .+\n?)+)/gm, match => {
      const items = match.trim().split('\n').map(i => `<li>${i.replace(/^\d+\. /, '')}</li>`).join('');
      return `<ol>${items}</ol>`;
    })

    // Line breaks & paragraphs
    .replace(/\n\n+/g, '\n</p>\n<p>')
    .replace(/^(.+)$/gm, (line) => {
      if (line.startsWith('<') || line === '') return line;
      return line;
    });

  return html;
}

// ── Read all doc files ────────────────────────────────────────────────────────
const docsDir = path.join(__dirname);
const docFiles = [
  '01_SYNOPSIS.md',
  '02_SRS.md',
  '03_SYSTEM_DESIGN.md',
  '04_API_DOCUMENTATION.md',
  '05_USER_MANUAL.md',
];

function buildHtml() {
  const sections = docFiles.map(file => {
    const filePath = path.join(docsDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    return mdToHtml(content);
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>WealthWise — Complete Technical Documentation</title>
<style>
  /* ── Fonts ── */
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

  /* ── Reset & Base ── */
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 10.5pt;
    line-height: 1.7;
    color: #1a1f2e;
    background: #ffffff;
  }

  /* ── Cover Page ── */
  .cover-page {
    page-break-after: always;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #0f1624 0%, #1a2640 50%, #0d1f3c 100%);
    color: white;
    text-align: center;
    padding: 60px 40px;
    position: relative;
    overflow: hidden;
  }

  .cover-page::before {
    content: '';
    position: absolute;
    width: 600px;
    height: 600px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(180,255,69,0.08) 0%, transparent 70%);
    top: -200px;
    right: -200px;
  }

  .cover-page::after {
    content: '';
    position: absolute;
    width: 400px;
    height: 400px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%);
    bottom: -150px;
    left: -100px;
  }

  .cover-logo {
    font-size: 18pt;
    font-weight: 700;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: #b4ff45;
    margin-bottom: 16px;
    position: relative;
    z-index: 1;
  }

  .cover-logo span {
    color: rgba(180,255,69,0.6);
  }

  .cover-divider {
    width: 80px;
    height: 3px;
    background: linear-gradient(90deg, #b4ff45, #3b82f6);
    margin: 20px auto;
    border-radius: 2px;
    position: relative;
    z-index: 1;
  }

  .cover-title {
    font-size: 30pt;
    font-weight: 700;
    color: #ffffff;
    line-height: 1.2;
    margin-bottom: 16px;
    position: relative;
    z-index: 1;
  }

  .cover-subtitle {
    font-size: 13pt;
    color: rgba(255,255,255,0.65);
    margin-bottom: 40px;
    max-width: 600px;
    position: relative;
    z-index: 1;
  }

  .cover-meta {
    display: flex;
    gap: 40px;
    justify-content: center;
    flex-wrap: wrap;
    position: relative;
    z-index: 1;
    margin-top: 20px;
  }

  .cover-meta-item {
    text-align: center;
  }

  .cover-meta-label {
    font-size: 7.5pt;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: rgba(255,255,255,0.4);
    margin-bottom: 4px;
  }

  .cover-meta-value {
    font-size: 10pt;
    font-weight: 600;
    color: rgba(255,255,255,0.9);
  }

  .cover-badge {
    display: inline-block;
    background: rgba(180,255,69,0.15);
    border: 1px solid rgba(180,255,69,0.3);
    color: #b4ff45;
    font-size: 8pt;
    padding: 5px 14px;
    border-radius: 999px;
    margin: 6px 4px;
    font-weight: 500;
    letter-spacing: 0.5px;
  }

  .cover-badges {
    margin: 30px auto;
    max-width: 500px;
    position: relative;
    z-index: 1;
  }

  /* ── TOC Page ── */
  .toc-page {
    page-break-after: always;
    padding: 50px 60px;
  }

  .toc-title {
    font-size: 22pt;
    font-weight: 700;
    color: #0f1624;
    margin-bottom: 8px;
    border-bottom: 3px solid #b4ff45;
    padding-bottom: 12px;
  }

  .toc-subtitle {
    font-size: 9.5pt;
    color: #6b7280;
    margin-bottom: 32px;
  }

  .toc-section {
    margin-bottom: 24px;
  }

  .toc-section-title {
    font-size: 12pt;
    font-weight: 700;
    color: #0f1624;
    border-left: 4px solid #b4ff45;
    padding-left: 12px;
    margin-bottom: 10px;
  }

  .toc-item {
    display: flex;
    align-items: baseline;
    padding: 4px 0 4px 20px;
    border-bottom: 1px dotted #e5e7eb;
  }

  .toc-item-name {
    font-size: 9.5pt;
    color: #374151;
  }

  .toc-dots {
    flex: 1;
    border-bottom: 1px dotted #d1d5db;
    margin: 0 8px;
    position: relative;
    top: -2px;
  }

  .toc-item-page {
    font-size: 8.5pt;
    color: #6b7280;
    font-weight: 500;
  }

  /* ── Document Sections ── */
  .doc-section {
    page-break-before: always;
    padding: 0;
  }

  .section-header {
    background: linear-gradient(135deg, #0f1624 0%, #1a2640 100%);
    color: white;
    padding: 28px 48px;
    margin-bottom: 32px;
    position: relative;
    overflow: hidden;
  }

  .section-header::after {
    content: attr(data-number);
    position: absolute;
    right: 40px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 72pt;
    font-weight: 800;
    opacity: 0.06;
    color: white;
    line-height: 1;
  }

  .section-number {
    font-size: 8.5pt;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 2px;
    color: #b4ff45;
    margin-bottom: 8px;
  }

  .section-title {
    font-size: 22pt;
    font-weight: 700;
    color: white;
    line-height: 1.2;
  }

  /* ── Content Area ── */
  .content-area {
    padding: 0 48px 48px;
  }

  /* ── Typography ── */
  h1 { font-size: 20pt; font-weight: 700; color: #0f1624; margin: 28px 0 14px; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb; }
  h2 { font-size: 15pt; font-weight: 700; color: #1e3a5f; margin: 24px 0 12px; padding-bottom: 6px; border-bottom: 1px solid #e5e7eb; }
  h3 { font-size: 12pt; font-weight: 600; color: #1f2937; margin: 18px 0 8px; }
  h4 { font-size: 10.5pt; font-weight: 600; color: #374151; margin: 16px 0 6px; }
  h5, h6 { font-size: 10pt; font-weight: 600; color: #4b5563; margin: 12px 0 6px; }

  p { margin-bottom: 10px; color: #374151; line-height: 1.75; }

  strong { font-weight: 600; color: #111827; }
  em { font-style: italic; color: #4b5563; }

  /* ── Code ── */
  code {
    font-family: 'JetBrains Mono', 'Cascadia Code', 'Fira Code', 'Consolas', monospace;
    font-size: 8.5pt;
    background: #f3f4f6;
    color: #1f2937;
    padding: 1px 5px;
    border-radius: 3px;
    border: 1px solid #e5e7eb;
  }

  pre {
    background: #0f1624;
    border: 1px solid #1e3a5f;
    border-radius: 8px;
    padding: 16px 20px;
    overflow-x: auto;
    margin: 14px 0;
    page-break-inside: avoid;
  }

  pre code {
    font-family: 'JetBrains Mono', 'Cascadia Code', 'Fira Code', 'Consolas', monospace;
    font-size: 7.5pt;
    background: transparent;
    color: #a5f3fc;
    padding: 0;
    border: none;
    border-radius: 0;
    line-height: 1.6;
    white-space: pre;
  }

  /* ── Tables ── */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 14px 0;
    font-size: 9pt;
    page-break-inside: avoid;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    border-radius: 6px;
    overflow: hidden;
  }

  thead {
    background: linear-gradient(135deg, #0f1624 0%, #1e3a5f 100%);
    color: white;
  }

  th {
    padding: 10px 14px;
    text-align: left;
    font-weight: 600;
    font-size: 8.5pt;
    letter-spacing: 0.3px;
    text-transform: uppercase;
    color: #ffffff;
  }

  td {
    padding: 9px 14px;
    color: #374151;
    border-bottom: 1px solid #f3f4f6;
    vertical-align: top;
    line-height: 1.5;
  }

  tbody tr:last-child td { border-bottom: none; }
  tbody tr:nth-child(even) { background: #f9fafb; }
  tbody tr:hover { background: #f0fdf4; }

  /* ── Lists ── */
  ul, ol {
    margin: 10px 0 10px 22px;
    padding: 0;
    color: #374151;
  }

  li {
    margin-bottom: 5px;
    line-height: 1.65;
  }

  li::marker { color: #b4ff45; font-weight: 700; }

  /* ── Blockquotes ── */
  blockquote {
    border-left: 4px solid #b4ff45;
    background: #f0fdf4;
    padding: 12px 18px;
    margin: 14px 0;
    border-radius: 0 6px 6px 0;
    font-style: normal;
    color: #1f2937;
    font-size: 9.5pt;
  }

  /* ── Horizontal Rule ── */
  hr {
    border: none;
    border-top: 1px solid #e5e7eb;
    margin: 24px 0;
  }

  /* ── Info Box ── */
  .info-box {
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    border-radius: 8px;
    padding: 14px 18px;
    margin: 14px 0;
    font-size: 9.5pt;
    color: #1e40af;
  }

  /* ── Page Breaks ── */
  .page-break { page-break-after: always; }

  /* ── Print Settings ── */
  @page {
    size: A4;
    margin: 20mm 18mm 22mm;

    @bottom-center {
      content: "WealthWise Technical Documentation — Page " counter(page) " of " counter(pages);
      font-size: 7.5pt;
      color: #9ca3af;
      font-family: 'Inter', sans-serif;
    }

    @top-right {
      content: "Confidential | April 2026";
      font-size: 7pt;
      color: #d1d5db;
      font-family: 'Inter', sans-serif;
    }
  }

  @page :first {
    @bottom-center { content: none; }
    @top-right { content: none; }
    margin: 0;
  }

  /* ── Section label stripes in headings ── */
  h2::before {
    display: inline-block;
    width: 4px;
    height: 1em;
    background: #b4ff45;
    margin-right: 10px;
    border-radius: 2px;
    vertical-align: text-bottom;
    content: '';
  }
</style>
</head>
<body>

<!-- ═══════════════════════ COVER PAGE ═══════════════════════ -->
<div class="cover-page">
  <div class="cover-logo">Wealth<span>Wise</span></div>
  <div class="cover-divider"></div>
  <div class="cover-title">Complete Technical<br>Documentation</div>
  <div class="cover-subtitle">
    An AI-Augmented Smart Mutual Fund Management &amp; Financial Intelligence Platform
  </div>
  <div class="cover-badges">
    <span class="cover-badge">Synopsis</span>
    <span class="cover-badge">SRS v2.0</span>
    <span class="cover-badge">System Design (HLD + LLD)</span>
    <span class="cover-badge">REST API Reference</span>
    <span class="cover-badge">User Manual</span>
  </div>
  <div class="cover-meta">
    <div class="cover-meta-item">
      <div class="cover-meta-label">Version</div>
      <div class="cover-meta-value">1.0 (MVR)</div>
    </div>
    <div class="cover-meta-item">
      <div class="cover-meta-label">Date</div>
      <div class="cover-meta-value">April 2026</div>
    </div>
    <div class="cover-meta-item">
      <div class="cover-meta-label">Status</div>
      <div class="cover-meta-value">Approved</div>
    </div>
    <div class="cover-meta-item">
      <div class="cover-meta-label">Domain</div>
      <div class="cover-meta-value">FinTech / MF</div>
    </div>
    <div class="cover-meta-item">
      <div class="cover-meta-label">Stack</div>
      <div class="cover-meta-value">React + Spring Boot</div>
    </div>
  </div>
</div>

<!-- ═══════════════════════ TABLE OF CONTENTS ═══════════════════════ -->
<div class="toc-page">
  <div class="toc-title">Table of Contents</div>
  <div class="toc-subtitle">WealthWise Complete Technical Documentation — All Sections</div>

  <div class="toc-section">
    <div class="toc-section-title">1. Project Synopsis</div>
    <div class="toc-item"><span class="toc-item-name">1.1 Project Title &amp; Overview</span><span class="toc-dots"></span><span class="toc-item-page">§1</span></div>
    <div class="toc-item"><span class="toc-item-name">1.2 Problem Statement</span><span class="toc-dots"></span><span class="toc-item-page">§1</span></div>
    <div class="toc-item"><span class="toc-item-name">1.3 Objectives (Short-term &amp; Long-term)</span><span class="toc-dots"></span><span class="toc-item-page">§1</span></div>
    <div class="toc-item"><span class="toc-item-name">1.4 Scope of the System</span><span class="toc-dots"></span><span class="toc-item-page">§1</span></div>
    <div class="toc-item"><span class="toc-item-name">1.5 Key Features Overview</span><span class="toc-dots"></span><span class="toc-item-page">§1</span></div>
    <div class="toc-item"><span class="toc-item-name">1.6 Technology Stack</span><span class="toc-dots"></span><span class="toc-item-page">§1</span></div>
  </div>

  <div class="toc-section">
    <div class="toc-section-title">2. Software Requirements Specification (SRS)</div>
    <div class="toc-item"><span class="toc-item-name">2.1 Introduction (Purpose, Scope, Glossary)</span><span class="toc-dots"></span><span class="toc-item-page">§2</span></div>
    <div class="toc-item"><span class="toc-item-name">2.2 Overall Description (Architecture, User Classes)</span><span class="toc-dots"></span><span class="toc-item-page">§2</span></div>
    <div class="toc-item"><span class="toc-item-name">2.3 Functional Requirements (Auth, Transactions, Holdings, Goals, Analytics, Alerts)</span><span class="toc-dots"></span><span class="toc-item-page">§2</span></div>
    <div class="toc-item"><span class="toc-item-name">2.4 Non-Functional Requirements (Performance, Security, Scalability)</span><span class="toc-dots"></span><span class="toc-item-page">§2</span></div>
    <div class="toc-item"><span class="toc-item-name">2.5 Business Rules</span><span class="toc-dots"></span><span class="toc-item-page">§2</span></div>
    <div class="toc-item"><span class="toc-item-name">2.6 Use Cases (UC-01 to UC-05)</span><span class="toc-dots"></span><span class="toc-item-page">§2</span></div>
  </div>

  <div class="toc-section">
    <div class="toc-section-title">3. System Design (HLD + LLD)</div>
    <div class="toc-item"><span class="toc-item-name">3.1 Architecture Diagram</span><span class="toc-dots"></span><span class="toc-item-page">§3</span></div>
    <div class="toc-item"><span class="toc-item-name">3.2 Data Flow Diagrams (Level 0 &amp; Level 1)</span><span class="toc-dots"></span><span class="toc-item-page">§3</span></div>
    <div class="toc-item"><span class="toc-item-name">3.3 Sequence Diagrams (Login, Transaction, Report)</span><span class="toc-dots"></span><span class="toc-item-page">§3</span></div>
    <div class="toc-item"><span class="toc-item-name">3.4 Use Case Diagram</span><span class="toc-dots"></span><span class="toc-item-page">§3</span></div>
    <div class="toc-item"><span class="toc-item-name">3.5 Class Diagram (Domain Model + Service Classes)</span><span class="toc-dots"></span><span class="toc-item-page">§3</span></div>
    <div class="toc-item"><span class="toc-item-name">3.6 Module Breakdown (Frontend, Backend, Database)</span><span class="toc-dots"></span><span class="toc-item-page">§3</span></div>
    <div class="toc-item"><span class="toc-item-name">3.7 Technology Choices Justification</span><span class="toc-dots"></span><span class="toc-item-page">§3</span></div>
    <div class="toc-item"><span class="toc-item-name">3.8 Core Function Logic (FIFO, XIRR, Monte Carlo, SIP PMT)</span><span class="toc-dots"></span><span class="toc-item-page">§3</span></div>
    <div class="toc-item"><span class="toc-item-name">3.9 Data Flow Explanation</span><span class="toc-dots"></span><span class="toc-item-page">§3</span></div>
  </div>

  <div class="toc-section">
    <div class="toc-section-title">4. API Documentation</div>
    <div class="toc-item"><span class="toc-item-name">4.1 Authentication APIs (Register, Login, OTP Reset)</span><span class="toc-dots"></span><span class="toc-item-page">§4</span></div>
    <div class="toc-item"><span class="toc-item-name">4.2 Profile APIs</span><span class="toc-dots"></span><span class="toc-item-page">§4</span></div>
    <div class="toc-item"><span class="toc-item-name">4.3 Transaction APIs (CRUD + CSV Import)</span><span class="toc-dots"></span><span class="toc-item-page">§4</span></div>
    <div class="toc-item"><span class="toc-item-name">4.4 Holdings APIs (Aggregate + Lot Drill-down)</span><span class="toc-dots"></span><span class="toc-item-page">§4</span></div>
    <div class="toc-item"><span class="toc-item-name">4.5 Goals APIs (CRUD + Links + Monte Carlo)</span><span class="toc-dots"></span><span class="toc-item-page">§4</span></div>
    <div class="toc-item"><span class="toc-item-name">4.6 Analytics &amp; Tax APIs</span><span class="toc-dots"></span><span class="toc-item-page">§4</span></div>
    <div class="toc-item"><span class="toc-item-name">4.7 Scheme &amp; Fund Search APIs</span><span class="toc-dots"></span><span class="toc-item-page">§4</span></div>
    <div class="toc-item"><span class="toc-item-name">4.8 Alerts APIs</span><span class="toc-dots"></span><span class="toc-item-page">§4</span></div>
    <div class="toc-item"><span class="toc-item-name">4.9 Settings APIs</span><span class="toc-dots"></span><span class="toc-item-page">§4</span></div>
    <div class="toc-item"><span class="toc-item-name">4.10 Error Reference</span><span class="toc-dots"></span><span class="toc-item-page">§4</span></div>
  </div>

  <div class="toc-section">
    <div class="toc-section-title">5. User Manual</div>
    <div class="toc-item"><span class="toc-item-name">5.1 System Overview</span><span class="toc-dots"></span><span class="toc-item-page">§5</span></div>
    <div class="toc-item"><span class="toc-item-name">5.2 Getting Started (Registration, Login, Password Reset)</span><span class="toc-dots"></span><span class="toc-item-page">§5</span></div>
    <div class="toc-item"><span class="toc-item-name">5.3 Dashboard Navigation</span><span class="toc-dots"></span><span class="toc-item-page">§5</span></div>
    <div class="toc-item"><span class="toc-item-name">5.4 Transactions</span><span class="toc-dots"></span><span class="toc-item-page">§5</span></div>
    <div class="toc-item"><span class="toc-item-name">5.5 Portfolio &amp; Analytics</span><span class="toc-dots"></span><span class="toc-item-page">§5</span></div>
    <div class="toc-item"><span class="toc-item-name">5.6 Financial Goals</span><span class="toc-dots"></span><span class="toc-item-page">§5</span></div>
    <div class="toc-item"><span class="toc-item-name">5.7 Investments (SIP Plans)</span><span class="toc-dots"></span><span class="toc-item-page">§5</span></div>
    <div class="toc-item"><span class="toc-item-name">5.8 Notifications &amp; Alerts</span><span class="toc-dots"></span><span class="toc-item-page">§5</span></div>
    <div class="toc-item"><span class="toc-item-name">5.9 Settings</span><span class="toc-dots"></span><span class="toc-item-page">§5</span></div>
    <div class="toc-item"><span class="toc-item-name">5.10 Profile Management</span><span class="toc-dots"></span><span class="toc-item-page">§5</span></div>
    <div class="toc-item"><span class="toc-item-name">5.11 Frequently Asked Questions</span><span class="toc-dots"></span><span class="toc-item-page">§5</span></div>
  </div>
</div>

<!-- ═══════════════════════ SECTION 1: SYNOPSIS ═══════════════════════ -->
<div class="doc-section">
  <div class="section-header" data-number="1">
    <div class="section-number">Document 01</div>
    <div class="section-title">Project Synopsis</div>
  </div>
  <div class="content-area">
${sections[0]}
  </div>
</div>

<!-- ═══════════════════════ SECTION 2: SRS ═══════════════════════ -->
<div class="doc-section">
  <div class="section-header" data-number="2">
    <div class="section-number">Document 02</div>
    <div class="section-title">Software Requirements Specification</div>
  </div>
  <div class="content-area">
${sections[1]}
  </div>
</div>

<!-- ═══════════════════════ SECTION 3: SYSTEM DESIGN ═══════════════════════ -->
<div class="doc-section">
  <div class="section-header" data-number="3">
    <div class="section-number">Document 03</div>
    <div class="section-title">System Design (HLD + LLD)</div>
  </div>
  <div class="content-area">
${sections[2]}
  </div>
</div>

<!-- ═══════════════════════ SECTION 4: API DOCS ═══════════════════════ -->
<div class="doc-section">
  <div class="section-header" data-number="4">
    <div class="section-number">Document 04</div>
    <div class="section-title">REST API Documentation</div>
  </div>
  <div class="content-area">
${sections[3]}
  </div>
</div>

<!-- ═══════════════════════ SECTION 5: USER MANUAL ═══════════════════════ -->
<div class="doc-section">
  <div class="section-header" data-number="5">
    <div class="section-number">Document 05</div>
    <div class="section-title">User Manual</div>
  </div>
  <div class="content-area">
${sections[4]}
  </div>
</div>

</body>
</html>`;
}

// ── Generate PDF ──────────────────────────────────────────────────────────────
(async () => {
  console.log('📄 WealthWise Documentation PDF Generator');
  console.log('─'.repeat(50));

  const outputPath = path.join(__dirname, 'WealthWise_Complete_Documentation.pdf');
  const htmlPath   = path.join(__dirname, 'WealthWise_Documentation.html');

  console.log('📝 Building HTML from markdown files...');
  const htmlContent = buildHtml();
  fs.writeFileSync(htmlPath, htmlContent, 'utf8');
  console.log(`✅ HTML written: ${htmlPath}`);

  console.log('🚀 Launching Chromium via Playwright...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.setContent(htmlContent, {
    waitUntil: 'networkidle',
    timeout: 30000,
  });

  // Wait for Google Fonts to load
  await page.waitForTimeout(2000);

  console.log('🖨️  Generating PDF (A4, all sections)...');
  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '20mm', right: '18mm', bottom: '22mm', left: '18mm' },
    displayHeaderFooter: true,
    headerTemplate: `
      <div style="font-family: Inter, sans-serif; font-size: 8px; color: #9ca3af; width: 100%; padding: 0 18mm; display: flex; justify-content: space-between;">
        <span>WealthWise Technical Documentation</span>
        <span>Confidential | April 2026</span>
      </div>`,
    footerTemplate: `
      <div style="font-family: Inter, sans-serif; font-size: 8px; color: #9ca3af; width: 100%; padding: 0 18mm; display: flex; justify-content: space-between;">
        <span>© 2026 WealthWise. All Rights Reserved.</span>
        <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
      </div>`,
  });

  await browser.close();

  const fileSizeKB = (fs.statSync(outputPath).size / 1024).toFixed(1);
  console.log('─'.repeat(50));
  console.log(`✅ PDF generated successfully!`);
  console.log(`📁 Output: ${outputPath}`);
  console.log(`📊 File size: ${fileSizeKB} KB`);
  console.log('─'.repeat(50));
})();
