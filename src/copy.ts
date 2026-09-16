/**
 * All visitor-facing strings. Albanian first (the audience is in Tirana), English second.
 * Rules: short sentences, concrete verbs, no invented facts, one label per intent
 * (ask = "Pyet në Instagram", tryon = "Provoje", catalog = "Shiko fustanet").
 */
export type Lang = 'sq' | 'en';

const sq = {
  langName: 'Shqip',
  langShort: 'SQ',
  switchTo: 'English (EN)',
  a11y: { skip: 'Kalo te fustanet', chips: 'Kategoritë', rail: 'Të përzgjedhurat', wordmark: 'Dresses by Greta, kryefaqja' },
  nav: {
    menu: 'Menu',
    close: 'Mbyll',
    search: 'Kërko',
    bag: 'Lista',
    region: 'Rajoni dhe gjuha',
    all: 'Të gjitha fustanet',
    dresses: 'Fustanet',
    tryon: 'Provoje',
    shop: 'Dyqani',
    instagram: 'Instagram',
    back: 'Kthehu',
  },
  hero: {
    kicker: 'Dresses by Greta, Tiranë',
    wordmark: 'Dresses by Greta',
    title1: 'Për shitje',
    title2: 'me qira.',
    body: 'Fustane mbrëmjeje dhe mature nga dyqani në Tiranë. Shikoji, provoje nga telefoni, rezervoje me një mesazh.',
    catalog: 'Shiko fustanet',
    tryon: 'Provoje',
    alt: 'Fustan i gjatë me pajeta blu safir, në plazh nën diell',
  },
  rail: { title: 'Të përzgjedhurat', body: 'Lëviz poshtë për të hapur çdo fustan.', open: 'Hap' },
  catalog: {
    title: 'Të gjitha fustanet',
    count: (n: number) => `${n} fustane nga Instagrami i @dressesbygreta`,
    tryon: 'Provoje',
    view: 'Shiko në Instagram',
    empty: 'Ende asnjë fustan në këtë kategori.',
    filters: { all: 'Të gjitha', gowns: 'Të gjata', mini: 'Mini & midi', black: 'Të zeza', tv: 'Në TV' },
  },
  search: {
    title: 'Kërko',
    placeholder: 'Kërko fustane, ngjyra, kategori',
    results: (n: number) => (n === 1 ? '1 fustan' : `${n} fustane`),
    none: 'Asnjë fustan me këtë emër. Provo një ngjyrë: e kuqe, blu, e zezë.',
    viewAll: 'Shiko të gjitha',
    clear: 'Fshi',
  },
  bag: {
    title: 'Lista ime',
    empty: 'Lista jote është bosh.',
    emptyBody: 'Shto fustanet që të pëlqejnë dhe dërgoja listën Gretës me një mesazh.',
    continue: 'Vazhdo të shikosh',
    add: 'Shto në listë',
    added: 'Në listë',
    remove: 'Hiq',
    ask: 'Pyet në Instagram',
    copy: 'Kopjo listën',
    copied: 'Lista u kopjua. Ngjite në mesazh.',
    hint: 'Lista qëndron vetëm në këtë faqe. Kopjoje dhe ngjite në mesazhin për Gretën.',
    count: (n: number) => (n === 1 ? '1 fustan' : `${n} fustane`),
  },
  tryonSection: {
    title: 'Provoje pa dalë nga shtëpia.',
    body: 'Hap kamerën, qëndro dy metra larg dhe shiko si të rri fustani. Fotoja mbetet në telefonin tënd: asgjë nuk ngarkohet dhe asgjë nuk ruhet.',
    cta: 'Provoje',
    steps: ['Zgjidh një fustan', 'Hap kamerën ose një foto', 'Ndalo pamjen, rregulloje, ndrysho fustanin'],
    privacy: 'Kamera qëndron në pajisjen tënde. Asgjë nuk ngarkohet dhe asgjë nuk ruhet.',
  },
  rent: {
    title: 'Për shitje dhe me qira.',
    body: 'Çdo fustan rezervohet me një mesazh në Instagram. Për çmimet, datat dhe rregullat e qirasë, shkruaj direkt: përgjigja vjen nga Greta.',
    cta: 'Pyet në Instagram',
    rules: 'Rregullat e qirasë gjenden te highlight-i "Rregulla" në Instagram.',
  },
  visit: {
    title: 'Dyqani në Tiranë.',
    address: 'Rruga Andon Zako Çajupi, pas LSI, Tiranë',
    maps: 'Hap në Google Maps',
    body: "Eja t'i provosh vetë. Fustanet e reja dalin çdo javë në Instagram.",
  },
  footer: {
    shop: 'Dyqani',
    support: 'Ndihmë',
    dresses: 'Fustanet',
    follow: 'Ndiq @dressesbygreta',
    followers: '26,2 mijë ndjekës',
    made: 'Fotot janë nga Instagrami i Dresses by Greta.',
    privacy: 'Kjo faqe nuk përdor cookies dhe nuk ruan asnjë foto.',
    rules: 'Rregullat e qirasë',
  },
  popup: {
    lead: 'Mos humb asgjë.',
    body: 'Fustanet e reja dalin çdo javë në Instagram.',
    cta: 'Ndiq në Instagram',
    close: 'Mbyll',
  },
  room: {
    title: 'Provoje',
    promise: 'Kamera qëndron në pajisjen tënde. Asgjë nuk ngarkohet dhe asgjë nuk ruhet.',
    gateLead: 'Shiko si të rri fustani.',
    gateBody: 'Qëndro rreth dy metra larg kamerës, që supet dhe ijët të jenë në kuadër.',
    openCamera: 'Hap kamerën',
    usePhoto: 'Përdor një foto',
    loading: 'Po përgatitet dhoma e provës',
    denied: 'Kamera është e bllokuar. Lejoje te cilësimet e shfletuesit, ose përdor një foto.',
    unavailable: 'Nuk u gjet kamerë në këtë pajisje. Mund ta provosh fustanin mbi një foto.',
    inApp: 'Shfletuesi i Instagramit nuk lejon kamerën. Hape faqen në Safari ose Chrome, ose përdor një foto.',
    noBody: 'Largohu pak, që supet dhe ijët të hyjnë në kuadër.',
    freeze: 'Ndalo pamjen',
    live: 'Live',
    reset: 'Rivendos',
    close: 'Mbyll',
    ask: 'Pyet në Instagram',
    adjustHint: 'Zvarrit për ta lëvizur fustanin. Me dy gishta ose me scroll për madhësinë.',
    photoNoBody: 'Nuk i gjetëm supet dhe ijët në këtë foto. Provo një foto në këmbë, nga përpara.',
    badFile: 'Ky skedar nuk hapet si foto.',
    loadFail: 'Dhoma e provës nuk u hap në këtë shfletues. Katalogu funksionon normalisht.',
    rail: 'Fustanet për provë',
    canvas: 'Pamja live me fustanin e zgjedhur mbi ty',
  },
};

const en: typeof sq = {
  langName: 'English',
  langShort: 'EN',
  switchTo: 'Shqip (SQ)',
  a11y: { skip: 'Skip to the dresses', chips: 'Categories', rail: 'The edit', wordmark: 'Dresses by Greta, home' },
  nav: {
    menu: 'Menu',
    close: 'Close',
    search: 'Search',
    bag: 'Bag',
    region: 'Region and language',
    all: 'All dresses',
    dresses: 'Dresses',
    tryon: 'Try it on',
    shop: 'The shop',
    instagram: 'Instagram',
    back: 'Back',
  },
  hero: {
    kicker: 'Dresses by Greta, Tirana',
    wordmark: 'Dresses by Greta',
    title1: 'For sale',
    title2: 'rent.',
    body: 'Evening and prom dresses from the boutique in Tirana. Browse them, try one on from your phone, reserve with a message.',
    catalog: 'See the dresses',
    tryon: 'Try it on',
    alt: 'Long sapphire sequin gown on a sunlit beach',
  },
  rail: { title: 'The edit', body: 'Scroll to open each dress.', open: 'Open' },
  catalog: {
    title: 'All the dresses',
    count: (n: number) => `${n} dresses from the Instagram of @dressesbygreta`,
    tryon: 'Try it on',
    view: 'View on Instagram',
    empty: 'No dresses in this category yet.',
    filters: { all: 'All', gowns: 'Gowns', mini: 'Mini & midi', black: 'Black', tv: 'Seen on TV' },
  },
  search: {
    title: 'Search',
    placeholder: 'Search dresses, colours, categories',
    results: (n: number) => (n === 1 ? '1 dress' : `${n} dresses`),
    none: 'No dress by that name. Try a colour: red, blue, black.',
    viewAll: 'View all',
    clear: 'Clear',
  },
  bag: {
    title: 'Bag',
    empty: 'Your bag is empty.',
    emptyBody: 'Add the dresses you like and send the list to Greta in one message.',
    continue: 'Continue browsing',
    add: 'Add to bag',
    added: 'In the bag',
    remove: 'Remove',
    ask: 'Ask on Instagram',
    copy: 'Copy the list',
    copied: 'List copied. Paste it into your message.',
    hint: 'The list lives only on this page. Copy it and paste it into your message to Greta.',
    count: (n: number) => (n === 1 ? '1 dress' : `${n} dresses`),
  },
  tryonSection: {
    title: 'Try it on without leaving home.',
    body: 'Open the camera, stand two metres back and the dress is on you. The picture stays on your phone: nothing is uploaded and nothing is saved.',
    cta: 'Try it on',
    steps: ['Pick a dress', 'Open the camera or a photo', 'Freeze it, adjust it, switch dresses'],
    privacy: 'Your camera stays on this device. Nothing is uploaded or saved.',
  },
  rent: {
    title: 'For sale and for rent.',
    body: 'Every dress is reserved with a message on Instagram. For prices, dates and the rental rules, write directly: the answer comes from Greta.',
    cta: 'Ask on Instagram',
    rules: 'The rental rules are in the "Rregulla" highlight on Instagram.',
  },
  visit: {
    title: 'The shop in Tirana.',
    address: 'Rruga Andon Zako Çajupi, pas LSI, Tiranë',
    maps: 'Open in Google Maps',
    body: 'Come and try them in person. New dresses appear every week on Instagram.',
  },
  footer: {
    shop: 'The shop',
    support: 'Help',
    dresses: 'Dresses',
    follow: 'Follow @dressesbygreta',
    followers: '26.2K followers',
    made: 'Photos are from the Instagram of Dresses by Greta.',
    privacy: 'This site uses no cookies and stores no photos.',
    rules: 'Rental rules',
  },
  popup: {
    lead: 'Stay in the know.',
    body: 'New dresses appear every week on Instagram.',
    cta: 'Follow on Instagram',
    close: 'Close',
  },
  room: {
    title: 'Try it on',
    promise: 'Your camera stays on this device. Nothing is uploaded or saved.',
    gateLead: 'See the dress on you.',
    gateBody: 'Stand about two metres from the camera so your shoulders and hips are in frame.',
    openCamera: 'Open camera',
    usePhoto: 'Use a photo',
    loading: 'Preparing the fitting room',
    denied: 'The camera is blocked. Allow it in your browser settings, or use a photo.',
    unavailable: 'No camera found on this device. You can still try a dress on a photo.',
    inApp: "Instagram's browser does not allow the camera. Open this page in Safari or Chrome, or use a photo.",
    noBody: 'Step back until your shoulders and hips are in frame.',
    freeze: 'Freeze',
    live: 'Live',
    reset: 'Reset',
    close: 'Close',
    ask: 'Ask on Instagram',
    adjustHint: 'Drag to move the dress. Pinch or scroll to resize.',
    photoNoBody: 'We could not find shoulders and hips in that photo. Try a full-length photo taken straight on.',
    badFile: 'That file could not be opened as a photo.',
    loadFail: 'The fitting room could not open in this browser. The catalog still works.',
    rail: 'Dresses to try',
    canvas: 'Live view with the selected dress on you',
  },
};

export const copy = { sq, en };

const KEY = 'lang';

/** Albanian by default; the URL carries the choice (?lang=en) so nothing needs to be stored. */
export function detectLang(): Lang {
  const fromUrl = new URLSearchParams(location.search).get(KEY);
  return fromUrl === 'en' ? 'en' : 'sq';
}

export function writeLang(lang: Lang): void {
  const url = new URL(location.href);
  if (lang === 'sq') url.searchParams.delete(KEY);
  else url.searchParams.set(KEY, lang);
  history.replaceState(history.state, '', url);
}

export type Copy = typeof sq;
