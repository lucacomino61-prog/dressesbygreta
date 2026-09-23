/** Public JSON: the catalogue for search and the bag, order submission, the local test gateway. */
import { Hono } from 'hono';
import { isLang } from '../../shared/copy';
import { hit, listVisible } from '../db';
import { clientIp } from '../auth';
import { createOrder, getOrder, parseOrderInput, setOrderStatus, setPaymentStatus } from '../orders';
import { gatewayFor } from '../payments';
import type { AppEnv } from '../types';

export const publicApi = new Hono<AppEnv>();

/** Everything the bag and the search drawer need, in one small response. */
publicApi.get('/products', async (c) => {
  const lang = isLang(c.req.query('lang')) ? (c.req.query('lang') as 'sq' | 'en') : 'sq';
  const list = await listVisible(c.env.DB, lang);
  return c.json(
    list.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      price: p.price,
      color: p.color,
      categories: p.categories,
      stock: p.stock,
      cover: p.photos[0] ?? null,
    })),
    200,
    { 'cache-control': 'public, max-age=20' },
  );
});

publicApi.post('/orders', async (c) => {
  if (c.req.header('Origin') !== new URL(c.req.url).origin) return c.json({ error: 'bad_origin' }, 403);
  const body = (await c.req.json().catch(() => null)) as Record<string, unknown> | null;
  // The honeypot field is invisible to people; anything in it came from a bot.
  if (!body || (typeof body.website === 'string' && body.website.trim())) return c.json({ error: 'invalid' }, 400);
  const { input, errors } = parseOrderInput(body);
  if (!input) return c.json({ error: 'invalid', fields: errors }, 400);
  if (!(await hit(c.env.DB, `order:${clientIp(c)}`, 10, 60 * 60))) return c.json({ error: 'too_many_orders' }, 429);
  const res = await createOrder(c.env, input, new URL(c.req.url).origin);
  if (!res.ok) return c.json({ error: res.error, unavailable: res.unavailable ?? [] }, res.status);
  return c.json({ id: res.id, number: res.number, payUrl: res.payUrl ?? null }, 201);
});

/** The simulated bank's answer (local development only). */
publicApi.post('/pay/test/:id', async (c) => {
  if (!gatewayFor(c.env) || c.req.header('Origin') !== new URL(c.req.url).origin) return c.json({ error: 'not_available' }, 404);
  const o = await getOrder(c.env.DB, c.req.param('id'));
  if (!o || o.order.status !== 'awaiting_payment') return c.json({ error: 'not_awaiting' }, 409);
  const { result } = (await c.req.json().catch(() => ({}))) as { result?: string };
  if (result === 'paid') {
    await setPaymentStatus(c.env.DB, o.order.id, 'paid');
    await setOrderStatus(c.env.DB, o.order.id, 'new');
  } else {
    await setOrderStatus(c.env.DB, o.order.id, 'cancelled', 'failed');
  }
  return c.json({ ok: true });
});
