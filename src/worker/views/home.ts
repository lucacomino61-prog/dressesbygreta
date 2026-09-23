/** Home: the photograph and the wordmark, the featured gowns as sleeves, the sizes, the shop. */
import { SIZES, SIZE_LETTER, type Product } from '../../shared/catalog';
import { copy, href, type Lang } from '../../shared/copy';
import { html, type Raw } from '../../shared/html';
import { SITE } from '../site';
import { flipId, plate, price } from './parts';

export function homeView(lang: Lang, visible: Product[]): Raw {
  const t = copy[lang];
  const featured = (visible.some((p) => p.featured) ? visible.filter((p) => p.featured) : visible).slice(0, 7);
  const counts = SIZES.map((s) => ({ s, n: visible.filter((p) => p.stock[s] > 0).length }));

  return html`<section class="hero" id="hero">
      <figure class="plate hero__plate" style="--p: 1">
        <div class="plate__inner">
          <img class="plate__img" src="${SITE.heroImage}" width="790" height="1400" alt="${t.hero.alt}" fetchpriority="high" decoding="async" />
          <span class="plate__scan" aria-hidden="true"></span>
        </div>
      </figure>
      <div class="hero__overlay" aria-hidden="true"></div>
      <div class="hero__mark"><h1 class="hero__title">${t.hero.wordmark}</h1></div>
      <div class="hero__content">
        <a class="btn btn--photo" href="${href('/dyqani', lang)}">${t.hero.cta}</a>
      </div>
    </section>

    ${featured.length
      ? html`<section class="rail" id="rail" aria-label="${t.shop.title}">
          ${featured.map((p, i) => {
            const url = href(`/fustan/${p.slug}`, lang);
            return html`<article class="rail__plate" style="z-index: ${i + 1}">
                <a class="rail__frame" href="${url}" tabindex="-1" aria-hidden="true" data-fly>
                  ${plate(p.photos[0], { alt: '', sizes: '(min-width: 1024px) 44vw, 100vw', eager: i < 1, target: 1600, flip: flipId(p), cls: 'rail__photo', tag: 'span' })}
                  <span class="rail__scrim" aria-hidden="true"></span>
                </a>
                <div class="rail__caption">
                  <h2 class="rail__name"><a href="${url}" data-fly-link>${p.name}</a></h2>
                  ${price(p, lang, 'price rail__price')}
                  <div class="rail__actions">
                    <a class="tlink" href="${url}" data-fly-link>${t.shop.open}</a>
                    ${p.instagramUrl ? html`<a class="tlink" href="${p.instagramUrl}" target="_blank" rel="noopener">${t.product.instagram}</a>` : ''}
                  </div>
                </div>
              </article>
              <div class="hold" aria-hidden="true"></div>`;
          })}
        </section>`
      : ''}

    <section class="sizes-band" aria-labelledby="sizes-band-title">
      <div class="container sizes-band__head">
        <h2 class="heading" id="sizes-band-title">${t.sizes.title}</h2>
        <p class="body">${t.home.sizesLead}</p>
      </div>
      <ol class="sizes-band__row">
        ${counts.map(({ s, n }) =>
          n > 0
            ? html`<li><a class="sb" href="${href('/dyqani', lang, { masa: s })}"><span class="sb__n">${s}</span><span class="sb__meta"><span class="sb__l">${SIZE_LETTER[s]}</span><span class="sb__c">${t.sizes.count(n)}</span></span></a></li>`
            : html`<li><span class="sb is-out" aria-disabled="true"><span class="sb__n">${s}</span><span class="sb__meta"><span class="sb__l">${SIZE_LETTER[s]}</span><span class="sb__c">${t.sizes.none}</span></span></span></li>`,
        )}
      </ol>
      <p class="container small sizes-band__guide">${t.sizes.guide}</p>
    </section>

    <section class="visit container" id="visit">
      <h2 class="heading">${t.visit.title}</h2>
      <p class="visit__address">${SITE.address}</p>
      <div class="visit__cta">
        <a class="btn btn--line" href="${SITE.maps}" target="_blank" rel="noopener">${t.visit.maps}</a>
        <a class="btn" href="${href('/dyqani', lang)}">${t.home.openLookbook}</a>
      </div>
      <p class="visit__line body">${t.visit.body}</p>
    </section>`;
}

export function storeJsonLd(origin: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ClothingStore',
    name: SITE.name,
    url: origin + '/',
    image: origin + SITE.ogImage,
    sameAs: [SITE.instagram],
    address: { '@type': 'PostalAddress', streetAddress: 'Rruga Andon Zako Çajupi, pas LSI', addressLocality: 'Tiranë', addressCountry: 'AL' },
    geo: { '@type': 'GeoCoordinates', latitude: SITE.geo.lat, longitude: SITE.geo.lng },
  };
}
