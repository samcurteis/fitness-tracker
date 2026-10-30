# Next.js alone, no separate Go backend

v1 is a single Next.js App Router app (TypeScript): a server component fetches wellness data from intervals.icu with the API key held server-side, and client components draw the charts. The author uses Go daily, so a Go + React stack was the obvious pick; Next was chosen because the project is for learning (Next is new to the author and keeps React fresh) and as a portfolio piece with nothing unneeded. A separate backend would be redundant for one server-side fetch, and future AI features fit the same server side.

## Considered Options

- React (Vite) SPA + Go backend serving the SPA: just as few runtime parts, but two languages and toolchains, and the learning value would be Go, which the author already has.
- Next.js + Go: Next's own server would be redundant next to a Go API.
