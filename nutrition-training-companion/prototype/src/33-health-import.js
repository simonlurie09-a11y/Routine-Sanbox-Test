/* Companion prototype — reading an Apple Health export on the device.
   HealthKit has no web API: the iPhone app reads Health directly, with the
   permission sheet iOS shows (docs/03 §3.6). A web page can't, so the
   prototype offers the next best thing: the file the Health app exports
   (Health → your picture → Export All Health Data → export.zip, or the
   export.xml inside it). We read it here, in the browser, as a stream, so
   even a large export never has to fit in memory. Nothing is uploaded. We
   keep the profile details (birth date, sex, height, weight) and a count of
   the readiness data the file holds; the raw records are dropped. */
(function () {
  'use strict';

  const C = window.Companion;

  /* Record types we look at, and what we call them. */
  const TYPES = {
    HKQuantityTypeIdentifierBodyMass: 'weight',
    HKQuantityTypeIdentifierHeight: 'height',
    HKQuantityTypeIdentifierRestingHeartRate: 'restingHr',
    HKQuantityTypeIdentifierHeartRateVariabilitySDNN: 'hrv',
    HKCategoryTypeIdentifierSleepAnalysis: 'sleep'
  };
  const SEX = { HKBiologicalSexFemale: 'female', HKBiologicalSexMale: 'male' };
  const KG = { kg: 1, g: 0.001, lb: 0.45359237, st: 6.35029318 };
  const CM = { cm: 1, m: 100, mm: 0.1, in: 2.54, ft: 30.48 };

  class ImportError extends Error {
    constructor(code, message) {
      super(message);
      this.code = code;
    }
  }
  const fail = (code, message) => { throw new ImportError(code, message); };
  const WRONG_FILE = "This isn't a Health export. Choose the export.zip file the Health app made, or the export.xml inside it.";

  /* ----------------------------------------------------------- zip */
  const u16 = (v, o) => v.getUint16(o, true);
  const u32 = (v, o) => v.getUint32(o, true);
  const u64 = (v, o) => v.getUint32(o, true) + v.getUint32(o + 4, true) * 0x100000000;
  async function view(file, start, end) {
    return new DataView(await file.slice(start, end).arrayBuffer());
  }

  /* Finds export.xml in the zip's central directory (ZIP64 included, since a
     few years of Health data passes 4 GB). Returns where its data starts. */
  async function findExportXml(file) {
    const tailStart = Math.max(0, file.size - (22 + 0xffff));
    const tail = await view(file, tailStart, file.size);
    let eocd = -1;
    for (let i = tail.byteLength - 22; i >= 0; i--) {
      if (u32(tail, i) === 0x06054b50) { eocd = i; break; }
    }
    if (eocd < 0) fail('not_zip', WRONG_FILE);
    let count = u16(tail, eocd + 10);
    let cdSize = u32(tail, eocd + 12);
    let cdOffset = u32(tail, eocd + 16);
    if (count === 0xffff || cdSize === 0xffffffff || cdOffset === 0xffffffff) {
      const loc = eocd - 20;
      if (loc < 0 || u32(tail, loc) !== 0x07064b50) fail('bad_zip', "We couldn't read this ZIP file. Try exporting from Health again.");
      const at = u64(tail, loc + 8);
      const z = await view(file, at, at + 56);
      if (u32(z, 0) !== 0x06064b50) fail('bad_zip', "We couldn't read this ZIP file. Try exporting from Health again.");
      count = u64(z, 32);
      cdSize = u64(z, 40);
      cdOffset = u64(z, 48);
    }
    const cd = await view(file, cdOffset, cdOffset + cdSize);
    const names = new TextDecoder();
    let p = 0;
    for (let n = 0; n < count && p + 46 <= cd.byteLength; n++) {
      if (u32(cd, p) !== 0x02014b50) break;
      const method = u16(cd, p + 10);
      let compSize = u32(cd, p + 20);
      let size = u32(cd, p + 24);
      const nameLen = u16(cd, p + 28);
      const extraLen = u16(cd, p + 30);
      const commentLen = u16(cd, p + 32);
      let offset = u32(cd, p + 42);
      const name = names.decode(new Uint8Array(cd.buffer, cd.byteOffset + p + 46, nameLen));
      if (/(^|\/)export\.xml$/i.test(name)) {
        /* ZIP64 sizes and offset live in extra field 0x0001, in this order. */
        for (let e = p + 46 + nameLen, end = e + extraLen; e + 4 <= end;) {
          const id = u16(cd, e);
          const len = u16(cd, e + 2);
          if (id === 0x0001) {
            let q = e + 4;
            if (size === 0xffffffff) { size = u64(cd, q); q += 8; }
            if (compSize === 0xffffffff) { compSize = u64(cd, q); q += 8; }
            if (offset === 0xffffffff) { offset = u64(cd, q); q += 8; }
          }
          e += 4 + len;
        }
        const local = await view(file, offset, offset + 30);
        if (u32(local, 0) !== 0x04034b50) fail('bad_zip', "We couldn't read this ZIP file. Try exporting from Health again.");
        return { name, method, size, compSize, start: offset + 30 + u16(local, 26) + u16(local, 28) };
      }
      p += 46 + nameLen + extraLen + commentLen;
    }
    return fail('no_export', "This ZIP file has no export.xml in it. Choose the export.zip the Health app made.");
  }

  /* The XML as a stream of text, inflating it on the way if it's zipped. */
  function textStream(file, entry, onProgress) {
    const blob = entry ? file.slice(entry.start, entry.start + entry.compSize) : file;
    const total = Math.max(1, blob.size);
    let seen = 0;
    let stream = blob.stream().pipeThrough(new TransformStream({
      transform(chunk, ctl) {
        seen += chunk.byteLength;
        if (onProgress) onProgress(Math.min(1, seen / total));
        ctl.enqueue(chunk);
      }
    }));
    if (entry && entry.method === 8) {
      let inflate;
      try {
        inflate = new DecompressionStream('deflate-raw');
      } catch (e) {
        fail('no_unzip', "This browser can't open ZIP files. Unzip export.zip first, then choose the export.xml inside it.");
      }
      stream = stream.pipeThrough(inflate);
    } else if (entry && entry.method !== 0) {
      fail('bad_zip', "We can't read how this ZIP file was packed. Unzip it first, then choose export.xml.");
    }
    return stream.pipeThrough(new TextDecoderStream());
  }

  /* ----------------------------------------------------------- xml */
  const attr = (attrs, name) => {
    const i = attrs.indexOf(` ${name}="`);
    if (i < 0) return null;
    const start = i + name.length + 3;
    const end = attrs.indexOf('"', start);
    return end < 0 ? null : attrs.slice(start, end);
  };
  /* "2026-10-14 07:12:00 +0100" -> milliseconds. */
  function parseDate(text) {
    if (!text) return NaN;
    const m = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})(?: ?([+-])(\d{2}):?(\d{2}))?/.exec(text);
    if (!m) return Date.parse(text);
    return Date.parse(`${m[1]}T${m[2]}${m[3] ? `${m[3]}${m[4]}:${m[5]}` : 'Z'}`);
  }
  const TAG = /<(Record|Workout|Me)\s([^>]*)>/g;
  const TYPE_RE = /\stype="([^"]*)"/;
  /* Apple's export starts with a long DTD; give up if no <HealthData> by then. */
  const MAX_PREAMBLE = 2000000;

  function emptySummary() {
    return {
      format: null, birthDate: null, sex: null, weightKg: null, heightCm: null,
      counts: { weight: 0, height: 0, restingHr: 0, hrv: 0, sleep: 0, workouts: 0 },
      latest: { restingHr: null, hrv: null, sleep: null }, nights: new Set()
    };
  }

  function take(out, kind, attrs) {
    if (kind === 'Me') {
      attrs = attrs.replace(/\s+/g, ' ');
      const dob = attr(attrs, 'HKCharacteristicTypeIdentifierDateOfBirth');
      if (dob && /^\d{4}-\d{2}-\d{2}$/.test(dob)) out.birthDate = dob;
      const sex = SEX[attr(attrs, 'HKCharacteristicTypeIdentifierBiologicalSex')];
      if (sex) out.sex = sex;
      return;
    }
    if (kind === 'Workout') {
      out.counts.workouts += 1;
      return;
    }
    const type = TYPE_RE.exec(attrs);
    const key = type && TYPES[type[1]];
    if (!key) return;
    const a = attrs.replace(/\s+/g, ' ');
    const at = parseDate(attr(a, 'startDate'));
    if (key === 'sleep') {
      /* Sleep comes in stages (core, deep, REM, awake), so count nights by the day it ended. */
      const night = (attr(a, 'endDate') || '').slice(0, 10);
      if (night && !out.nights.has(night)) {
        out.nights.add(night);
        out.counts.sleep += 1;
      }
      if (!out.latest.sleep || at > out.latest.sleep.at) out.latest.sleep = { at };
      return;
    }
    out.counts[key] += 1;
    const raw = Number(attr(a, 'value'));
    if (!Number.isFinite(raw)) return;
    const unit = attr(a, 'unit');
    if (key === 'weight' || key === 'height') {
      const factor = key === 'weight' ? KG[unit] : CM[unit];
      if (!factor) return;
      const field = key === 'weight' ? 'weightKg' : 'heightCm';
      if (!out[field] || at > out[field].at) out[field] = { value: raw * factor, at };
      return;
    }
    if (!out.latest[key] || at > out.latest[key].at) out.latest[key] = { value: raw, unit, at };
  }

  async function scan(stream, out, signal) {
    const reader = stream.getReader();
    let carry = '';
    let preamble = 0;
    try {
      for (;;) {
        if (signal && signal.aborted) fail('cancelled', 'Stopped.');
        const { value, done } = await reader.read();
        if (done) break;
        const text = carry + value;
        if (!preamble && !/^\s*</.test(text)) fail('wrong_file', WRONG_FILE);
        const lastOpen = text.lastIndexOf('<');
        const open = lastOpen >= 0 && text.indexOf('>', lastOpen) < 0;
        const ready = open ? text.slice(0, lastOpen) : text;
        carry = open ? text.slice(lastOpen) : '';
        if (!out.format) {
          preamble += ready.length || 1;
          if (/<HealthData[\s>]/.test(ready)) out.format = 'apple_health';
          else if (preamble > MAX_PREAMBLE) fail('wrong_file', WRONG_FILE);
        }
        TAG.lastIndex = 0;
        for (let m = TAG.exec(ready); m; m = TAG.exec(ready)) take(out, m[1], ` ${m[2]}`);
      }
    } catch (e) {
      try { await reader.cancel(); } catch (ignored) { /* already closed */ }
      throw e;
    }
  }

  /* Reads a Health export (export.zip or export.xml). opts.onProgress gets a
     0–1 fraction of the file read; opts.signal (AbortSignal) stops it. */
  async function read(file, opts) {
    const o = opts || {};
    if (!file || !file.size) fail('wrong_file', WRONG_FILE);
    if (typeof file.stream !== 'function' || typeof TextDecoderStream === 'undefined') {
      fail('no_stream', "This browser can't read large files. Try Safari or Chrome.");
    }
    const head = new Uint8Array(await file.slice(0, 4).arrayBuffer());
    const zipped = head[0] === 0x50 && head[1] === 0x4b && head[2] === 0x03 && head[3] === 0x04;
    const entry = zipped ? await findExportXml(file) : null;
    const out = emptySummary();
    await scan(textStream(file, entry, o.onProgress), out, o.signal);
    if (out.format !== 'apple_health') fail('wrong_file', WRONG_FILE);
    const found = out.birthDate || out.sex || out.weightKg || out.heightCm || Object.values(out.counts).some(Boolean);
    if (!found) fail('empty', "This export has no data we use yet: no birth date, height, weight, sleep or heart rate.");
    delete out.nights;
    out.fileName = file.name || (zipped ? 'export.zip' : 'export.xml');
    out.bytes = file.size;
    return out;
  }

  /* Age in whole years on a given day, from "YYYY-MM-DD". */
  function ageOn(birthDate, now) {
    const [y, m, d] = birthDate.split('-').map(Number);
    const t = now || new Date();
    let age = t.getFullYear() - y;
    if (t.getMonth() + 1 < m || (t.getMonth() + 1 === m && t.getDate() < d)) age -= 1;
    return age;
  }

  /* The profile fields a summary fills in (only the ones it has). */
  function toProfile(summary) {
    const patch = {};
    if (summary.birthDate) {
      patch.birthDate = summary.birthDate;
      patch.birthYear = Number(summary.birthDate.slice(0, 4));
    }
    if (summary.sex) patch.sexForEquations = summary.sex;
    if (summary.weightKg) patch.weightKg = Math.round(summary.weightKg.value * 10) / 10;
    if (summary.heightCm) patch.heightCm = Math.round(summary.heightCm.value);
    return patch;
  }

  /* What a simulated HealthKit connection hands back in the prototype (the
     sample person: born 1994, 180 cm, 82 kg). The app reads the same fields
     with HKHealthStore's dateOfBirthComponents, biologicalSex and the latest
     bodyMass and height samples. */
  const SIMULATED = {
    format: 'apple_health', birthDate: '1994-03-08', sex: null,
    weightKg: { value: 82.4, at: Date.now() - 2 * 86400000 }, heightCm: { value: 180, at: Date.now() - 200 * 86400000 },
    counts: { weight: 214, height: 3, restingHr: 610, hrv: 2480, sleep: 1830, workouts: 162 },
    latest: { restingHr: null, hrv: null, sleep: null }, simulated: true
  };

  C.healthImport = { read, toProfile, ageOn, parseDate, ImportError, SIMULATED };
})();
