# WebCraft

A responsive static website for WebCraft. HTML, CSS, and small JavaScript files are served directly. A dependency-free Python build adds the scheduled articles that are ready to publish.

## Preview locally

From this folder, run:

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Open http://127.0.0.1:4173.

## GitHub Pages

In **Settings → Pages**, select **GitHub Actions** as the source. The Pages workflow runs on pushes to `main`, on demand, and at 9:17 a.m. Eastern each day from November 23 through December 22, 2026. It keeps the `localwebcraft.com` domain, verifies the generated site, and deploys it as a single artifact.

Each dated batch in `_editorial/daily/` contains one article for each of the 32 service areas. Drafts are visible in this public GitHub repository. The daily writing job supplies subsequent batches. Pages deploys any complete, due batches in a push or scheduled run. Only due articles are copied to the website. The build adds each article’s links to Insights, its service and location pages, and the XML sitemap. If a scheduled run is missed, the next successful build picks up anything due.

```sh
python3 scripts/publish_articles.py --calendar
python3 scripts/publish_articles.py --output /tmp/webcraft-dec-22 --at 2026-12-22T14:17:00+00:00
```

The contact form uses the repository’s existing Web3Forms endpoint. Its confirmation page is handled by Web3Forms. The displayed business designs are illustrative concepts, not client work.

Photography: [coffee](https://images.unsplash.com/photo-1509042239860-f550ce710b93) and [plants](https://images.unsplash.com/photo-1416879595882-3373a0480b5b), via Unsplash. Google Fonts supplies Inter; system font fallbacks are included.
