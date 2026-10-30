# Bring-your-own API key in an httpOnly cookie

Anyone can use the app with their own intervals.icu API key; there is no server-side key and no login or gate. The visitor enters the key once, a server action stores it in a `Secure; HttpOnly; SameSite=Lax` cookie (about one year, with a "Forget key" action), and the server component reads the cookie and fetches with athlete id `0` (the key's owner). This replaces the server env var key from ADR 0001. The app isn't tied to one person's data, and the page needs no access protection because it shows nothing without a key.

## Considered Options

- Server env var key + a gate (Basic Auth in middleware): works for one person only, and still needs a password. Vercel Hobby can't password-protect production.
- Key in localStorage, browser calls intervals.icu directly (CORS allows it): the key never touches our server, but any page JS can read it, and Next's server side would have almost nothing to do.

## Consequences

- The key passes through our server on each request; visitors have to trust the deployment.
- All visitors' requests leave from Vercel's IPs, which share intervals.icu's 10/s per-IP limit. That's fine at personal scale.
