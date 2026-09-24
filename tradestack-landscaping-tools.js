(() => {
  'use strict';
  if (window.TradeStackLandscapingToolsLoaded) return;
  window.TradeStackLandscapingToolsLoaded = true;

  const $ = id => document.getElementById(id);
  const num = v => String(v).trim() !== '' && Number.isFinite(Number(v)) ? Number(v) : null;
  const fmt = (n, max = 2) => !Number.isFinite(n) ? '—' : Number(n.toFixed(max)).toLocaleString(undefined, { maximumFractionDigits: max });

  function css() {
    if ($('tsLandscapeStyle')) return;
    const s = document.createElement('style');
    s.id = 'tsLandscapeStyle';
    s.textContent = `
      .ts-land{max-width:1050px;margin:28px auto;padding:0 18px;color:#f5f7f9}
      .ts-land-card{background:#14212b;border:1px solid #405669;border-radius:18px;overflow:hidden;box-shadow:0 14px 34px #0005}
      .ts-land-head{padding:22px;background:linear-gradient(135deg,#173326,#244b38);border-bottom:1px solid #405669}
      .ts-land-head h2{margin:5px 0 7px;color:#ffd166}.ts-land-head p{margin:0;color:#c8d9d0;line-height:1.5}
      .ts-land-kicker{color:#82e5ad;font-size:.72rem;font-weight:900;letter-spacing:.11em;text-transform:uppercase}
      .ts-land-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;padding:16px}
      .ts-land-tool{background:#182733;border:1px solid #344b5d;border-radius:14px;padding:16px}
      .ts-land-tool h3{margin:0 0 11px;color:#f7d98a}.ts-land-tool p{color:#c3d2dc;line-height:1.45}
      .ts-land-inputs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}
      .ts-land-inputs.three{grid-template-columns:repeat(3,minmax(0,1fr))}
      .ts-land-field label{display:block;color:#b8c8d4;font-size:.78rem;font-weight:800;margin-bottom:5px}
      .ts-land-field input,.ts-land-field select{width:100%;min-height:44px;box-sizing:border-box;border:1px solid #4a6274;border-radius:9px;background:#0c151c;color:#fff;padding:9px 10px;font:inherit}
      .ts-land-btns{display:flex;gap:9px;flex-wrap:wrap;margin-top:12px}.ts-land-btns button{min-height:43px;border:0;border-radius:9px;padding:9px 14px;font-weight:900;cursor:pointer;background:linear-gradient(135deg,#2e7d4d,#1f5736);color:#fff}
      .ts-land-status{min-height:21px;margin-top:9px;color:#ffd166;font-size:.85rem;font-weight:700}
      .ts-land-results{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:10px}
      .ts-land-result{background:#0c151c;border:1px solid #314758;border-radius:10px;padding:10px;text-align:center}.ts-land-result strong{display:block;color:#82e5ad}.ts-land-result span{font-size:.72rem;color:#94a9b7}
      .ts-land-note{font-size:.78rem;color:#95a9b6}.ts-land-wide{grid-column:1/-1}
      .ts-land-tip{margin:0 16px 16px;border-left:4px solid #82e5ad;background:#102319;padding:13px;border-radius:10px;color:#c8ead5;line-height:1.48;font-size:.86rem}
      @media(max-width:760px){.ts-land-grid{grid-template-columns:1fr;padding:12px}.ts-land-inputs,.ts-land-inputs.three{grid-template-columns:1fr}.ts-land-results{grid-template-columns:repeat(2,minmax(0,1fr))}.ts-land{padding:0 12px}}
    `;
    document.head.appendChild(s);
  }

  function positive(...values) { return values.every(v => v !== null && v > 0); }

  function calcFeet() {
    const v = num($('tsLandLinearValue').value), unit = $('tsLandLinearUnit').value, st = $('tsLandLinearStatus');
    if (v === null || v < 0) { st.textContent = 'Enter a non-negative measurement.'; return; }
    const feet = unit === 'ft' ? v : v * 3;
    $('tsLandOutFt').textContent = fmt(feet) + ' ft';
    $('tsLandOutYd').textContent = fmt(feet / 3) + ' yd';
    st.textContent = 'Linear measurement converted.';
  }

  function calcRect() {
    const l = num($('tsLandLength').value), w = num($('tsLandWidth').value), st = $('tsLandAreaStatus');
    if (!positive(l, w)) { st.textContent = 'Enter length and width above 0.'; return; }
    const area = l * w, perimeter = 2 * (l + w);
    $('tsLandAreaFt').textContent = fmt(area) + ' ft²';
    $('tsLandAreaYd').textContent = fmt(area / 9) + ' yd²';
    $('tsLandPerim').textContent = fmt(perimeter) + ' ft';
    st.textContent = 'Rectangle calculated.';
  }

  function calcCircle() {
    const d = num($('tsLandDiameter').value), st = $('tsLandCircleStatus');
    if (!positive(d)) { st.textContent = 'Enter a diameter above 0.'; return; }
    const r = d / 2, area = Math.PI * r * r, circumference = Math.PI * d;
    $('tsLandCircleFt').textContent = fmt(area) + ' ft²';
    $('tsLandCircleYd').textContent = fmt(area / 9) + ' yd²';
    $('tsLandCirc').textContent = fmt(circumference) + ' ft';
    st.textContent = 'Circular bed calculated.';
  }

  function calcMaterial() {
    const area = num($('tsLandMatArea').value), depth = num($('tsLandDepth').value), bag = num($('tsLandBag').value), st = $('tsLandMaterialStatus');
    if (!positive(area, depth)) { st.textContent = 'Enter area and depth above 0.'; return; }
    const cuft = area * (depth / 12), cuyd = cuft / 27;
    $('tsLandCuFt').textContent = fmt(cuft) + ' ft³';
    $('tsLandCuYd').textContent = fmt(cuyd, 3) + ' yd³';
    $('tsLandBags').textContent = bag && bag > 0 ? Math.ceil(cuft / bag).toLocaleString() + ' bags' : '—';
    st.textContent = bag && bag > 0 ? 'Material volume and bag count calculated.' : 'Volume calculated. Add bag size for bag count.';
  }

  function calcSod() {
    const area = num($('tsLandSodArea').value), pallet = num($('tsLandPallet').value), waste = num($('tsLandWaste').value) ?? 0, st = $('tsLandSodStatus');
    if (!positive(area) || waste < 0) { st.textContent = 'Enter area above 0 and a valid waste percentage.'; return; }
    const adjusted = area * (1 + waste / 100);
    $('tsLandSodFt').textContent = fmt(adjusted) + ' ft²';
    $('tsLandSodYd').textContent = fmt(adjusted / 9) + ' yd²';
    $('tsLandPallets').textContent = pallet && pallet > 0 ? Math.ceil(adjusted / pallet).toLocaleString() + ' pallets' : '—';
    st.textContent = pallet && pallet > 0 ? 'Sod quantity and pallet count calculated.' : 'Sod quantity calculated. Add pallet coverage for pallet count.';
  }

  function calcPlants() {
    const area = num($('tsLandPlantArea').value), spacingIn = num($('tsLandSpacing').value), pattern = $('tsLandPattern').value, st = $('tsLandPlantStatus');
    if (!positive(area, spacingIn)) { st.textContent = 'Enter area and spacing above 0.'; return; }
    const spacingFt = spacingIn / 12;
    const factor = pattern === 'tri' ? 0.8660254 : 1;
    const eachArea = spacingFt * spacingFt * factor;
    const count = Math.ceil(area / eachArea);
    $('tsLandPlants').textContent = count.toLocaleString();
    $('tsLandPlantEach').textContent = fmt(eachArea, 3) + ' ft²';
    st.textContent = 'Approximate plant count calculated. Field layout may require adjustment.';
  }

  function calcGpm() {
    const gallons = num($('tsLandGallons').value), seconds = num($('tsLandSeconds').value), st = $('tsLandGpmStatus');
    if (!positive(gallons, seconds)) { st.textContent = 'Enter gallons and seconds above 0.'; return; }
    const gpm = gallons * 60 / seconds;
    $('tsLandGpm').textContent = fmt(gpm, 3) + ' GPM';
    st.textContent = 'Flow rate calculated.';
  }

  function calcRuntime() {
    const gpm = num($('tsLandZoneGpm').value), area = num($('tsLandZoneArea').value), target = num($('tsLandTargetIn').value), st = $('tsLandRunStatus');
    if (!positive(gpm, area, target)) { st.textContent = 'Enter GPM, irrigated area, and target inches above 0.'; return; }
    const rate = 96.3 * gpm / area;
    const minutes = target / rate * 60;
    $('tsLandPrecip').textContent = fmt(rate, 3) + ' in/hr';
    $('tsLandMinutes').textContent = fmt(minutes, 1) + ' min';
    st.textContent = 'Runtime estimated from zone flow and irrigated area.';
  }

  function calcPipe() {
    const d = num($('tsLandPipeDia').value), len = num($('tsLandPipeLen').value), st = $('tsLandPipeStatus');
    if (!positive(d, len)) { st.textContent = 'Enter inside diameter and length above 0.'; return; }
    const rFt = (d / 12) / 2;
    const cuft = Math.PI * rFt * rFt * len;
    const gal = cuft * 7.48052;
    $('tsLandPipeCuFt').textContent = fmt(cuft, 3) + ' ft³';
    $('tsLandPipeGal').textContent = fmt(gal, 2) + ' gal';
    st.textContent = 'Pipe volume calculated using inside diameter.';
  }

  function mount() {
    if ($('landscaping-tools')) return;
    css();
    const sec = document.createElement('section');
    sec.id = 'landscaping-tools';
    sec.className = 'ts-land';
    sec.innerHTML = `
      <div class="ts-land-card">
        <div class="ts-land-head">
          <div class="ts-land-kicker">TradeStack Free Field Tools</div>
          <h2>🌿 Landscaping & Irrigation Calculators</h2>
          <p>Field math for measurements, material volume, sod, plant spacing, irrigation flow, runtime, and pipe volume. These core landscaping tools stay free.</p>
        </div>
        <div class="ts-land-grid">
          <article class="ts-land-tool">
            <h3>Feet ↔ Yards</h3><p class="ts-land-note">Linear measurement conversion.</p>
            <div class="ts-land-inputs"><div class="ts-land-field"><label>Measurement</label><input id="tsLandLinearValue" type="number" step="any" inputmode="decimal" placeholder="30"></div><div class="ts-land-field"><label>Unit entered</label><select id="tsLandLinearUnit"><option value="ft">Feet</option><option value="yd">Yards</option></select></div></div>
            <div class="ts-land-btns"><button id="tsLandCalcLinear">Convert</button></div><div class="ts-land-status" id="tsLandLinearStatus">Enter a measurement.</div>
            <div class="ts-land-results" style="grid-template-columns:repeat(2,minmax(0,1fr))"><div class="ts-land-result"><strong id="tsLandOutFt">—</strong><span>Feet</span></div><div class="ts-land-result"><strong id="tsLandOutYd">—</strong><span>Yards</span></div></div>
          </article>

          <article class="ts-land-tool">
            <h3>Square Feet / Square Yards</h3><p class="ts-land-note">Rectangle area plus perimeter.</p>
            <div class="ts-land-inputs"><div class="ts-land-field"><label>Length (ft)</label><input id="tsLandLength" type="number" step="any" inputmode="decimal" placeholder="40"></div><div class="ts-land-field"><label>Width (ft)</label><input id="tsLandWidth" type="number" step="any" inputmode="decimal" placeholder="25"></div></div>
            <div class="ts-land-btns"><button id="tsLandCalcArea">Calculate</button></div><div class="ts-land-status" id="tsLandAreaStatus">Enter length and width.</div>
            <div class="ts-land-results"><div class="ts-land-result"><strong id="tsLandAreaFt">—</strong><span>Square feet</span></div><div class="ts-land-result"><strong id="tsLandAreaYd">—</strong><span>Square yards</span></div><div class="ts-land-result"><strong id="tsLandPerim">—</strong><span>Perimeter</span></div></div>
          </article>

          <article class="ts-land-tool">
            <h3>Round Bed / Circle Area</h3><p class="ts-land-note">Useful for tree rings and circular beds.</p>
            <div class="ts-land-inputs"><div class="ts-land-field"><label>Diameter (ft)</label><input id="tsLandDiameter" type="number" step="any" inputmode="decimal" placeholder="12"></div></div>
            <div class="ts-land-btns"><button id="tsLandCalcCircle">Calculate</button></div><div class="ts-land-status" id="tsLandCircleStatus">Enter diameter.</div>
            <div class="ts-land-results"><div class="ts-land-result"><strong id="tsLandCircleFt">—</strong><span>Square feet</span></div><div class="ts-land-result"><strong id="tsLandCircleYd">—</strong><span>Square yards</span></div><div class="ts-land-result"><strong id="tsLandCirc">—</strong><span>Circumference</span></div></div>
          </article>

          <article class="ts-land-tool">
            <h3>Mulch / Gravel / Soil Volume</h3><p class="ts-land-note">Turns square footage and depth into cubic feet and cubic yards.</p>
            <div class="ts-land-inputs three"><div class="ts-land-field"><label>Area (ft²)</label><input id="tsLandMatArea" type="number" step="any" inputmode="decimal" placeholder="1000"></div><div class="ts-land-field"><label>Depth (in)</label><input id="tsLandDepth" type="number" step="any" inputmode="decimal" placeholder="3"></div><div class="ts-land-field"><label>Bag size (ft³, optional)</label><input id="tsLandBag" type="number" step="any" inputmode="decimal" placeholder="2"></div></div>
            <div class="ts-land-btns"><button id="tsLandCalcMaterial">Calculate</button></div><div class="ts-land-status" id="tsLandMaterialStatus">Enter area and depth.</div>
            <div class="ts-land-results"><div class="ts-land-result"><strong id="tsLandCuFt">—</strong><span>Cubic feet</span></div><div class="ts-land-result"><strong id="tsLandCuYd">—</strong><span>Cubic yards</span></div><div class="ts-land-result"><strong id="tsLandBags">—</strong><span>Bags</span></div></div>
          </article>

          <article class="ts-land-tool">
            <h3>Sod Quantity</h3><p class="ts-land-note">Adds optional waste and pallet coverage.</p>
            <div class="ts-land-inputs three"><div class="ts-land-field"><label>Measured area (ft²)</label><input id="tsLandSodArea" type="number" step="any" inputmode="decimal" placeholder="1200"></div><div class="ts-land-field"><label>Waste (%)</label><input id="tsLandWaste" type="number" step="any" inputmode="decimal" value="5"></div><div class="ts-land-field"><label>Pallet coverage (ft², optional)</label><input id="tsLandPallet" type="number" step="any" inputmode="decimal" placeholder="450"></div></div>
            <div class="ts-land-btns"><button id="tsLandCalcSod">Calculate</button></div><div class="ts-land-status" id="tsLandSodStatus">Enter measured area.</div>
            <div class="ts-land-results"><div class="ts-land-result"><strong id="tsLandSodFt">—</strong><span>Sod ft²</span></div><div class="ts-land-result"><strong id="tsLandSodYd">—</strong><span>Sod yd²</span></div><div class="ts-land-result"><strong id="tsLandPallets">—</strong><span>Pallets</span></div></div>
          </article>

          <article class="ts-land-tool">
            <h3>Plant Spacing</h3><p class="ts-land-note">Approximate plant count for square or triangular spacing.</p>
            <div class="ts-land-inputs three"><div class="ts-land-field"><label>Bed area (ft²)</label><input id="tsLandPlantArea" type="number" step="any" inputmode="decimal" placeholder="500"></div><div class="ts-land-field"><label>Spacing (in)</label><input id="tsLandSpacing" type="number" step="any" inputmode="decimal" placeholder="24"></div><div class="ts-land-field"><label>Pattern</label><select id="tsLandPattern"><option value="square">Square</option><option value="tri">Triangular</option></select></div></div>
            <div class="ts-land-btns"><button id="tsLandCalcPlants">Calculate</button></div><div class="ts-land-status" id="tsLandPlantStatus">Enter bed area and spacing.</div>
            <div class="ts-land-results" style="grid-template-columns:repeat(2,minmax(0,1fr))"><div class="ts-land-result"><strong id="tsLandPlants">—</strong><span>Approx. plants</span></div><div class="ts-land-result"><strong id="tsLandPlantEach">—</strong><span>Area per plant</span></div></div>
          </article>

          <article class="ts-land-tool">
            <h3>Bucket Test → GPM</h3><p class="ts-land-note">Measure flow with a known container and stopwatch.</p>
            <div class="ts-land-inputs"><div class="ts-land-field"><label>Gallons collected</label><input id="tsLandGallons" type="number" step="any" inputmode="decimal" placeholder="5"></div><div class="ts-land-field"><label>Seconds</label><input id="tsLandSeconds" type="number" step="any" inputmode="decimal" placeholder="30"></div></div>
            <div class="ts-land-btns"><button id="tsLandCalcGpm">Calculate</button></div><div class="ts-land-status" id="tsLandGpmStatus">Enter gallons and seconds.</div>
            <div class="ts-land-results" style="grid-template-columns:1fr"><div class="ts-land-result"><strong id="tsLandGpm">—</strong><span>Gallons per minute</span></div></div>
          </article>

          <article class="ts-land-tool">
            <h3>Irrigation Runtime / Precipitation</h3><p class="ts-land-note">Estimates precipitation rate from total zone GPM and irrigated square footage.</p>
            <div class="ts-land-inputs three"><div class="ts-land-field"><label>Zone flow (GPM)</label><input id="tsLandZoneGpm" type="number" step="any" inputmode="decimal" placeholder="12"></div><div class="ts-land-field"><label>Irrigated area (ft²)</label><input id="tsLandZoneArea" type="number" step="any" inputmode="decimal" placeholder="1500"></div><div class="ts-land-field"><label>Target water (in)</label><input id="tsLandTargetIn" type="number" step="any" inputmode="decimal" placeholder="0.5"></div></div>
            <div class="ts-land-btns"><button id="tsLandCalcRuntime">Calculate</button></div><div class="ts-land-status" id="tsLandRunStatus">Enter zone flow, area, and target inches.</div>
            <div class="ts-land-results" style="grid-template-columns:repeat(2,minmax(0,1fr))"><div class="ts-land-result"><strong id="tsLandPrecip">—</strong><span>Precipitation rate</span></div><div class="ts-land-result"><strong id="tsLandMinutes">—</strong><span>Estimated runtime</span></div></div>
          </article>

          <article class="ts-land-tool ts-land-wide">
            <h3>Pipe Water Volume</h3><p class="ts-land-note">Uses inside diameter and pipe length.</p>
            <div class="ts-land-inputs"><div class="ts-land-field"><label>Inside diameter (in)</label><input id="tsLandPipeDia" type="number" step="any" inputmode="decimal" placeholder="1"></div><div class="ts-land-field"><label>Length (ft)</label><input id="tsLandPipeLen" type="number" step="any" inputmode="decimal" placeholder="100"></div></div>
            <div class="ts-land-btns"><button id="tsLandCalcPipe">Calculate</button></div><div class="ts-land-status" id="tsLandPipeStatus">Enter pipe diameter and length.</div>
            <div class="ts-land-results" style="grid-template-columns:repeat(2,minmax(0,1fr))"><div class="ts-land-result"><strong id="tsLandPipeCuFt">—</strong><span>Cubic feet</span></div><div class="ts-land-result"><strong id="tsLandPipeGal">—</strong><span>Gallons in pipe</span></div></div>
          </article>
        </div>
        <div class="ts-land-tip"><strong>Field note:</strong> Material depth, compaction, waste, pallet coverage, plant layout, and actual irrigation distribution vary by job. Use these as estimating and field-math tools, then verify site conditions and supplier specifications.</div>
      </div>`;

    const electrical = $('electrical-tools');
    const premium = $('premium');
    if (electrical?.parentNode) electrical.parentNode.insertBefore(sec, electrical);
    else if (premium?.parentNode) premium.parentNode.insertBefore(sec, premium);
    else (document.querySelector('.container') || document.body).appendChild(sec);

    $('tsLandCalcLinear').onclick = calcFeet;
    $('tsLandCalcArea').onclick = calcRect;
    $('tsLandCalcCircle').onclick = calcCircle;
    $('tsLandCalcMaterial').onclick = calcMaterial;
    $('tsLandCalcSod').onclick = calcSod;
    $('tsLandCalcPlants').onclick = calcPlants;
    $('tsLandCalcGpm').onclick = calcGpm;
    $('tsLandCalcRuntime').onclick = calcRuntime;
    $('tsLandCalcPipe').onclick = calcPipe;

    const q = document.querySelector('.quick-trades');
    if (q && !$('tsLandJump')) {
      const b = document.createElement('button');
      b.id = 'tsLandJump'; b.type = 'button'; b.className = 'quick-trade-button';
      b.innerHTML = '<span class="quick-icon">🌿</span><span class="quick-label">Landscaping Tools</span>';
      b.onclick = () => sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
      q.appendChild(b);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
  else mount();
})();
