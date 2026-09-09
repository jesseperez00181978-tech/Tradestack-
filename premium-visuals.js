(function () {
  'use strict';

  const TYPES = ['PHOTO', 'DIAGRAM', 'FLOWCHART', 'COMPARISON', 'NONE'];
  const selected = {
    'Diesel & Heavy Equipment': [1, 7, 10, 14, 18],
    'Solar Power': [1, 2, 4, 9, 17],
    'Electric Vehicles': [1, 2, 8, 13, 19],
    'Roofing': [2, 6, 13, 17, 19],
    'Decks & Outdoor Structures': [3, 6, 12, 16, 17],
    'Exteriors & Siding': [2, 3, 9, 10, 14],
    'Doors & Windows': [2, 3, 9, 12, 14],
    'Masonry & Concrete': [3, 5, 6, 11, 17],
    'Painting & Drywall': [2, 6, 11, 12, 19],
    'Fencing & Gates': [2, 3, 9, 13, 17],
    'Welding & Fabrication': [1, 2, 5, 14, 18],
    'Battery & Backup Power': [1, 2, 12, 13, 18],
    'Structural Framing': [1, 6, 8, 13, 19],
    'Drainage & Waterproofing': [2, 6, 10, 11, 16],
    'Appliance Repair': [1, 2, 3, 17, 19],
    'Commercial Maintenance': [1, 4, 8, 14, 18],
    'Ventilation & Indoor Air Quality': [1, 2, 9, 17, 18],
    'Bathroom & Kitchen Remodel Systems': [1, 2, 5, 10, 11],
    'Home Inspection Basics': [1, 3, 4, 15, 18],
    'Fire Protection Basics': [1, 4, 8, 15, 19]
  };

  const esc = (value) => String(value == null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  const clean = (value) => String(value || '').replace(/\s+/g, ' ').trim();
  const short = (value, max) => {
    const text = clean(value);
    return text.length > max ? text.slice(0, max - 1).replace(/\s+\S*$/, '') + '...' : text;
  };

  function classify(title) {
    const text = clean(title).toLowerCase();
    if (/no-start|no start|will not|diagnos|troubleshoot|fault|failure|underperformance|low production|slow recharge|rapid discharge|overheat|overheating|leak diagnosis|water intrusion|crack diagnosis|damage diagnosis|imbalance|drift|sag &|clog|peeling|blistering|backdraft|defect recognition|repair-or-replace/.test(text)) return 'FLOWCHART';
    if (/inspection|assessment|recognition|visual|survey|damage mapping|pre-purchase|condition check|site survey/.test(text)) return 'PHOTO';
    if (/types|selection|fundamentals|basics|architecture|concepts|merv|chemistry|material basics|level 1|level 2|dc fast|open, closed|lithium|lead-acid|mig|flux-core|stick|tig|comparison/.test(text)) return 'COMPARISON';
    if (/install|installation|layout|system|wiring|framing|flashing|roof|drain|piping|rough-in|plumbing|valve|racking|array|connection|sizing|waterproofing|water path|ventilation|joist|beam|post|stair|tile|cabinet|controller|charging/.test(text)) return 'DIAGRAM';
    return 'NONE';
  }

  function isSelected(trade, number) {
    return Boolean(selected[trade] && selected[trade].indexOf(Number(number)) !== -1);
  }

  function guideNumber(article) {
    const input = article.querySelector('[data-check], .done input');
    if (input && input.dataset.id) {
      const match = input.dataset.id.match(/(?:^|[-_])(\d+)$/);
      if (match) return Number(match[1]);
    }
    const number = article.querySelector('.num');
    const match = number && number.textContent.match(/(\d+)/);
    return match ? Number(match[1]) : 0;
  }

  function stepsFor(article) {
    return Array.from(article.querySelectorAll('.body ol li, .detail ol li'))
      .map((item) => clean(item.textContent)).filter(Boolean);
  }

  function visualHeader(type, title) {
    return '<div class="ts-visual-head"><span class="ts-kind ts-' + type.toLowerCase() + '">' + type + '</span><span>' + esc(title) + '</span></div>';
  }

  function diagram(title, steps) {
    const items = (steps.length ? steps : ['Identify the system', 'Check the critical connection', 'Test the operating condition', 'Verify and document']).slice(0, 4);
    return '<section class="ts-visual ts-diagram" aria-label="Diagram for ' + esc(title) + '">' + visualHeader('DIAGRAM', title) +
      '<div class="ts-path">' + items.map((item, index) => '<div class="ts-node"><small>' + String(index + 1).padStart(2, '0') + '</small><strong>' + esc(short(item, 78)) + '</strong></div>').join('<span class="ts-arrow" aria-hidden="true">&rarr;</span>') + '</div>' +
      '<p class="ts-caption">Read left to right: the next box depends on the condition in the previous box.</p></section>';
  }

  function flowchart(title, steps) {
    const items = (steps.length ? steps : ['Confirm the symptom', 'Check the basic input', 'Test the likely branch', 'Repair, retest, or escalate']).slice(0, 4);
    return '<section class="ts-visual ts-flowchart" aria-label="Flowchart for ' + esc(title) + '">' + visualHeader('FLOWCHART', title) +
      '<div class="ts-decision-path">' + items.map((item, index) => '<div class="ts-decision"><b>' + (index === 0 ? 'START' : index === items.length - 1 ? 'VERIFY' : 'CHECK') + '</b><span>' + esc(short(item, 82)) + '</span></div>').join('<span class="ts-down" aria-hidden="true">&darr;</span>') + '</div>' +
      '<p class="ts-caption">If a check fails, stop at that branch and correct the cause before moving on.</p></section>';
  }

  function comparison(title, steps) {
    const text = title.toLowerCase();
    let columns = ['Existing condition', 'Specified method', 'Escalation boundary'];
    if (/level 1|level 2|dc fast/.test(text)) columns = ['Level 1 AC', 'Level 2 AC', 'DC fast charge'];
    else if (/lithium|lead-acid/.test(text)) columns = ['Lithium-ion', 'Lead-acid', 'System constraint'];
    else if (/open, closed|valley/.test(text)) columns = ['Open valley', 'Closed-cut', 'Woven'];
    else if (/string inverter|microinverter|optimizer/.test(text)) columns = ['String inverter', 'Optimizer', 'Microinverter'];
    else if (/mig|flux-core|stick|tig/.test(text)) columns = ['MIG / GMAW', 'Flux-core / FCAW', 'Stick or TIG'];
    else if (/merv|filtration|filter selection/.test(text)) columns = ['Lower resistance', 'Higher filtration', 'System check'];
    const rows = [
      ['Best first question', steps[0] || 'What condition is actually present?'],
      ['Choose it when', steps[1] || 'The surrounding system supports the choice.'],
      ['Watch for', steps[2] || 'A limit that changes the safe next step.']
    ];
    return '<section class="ts-visual ts-comparison" aria-label="Comparison for ' + esc(title) + '">' + visualHeader('COMPARISON', title) +
      '<div class="ts-table-wrap"><table><thead><tr><th>Decision point</th>' + columns.map((column) => '<th>' + esc(column) + '</th>').join('') + '</tr></thead><tbody>' +
      rows.map((row) => '<tr><th>' + esc(row[0]) + '</th>' + columns.map((column, index) => '<td>' + esc(short(index === 0 ? row[1] : index === 1 ? (steps[3] || 'Follow listed instructions.') : (steps[4] || 'Escalate when the limit is unknown.'), 72)) + '</td>').join('') + '</tr>').join('') +
      '</tbody></table></div></section>';
  }

  function photoBoard(title) {
    const subject = short(title.replace(/\b(fundamentals?|basics?|inspection|assessment)\b/gi, '').replace(/\s+/g, ' '), 58);
    return '<section class="ts-visual ts-photo" aria-label="Photo reference plan for ' + esc(title) + '">' + visualHeader('PHOTO', title) +
      '<div class="ts-photo-grid"><div><div class="ts-photo-frame"><span>WIDE</span></div><b>Context</b><small>Show the full ' + esc(subject) + ' and its surroundings.</small></div>' +
      '<div><div class="ts-photo-frame"><span>DETAIL</span></div><b>Condition</b><small>Fill the frame with the defect, connection, or warning sign.</small></div>' +
      '<div><div class="ts-photo-frame"><span>SCALE</span></div><b>Reference</b><small>Include a ruler, label, gauge, or known-size object when useful.</small></div></div>' +
      '<p class="ts-caption">A real field photo earns its place here because condition and context matter more than a generic illustration.</p></section>';
  }

  function visualFor(type, title, steps) {
    let primary = '';
    if (type === 'DIAGRAM') primary = diagram(title, steps);
    if (type === 'FLOWCHART') primary = flowchart(title, steps);
    if (type === 'COMPARISON') primary = comparison(title, steps);
    if (type === 'PHOTO') primary = photoBoard(title);
    if (!primary) return '';
    const complex = /complete|system|architecture|planning|commissioning|integration|rough-in|waterproofing|charging|hydraulic|electrical|fire sprinkler|framing/.test(title.toLowerCase());
    if (!complex || type === 'PHOTO') return primary;
    return primary + (type === 'FLOWCHART' ? diagram(title + ' system path', steps) : flowchart(title + ' verification path', steps));
  }

  function topicTools(trade, title) {
    const text = (trade + ' ' + title).toLowerCase();
    const base = ['Current manufacturer/service information', 'Task-appropriate PPE and work light', 'Phone or camera for baseline condition photos'];
    if (/electric|solar|battery|weld|appliance|commercial|fire/.test(text)) return base.concat(['Rated meter/tester and lockout or isolation supplies', 'Torque tool and manufacturer-specified connectors/fasteners']);
    if (/roof|deck|exterior|door|window|masonry|framing|fence|drain|remodel/.test(text)) return base.concat(['Tape or laser, level, and layout markers', 'Compatible repair materials and the listed fastening/flashing system']);
    if (/diesel|vehicle/.test(text)) return base.concat(['Scan tool or approved diagnostic equipment', 'Service-data limits and a safe test area']);
    return base.concat(['The correct measuring tool for the decision being made', 'Replacement parts or materials only after the failure is confirmed']);
  }

  function upgradeContent(trade, title, type, steps) {
    const text = (trade + ' ' + title).toLowerCase();
    const diagnostic = type === 'FLOWCHART';
    const highRisk = /electric|solar|battery|weld|diesel|vehicle|fire|roof/.test(text);
    const water = /roof|exterior|window|door|drain|waterproof|siding|deck|masonry|remodel/.test(text);
    const structural = /deck|framing|masonry|fence|roof|beam|stair|foundation/.test(text);
    const before = ['Define the symptom or finished condition in one sentence before touching anything.', 'Record the starting state, labels, dimensions, and anything that must be restored.', 'Set the stop point: the next step belongs to a qualified trade when the required test, code, or equipment is outside the guide scope.'];
    if (diagnostic) before[0] = 'Reproduce the complaint under a controlled condition and record exactly when it appears.';
    if (water) before[1] = 'Map the intended water path and photograph the surrounding assembly before opening or covering it.';
    if (structural) before[1] = 'Confirm the load path, support, dimensions, and approved detail before removing or cutting material.';
    const tips = diagnostic ? ['Change one variable or measurement at a time so the result identifies a branch.', 'Compare the input and output of the suspected component before condemning it.', 'Retest under the same conditions that created the original complaint.'] : ['Dry-fit or mark the work before making the permanent cut, connection, or fastener run.', 'Use the manufacturer sequence at interfaces; that is where otherwise good work usually fails.', 'Keep a short photo and measurement record before concealment or handoff.'];
    const mistakes = water ? ['Sealing over a drainage exit or relying on surface caulk to replace a missing assembly detail.', 'Repairing the visible stain or finish before proving the water source.', 'Concealing the work before a water or leak check is complete.'] : structural ? ['Changing a member, connection, opening, or fastener pattern without checking the approved detail.', 'Removing temporary support before the permanent load path is complete.', 'Using a cosmetic fix to hide movement, settlement, or damaged material.'] : diagnostic ? ['Clearing codes or resetting protection before saving the evidence.', 'Replacing the most expensive part before checking power, supply, grounds, or configuration.', 'Calling the job complete without a post-repair verification.'] : ['Mixing products, fasteners, or components that are not listed together.', 'Skipping the layout or measurement check because the work looks close enough.', 'Leaving labels, access, or service records for the end and then discovering they no longer fit.'];
    const troubleshooting = diagnostic ? ['If the basic input is out of range, correct that first and repeat the test.', 'If the input is correct but the output is wrong, isolate the component or branch using the service procedure.', 'If results conflict or the limit is unknown, stop and escalate with the saved readings and photos.'] : ['If the result is out of alignment, stop before adding more material and return to the last verified reference.', 'If leakage, movement, heat, or abnormal noise appears, isolate the hazard and identify the source before cosmetic repair.', 'After the correction, inspect the interface and run the system through its intended operating condition.'];
    const safety = highRisk ? (diagnostic ? 'Do not bypass a protective device to force a result. Use the listed procedure, rated test equipment, and the required isolation or lockout sequence.' : 'Keep the work inside the listed procedure and qualification boundary. Isolate hazardous energy, protect the work area, and use only rated/listed components.') : 'Use task-appropriate PPE, maintain a clean work area, and stop when concealed damage, structural uncertainty, or regulated work changes the risk.';
    return { tools: topicTools(trade, title), before, tips, mistakes, troubleshooting, safety };
  }

  function listBlock(title, items) {
    return '<section class="ts-upgrade-section"><h4>' + esc(title) + '</h4><ul>' + items.map((item) => '<li>' + esc(item) + '</li>').join('') + '</ul></section>';
  }

  function upgradeMarkup(trade, title, type, steps, number) {
    if (!isSelected(trade, number)) return '';
    const content = upgradeContent(trade, title, type, steps);
    return '<section class="ts-upgrade" aria-label="Expanded field notes"><div class="ts-upgrade-label">EXPANDED FIELD NOTES</div><div class="ts-upgrade-grid">' +
      listBlock('Tools & Materials', content.tools) + listBlock('Before You Start', content.before) + listBlock('Field Tips', content.tips) +
      listBlock('Common Mistakes', content.mistakes) + listBlock('Troubleshooting', content.troubleshooting) +
      '</div><div class="ts-safety-note"><b>Safety boundary:</b> ' + esc(content.safety) + '</div></section>';
  }

  function decorateArticle(article, trade) {
    if (article.dataset.tsDecorated === '1') return;
    const localTitle = clean((article.querySelector('.head b, .guide h3') || {}).textContent || '').replace(/^\d+\.\s*/, '');
    if (!localTitle) return;
    const type = classify(localTitle);
    const number = guideNumber(article);
    const steps = stepsFor(article);
    const body = article.querySelector('.body, .detail');
    if (!body) return;
    article.dataset.tsDecorated = '1';
    article.dataset.visualType = type;
    const strip = document.createElement('div');
    strip.className = 'ts-audit-strip';
    strip.innerHTML = '<span class="ts-kind ts-' + type.toLowerCase() + '">' + type + '</span>' + (isSelected(trade, number) ? '<span class="ts-deepened">DEEPENED</span>' : '<span class="ts-audit-note">visual/content pass</span>');
    body.insertBefore(strip, body.firstChild);
    const visual = visualFor(type, localTitle, steps);
    if (visual) {
      const holder = document.createElement('div');
      holder.innerHTML = visual;
      body.insertBefore(holder.firstElementChild, strip.nextSibling);
    }
    const upgrade = upgradeMarkup(trade, localTitle, type, steps, number);
    if (upgrade) {
      const holder = document.createElement('div');
      holder.innerHTML = upgrade;
      const safety = body.querySelector('.safety');
      body.insertBefore(holder.firstElementChild, safety || body.lastElementChild);
    }
  }

  function injectViewerCss(doc) {
    if (doc.getElementById('ts-visual-css')) return;
    const style = doc.createElement('style');
    style.id = 'ts-visual-css';
    style.textContent = [
      '.ts-audit-strip{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin:0 0 12px;padding:7px 9px;border:1px solid #2b4058;border-radius:9px;background:#0d1726;color:#a9bad4;font-size:.68rem;font-weight:800;letter-spacing:.5px}.ts-kind,.ts-deepened{display:inline-block;border-radius:999px;padding:4px 7px;font-size:.64rem;letter-spacing:.4px}.ts-photo{color:#b8e9ff;border:1px solid #276079;background:#0c2530}.ts-diagram{color:#93dfff;border:1px solid #24577a;background:#0c1e31}.ts-flowchart{color:#ffd58b;border:1px solid #6e5124;background:#251d0e}.ts-comparison{color:#cdbdff;border:1px solid #5b4b91;background:#1a1630}.ts-none{color:#aebbd0;border:1px solid #39465c;background:#111a2a}.ts-deepened{color:#101b18;background:#83e6bf}.ts-audit-note{font-weight:600;color:#91a3bf}.ts-visual{margin:0 0 14px;padding:12px;border-radius:13px;background:#09111d;border:1px solid #263c59;color:#eef5ff}.ts-visual-head{display:flex;gap:8px;align-items:center;margin-bottom:10px;color:#dce8ff;font-size:.75rem;font-weight:800}.ts-path{display:flex;align-items:stretch;gap:6px;overflow:auto;padding-bottom:3px}.ts-node{min-width:118px;flex:1;padding:9px;border:1px solid #2f4b6b;border-radius:10px;background:#101d30}.ts-node small{display:block;color:#75d8ff;font-size:.62rem;margin-bottom:4px}.ts-node strong{display:block;font-size:.75rem;line-height:1.3}.ts-arrow{align-self:center;color:#75d8ff;font-size:1.05rem}.ts-decision-path{display:grid;gap:6px}.ts-decision{display:grid;grid-template-columns:54px 1fr;gap:9px;align-items:center;padding:8px 9px;border-radius:9px;border:1px solid #58441f;background:#17170f}.ts-decision b{font-size:.58rem;color:#f2bd4b}.ts-decision span{font-size:.75rem;line-height:1.3}.ts-down{text-align:center;color:#f2bd4b;font-size:1rem;height:8px}.ts-caption{margin:9px 0 0;color:#91a3bf;font-size:.72rem;line-height:1.35}.ts-table-wrap{overflow:auto}.ts-comparison table{width:100%;min-width:520px;border-collapse:collapse;font-size:.7rem}.ts-comparison th,.ts-comparison td{border:1px solid #344568;padding:7px;vertical-align:top;text-align:left;line-height:1.3}.ts-comparison th{color:#dce8ff;background:#131d33}.ts-comparison td{color:#b9c9df}.ts-photo-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.ts-photo-grid>div{min-width:0}.ts-photo-frame{height:68px;display:grid;place-items:center;border:1px dashed #4a8ba8;border-radius:9px;background:linear-gradient(135deg,#0d2631,#152331);color:#77d9f6;font-size:.62rem;font-weight:900;letter-spacing:1px}.ts-photo-grid b{display:block;margin-top:6px;font-size:.75rem}.ts-photo-grid small{display:block;margin-top:3px;color:#9db0c9;line-height:1.3;font-size:.67rem}.ts-upgrade{margin:0 0 14px;padding:12px;border:1px solid #31506b;border-radius:13px;background:#0c1724}.ts-upgrade-label{margin-bottom:10px;color:#83e6bf;font-size:.65rem;font-weight:900;letter-spacing:1.2px}.ts-upgrade-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.ts-upgrade-section{padding:9px;border:1px solid #263d57;border-radius:9px;background:#0f1b2b}.ts-upgrade-section h4{margin:0 0 5px;color:#d5e7ff;font-size:.78rem}.ts-upgrade-section ul{margin:0;padding-left:17px}.ts-upgrade-section li{margin:5px 0;color:#b9c9df;font-size:.72rem;line-height:1.35}.ts-safety-note{margin-top:9px;padding:9px;border-left:3px solid #f2bd4b;background:#211b13;color:#ffd9a8;font-size:.73rem;line-height:1.4}.ts-safety-note b{color:#ffe7b0}@media(max-width:560px){.ts-path{display:grid;gap:5px}.ts-arrow{display:block;text-align:center;transform:rotate(90deg);height:14px}.ts-node{min-width:0}.ts-photo-grid{grid-template-columns:1fr}.ts-photo-frame{height:54px}.ts-upgrade-grid{grid-template-columns:1fr}.ts-comparison table{min-width:460px}}'
    ].join('');
    doc.head.appendChild(style);
  }

  function decorateViewer(viewer, trade) {
    const doc = viewer.contentDocument;
    if (!doc || !doc.body) return;
    if (doc.querySelector('.screen')) return;
    injectViewerCss(doc);
    doc.querySelectorAll('article.guide').forEach((article) => decorateArticle(article, trade));
    if (doc.body.dataset.tsObserver !== '1') {
      doc.body.dataset.tsObserver = '1';
      new MutationObserver(() => doc.querySelectorAll('article.guide').forEach((article) => decorateArticle(article, trade))).observe(doc.body, { childList: true, subtree: true });
    }
  }

  function parseLibrary(shellDoc) {
    const node = shellDoc.getElementById('library-data');
    if (!node) return [];
    const raw = node.textContent || '';
    try { return JSON.parse(raw); } catch (_) {
      const holder = new DOMParser().parseFromString('<textarea>' + raw + '</textarea>', 'text/html');
      try { return JSON.parse(holder.querySelector('textarea').value); } catch (__) { return []; }
    }
  }

  function titlesFor(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const staticTitles = Array.from(doc.querySelectorAll('article.guide .head b, article.guide .guide-top h3')).map((node) => clean(node.textContent).replace(/^\d+\.\s*/, ''));
    if (staticTitles.length) return staticTitles;
    const match = html.match(/const guides=(\[[\s\S]*?\]);\s*const KEY=/);
    if (!match) return [];
    try { return JSON.parse(match[1]).map((guide) => guide.title); } catch (_) { return []; }
  }

  function auditRows(library) {
    const rows = [];
    library.slice(0, 20).forEach((entry) => {
      titlesFor(entry.html).forEach((title, index) => rows.push({ trade: entry.title, number: index + 1, title, type: classify(title), deepened: isSelected(entry.title, index + 1) }));
    });
    return rows;
  }

  function addAuditUi(shellDoc, library) {
    if (document.getElementById('ts-audit-open')) return;
    const rows = auditRows(library);
    const counts = rows.reduce((all, row) => { all[row.type] = (all[row.type] || 0) + 1; return all; }, {});
    const head = document.querySelector('.premium-hub-head');
    if (!head) return;
    const summary = document.createElement('div');
    summary.id = 'ts-audit-summary';
    summary.innerHTML = '<span>Visual pass: <b>' + rows.length + '/400 marked</b></span><span>' + TYPES.map((type) => type + ' ' + (counts[type] || 0)).join(' &middot; ') + '</span>';
    head.appendChild(summary);
    const button = document.createElement('button');
    button.id = 'ts-audit-open';
    button.type = 'button';
    button.textContent = 'Open visual audit';
    head.appendChild(button);
    button.addEventListener('click', () => showAudit(rows));
  }

  function showAudit(rows) {
    let modal = document.getElementById('ts-audit-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'ts-audit-modal';
      modal.innerHTML = '<div class="ts-audit-card"><div class="ts-audit-top"><div><div class="ts-audit-kicker">TradeStack Premium</div><h2>400-guide visual audit</h2><p>PHOTO means a real condition is worth seeing. DIAGRAM, FLOWCHART, and COMPARISON are purpose-built field visuals. NONE is an intentional decision.</p></div><button type="button" id="ts-audit-close">Close</button></div><div class="ts-audit-filters"><input id="ts-audit-search" type="search" placeholder="Find a guide or trade"><select id="ts-audit-type"><option value="ALL">All visual types</option>' + TYPES.map((type) => '<option>' + type + '</option>').join('') + '</select></div><div id="ts-audit-count"></div><div id="ts-audit-list"></div></div>';
      document.body.appendChild(modal);
      document.getElementById('ts-audit-close').onclick = () => modal.remove();
      modal.addEventListener('click', (event) => { if (event.target === modal) modal.remove(); });
      const render = () => {
        const term = (document.getElementById('ts-audit-search').value || '').toLowerCase();
        const type = document.getElementById('ts-audit-type').value;
        const filtered = rows.filter((row) => (!term || (row.trade + ' ' + row.title).toLowerCase().includes(term)) && (type === 'ALL' || row.type === type));
        document.getElementById('ts-audit-count').textContent = filtered.length + ' guide' + (filtered.length === 1 ? '' : 's');
        document.getElementById('ts-audit-list').innerHTML = filtered.map((row) => '<div class="ts-audit-row"><span class="ts-kind ts-' + row.type.toLowerCase() + '">' + row.type + '</span><span class="ts-audit-guide">' + esc(row.trade) + ' ' + String(row.number).padStart(2, '0') + ' - ' + esc(row.title) + '</span>' + (row.deepened ? '<span class="ts-deepened">DEEPENED</span>' : '') + '</div>').join('');
      };
      document.getElementById('ts-audit-search').oninput = render;
      document.getElementById('ts-audit-type').onchange = render;
      render();
    }
    modal.style.display = 'grid';
  }

  function injectParentCss() {
    if (document.getElementById('ts-parent-css')) return;
    const style = document.createElement('style');
    style.id = 'ts-parent-css';
    style.textContent = [
      '#ts-audit-summary{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0 8px;color:#a9bad4;font-size:.72rem}#ts-audit-summary span{padding:6px 8px;border:1px solid #2b4058;border-radius:999px;background:#0c1726}#ts-audit-summary b{color:#83e6bf}#ts-audit-open{border:1px solid #3b6a88;border-radius:10px;padding:9px 12px;background:#10253a;color:#ccecff;font-weight:800;cursor:pointer}#ts-audit-modal{display:none;position:fixed;inset:0;z-index:1000;place-items:center;padding:16px;background:#02050bcc}#ts-audit-card{width:min(920px,100%);max-height:min(88vh,780px);overflow:auto;padding:18px;border:1px solid #365171;border-radius:16px;background:#09111d;color:#edf3ff;box-shadow:0 20px 70px #000b}#ts-audit-top{display:flex;justify-content:space-between;gap:16px}#ts-audit-top h2{margin:4px 0;font-size:1.2rem}#ts-audit-top p{margin:0;color:#9db0c9;max-width:680px;line-height:1.4;font-size:.8rem}#ts-audit-top button{height:max-content;border:1px solid #3b506d;border-radius:9px;padding:8px 10px;background:#101d30;color:#fff}#ts-audit-kicker{color:#75d8ff;font-size:.67rem;letter-spacing:1.2px;text-transform:uppercase}.ts-audit-filters{display:flex;gap:8px;margin:14px 0}.ts-audit-filters input,.ts-audit-filters select{min-width:0;flex:1;padding:10px;border:1px solid #334b6b;border-radius:9px;background:#0f1b2b;color:#fff}.ts-audit-filters select{flex:0 0 180px}.ts-audit-row{display:flex;gap:8px;align-items:center;padding:7px 0;border-top:1px solid #1c3048;font-size:.74rem}.ts-audit-guide{flex:1;color:#cfddf0}.ts-audit-row .ts-deepened{font-size:.58rem}@media(max-width:560px){#ts-audit-top{display:block}#ts-audit-top button{margin-top:10px}.ts-audit-filters{display:grid}.ts-audit-filters select{flex:auto}.ts-audit-row{align-items:flex-start;flex-wrap:wrap}.ts-audit-guide{flex-basis:calc(100% - 75px)}}'
    ].join('');
    document.head.appendChild(style);
  }

  function bootShell() {
    const shell = document.querySelector('.premium-frame');
    if (!shell || !shell.contentDocument) return false;
    const shellDoc = shell.contentDocument;
    const library = parseLibrary(shellDoc);
    if (!library.length) return false;
    injectParentCss();
    addAuditUi(shellDoc, library);
    const viewer = shellDoc.getElementById('viewer');
    if (!viewer) return false;
    const active = shellDoc.getElementById('current');
    const decorate = () => decorateViewer(viewer, active ? clean(active.textContent).replace(/^[^A-Za-z]+/, '') : '');
    viewer.addEventListener('load', decorate);
    decorate();
    return true;
  }

  let tries = 0;
  const timer = setInterval(() => {
    tries += 1;
    if (bootShell() || tries > 80) clearInterval(timer);
  }, 100);
})();
