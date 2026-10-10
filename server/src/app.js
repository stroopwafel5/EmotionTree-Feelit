/**
 * app.js
 * --------------------------------------------------------------------------
 * Puts the server together: settings, database, content, rules, email,
 * and the routes. `createApp()` is used by server.js and by the tests.
 *
 * Route files:
 *   routes/api.js     - the kids' app (JSON, with a login token)
 *   routes/parent.js  - parent web pages (login by email link)
 *   routes/school.js  - school web pages (login by email link) + admin
 *   routes/dev.js     - test mailbox and "add a school" form (test mode only)
 */
import http from 'node:http';

import { loadConfig } from './config.js';
import { Content } from './content.js';
import { HttpError, parseCookies, sendHtml, sendJson, sessionCookie } from './http.js';
import { Mailer } from './mail.js';
import { messagePage } from './pages.js';
import { newToken, RateLimiter, safeEqual, tokenHash } from './security.js';
import { Service } from './service.js';
import { Store } from './store.js';
import registerApi from './routes/api.js';
import registerDev from './routes/dev.js';
import registerParent from './routes/parent.js';
import registerSchool from './routes/school.js';

/** A tiny router: method + path pattern ("/api/friends/:id") -> handler. */
class Router {
  constructor() {
    this.routes = [];
  }

  add(method, pattern, handler) {
    const keys = [];
    const regex = new RegExp(
      '^' +
        pattern.replace(/:(\w+)/g, (_, key) => {
          keys.push(key);
          return '([^/]+)';
        }) +
        '$',
    );
    this.routes.push({ method, regex, keys, handler });
  }

  match(method, path) {
    for (const route of this.routes) {
      const m = route.method === method ? route.regex.exec(path) : null;
      if (m) {
        const params = {};
        route.keys.forEach((key, i) => (params[key] = decodeURIComponent(m[i + 1])));
        return { handler: route.handler, params };
      }
    }
    return null;
  }
}

export function createApp(overrides = {}) {
  const config = loadConfig(overrides);
  const store = new Store(config.dataDir);
  const content = new Content(config.contentDir);
  const service = new Service(store, content, config);
  const mailer = new Mailer(config, store);
  const router = new Router();

  /** Shared helpers for all route files. */
  const ctx = {
    config,
    store,
    content,
    service,
    mailer,
    limits: {
      connect: new RateLimiter(10, 10 * 60 * 1000), // 10 per 10 minutes per IP
      email: new RateLimiter(5, 60 * 60 * 1000), // 5 emails per hour per child / address
    },

    /** A full link for emails, e.g. ctx.url('/parent/friend', token). */
    url(path, token) {
      return `${config.publicUrl}${path}${token ? `?t=${encodeURIComponent(token)}` : ''}`;
    },

    /** Starts a login on the parent or school pages. Returns the Set-Cookie value. */
    startWebSession(role, data) {
      const token = newToken();
      store.db.webSessions[tokenHash(token)] = {
        role,
        ...data,
        csrf: newToken(),
        expires: Date.now() + config.parentSessionMs,
      };
      store.save();
      return sessionCookie(role === 'parent' ? 'et_parent' : 'et_school', token, config.parentSessionMs);
    },

    /** The logged-in parent/school for a request, or null. */
    webSession(req, role) {
      const cookie = parseCookies(req)[role === 'parent' ? 'et_parent' : 'et_school'];
      const session = cookie ? store.db.webSessions[tokenHash(cookie)] : undefined;
      if (!session || session.role !== role || session.expires < Date.now()) {
        return null;
      }
      return session;
    },

    /** Throws unless the form's csrf value matches the login. */
    checkCsrf(session, form) {
      if (!session || !safeEqual(form.csrf ?? '', session.csrf)) {
        throw new HttpError(403, 'This form has expired. Please go back and try again.');
      }
    },

    /** The child for the app's "Authorization: Bearer <token>" header. */
    kidFromRequest(req) {
      const auth = String(req.headers.authorization ?? '');
      const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
      return service.kidForToken(token);
    },

    ip(req) {
      return req.socket.remoteAddress ?? 'unknown';
    },
  };

  registerApi(router, ctx);
  registerParent(router, ctx);
  registerSchool(router, ctx);
  registerDev(router, ctx);

  router.add('GET', '/health', (req, res) => sendJson(res, 200, { ok: true, testMode: config.testMode }));

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    const isApi = url.pathname.startsWith('/api/') || url.pathname === '/health';

    // The app talks to /api with a token (no cookies), so any origin is OK.
    // (Needed only for browser previews; phones don't use CORS.)
    if (isApi) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }
    }
    // Basic protection for the web pages.
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    if (!isApi) {
      res.setHeader('X-Frame-Options', 'DENY');
    }

    const found = router.match(req.method ?? 'GET', url.pathname);
    try {
      if (!found) {
        throw new HttpError(404, 'Page not found.');
      }
      await found.handler(req, res, { params: found.params, query: url.searchParams });
    } catch (error) {
      const status = error instanceof HttpError ? error.status : 500;
      if (status === 500) {
        console.error(error);
      }
      const message = error instanceof HttpError ? error.message : 'Something went wrong on the server.';
      if (res.headersSent) {
        res.end();
      } else if (isApi) {
        sendJson(res, status, { error: message });
      } else {
        sendHtml(res, status, messagePage('Oops', message, { url: '/', label: 'Go to the start' }));
      }
    }
  });

  return { server, config, store, service, ctx };
}
