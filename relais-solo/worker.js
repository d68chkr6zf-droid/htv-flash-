/*
 * HTV Flash · relais SumUp Solo (Cloudflare Worker)
 *
 * L'appli HTV Flash ne parle jamais directement à SumUp : elle passe par ce petit relais,
 * qui garde la clé API secrète (SumUp interdit de la mettre dans une appli web).
 *
 * Variables à créer dans Cloudflare (Worker → Settings → Variables and Secrets, type « Secret ») :
 *   SUMUP_API_KEY        clé API secrète SumUp (sup_sk_…)
 *   SUMUP_AFFILIATE_KEY  clé d'affiliation SumUp
 *   SUMUP_APP_ID         identifiant d'application saisi en créant la clé d'affiliation (ex. com.htvflash.app)
 *   RELAY_TOKEN          mot de passe du relais, à recopier dans les réglages de l'appli
 * Facultatif :
 *   SUMUP_MERCHANT_CODE  code marchand (sinon lu automatiquement depuis le compte)
 *   ALLOWED_ORIGIN       adresse de l'appli (par défaut : toutes, le mot de passe protège déjà)
 */
const API = 'https://api.sumup.com';
let merchantCache = '';

export default {
  async fetch(request, env) {
    const cors = {
      'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Relay-Token',
      'Access-Control-Max-Age': '86400',
    };
    const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

    if (!env.RELAY_TOKEN || request.headers.get('X-Relay-Token') !== env.RELAY_TOKEN) return json({ error: 'Mot de passe du relais incorrect' }, 401);
    if (!env.SUMUP_API_KEY) return json({ error: 'Clé API SumUp absente du relais' }, 500);

    const sumup = async (method, path, body) => {
      const r = await fetch(API + path, {
        method,
        headers: { Authorization: `Bearer ${env.SUMUP_API_KEY}`, 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });
      const text = await r.text();
      let data = null;
      try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
      return { ok: r.ok, status: r.status, data };
    };
    const merchant = async () => {
      if (env.SUMUP_MERCHANT_CODE) return env.SUMUP_MERCHANT_CODE;
      if (merchantCache) return merchantCache;
      const me = await sumup('GET', '/v0.1/me');
      const code = me.data && (me.data.merchant_profile?.merchant_code || me.data.merchant_code);
      if (!code) throw Object.assign(new Error('Code marchand introuvable (clé API invalide ?)'), { status: me.status || 500 });
      merchantCache = code;
      return code;
    };
    const fail = (r) => json({ error: errText(r.data) || `Erreur SumUp ${r.status}`, sumup: r.data }, r.status >= 400 ? r.status : 502);

    try {
      const url = new URL(request.url);
      const path = url.pathname.replace(/\/+$/, '');
      const body = request.method === 'POST' ? await request.json().catch(() => ({})) : {};
      const m = await merchant();
      const base = `/v0.1/merchants/${m}/readers`;

      // test de connexion
      if (path === '/health') return json({ ok: true, merchant_code: m });

      // lecteurs associés
      if (path === '/readers' && request.method === 'GET') {
        const r = await sumup('GET', base);
        return r.ok ? json({ readers: r.data?.items || r.data || [] }) : fail(r);
      }
      // association d'un Solo avec le code affiché sur son écran
      if (path === '/pair' && request.method === 'POST') {
        const code = String(body.pairing_code || '').trim().toUpperCase();
        if (!code) return json({ error: 'Code d\'association manquant' }, 400);
        const r = await sumup('POST', base, { pairing_code: code, name: body.name || 'HTV Flash' });
        return r.ok ? json({ reader: r.data }) : fail(r);
      }
      // dissociation
      const del = path.match(/^\/readers\/([\w-]+)$/);
      if (del && request.method === 'DELETE') {
        const r = await sumup('DELETE', `${base}/${del[1]}`);
        return r.ok ? json({ ok: true }) : fail(r);
      }
      // état du lecteur (en ligne, en attente de carte…)
      if (path === '/status' && request.method === 'GET') {
        const r = await sumup('GET', `${base}/${encodeURIComponent(url.searchParams.get('reader_id') || '')}/status`);
        return r.ok ? json(r.data?.data || r.data) : fail(r);
      }
      // envoi du montant sur le Solo
      if (path === '/checkout' && request.method === 'POST') {
        const cents = Math.round(Number(body.amount) * 100);
        if (!body.reader_id || !(cents > 0)) return json({ error: 'Lecteur ou montant manquant' }, 400);
        const payload = { total_amount: { currency: 'EUR', minor_unit: 2, value: cents } };
        if (body.description) payload.description = String(body.description).slice(0, 100);
        if (env.SUMUP_AFFILIATE_KEY) payload.affiliate = { app_id: env.SUMUP_APP_ID || 'com.htvflash.app', key: env.SUMUP_AFFILIATE_KEY, ...(body.reference ? { foreign_transaction_id: String(body.reference).slice(0, 128) } : {}) };
        const r = await sumup('POST', `${base}/${encodeURIComponent(body.reader_id)}/checkout`, payload);
        return r.ok ? json(r.data?.data || r.data) : fail(r);
      }
      // résultat du paiement : pending, successful, failed, cancelled
      if (path === '/checkout' && request.method === 'GET') {
        const r = await sumup('GET', `${base}/${encodeURIComponent(url.searchParams.get('reader_id') || '')}/checkout/${encodeURIComponent(url.searchParams.get('checkout_id') || '')}`);
        return r.ok ? json(r.data?.data || r.data) : fail(r);
      }
      // annulation pendant que le Solo attend la carte
      if (path === '/terminate' && request.method === 'POST') {
        const r = await sumup('POST', `${base}/${encodeURIComponent(body.reader_id || '')}/terminate`);
        return r.ok ? json({ ok: true }) : fail(r);
      }
      return json({ error: 'Adresse inconnue' }, 404);
    } catch (e) {
      return json({ error: e.message || 'Erreur du relais' }, e.status || 500);
    }
  },
};

function errText(d) {
  if (!d) return '';
  if (typeof d.message === 'string') return d.message;
  if (typeof d.detail === 'string') return d.detail;
  if (d.errors) return typeof d.errors === 'string' ? d.errors : (d.errors.detail || d.errors.type || JSON.stringify(d.errors));
  if (typeof d.error_message === 'string') return d.error_message;
  return '';
}
