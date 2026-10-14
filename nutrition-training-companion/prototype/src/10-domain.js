/* Companion prototype — domain logic. Pure functions, no React.
   These implement the rules in docs/06 (evidence gate) and docs/07 (health
   rating, split review, readiness) so the prototype behaves like the design. */
(function () {
  'use strict';

  const C = window.Companion;
  const D = C.data;

  /* ------------------------------------------------------------ format */
  const round = (v, dp = 0) => {
    const f = Math.pow(10, dp);
    return Math.round(v * f) / f;
  };
  const fmt = {
    int: (v) => Math.round(v).toLocaleString('en-GB'),
    kcal: (v) => `${Math.round(v).toLocaleString('en-GB')} kcal`,
    /* 2.4 g, 25.6 g, 112 g */
    g: (v) => `${v >= 100 ? Math.round(v) : String(round(v, 1))} g`,
    num: (v, dp = 1) => String(round(v, dp)),
    sets: (v) => String(round(v, 1)),
    pct: (v) => `${Math.round(v * 100)}%`,
    minutes: (m) => {
      const h = Math.floor(m / 60);
      const mm = Math.round(m % 60);
      return h ? `${h} h ${mm} min` : `${mm} min`;
    },
    dayMonth: (ts) => new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
    weekdayLong: (ts) => {
      const d = new Date(ts);
      return `${d.toLocaleDateString('en-GB', { weekday: 'long' })}, ${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}`;
    },
    weekday: (n) => ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][n],
    time: (ts) => new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    relativeDay: (ts) => {
      const diff = Math.round((D.startOfToday() - new Date(ts).setHours(0, 0, 0, 0)) / D.DAY);
      if (diff <= 0) return 'Today';
      if (diff === 1) return 'Yesterday';
      return fmt.dayMonth(ts);
    }
  };

  /* --------------------------------------------------------- nutrients */
  const NUTRIENT_KEYS = ['energyKcal', 'proteinG', 'carbohydrateG', 'sugarsG', 'fatG', 'saturatedFatG', 'fiberG', 'sodiumMg'];
  const saltFromSodium = (sodiumMg) => (sodiumMg * 2.5) / 1000;

  function nutrientsFor(food, grams) {
    const out = {};
    NUTRIENT_KEYS.forEach((k) => {
      const v = food.nutrients[k];
      out[k] = v == null ? null : (v * grams) / 100;
    });
    out.saltG = out.sodiumMg == null ? null : saltFromSodium(out.sodiumMg);
    return out;
  }

  function sumNutrients(entries) {
    const total = { energyKcal: 0, proteinG: 0, carbohydrateG: 0, sugarsG: 0, fatG: 0, saturatedFatG: 0, fiberG: 0, sodiumMg: 0 };
    entries.forEach((e) => {
      Object.keys(total).forEach((k) => {
        total[k] += e.nutrients[k] || 0;
      });
    });
    return total;
  }

  /* ---------------------------------------------------- health rating */
  /* Thresholds per 100 g (food) or 100 ml (drink):
     UK front-of-pack guidance (2016) for sugars, salt, saturates and fat;
     Regulation (EC) No 1924/2006 for fibre and protein claims; NOVA for processing. */
  const FOP = {
    sugarsG: { food: [5, 22.5], drink: [2.5, 11.25], label: 'Sugar', ref: 'UK front-of-pack guidance' },
    saturatedFatG: { food: [1.5, 5], drink: [0.75, 2.5], label: 'Saturated fat', ref: 'UK front-of-pack guidance' },
    saltG: { food: [0.3, 1.5], drink: [0.3, 0.75], label: 'Salt', ref: 'UK front-of-pack guidance' },
    fatG: { food: [3, 17.5], drink: [1.5, 8.75], label: 'Fat', ref: 'UK front-of-pack guidance' }
  };
  const NOVA_WORDS = {
    1: 'NOVA group 1: unprocessed or minimally processed.',
    2: 'NOVA group 2: a processed culinary ingredient.',
    3: 'NOVA group 3: processed food.',
    4: 'NOVA group 4: likely ultra-processed.'
  };

  function healthRating(food) {
    const per100 = { ...food.nutrients, saltG: food.nutrients.sodiumMg == null ? null : saltFromSodium(food.nutrients.sodiumMg) };
    const basis = food.isBeverage ? 'drink' : 'food';
    const unit100 = food.isBeverage ? '100 ml' : '100 g';
    const serving = food.serving;
    const perServing = (v) => (serving ? (v * serving.grams) / 100 : null);
    const servingNoun = serving ? serving.label.replace(/\s*\(.*\)$/, '').replace(/^1 /, 'one ') : null;
    const dims = [];
    const gaps = [];

    ['sugarsG', 'saturatedFatG', 'saltG', 'fatG'].forEach((key) => {
      const rule = FOP[key];
      const v = per100[key];
      if (v == null) {
        gaps.push(rule.label);
        dims.push({ key, label: rule.label, palette: 'nutrientToLimit', status: 'unknown', explanation: 'Not on the label or in the database.' });
        return;
      }
      const [low, high] = rule[basis];
      const status = v <= low ? 'low' : v > high ? 'high' : 'medium';
      let explanation;
      if (status === 'high') explanation = `${fmt.num(v)} g per ${unit100}, above the UK 'high' level of ${high} g.`;
      else if (status === 'low') explanation = `${fmt.num(v)} g per ${unit100}, at or below the UK 'low' level of ${low} g.`;
      else explanation = `${fmt.num(v)} g per ${unit100}, between the UK 'low' (${low} g) and 'high' (${high} g) levels.`;
      const ps = perServing(v);
      if (ps != null && status !== 'low') explanation += ` ${capitalise(servingNoun)} has ${fmt.num(ps)} g.`;
      dims.push({ key, label: rule.label, palette: 'nutrientToLimit', status, value: v, explanation, ref: rule.ref });
    });

    /* Fibre: EU 'source of' >= 3 g/100 g or >= 1.5 g/100 kcal; 'high' >= 6 g/100 g or >= 3 g/100 kcal. */
    const fibre = per100.fiberG;
    if (fibre == null) {
      gaps.push('Fibre');
      dims.push({ key: 'fiberG', label: 'Fibre', palette: 'nutrientToEncourage', status: 'unknown', explanation: 'Not on the label or in the database.' });
    } else {
      const per100kcal = per100.energyKcal ? (fibre / per100.energyKcal) * 100 : 0;
      const status = fibre >= 6 || per100kcal >= 3 ? 'high' : fibre >= 3 || per100kcal >= 1.5 ? 'source' : 'low';
      const explanation =
        status === 'high' ? `${fmt.num(fibre)} g per ${unit100} meets the EU 'high fibre' level of 6 g.`
          : status === 'source' ? `${fmt.num(fibre)} g per ${unit100} meets the EU 'source of fibre' level of 3 g.`
            : `${fmt.num(fibre)} g per ${unit100}, below the EU 'source of fibre' level of 3 g.`;
      dims.push({ key: 'fiberG', label: 'Fibre', palette: 'nutrientToEncourage', status, value: fibre, explanation, ref: 'Regulation (EC) No 1924/2006' });
    }

    /* Protein: EU 'source of' >= 12% of energy; 'high' >= 20%. */
    if (per100.proteinG == null || !per100.energyKcal) {
      gaps.push('Protein');
      dims.push({ key: 'proteinG', label: 'Protein', palette: 'nutrientToEncourage', status: 'unknown', explanation: 'Not on the label or in the database.' });
    } else {
      const share = (per100.proteinG * 4) / per100.energyKcal;
      const status = share >= 0.2 ? 'high' : share >= 0.12 ? 'source' : 'low';
      const pct = Math.round(share * 100);
      const explanation =
        status === 'high' ? `${pct}% of the calories come from protein, above the EU 'high protein' level of 20%.`
          : status === 'source' ? `${pct}% of the calories come from protein, above the EU 'source of protein' level of 12%.`
            : `${pct}% of the calories come from protein, below the EU 'source of protein' level of 12%.`;
      dims.push({ key: 'proteinG', label: 'Protein', palette: 'nutrientToEncourage', status, value: per100.proteinG, explanation, ref: 'Regulation (EC) No 1924/2006' });
    }

    /* Processing (NOVA). */
    if (food.nova) {
      const markers = (food.additives || []).slice(0, 3);
      let explanation = NOVA_WORDS[food.nova];
      if (markers.length) explanation += ` Contains ${listJoin(markers)}.`;
      dims.push({ key: 'processing', label: 'Processing', palette: 'processing', status: `nova${food.nova}`, explanation, ref: 'NOVA classification' });
    } else {
      gaps.push('Processing');
      dims.push({ key: 'processing', label: 'Processing', palette: 'processing', status: 'unknown', explanation: 'Not enough information to judge processing.' });
    }

    /* Order as the brief lists them: sugar, sodium, fibre, saturated fat, processing, protein; fat last. */
    const order = ['sugarsG', 'saltG', 'fiberG', 'saturatedFatG', 'processing', 'proteinG', 'fatG'];
    dims.sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));

    const highs = dims.filter((d) => d.palette === 'nutrientToLimit' && d.status === 'high').map((d) => d.label.toLowerCase());
    const goods = dims.filter((d) => d.palette === 'nutrientToEncourage' && (d.status === 'high' || d.status === 'source'))
      .map((d) => (d.status === 'high' ? `high in ${d.label.toLowerCase()}` : `a source of ${d.label.toLowerCase()}`));
    const parts = [];
    if (highs.length) parts.push(`high in ${listJoin(highs)}`);
    parts.push(...goods);
    if (food.nova === 4) parts.push('likely ultra-processed');
    const summary = parts.length ? `${capitalise(listJoin(parts))}.` : 'No nutrient is in a high band.';
    return { summary, dimensions: dims, dataGaps: gaps, basis: unit100 };
  }

  /* ------------------------------------------------------------ barcode */
  function normalizeGtin(input) {
    const digits = String(input || '').replace(/[\s-]/g, '');
    if (!/^\d+$/.test(digits)) return { ok: false, error: 'Use digits only.' };
    if (![8, 12, 13, 14].includes(digits.length)) return { ok: false, error: 'Barcodes have 8, 12, 13 or 14 digits.' };
    const body = digits.slice(0, -1);
    if (D.checkDigit(body) !== digits.slice(-1)) {
      return { ok: false, error: "That number's last digit doesn't match. Check it and try again." };
    }
    return { ok: true, gtin14: digits.padStart(14, '0') };
  }

  /* What a scan or a typed code contains. Linear barcodes (EAN-13, UPC-A,
     EAN-8, GTIN-14) carry the digits; QR codes and Data Matrix on packs carry
     a GS1 Digital Link URI (https://<domain>/01/<GTIN>/10/<batch>?17=<expiry>)
     or a GS1 element string ("(01)<GTIN>(17)…", or unbracketed after a
     symbology prefix such as ]Q3 or ]d2). Batch, serial and expiry are kept
     but never used for lookup. */
  const GS1_EXTRAS = { 10: 'batch', 21: 'serial', 17: 'expiry', 15: 'bestBefore' };
  function parseScan(raw) {
    const text = String(raw || '').trim();
    if (!text) return { ok: false, error: 'Enter the digits under the bars.' };
    if (/^https?:\/\//i.test(text)) {
      let url;
      try { url = new URL(text); } catch (e) { return { ok: false, error: "We couldn't read that link." }; }
      const parts = url.pathname.split('/').filter(Boolean).map((p) => decodeURIComponent(p));
      const at = parts.findIndex((p, i) => (p === '01' || p.toLowerCase() === 'gtin') && /^\d{8,14}$/.test(parts[i + 1] || ''));
      if (at < 0) return { ok: false, error: "This QR code is a web link, not a product code. Scan the barcode instead." };
      const norm = normalizeGtin(parts[at + 1]);
      if (!norm.ok) return norm;
      const extras = {};
      for (let i = at + 2; i + 1 < parts.length; i += 2) if (GS1_EXTRAS[parts[i]]) extras[GS1_EXTRAS[parts[i]]] = parts[i + 1];
      url.searchParams.forEach((v, k) => { if (GS1_EXTRAS[k]) extras[GS1_EXTRAS[k]] = v; });
      return { ...norm, kind: 'gs1_digital_link', host: url.hostname, extras };
    }
    const element = text.replace(/^\](Q3|d2|C1|e0)/, '');
    const bracketed = element.match(/^\(01\)(\d{14})/);
    /* Unbracketed: "01" + 14 digits, then more data (16+ characters, so never a bare GTIN). */
    const plain = !bracketed && element.length >= 16 ? element.match(/^01(\d{14})/) : null;
    if (bracketed || plain) {
      const norm = normalizeGtin((bracketed || plain)[1]);
      return norm.ok ? { ...norm, kind: 'gs1_element_string', extras: {} } : norm;
    }
    const norm = normalizeGtin(text);
    return norm.ok ? { ...norm, kind: 'barcode', extras: {} } : norm;
  }

  /* Mirror first, then the source chain: Open Food Facts, then FoodData Central. */
  function lookupBarcode(gtin14, customFoods) {
    const custom = (customFoods || []).find((f) => f.gtin && f.gtin.padStart(14, '0') === gtin14);
    if (custom) return { status: 'found', food: custom, path: ['your foods'] };
    const product = D.PRODUCTS.find((p) => p.gtin.padStart(14, '0') === gtin14);
    if (!product) return { status: 'not_found', path: ['Open Food Facts', 'USDA FoodData Central'] };
    if (product.offIncomplete) {
      return { status: 'found', food: product, path: ['Open Food Facts (no nutrition data)', 'USDA FoodData Central'] };
    }
    return { status: 'found', food: product, path: ['Open Food Facts'] };
  }

  function allFoods(customFoods) {
    return [...(customFoods || []), ...D.PRODUCTS, ...D.GENERIC_FOODS];
  }
  function findFood(id, customFoods) {
    return allFoods(customFoods).find((f) => f.id === id) || null;
  }
  function searchFoods(query, customFoods) {
    const q = String(query || '').trim().toLowerCase();
    const list = allFoods(customFoods);
    if (!q) return list;
    return list.filter((f) => `${f.name} ${f.brand || ''}`.toLowerCase().includes(q));
  }

  /* ------------------------------------------------------------- labels */
  const SYNONYMS = (() => {
    const map = {};
    Object.entries(D.INGREDIENTS).forEach(([id, words]) => words.forEach((w) => { map[w] = id; }));
    return map;
  })();
  function levenshtein(a, b) {
    const m = a.length;
    const n2 = b.length;
    const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n2).fill(0)]);
    for (let j = 1; j <= n2; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n2; j++) {
        dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      }
    }
    return dp[m][n2];
  }
  /* Split on commas that are not inside brackets. */
  function splitTopLevel(text) {
    const out = [];
    let depth = 0;
    let buf = '';
    for (const ch of text) {
      if (ch === '(') depth++;
      if (ch === ')') depth = Math.max(0, depth - 1);
      if (ch === ',' && depth === 0) {
        out.push(buf.trim());
        buf = '';
      } else buf += ch;
    }
    if (buf.trim()) out.push(buf.trim());
    return out;
  }
  function parseIngredients(text) {
    return splitTopLevel(text || '').map((raw, i) => {
      const pctMatch = raw.match(/\((\d+(?:[.,]\d+)?)\s*%\)/);
      const name = raw.replace(/\(.*?\)/g, '').replace(/:.*$/, '').trim().toLowerCase();
      const canonicalId = SYNONYMS[name] || null;
      let suggestion = null;
      if (!canonicalId) {
        let best = null;
        Object.keys(SYNONYMS).forEach((w) => {
          const d = levenshtein(name, w);
          if (d <= 2 && (!best || d < best.d)) best = { w, d };
        });
        if (best) suggestion = best.w;
      }
      return {
        position: i + 1,
        raw,
        name,
        percent: pctMatch ? Number(pctMatch[1].replace(',', '.')) : null,
        canonicalId,
        suggestion,
        flags: canonicalId ? [] : ['needs_review']
      };
    });
  }

  /* "Energy 1766 kJ / 421 kcal" … → per-100 g nutrients. */
  function parsePanel(text) {
    if (!text) return null;
    const grab = (re) => {
      const m = text.match(re);
      return m ? Number(m[1].replace(',', '.')) : null;
    };
    const salt = grab(/salt\s+([\d.,]+)\s*g/i);
    return {
      energyKcal: grab(/([\d.,]+)\s*kcal/i),
      fatG: grab(/^fat\s+([\d.,]+)\s*g/im),
      saturatedFatG: grab(/saturates\s+([\d.,]+)\s*g/i),
      carbohydrateG: grab(/carbohydrate\s+([\d.,]+)\s*g/i),
      sugarsG: grab(/sugars\s+([\d.,]+)\s*g/i),
      fiberG: grab(/fibre\s+([\d.,]+)\s*g/i),
      proteinG: grab(/protein\s+([\d.,]+)\s*g/i),
      sodiumMg: salt == null ? null : (salt * 1000) / 2.5
    };
  }

  /* Energy from macros (EU factors): 4 protein, 4 carbohydrate, 9 fat, 2 fibre. */
  function validateNutrients(nu) {
    const issues = [];
    const keys = ['proteinG', 'carbohydrateG', 'fatG'];
    if (keys.some((k) => nu[k] == null) || nu.energyKcal == null) {
      return { ok: false, issues: ['Some values are missing.'], energyGap: null };
    }
    const fromMacros = 4 * nu.proteinG + 4 * nu.carbohydrateG + 9 * nu.fatG + 2 * (nu.fiberG || 0);
    const energyGap = Math.abs(fromMacros - nu.energyKcal) / nu.energyKcal;
    if (energyGap > 0.15) issues.push(`Calories differ from the protein, carbs and fat by ${Math.round(energyGap * 100)}%.`);
    const mass = nu.proteinG + nu.carbohydrateG + nu.fatG + (nu.fiberG || 0);
    if (mass > 100) issues.push('Protein, carbs, fat and fibre add up to more than 100 g per 100 g.');
    if (nu.sugarsG != null && nu.sugarsG > nu.carbohydrateG) issues.push('Sugars are higher than total carbohydrate.');
    if (nu.saturatedFatG != null && nu.saturatedFatG > nu.fatG) issues.push('Saturated fat is higher than total fat.');
    return { ok: issues.length === 0, issues, energyGap };
  }

  /* Ingredient-only estimate: mirror products sharing the leading ingredients give the range. */
  function estimateFromIngredients(ingredients) {
    const ids = ingredients.map((i) => i.canonicalId || SYNONYMS[i.suggestion] || null).filter(Boolean);
    const lead = ids.slice(0, 3);
    const neighbours = D.PRODUCTS.filter((p) => p.ingredients && !p.isBeverage).filter((p) => {
      const theirs = parseIngredients(p.ingredients).map((x) => x.canonicalId).filter(Boolean);
      return lead.filter((id) => theirs.includes(id)).length >= 2;
    });
    if (neighbours.length < 3) return { neighbours: neighbours.length, per100: null };
    const keys = ['energyKcal', 'proteinG', 'carbohydrateG', 'sugarsG', 'fatG', 'saturatedFatG', 'fiberG', 'sodiumMg'];
    const per100 = {};
    keys.forEach((k) => {
      const vals = neighbours.map((p) => p.nutrients[k]).sort((a, b) => a - b);
      const mid = vals.length % 2 ? vals[(vals.length - 1) / 2] : (vals[vals.length / 2 - 1] + vals[vals.length / 2]) / 2;
      per100[k] = { value: round(mid, 1), low: vals[0], high: vals[vals.length - 1] };
    });
    return { neighbours: neighbours.length, per100, names: neighbours.map((p) => p.name) };
  }

  /* Everything the label-review screen needs, recomputed after each correction. */
  function assessLabel(sample, edits) {
    const e = edits || {};
    const ingredientsText = e.ingredientsText != null ? e.ingredientsText : sample.ingredientsText;
    const ingredients = parseIngredients(ingredientsText);
    const reasons = [];
    const review = [];
    let nutrients;
    let ranges = null;
    let method;

    if (sample.hasPanel) {
      method = 'panel';
      nutrients = { ...parsePanel(sample.panelText), ...(e.nutrients || {}) };
    } else if (e.nutrients && Object.keys(e.nutrients).length) {
      method = 'user';
      const est = estimateFromIngredients(ingredients);
      nutrients = {};
      ['energyKcal', 'proteinG', 'carbohydrateG', 'sugarsG', 'fatG', 'saturatedFatG', 'fiberG', 'sodiumMg'].forEach((k) => {
        nutrients[k] = e.nutrients[k] != null ? e.nutrients[k] : est.per100 ? est.per100[k].value : null;
      });
      ranges = est.per100;
    } else {
      method = 'ingredients';
      const est = estimateFromIngredients(ingredients);
      ranges = est.per100;
      nutrients = {};
      if (est.per100) Object.keys(est.per100).forEach((k) => { nutrients[k] = est.per100[k].value; });
      reasons.push({ code: 'no_nutrition_panel', message: "There's no nutrition panel, so calories are estimated from the ingredient order." });
      if (est.per100) {
        reasons.push({ code: 'estimated_from_similar', message: `Ranges come from ${est.neighbours} similar products.` });
        const sugarSpread = est.per100.sugarsG.high - est.per100.sugarsG.low;
        if (sugarSpread > 8) review.push('sugarsG');
      } else {
        reasons.push({ code: 'no_similar_products', message: "We couldn't find enough similar products to estimate from. Enter the values yourself." });
      }
    }

    const unresolved = ingredients.filter((i) => !i.canonicalId);
    if (unresolved.length) {
      reasons.push({ code: 'ocr_uncertain_tokens', message: `${unresolved.length === 1 ? '1 word was' : `${unresolved.length} words were`} hard to read. ${unresolved.length === 1 ? "It's" : "They're"} marked below.` });
    }
    const validation = validateNutrients(nutrients);
    validation.issues.forEach((msg) => reasons.push({ code: 'validation', message: msg }));

    let confidence;
    if (method === 'panel' && validation.ok && !unresolved.length && sample.ocrConfidence >= 0.85) confidence = 'high';
    else if ((method === 'panel' || method === 'user') && validation.ok && unresolved.length <= 1) confidence = 'medium';
    else confidence = 'low';

    return { ingredients, nutrients, ranges, method, confidence, reasons, fieldsNeedingReview: review, validation };
  }

  /* ------------------------------------------------------------ training */
  const exerciseById = (id) => D.EXERCISES.find((x) => x.id === id);
  const muscleById = (id) => D.MUSCLES.find((m) => m.id === id);
  const WARMUP_S = 300;
  const WORK_S = 40;

  function weeklyVolume(def) {
    const vol = {};
    D.MUSCLES.forEach((m) => { vol[m.id] = 0; });
    def.days.forEach((day) => day.items.forEach((it) => {
      const ex = exerciseById(it.exercise);
      Object.entries(ex.credit).forEach(([m, credit]) => { vol[m] += it.sets * credit; });
    }));
    return vol;
  }
  function groupVolume(vol) {
    const groups = {};
    D.MUSCLES.forEach((m) => { groups[m.group] = (groups[m.group] || 0) + vol[m.id]; });
    return groups;
  }
  function dayMinutes(day) {
    const s = day.items.reduce((acc, it) => acc + it.sets * (it.restS + WORK_S), WARMUP_S);
    return Math.round(s / 60);
  }
  const dayLabelWithWeekday = (day) => (day.weekday != null ? `${fmt.weekday(day.weekday)}, ${day.label}` : day.label);

  function reviewSplit(def, profile) {
    const vol = weeklyVolume(def);
    const findings = [];
    const claim = D.CLAIMS.find((c) => c.key === 'hypertrophy.volume.raise_low_weekly_sets' && c.status === 'active');
    const low = D.MUSCLES.filter((m) => vol[m.id] > 0 && vol[m.id] < 10).sort((a, b) => vol[a.id] - vol[b.id]);
    if (claim && low.length) {
      findings.push({
        code: 'low_volume', severity: 'info',
        title: 'Under 10 weekly sets',
        detail: low.length > 4
          ? `${low.slice(0, 3).map((m) => `${m.name} ${fmt.sets(vol[m.id])}`).join(', ')} and ${low.length - 3} more.`
          : `${low.map((m) => `${m.name} ${fmt.sets(vol[m.id])}`).join(', ')}.`,
        muscles: low.map((m) => m.id), claimKey: claim.key
      });
    }
    const zero = D.MUSCLES.filter((m) => vol[m.id] === 0);
    if (zero.length) findings.push({ code: 'no_direct_work', severity: 'info', title: 'No direct work', detail: zero.map((m) => m.name).join(', '), muscles: zero.map((m) => m.id) });
    const push = vol.chest + vol.front_delts;
    const pull = vol.lats + vol.upper_back;
    if (pull > 0 && push / pull > 1.5) {
      findings.push({ code: 'volume_imbalance', severity: 'info', title: 'More pushing than pulling', detail: `Chest and front delts ${fmt.sets(push)} sets; lats and upper back ${fmt.sets(pull)} sets.`, muscles: ['lats', 'upper_back'] });
    }
    const trainingDays = def.days.map((d) => d.weekday).filter((w) => w != null).sort();
    const restDays = 7 - new Set(trainingDays).size;
    if (restDays === 0) findings.push({ code: 'no_rest_day', severity: 'info', title: 'No rest day', detail: 'Every day of the week has a session.' });
    /* Same primary muscle on consecutive days. */
    for (let i = 0; i < def.days.length; i++) {
      for (let j = 0; j < def.days.length; j++) {
        const a = def.days[i];
        const b = def.days[j];
        if (a.weekday == null || b.weekday == null || (b.weekday - a.weekday + 7) % 7 !== 1) continue;
        const prim = (day) => new Set(day.items.flatMap((it) => Object.entries(exerciseById(it.exercise).credit).filter(([, c]) => c === 1).map(([m]) => m)));
        const shared = [...prim(a)].filter((m) => prim(b).has(m));
        if (shared.length) {
          findings.push({ code: 'recovery_spacing', severity: 'info', title: 'Same muscles on back-to-back days', detail: `${a.label} and ${b.label} both train ${listJoin(shared.map((m) => muscleById(m).name.toLowerCase()))}.` });
        }
      }
    }
    const limit = (profile && profile.sessionMinutes) || 60;
    def.days.forEach((d) => {
      const mins = dayMinutes(d);
      if (mins > limit) findings.push({ code: 'constraint_violation', severity: 'warning', title: `${d.label} runs long`, detail: `About ${mins} minutes; your limit is ${limit}.` });
    });
    if (profile && profile.goal === 'strength') {
      const heavy = def.days.some((d) => d.items.some((it) => it.repMin <= 6));
      if (!heavy) findings.push({ code: 'goal_mismatch', severity: 'info', title: 'Few heavy sets for a strength goal', detail: 'No main lift is set at 6 reps or fewer.' });
    }
    return { volume: vol, groups: groupVolume(vol), findings, minutes: Object.fromEntries(def.days.map((d) => [d.key, dayMinutes(d)])) };
  }

  /* Structured diff between two split definitions. */
  function diffDefinitions(a, b) {
    const ops = [];
    b.days.forEach((dayB) => {
      const dayA = a.days.find((d) => d.key === dayB.key) || { items: [] };
      const label = dayLabelWithWeekday(dayB);
      dayB.items.forEach((it) => {
        const prev = dayA.items.find((x) => x.exercise === it.exercise);
        const ex = exerciseById(it.exercise);
        if (!prev) {
          ops.push({ op: 'add', dayKey: dayB.key, dayLabel: label, exercise: it.exercise, name: ex.name, after: it,
            text: `${label}. ${it.sets} sets of ${it.repMin}–${it.repMax}, ${it.rir} reps in reserve.` });
        } else if (prev.sets !== it.sets || prev.repMin !== it.repMin || prev.repMax !== it.repMax) {
          const parts = [];
          if (prev.sets !== it.sets) parts.push(`${prev.sets} sets to ${it.sets} sets`);
          if (prev.repMin !== it.repMin || prev.repMax !== it.repMax) parts.push(`${prev.repMin}–${prev.repMax} reps to ${it.repMin}–${it.repMax}`);
          ops.push({ op: 'change', dayKey: dayB.key, dayLabel: label, exercise: it.exercise, name: ex.name, before: prev, after: it, text: `${label}. ${capitalise(parts.join(', '))}.` });
        }
      });
      dayA.items.forEach((it) => {
        if (!dayB.items.find((x) => x.exercise === it.exercise)) {
          ops.push({ op: 'remove', dayKey: dayB.key, dayLabel: label, exercise: it.exercise, name: exerciseById(it.exercise).name, before: it, text: `${label}. ${it.sets} sets removed.` });
        }
      });
    });
    return ops;
  }
  function volumeDeltas(a, b) {
    const va = weeklyVolume(a);
    const vb = weeklyVolume(b);
    return D.MUSCLES.filter((m) => va[m.id] !== vb[m.id]).map((m) => ({ muscle: m.id, name: m.name, before: va[m.id], after: vb[m.id] }));
  }
  function summarizeOps(ops) {
    if (!ops.length) return 'No changes.';
    const change = (o) => {
      const parts = [];
      if (o.before.sets !== o.after.sets) parts.push(`${o.before.sets} to ${o.after.sets} sets`);
      if (o.before.repMin !== o.after.repMin || o.before.repMax !== o.after.repMax) parts.push(`${o.before.repMin}–${o.before.repMax} to ${o.after.repMin}–${o.after.repMax} reps`);
      return `${o.name} ${parts.join(', ')}`;
    };
    return ops.map((o) => (o.op === 'add' ? `Added ${exerciseWords(o.name)}` : o.op === 'remove' ? `Removed ${exerciseWords(o.name)}` : change(o))).join('. ') + '.';
  }

  /* --------------------------------------------------------- intents */
  /* In the real app Claude parses the request into this structure; here a
     keyword parser stands in. The user confirms the parsed intent either way. */
  function parseIntent(text) {
    const t = ` ${String(text || '').toLowerCase().replace(/[^a-z0-9\s-]/g, ' ')} `;
    const has = (w) => t.includes(` ${w} `) || t.includes(` ${w}s `);
    const exercise = D.EXERCISES.find((x) => t.includes(x.name.toLowerCase()) || t.includes(x.id.replace(/-/g, ' ')));
    if (exercise && /\b(remove|drop|stop|delete|get rid)\b/.test(t)) {
      return { type: 'remove_exercise', exercise: exercise.id, summary: `Remove ${exerciseWords(exercise.name)} from your split.` };
    }
    if (exercise && /\b(add|include|fit in|start)\b/.test(t)) {
      const primary = Object.entries(exercise.credit).find(([, c]) => c === 1)[0];
      return { type: 'add_exercise', exercise: exercise.id, muscle: primary, summary: `Add ${exerciseWords(exercise.name)} to grow your ${muscleById(primary).name.toLowerCase()}.` };
    }
    if (/\bprotein\b/.test(t)) return { type: 'nutrition_target', nutrient: 'proteinG', summary: 'Check your daily protein target against the evidence.' };
    if (/\bfib(re|er)\b/.test(t)) return { type: 'nutrition_target', nutrient: 'fiberG', summary: 'Check your daily fibre target against the evidence.' };
    if (/\b(stronger|strength|powerlifting|1rm|max)\b/.test(t)) return { type: 'switch_style', style: 'strength', summary: 'Switch your plan toward strength.' };
    if (/\b(run|running|marathon|5k|10k|cardio|endurance)\b/.test(t)) return { type: 'switch_style', style: 'hybrid', summary: 'Add running and move toward a hybrid plan.' };
    if (/\b(hybrid)\b/.test(t)) return { type: 'switch_style', style: 'hybrid', summary: 'Move toward a hybrid plan.' };
    /* Longer phrases first ("upper back" before "back"). */
    const candidates = [];
    Object.entries(D.MUSCLE_WORDS).forEach(([muscle, words]) => words.forEach((w) => candidates.push({ muscle, w })));
    candidates.sort((a, b) => b.w.length - a.w.length);
    const hit = candidates.find((c) => (c.w.includes(' ') ? t.includes(` ${c.w} `) : has(c.w)));
    if (hit) {
      return { type: 'develop_muscle', muscle: hit.muscle, summary: `Build your ${muscleById(hit.muscle).name.toLowerCase()}.` };
    }
    return { type: 'unknown', summary: null };
  }

  /* ------------------------------------------------------ evidence gate */
  const REQUIRED_SOURCES = 3;
  const sourceById = (id) => D.SOURCES.find((s) => s.id === id);
  const isVerified = (src) => Object.values(src.checks).every((v) => v === 'pass');
  function claimByKey(key) {
    return D.CLAIMS.find((c) => c.key === key) || null;
  }
  function verifiedSourcesFor(claim) {
    if (!claim || claim.status !== 'active') return [];
    return claim.sources.map(sourceById).filter(Boolean).filter(isVerified);
  }

  function safetyCheck(profile, regions) {
    const flags = (profile && profile.safetyFlags) || [];
    if (flags.includes('pregnancy')) return { blocked: true, reason: "You told us you're pregnant, so we don't suggest training changes. A professional can tailor your plan." };
    if (flags.includes('condition_reported') && !flags.includes('clinician_supervised')) {
      return { blocked: true, reason: 'You told us about a medical condition, so we hold suggestions until you confirm a professional is supervising your training.' };
    }
    const injured = (profile && profile.injuryRegions) || [];
    if (flags.includes('injury_reported') && regions.some((r) => injured.includes(r))) {
      return { blocked: true, reason: 'You reported an injury in this area, so we won\'t suggest changes that load it. Please check with a professional.' };
    }
    return { blocked: false };
  }

  /* Raise a low-volume muscle toward the claim's range within the user's time limit. */
  function buildVolumeProposal(def, muscle, profile, preferredExercise) {
    const next = D.clone(def);
    const limit = (profile && profile.sessionMinutes) || 60;
    const equipment = (profile && profile.equipment) || D.EQUIPMENT;
    const claim = claimByKey('hypertrophy.volume.raise_low_weekly_sets');
    const target = claim.appliesTo.maxStartingSets;
    const ceiling = claim.appliesTo.ceilingSets;
    const volume = () => weeklyVolume(next)[muscle];
    const region = (exId) => exerciseById(exId).region;
    const fits = (day, extraSets, restS) => dayMinutes(day) + (extraSets * (restS + WORK_S)) / 60 <= limit;
    const usable = (ex) => ex.equipment.every((e) => equipment.includes(e));
    const primaryFor = (ex) => ex.credit[muscle] === 1;

    const daysFor = (reg) => next.days.filter((d) => d.items.some((it) => region(it.exercise) === reg))
      .sort((a, b) => dayMinutes(a) - dayMinutes(b));

    const distinctPrimary = new Set(next.days.flatMap((d) => d.items.filter((it) => primaryFor(exerciseById(it.exercise))).map((it) => it.exercise)));
    const toAdd = preferredExercise ? exerciseById(preferredExercise)
      : distinctPrimary.size < 2 ? D.EXERCISES.find((ex) => primaryFor(ex) && usable(ex) && !distinctPrimary.has(ex.id)) : null;
    if (toAdd && usable(toAdd) && !distinctPrimary.has(toAdd.id)) {
      const day = daysFor(toAdd.region).find((d) => fits(d, 3, 105));
      if (day) day.items.push({ exercise: toAdd.id, sets: 3, repMin: 8, repMax: 12, rir: 2, restS: 105 });
    }
    /* Then one set at a time: primary exercises first, then secondary, up to 4 sets each. */
    let guard = 0;
    while (volume() < target && guard++ < 40) {
      const candidates = [];
      next.days.forEach((d) => d.items.forEach((it) => {
        const credit = exerciseById(it.exercise).credit[muscle] || 0;
        if (credit && it.sets < 4 && fits(d, 1, it.restS)) candidates.push({ d, it, credit });
      }));
      if (!candidates.length) break;
      candidates.sort((a, b) => b.credit - a.credit || dayMinutes(a.d) - dayMinutes(b.d));
      candidates[0].it.sets += 1;
      if (volume() > ceiling) {
        candidates[0].it.sets -= 1;
        break;
      }
    }
    const ops = diffDefinitions(def, next);
    const minutes = def.days.map((d) => ({ dayKey: d.key, label: d.label, before: dayMinutes(d), after: dayMinutes(next.days.find((x) => x.key === d.key)), limit }))
      .filter((m) => m.before !== m.after);
    return { definition: next, ops, deltas: volumeDeltas(def, next), minutes, reachedTarget: volume() >= target, after: volume(), before: weeklyVolume(def)[muscle] };
  }

  /* Heavier loads on main multi-joint lifts that are trained with light loads.
     The verified claim (strength.low_rep_ranges) shows heavy loads (about 8 or
     fewer reps) beat light loads (about 15 or more reps) for 1RM strength; it
     does not show heavy beats moderate, so moderate lifts are left alone.
     Sets and rests stay as they are, so session length doesn't change. */
  const MAIN_LIFTS = ['bench-press', 'incline-bb-press', 'overhead-press', 'barbell-row', 'back-squat', 'romanian-deadlift'];
  function strengthBands(claim) {
    const ap = (claim && claim.appliesTo) || {};
    const heavyMax = Number(ap.heavyLoadApproxMaxRepsPerSet) || 8;
    const lightMin = Number(ap.lightLoadApproxMinRepsPerSet) || 15;
    return { heavyMax, lightMin, target: [Math.max(3, heavyMax - 2), heavyMax] };
  }
  function buildStrengthProposal(def, claim) {
    const { lightMin, target } = strengthBands(claim);
    const next = D.clone(def);
    next.days.forEach((d) => d.items.forEach((it) => {
      if (MAIN_LIFTS.includes(it.exercise) && it.repMin >= lightMin) {
        it.repMin = target[0];
        it.repMax = target[1];
      }
    }));
    return { definition: next, ops: diffDefinitions(def, next), deltas: [], minutes: [], repRange: target };
  }

  /* Daily nutrition targets the gate can suggest, and the claim each rests on.
     The numbers come from the claim's appliesTo (set by the evidence editor);
     the fallbacks are used only if the claim is active but names no number. */
  const TARGET_RULES = {
    proteinG: { claim: 'nutrition.protein_intake_for_muscle_gain', label: 'protein', title: 'A higher protein target' },
    fiberG: { claim: 'nutrition.fibre_intake_target', label: 'fibre', title: 'A higher fibre target' }
  };
  const firstNumber = (obj, keys, fallback) => {
    for (const k of keys) if (obj && Number(obj[k]) > 0) return Number(obj[k]);
    return fallback;
  };
  function evaluateTarget(intent, state, base, requestText) {
    const rule = TARGET_RULES[intent.nutrient];
    const profile = state.profile || {};
    const flags = profile.safetyFlags || [];
    const claim = claimByKey(rule.claim);
    const verified = verifiedSourcesFor(claim);
    const ask = { ...base, kind: 'target_change', claimKey: rule.claim, verifiedCount: verified.length };
    if (flags.includes('pregnancy')) {
      return { ...ask, status: 'blocked_safety', reason: "You told us you're pregnant, so we don't suggest nutrition targets. A professional can tailor them to you." };
    }
    if (intent.nutrient === 'proteinG' && flags.includes('condition_reported') && !flags.includes('clinician_supervised')) {
      return { ...ask, status: 'blocked_safety', reason: 'You told us about a medical condition, so we hold protein suggestions until a professional supervises your plan. Some conditions, such as kidney disease, need individual advice.' };
    }
    if (verified.length < REQUIRED_SOURCES) {
      return { ...ask, status: 'blocked_insufficient_evidence',
        reason: `Our evidence library doesn't yet have 3 verified studies behind a daily ${rule.label} target, so we haven't changed your targets.` };
    }
    const ap = claim.appliesTo || {};
    const current = state.targets ? state.targets[intent.nutrient] : null;
    let target;
    let basis;
    if (intent.nutrient === 'proteinG') {
      const goals = Array.isArray(ap.goals) && ap.goals.length ? ap.goals : ['muscle_gain'];
      if (!goals.includes(profile.goal)) {
        return { ...ask, status: 'blocked_insufficient_evidence',
          reason: `Our verified evidence on protein is about building muscle, and your goal is set to ${goalLabel(profile.goal).toLowerCase()}. So we haven't changed your targets.` };
      }
      if (!profile.weightKg) {
        return { ...ask, status: 'blocked_constraints', reason: 'Add your weight in Profile so we can work out a protein target in grams.' };
      }
      const perKg = firstNumber(ap, ['targetGPerKg', 'proteinGPerKgPerDay', 'gPerKgPerDay', 'gPerKg'], 1.6);
      target = Math.round(perKg * profile.weightKg);
      basis = `${fmt.num(perKg, 1)} g per kg of body weight a day, which is ${target} g for ${fmt.num(profile.weightKg, 1)} kg`;
    } else {
      target = Math.round(firstNumber(ap, ['minGPerDay', 'targetMinGPerDay', 'targetGPerDay', 'minimumGPerDay'], 25));
      basis = `at least ${target} g a day`;
    }
    if (current != null && current >= target) {
      return { ...ask, status: 'not_needed',
        reason: `Your ${rule.label} target of ${Math.round(current)} g already meets ${basis}, so there's nothing to change.` };
    }
    const before = current == null ? null : Math.round(current);
    const name = capitalise(rule.label);
    return {
      ...ask,
      status: 'proposed',
      sourceIds: verified.map((x) => x.id),
      title: rule.title,
      proposal: {
        targets: [{ key: intent.nutrient, label: name, before, after: target, unit: 'g' }],
        ops: [{ op: 'change', dayKey: 'targets', exercise: intent.nutrient, name: `Daily ${rule.label}`,
          text: `${before == null ? 'No target' : `${before} g`} to ${target} g a day: ${basis}.` }],
        deltas: [], minutes: []
      },
      drivers: [
        { label: 'You asked', detail: requestText ? `"${requestText}"` : intent.summary },
        { label: `Your ${rule.label} target`, detail: before == null ? 'Not set.' : `${before} g a day.` },
        intent.nutrient === 'proteinG' ? { label: 'Your weight', detail: `${fmt.num(profile.weightKg, 1)} kg, from your profile.` } : null,
        { label: 'Your goal', detail: goalLabel(profile.goal) }
      ].filter(Boolean)
    };
  }

  /* Decide what the app may do with an intent. Returns a recommendation draft.
     opts.requestText is the user's own words, shown as a driver. */
  function evaluateChange(intent, state, opts) {
    const requestText = (opts && opts.requestText) || null;
    const profile = state.profile;
    const def = currentDefinition(state);
    const base = { intent, required: REQUIRED_SOURCES, disclaimerVersion: D.DISCLAIMER.version };
    if (intent.type === 'unknown') return { ...base, status: 'not_understood' };
    if (intent.type === 'remove_exercise') return { ...base, status: 'user_edit' };
    if (intent.type === 'nutrition_target') return evaluateTarget(intent, state, base, requestText);

    const notEnough = 'Our evidence library doesn\'t yet have 3 verified studies behind this kind of change, so we haven\'t changed your plan.';
    if (intent.type === 'switch_style' && intent.style === 'strength') {
      const claim = claimByKey('strength.low_rep_ranges');
      const verified = verifiedSourcesFor(claim);
      if (verified.length < REQUIRED_SOURCES) {
        return { ...base, status: 'blocked_insufficient_evidence', claimKey: 'strength.low_rep_ranges', verifiedCount: verified.length, reason: notEnough };
      }
      const lifts = def.days.flatMap((d) => d.items.filter((it) => MAIN_LIFTS.includes(it.exercise)).map((it) => ({ d, it })));
      if (!lifts.length) {
        return { ...base, status: 'blocked_constraints', claimKey: claim.key, verifiedCount: verified.length,
          reason: 'Your split has none of the main multi-joint lifts (squat, bench press, overhead press, barbell row or Romanian deadlift), so there\'s nothing for us to make heavier. Edit the split yourself to add one.' };
      }
      const safety = safetyCheck(profile, [...new Set(lifts.map((l) => exerciseById(l.it.exercise).region))]);
      if (safety.blocked) return { ...base, status: 'blocked_safety', reason: safety.reason };
      const proposal = buildStrengthProposal(def, claim);
      if (!proposal.ops.length) {
        const { lightMin } = strengthBands(claim);
        const heaviest = Math.max(...lifts.map((l) => l.it.repMax));
        return { ...base, status: 'blocked_insufficient_evidence', claimKey: claim.key, verifiedCount: verified.length,
          reason: `Your main lifts already use moderate or heavy loads (${heaviest} reps a set at most). Our verified studies show heavier loads build more strength than light ones (${lightMin} or more reps), but not that going heavier than you already do adds more. So we haven't changed your plan.` };
      }
      const growth = claimByKey('hypertrophy.load_range_similar_growth');
      const names = [...new Set(proposal.ops.map((o) => exerciseWords(o.name)))];
      const drivers = [
        { label: 'You asked', detail: requestText ? `"${requestText}"` : intent.summary },
        { label: 'Your main lifts', detail: `${capitalise(listJoin(names))} ${names.length === 1 ? 'moves' : 'move'} from light loads to ${proposal.repRange[0]} to ${proposal.repRange[1]} reps, which means heavier weights. Sets and rests stay the same.` },
        verifiedSourcesFor(growth).length >= REQUIRED_SOURCES
          ? { label: 'Muscle growth', detail: 'Studies find similar growth across light and heavy loads when sets end close to failure, so you shouldn\'t lose size.' }
          : null,
        { label: 'Your goal', detail: goalLabel(profile && profile.goal) }
      ].filter(Boolean);
      return {
        ...base, status: 'proposed', kind: 'split_change', claimKey: claim.key,
        sourceIds: verified.map((x) => x.id), verifiedCount: verified.length,
        title: 'Heavier loads on your main lifts', proposal, drivers
      };
    }
    if (intent.type === 'switch_style') {
      const claim = claimByKey('endurance.weekly_distance_progression');
      const compatible = verifiedSourcesFor(claimByKey('training.concurrent_aerobic_compatible')).length >= REQUIRED_SOURCES;
      return { ...base, status: 'blocked_insufficient_evidence', claimKey: 'endurance.weekly_distance_progression', verifiedCount: verifiedSourcesFor(claim).length,
        reason: compatible
          ? 'Studies show that running alongside lifting doesn\'t cut your muscle or strength gains, but we don\'t yet have 3 verified studies on how fast to build up your running. So we haven\'t changed your plan.'
          : notEnough };
    }

    /* develop_muscle and add_exercise both rest on the volume claim. */
    const muscle = intent.muscle;
    const ex = intent.exercise ? exerciseById(intent.exercise) : null;
    const regions = ex ? [ex.region] : [D.EXERCISES.find((x) => x.credit[muscle] === 1).region];
    const safety = safetyCheck(profile, regions);
    if (safety.blocked) return { ...base, status: 'blocked_safety', reason: safety.reason };

    const claim = claimByKey('hypertrophy.volume.raise_low_weekly_sets');
    const verified = verifiedSourcesFor(claim);
    if (verified.length < REQUIRED_SOURCES) {
      return { ...base, status: 'blocked_insufficient_evidence', claimKey: claim.key, verifiedCount: verified.length,
        reason: 'We couldn\'t verify 3 studies for this change right now, so we haven\'t changed your plan.' };
    }
    const goals = claim.appliesTo.goals;
    if (profile && profile.goal && !goals.includes(profile.goal)) {
      return { ...base, status: 'blocked_insufficient_evidence', claimKey: claim.key, verifiedCount: verified.length,
        reason: `Our verified evidence for adding sets is about building muscle, and your goal is set to ${goalLabel(profile.goal).toLowerCase()}. Change your goal or edit the split yourself.` };
    }
    const before = weeklyVolume(def)[muscle];
    if (before >= claim.appliesTo.maxStartingSets) {
      return { ...base, status: 'blocked_insufficient_evidence', claimKey: claim.key, verifiedCount: verified.length,
        reason: `You already do ${fmt.sets(before)} weekly sets for your ${muscleById(muscle).name.toLowerCase()}. Our verified evidence covers raising low volume (under 10 sets), not going higher, so we haven't changed your plan.` };
    }
    /* Asked to add an exercise that is already in the plan: grow its muscle instead. */
    const alreadyIn = intent.exercise && def.days.some((d) => d.items.some((it) => it.exercise === intent.exercise));
    const proposal = buildVolumeProposal(def, muscle, profile, alreadyIn ? null : intent.exercise);
    if (!proposal.ops.length) {
      return { ...base, status: 'blocked_constraints', reason: `There isn't room for more sets within your ${(profile && profile.sessionMinutes) || 60}-minute sessions. Edit the split yourself or allow longer sessions.` };
    }
    const vol = weeklyVolume(def);
    const pulling = ['lats', 'upper_back', 'rear_delts', 'biceps'];
    const drivers = [
      intent.source === 'split_review'
        ? { label: 'From your split review', detail: `You do ${fmt.sets(before)} weekly sets for your ${muscleById(muscle).name.toLowerCase()}.` }
        : { label: 'You asked', detail: requestText ? `"${requestText}"` : intent.summary },
      { label: `${muscleById(muscle).name} volume`, detail: `${fmt.sets(before)} weekly sets${pulling.includes(muscle) && pulling.every((m) => m === muscle || vol[m] >= before) ? ', the lowest pulling volume in your plan' : ''}.` },
      { label: 'Your goal', detail: goalLabel(profile && profile.goal) }
    ];
    return {
      ...base,
      status: 'proposed',
      kind: 'split_change',
      claimKey: claim.key,
      sourceIds: verified.map((s) => s.id),
      verifiedCount: verified.length,
      title: `More ${muscleById(muscle).name.toLowerCase()} work in your split`,
      proposal,
      drivers: alreadyIn ? [...drivers, { label: 'Already in your split', detail: `${exerciseById(intent.exercise).name} is already in your plan, so we added sets instead.` }] : drivers
    };
  }

  function currentDefinition(state) {
    const v = state.split.versions.find((x) => x.number === state.split.current);
    return v.definition;
  }

  /* ------------------------------------------------------------ readiness */
  const READINESS_ORDER = ['oura', 'whoop', 'google_health', 'apple_health'];
  function stats(points) {
    const vals = points.map((p) => p.value);
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    const sd = Math.sqrt(vals.reduce((a, b) => a + (b - mean) * (b - mean), 0) / vals.length) || 1;
    return { mean, sd };
  }
  function readiness(state) {
    const devices = state.devices;
    const enabledMetric = (provider, metric) => {
      const dev = devices[provider];
      if (!dev || dev.status !== 'active') return false;
      return Object.entries(D.DATA_TYPE_METRICS).some(([type, metrics]) => metrics.includes(metric) && dev.dataTypes[type]);
    };
    for (const provider of READINESS_ORDER) {
      const seriesSet = D.WEARABLE_SERIES[provider];
      if (!seriesSet) continue;
      const usable = ['hrv_rmssd_ms', 'hrv_sdnn_ms', 'resting_hr_bpm', 'sleep_total_min'].filter((m) => seriesSet[m] && enabledMetric(provider, m));
      if (!usable.length) continue;
      const drivers = usable.map((metric) => {
        const s = seriesSet[metric];
        const today = s.points[s.points.length - 1];
        const baseline = stats(s.points.slice(-29, -1));
        const z = (today.value - baseline.mean) / baseline.sd;
        let effect = 'normal';
        if (metric.startsWith('hrv')) effect = z <= -2 ? 'low' : z <= -1 ? 'reduced' : 'normal';
        if (metric === 'resting_hr_bpm') effect = z >= 2 ? 'low' : z >= 1 ? 'reduced' : 'normal';
        if (metric === 'sleep_total_min') effect = z <= -1 ? 'reduced' : 'normal';
        return { metric, label: s.label, unit: s.unit, value: today.value, mean: baseline.mean, sd: baseline.sd, z, effect, text: driverText(metric, today.value, baseline, s.unit, effect, provider) };
      });
      const rank = { normal: 0, reduced: 1, low: 2 };
      const level = drivers.reduce((acc, d) => (rank[d.effect] > rank[acc] ? d.effect : acc), 'normal');
      const vendor = Object.entries(seriesSet).filter(([m]) => m.startsWith('vendor_') && enabledMetric(provider, m))
        .map(([, s]) => ({ label: s.label, value: s.points[s.points.length - 1].value, unit: s.unit }));
      return { level, provider, providerName: D.PROVIDERS[provider].name, drivers, vendor, syncedAt: devices[provider].lastSync };
    }
    return { level: 'unknown', provider: null, drivers: [], vendor: [] };
  }
  function driverText(metric, value, baseline, unit, effect, provider) {
    const name = D.PROVIDERS[provider].short;
    if (metric === 'sleep_total_min') return { value: `Slept ${fmt.minutes(value)}`, context: `Your average ${fmt.minutes(baseline.mean)}` };
    if (metric === 'resting_hr_bpm') return { value: `Resting HR ${Math.round(value)} bpm`, context: effect === 'normal' ? 'In your usual range' : `Your baseline ${Math.round(baseline.mean)} ± ${Math.round(baseline.sd)} bpm` };
    const stat = metric === 'hrv_sdnn_ms' ? 'SDNN' : 'RMSSD';
    return { value: `HRV ${Math.round(value)} ms`, context: `Your ${name} ${stat} baseline ${Math.round(baseline.mean)} ± ${Math.round(baseline.sd)} ms` };
  }

  /* Recovery-driven changes need their own evidence; the HRV claim is a draft. */
  function evaluateRecoveryAdjustment(state) {
    const r = readiness(state);
    if (r.level === 'normal' || r.level === 'unknown') return null;
    const claim = claimByKey('recovery.hrv_guided_lifting_volume');
    return { status: 'blocked_insufficient_evidence', claimKey: claim.key, verifiedCount: verifiedSourcesFor(claim).length, required: REQUIRED_SOURCES, readiness: r,
      reason: `Your readiness is ${r.level}. We don't have 3 verified studies showing that cutting today's lifting volume helps, so we haven't changed your session. You can still go lighter if you feel run down.` };
  }

  /* -------------------------------------------------------- notifications */
  function notifications(state) {
    const items = [];
    state.recommendations.filter((r) => r.status === 'proposed').forEach((r) => {
      items.push({ id: `rec-${r.id}`, kind: 'suggestion', title: r.title, body: 'A suggested change is ready for you to review.', screen: 'recommendation', params: { id: r.id } });
    });
    Object.entries(state.devices).forEach(([provider, dev]) => {
      if (dev.status === 'needs_reauth') {
        items.push({ id: `dev-${provider}`, kind: 'device', title: `Reconnect ${D.PROVIDERS[provider].short}`, body: `${D.PROVIDERS[provider].short} asked you to sign in again.`, screen: 'device', params: { provider } });
      }
    });
    return items;
  }

  /* ---------------------------------------------------------------- misc */
  const GOALS = [
    { id: 'muscle_gain', label: 'Build muscle', body: 'Grow muscle with training volume to match.', icon: 'dumbbell' },
    { id: 'strength', label: 'Get stronger', body: 'Lift more on your main exercises.', icon: 'figure.strengthtraining.traditional' },
    { id: 'fat_loss', label: 'Lose fat', body: 'Eat a little less and keep your strength.', icon: 'flame' },
    { id: 'endurance', label: 'Endurance', body: 'Run, ride or swim further.', icon: 'figure.run' },
    { id: 'hybrid', label: 'Hybrid', body: 'Strength and endurance in one plan.', icon: 'arrow.triangle.2.circlepath' },
    { id: 'general_health', label: 'General health', body: 'Move well and eat well, without a single target.', icon: 'heart' }
  ];
  function goalLabel(id) {
    const g = GOALS.find((x) => x.id === id);
    return g ? g.label : 'Not set';
  }
  function capitalise(s) {
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  }
  /* An exercise name mid-sentence: lower case, but "Romanian" stays a proper noun. */
  function exerciseWords(name) {
    return String(name).toLowerCase().replace(/\bromanian\b/g, 'Romanian');
  }
  function listJoin(items) {
    if (items.length <= 1) return items.join('');
    return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
  }

  C.domain = {
    fmt, round, capitalise, listJoin,
    NUTRIENT_KEYS, saltFromSodium, nutrientsFor, sumNutrients,
    healthRating,
    normalizeGtin, parseScan, lookupBarcode, allFoods, findFood, searchFoods,
    parseIngredients, parsePanel, validateNutrients, estimateFromIngredients, assessLabel,
    exerciseById, muscleById, weeklyVolume, groupVolume, dayMinutes, dayLabelWithWeekday, reviewSplit,
    diffDefinitions, volumeDeltas, summarizeOps,
    exerciseWords,
    parseIntent, TARGET_RULES, MAIN_LIFTS, REQUIRED_SOURCES, sourceById, isVerified, claimByKey, verifiedSourcesFor,
    safetyCheck, buildVolumeProposal, evaluateChange, currentDefinition,
    readiness, evaluateRecoveryAdjustment, notifications,
    GOALS, goalLabel
  };
})();
