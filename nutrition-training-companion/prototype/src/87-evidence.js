/* Companion prototype — the evidence library and the data catalogue (core).
   Every claim the app could act on, its status and the studies behind it
   (data/evidence/library.json), the datasets the real app would use
   (data/catalogue/catalogue.json), and downloads of both. Settings → Evidence
   library opens it; About and the readiness explainer link here too. */
(function () {
  'use strict';

  const C = window.Companion;
  const { html, T, Card, Screen, Section, Sections, Facts, Rows, Badge, Caption, Callout, CardTitle,
          LinkButton, Glyph, EmptyAnswer, DisclaimerBand, CitationCard, ClaimCard, isoDate,
          useDownloads, saveDownload, sizeText } = C.ui;
  const M = C.domain, D = C.data, A = C.actions;

  const AREAS = [
    { key: 'training', title: 'Training' },
    { key: 'recovery', title: 'Recovery' },
    { key: 'measurement', title: 'Wearables' },
    { key: 'nutrition', title: 'Nutrition' }
  ];
  const PRIORITY_WORDS = { essential: 'Essential', useful: 'Useful', optional: 'Optional' };

  const plural = (n, one, many) => `${n} ${n === 1 ? one : (many || `${one}s`)}`;
  const claims = () => D.CLAIMS || [];
  const sourceById = (id) => (D.SOURCES || []).find((s) => s.id === id) || null;
  /* Verified studies that count toward the claim (the gate's own rule). */
  const countedFor = (claim) => (claim.sources || []).map(sourceById).filter(Boolean).filter(M.isVerified);
  function claimDetail(claim) {
    const n = countedFor(claim).length;
    if (claim.status === 'active') return `Enough evidence. ${plural(n, 'verified study', 'verified studies')}.`;
    return n ? `Not enough evidence yet. ${n} of the ${M.REQUIRED_SOURCES} verified studies we need.` : 'Not enough evidence yet.';
  }
  const statusBadge = (claim) => html`<${Badge} palette="sourceVerification" status=${claim.status === 'active' ? 'verified' : 'needs_human'}
    label=${claim.status === 'active' ? 'Active' : 'Draft'} />`;

  /* ------------------------------------------------------------ downloads */
  function DownloadRows() {
    const dl = useDownloads();
    if (dl.checking) return html`<${Caption}>Checking whether this view can save files…<//>`;
    if (!dl.available || !dl.items.length) {
      return html`<${Caption}>This view can't save files. The same files are in the project's data folder on GitHub.<//>`;
    }
    return html`<${Rows} rows=${dl.items.map((item) => ({
      key: item.key, icon: 'doc.text', iconColor: 'ink', label: `${item.label} (${item.format})`,
      detail: `${item.detail} ${sizeText(item.content)}.`, chevron: false,
      right: html`<${T} size="callout" color="primary">Save<//>`,
      onPress: () => saveDownload(item)
    }))} />`;
  }

  /* ------------------------------------------------------- evidence library */
  function Evidence() {
    const all = claims();
    const active = all.filter((c) => c.status === 'active').length;
    const studies = (D.SOURCES || []).length;
    const verified = (D.SOURCES || []).filter(M.isVerified).length;
    const reviewed = D.EVIDENCE && D.EVIDENCE.reviewedAt;
    return html`<${Screen} title="Evidence library" subtitle="What our suggestions rest on">
      <${Sections}>
        <div className="stack-sm">
          <${Callout}>${`We only change your plan when a claim has at least ${M.REQUIRED_SOURCES} strong, verified, peer-reviewed studies behind it. ${active} of our ${all.length} claims ${active === 1 ? 'has' : 'have'} that today. The rest stay drafts, and we never use them to change your plan.`}<//>
          <${Caption}>${`${plural(studies, 'study', 'studies')} listed, ${verified} passed every check${reviewed ? `. Last reviewed ${isoDate(reviewed)}` : ''}.`}<//>
        </div>

        ${AREAS.map((area) => {
          const list = all.filter((c) => c.area === area.key).sort((a, b) => (a.status === b.status ? 0 : a.status === 'active' ? -1 : 1));
          if (!list.length) return null;
          return html`<${Section} key=${area.key} title=${area.title}>
            <${Rows} rows=${list.map((c) => ({ key: c.key, label: c.title, detail: claimDetail(c), right: statusBadge(c), onPress: () => A.push('claim', { key: c.key }) }))} />
          <//>`;
        })}

        <${Section} title="Download the data" caption="Open the CSV files in Excel, Numbers or Google Sheets. Citation files for Zotero, EndNote and Mendeley (RIS and BibTeX) are in the project's data folder.">
          <${DownloadRows} />
        <//>

        <${Section} title="Where the data comes from">
          <${Rows} rows=${[{ key: 'datasets', icon: 'list.bullet', iconColor: 'ink', label: 'Datasets the app uses',
            detail: 'Food composition, barcodes and QR codes, research databases and labelling rules, with what to download.',
            onPress: () => A.push('datasets') }]} />
        <//>

        <${Section} title="How we check a study">
          <${Facts} rows=${[
            ['Its PMID or DOI points to it', 'Required'],
            ['Title, authors, journal and year match', 'Required'],
            ['Strong design', 'Required'],
            ['Peer reviewed and indexed', 'Required'],
            ['Not retracted', 'Required'],
            ['Its abstract supports the finding', 'Required']
          ].map(([a, b]) => [a, b, { tabular: false }])} />
          <${Caption}>In this prototype the checks were made through web searches of PubMed, PubMed Central, DOI and publisher pages. The app re-checks every study through PubMed and Crossref before relying on it, and a person reviews each active claim.<//>
        <//>

        <${DisclaimerBand} />
      <//>
    <//>`;
  }

  /* ----------------------------------------------------------------- claim */
  function Claim({ params }) {
    const claim = claims().find((c) => c.key === params.key) || null;
    if (!claim) {
      return html`<${Screen} title="Claim">
        <${EmptyAnswer} icon="doc.text" title="We couldn't find this claim" body="It may have been renamed in a newer version of the library." />
      <//>`;
    }
    const counted = countedFor(claim);
    const others = (claim.sources || []).map(sourceById).filter(Boolean).filter((s) => !M.isVerified(s));
    const contra = (claim.contradicting || []).map(sourceById).filter(Boolean);
    const context = (claim.context || []).map(sourceById).filter(Boolean);
    return html`<${Screen} title=${claim.title} subtitle=${claim.status === 'active' ? 'Enough verified evidence' : 'Not enough evidence yet'}>
      <${Sections}>
        <div className="stack-sm">
          <div className="row">${statusBadge(claim)}</div>
          <${ClaimCard} claim=${claim} verifiedCount=${counted.length} required=${M.REQUIRED_SOURCES} />
        </div>
        <${Section} title=${claim.status === 'active' ? 'What we do with it' : 'What we would do with it'}>
          <${Callout}>${claim.appUse}<//>
          ${claim.status === 'active' ? null : html`<${Caption}>Until it has enough verified evidence, this never changes your plan.<//>`}
        <//>
        ${claim.verdict ? html`<${Section} title="Why this status"><${Callout}>${claim.verdict}<//><//>` : null}
        ${counted.length ? html`<${Section} title="Studies that count" caption="Each one passed all six checks.">
          ${counted.map((s) => html`<${CitationCard} key=${s.id} source=${s} />`)}
        <//>` : null}
        ${others.length ? html`<${Section} title="Studies still being checked" caption="These don't count until they pass every check.">
          ${others.map((s) => html`<${CitationCard} key=${s.id} source=${s} />`)}
        <//>` : null}
        ${contra.length ? html`<${Section} title="Evidence against, or mixed" caption="Listed so you can see both sides. It never counts toward the claim.">
          ${contra.map((s) => html`<${CitationCard} key=${s.id} source=${s} role="contradicts" />`)}
        <//>` : null}
        ${context.length ? html`<${Section} title="Background" caption="Useful context that doesn't count toward the claim.">
          ${context.map((s) => html`<${CitationCard} key=${s.id} source=${s} role="context" />`)}
        <//>` : null}
        ${claim.gaps ? html`<${Section} title="What would change this"><${Callout}>${claim.gaps}<//><//>` : null}
        <${DisclaimerBand} />
      <//>
    <//>`;
  }

  /* -------------------------------------------------------------- datasets */
  const catalogue = () => (D.CATALOGUE && D.CATALOGUE.categories) || [];
  function Datasets() {
    const cats = catalogue();
    const hosts = [...new Set(cats.flatMap((c) => c.entries).filter((e) => e.priority === 'essential').flatMap((e) => e.hostsNeeded || []))].sort();
    return html`<${Screen} title="Datasets the app uses" subtitle="What to download, and from where">
      <${Sections}>
        ${cats.length ? null : html`<${EmptyAnswer} icon="list.bullet" title="Nothing listed yet" body="The dataset catalogue hasn't been built for this version." />`}
        ${D.CATALOGUE && D.CATALOGUE.intro && cats.length ? html`<${Callout}>${D.CATALOGUE.intro}<//>` : null}
        ${cats.map((c, ci) => html`<${Section} key=${c.key} title=${c.title} caption=${c.summary}>
          <${Rows} rows=${c.entries.map((e, ei) => ({
            key: e.name, label: e.name,
            detail: `${PRIORITY_WORDS[e.priority] || ''}. ${e.publisher}. ${e.licence}.`,
            onPress: () => A.push('dataset', { category: ci, index: ei })
          }))} />
        <//>`)}
        ${hosts.length ? html`<${Section} title="Hosts to allow" caption="A download or API call from a server or cloud session needs these hosts.">
          <${Card}><${T} size="callout" className="tabular" as="p">${hosts.join(', ')}<//><//>
        <//>` : null}
      <//>
    <//>`;
  }

  function Dataset({ params }) {
    const cat = catalogue()[Number(params.category)] || null;
    const e = cat ? cat.entries[Number(params.index)] : null;
    if (!e) {
      return html`<${Screen} title="Dataset">
        <${EmptyAnswer} icon="list.bullet" title="We couldn't find this dataset" body="Pick one from Datasets the app uses." />
      <//>`;
    }
    const link = e.downloadUrl || e.landingUrl;
    return html`<${Screen} title=${e.name} subtitle=${e.publisher}>
      <${Sections}>
        <div className="stack-sm">
          <${Callout}>${e.whatItIs}<//>
          <${Caption}>${`${PRIORITY_WORDS[e.priority] || ''} for the app. ${e.verified ? `Details confirmed ${isoDate(e.checkedAt)}.` : 'Details not yet independently confirmed.'}`}<//>
        </div>
        <${Section} title="Download first">
          <${Callout}>${e.recommendedDownload}<//>
          ${link ? html`<a className="link row" href=${link} target="_blank" rel="noopener noreferrer">
            <${Glyph} name="link" size=${16} color="primary" /><${T} size="caption" color="primary">${link.replace(/^https:\/\//, '')}<//>
          </a>` : null}
        <//>
        <${Section} title="Details">
          <${Card}>
            <${Facts} rows=${[
              ['Formats', e.formats],
              e.size && ['Size', e.size],
              ['Licence', e.licence],
              e.attributionRequired && ['Credit', e.attributionRequired],
              e.latestRelease && ['Latest release', e.latestRelease],
              e.updateCadence && ['Updates', e.updateCadence],
              e.apiDocsUrl && ['API docs', e.apiDocsUrl.replace(/^https:\/\//, '')],
              (e.hostsNeeded || []).length && ['Hosts', e.hostsNeeded.join(', ')]
            ].filter(Boolean).map(([a, b]) => [a, b, { tabular: false }])} />
          <//>
        <//>
        <${Section} title="Access"><${Callout}>${e.accessNotes}<//><//>
        <${Section} title="In the app"><${Callout}>${e.useInApp}<//><//>
        ${e.facts ? html`<${Section} title="Facts the app relies on"><${Callout}>${e.facts}<//><//>` : null}
      <//>
    <//>`;
  }

  const push = (title, extra) => ({ title, tab: 'today', presentation: 'push', demoParams: {}, ...(extra || {}) });
  C.registerScreen('evidence', Evidence, push('Evidence library'));
  C.registerScreen('claim', Claim, push('Claim', {
    demoParams: { key: 'hypertrophy.volume.raise_low_weekly_sets' },
    demoParamsList: [{ key: 'hypertrophy.volume.raise_low_weekly_sets' }, { key: 'recovery.hrv_guided_lifting_volume' }]
  }));
  C.registerScreen('datasets', Datasets, push('Datasets the app uses'));
  C.registerScreen('dataset', Dataset, push('Dataset', { demoParams: { category: 0, index: 0 } }));
})();
