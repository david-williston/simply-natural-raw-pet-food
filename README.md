# Simply Natural Raw Pet Food — website

Hugo site using the [PaperMod](https://github.com/adityatelange/hugo-PaperMod) theme (git submodule in `themes/PaperMod`).

## Run locally

```bash
hugo server
```

Then open http://localhost:1313. Build for production with `hugo --gc --minify` (output in `public/`).

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
