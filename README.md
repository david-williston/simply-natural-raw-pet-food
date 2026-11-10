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

The header immediately shows the original name and tagline from
`assets/images/logo-text.svg`. Footprints then run upward from the bottom edge
and the final paw lands in the header, completing the logo and staying there.
Each footprint is sized from the actual displayed logo's paw crop, including on
mobile, with widely spaced strides. The logo sits on the right and the mobile
menu on the left in all languages. The artwork comes from the original logo and its glass-press animation.
The steps use quick pairs and short pauses. Each print fades over 20 seconds to
20% opacity and remains there. The trail runs once per page load; the final paw
in the logo remains fully opaque.

The effect is shared across languages, does not intercept clicks, and pauses in
hidden tabs. Reduced motion and JavaScript-free browsing receive the complete
static logo. The sticky header is opaque white. Trail prints use soft cream over
dark sections and the original olive over light sections, adapting as visitors
scroll; the paw in the logo retains the original branding.
The StrayCats.love footer credit and logo are
temporarily hidden; set `params.showDeveloperCredit: true` in `hugo.yaml` to restore them.

Search uses an index for the current language, and result cards show excerpts
around matching text with highlighted terms. No external translation or search
service is required. The original sale flyer is an English PDF in every version.
On mobile, search follows the visual viewport when the keyboard opens, keeps the
field and scrollable results above it, and dismisses the keyboard with Search.
Page arrival and popular-query buttons do not automatically open a mobile keyboard.
The hamburger menu opens and closes with a slide/fade, morphs into a close icon,
and has a soft glint. Motion effects respect reduced-motion preferences.

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
