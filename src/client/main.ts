/** Storefront entry: drawers, the bag, page transitions, per-page behaviour. */
import { isLang } from '../shared/copy';
import { bag } from './bag';
import { Drawers } from './drawers';
import { initPage } from './pages';
import { startRouter } from './router';

const lang = isLang(document.body.dataset.lang) ? document.body.dataset.lang : 'sq';
const drawers = new Drawers(lang);
startRouter(initPage(lang, drawers));
drawers.schedulePopup(9000);
void bag.refresh(lang);
