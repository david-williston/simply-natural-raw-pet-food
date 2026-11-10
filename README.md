# Simply Natural Raw Pet Food — website

Hugo site using the [PaperMod](https://github.com/adityatelange/hugo-PaperMod) theme (git submodule in `themes/PaperMod`).

Repository: [david-williston/simply-natural-raw-pet-food](https://github.com/david-williston/simply-natural-raw-pet-food).

## Run locally

```bash
hugo server
```

Then open http://localhost:1313. Build for production with `hugo --gc --minify` (output in `public/`).

## Deployment

The site is published at https://david-williston.github.io/simply-natural-raw-pet-food/.
Pushing to `main` runs `.github/workflows/pages.yaml`, which installs Hugo Extended
0.163.1, checks out the PaperMod submodule, and builds and deploys GitHub Pages.
The workflow uses the Pages URL for links, assets, search and canonical URLs.

## Languages and search

The site has eight versions: English at the root, Simplified Chinese (`zh-hans`),
Traditional Chinese (`zh-hant`), Korean (`ko`), Japanese (`ja`), Canadian French
(`fr`), Iranian Persian (`fa`, right-to-left), and Brazilian Portuguese (`pt-br`).
The language menu links to the equivalent page in each language.

English content lives in `content/*.md`; translations use matching names such as
`content/products.fr.md`. Keep explicit anchor IDs and link destinations aligned
between versions. Shared text, including homepage copy, is in `i18n/<language>.json`.
The business name, brands, address, phone and email remain unchanged.

The header uses the paw-against-glass animation in `assets/images/logo-animated.svg`.
Its blank demo margins are cropped to preserve the original logo's header size.
The animation is self-contained and shared across languages. It plays once per
browser tab session, then holds the complete logo. Later page visits in the same
tab use the original still image. Visitors who prefer reduced motion, and browsers
without SVG support, receive `assets/images/logo.jpg`. The sticky header is opaque
white so underlying sections do not reveal the logo image's canvas.

A brief trail of mirrored paw prints crosses the bottom edge once per tab session,
after the logo reveal. It uses the original paw artwork, does not intercept clicks,
and is disabled for reduced motion. The footer credits StrayCats.love with its logo.

Search uses an index for the current language, and result cards show excerpts
around matching text with highlighted terms. No external translation or search
service is required. The original sale flyer is an English PDF in every version.

After changing content, build and check all translated pages and links:

```bash
hugo --gc --minify
python3 scripts/check-site.py public
```

The same checks run before GitHub Pages deployment. Translations are AI-authored;
native-speaker editorial review is still useful, especially for nutrition copy.

The original custom domain is not changed by this deployment. When moving that
domain, update the Pages custom-domain settings and DNS separately.

The original flyer URL is retained under `static/_files/ugd/` for existing links.
When replacing `static/files/holiday-sale.pdf`, update that compatibility copy too.

See [the migration audit](WEBSITE_AUDIT.md) for the original-site comparison and
remaining form integration work.

## Where things live

| What | Where |
| --- | --- |
| Phone, address, hours, Facebook link, announcement bar, contact form endpoint | `hugo.yaml` → `params` |
| Page text | `content/*.md` |
| Home page sections | `layouts/index.html` |
| Header / footer | `layouts/_partials/header.html`, `footer.html` |
| Colours and all styling | `assets/css/extended/brand.css` |
| Photos | `assets/images/` (resized to WebP automatically) |
| Sale flyer PDF | `static/files/holiday-sale.pdf` |

## Shortcodes for page content

- `{{</* brands "Acana" "Orijen" */>}}` — brand chips
- `{{</* photos "store/treats.jpg|Alt text" "products-3.jpg|Alt text" */>}}` — photo row
- `{{</* callout title="Title" */>}}Text{{</* /callout */>}}` — highlighted note
- `{{</* button href="/contact-us/" text="Ask us" */>}}` — button

## Contact form

The form opens the visitor's email app until `params.contactFormAction` in `hugo.yaml` is set to a form endpoint (Formspree, Netlify Forms, etc.).
