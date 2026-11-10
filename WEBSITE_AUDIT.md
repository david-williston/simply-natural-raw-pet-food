# Original-site migration review

Reviewed November 10, 2026 against https://www.simplynaturalrawpet.ca/,
its public page sitemap, all eight published pages, live galleries, and linked assets.
This is a content and functionality comparison, not a word-for-word copy or a
medical review of the original site's nutrition claims.

The subsequent multilingual update adds full Simplified Chinese, Traditional
Chinese, Korean, Japanese, French, Farsi and Brazilian Portuguese versions of
the English site. The language selector preserves the current page, search
indexes stay within the selected language, and search cards include highlighted
matching excerpts. Farsi uses a right-to-left layout. Build checks cover all
72 pages, their language equivalents, UI translations, links, assets and anchors.
Translations are AI-authored and have not been professionally copyedited.

## Page coverage

| Original page | Result |
| --- | --- |
| `/` | Raw-feeding benefits, convenience foods, special orders, six meal-plan conditions, Facebook and frequent-buyer promotion retained. Longer nutrition explanations moved to `/nutrition/`. |
| `/about-us` | Business background, product range and professional referrals retained. |
| `/products` | All raw/dry dog, raw/dry/canned cat and supplement brand lists retained, with normalized brand spelling. Treats, alternatives to raw feeding, advice and delivery calls to action retained. |
| `/nutrition` | Supplement cautions, species-appropriate diet discussion and listed benefits retained; expanded with the original homepage's ingredients and transition information. |
| `/services` | Training, meal planning and Vancouver delivery retained. |
| `/puppy-kindergarten` | Ages 9–24 weeks, six weekly one-hour classes, positive reinforcement, all course topics, quizzes/prizes, handler's bag, preregistration and both instructors' names/qualifications retained. |
| `/deliveries` | Benefits, local service, nutrition advice, flexible schedules, natural diets, subscription trends and sustainability discussion retained. No online checkout existed on the original. |
| `/contact-us` | Name, phone, email and message fields, address, phone, email, hours and all five payment methods retained. Direct form submission is still outstanding; see below. |

The original sitemap lists exactly these eight pages. The rebuild also adds search.
Original extensionless page paths resolve as directories on static hosting;
the published canonical URLs include trailing slashes.

## Gaps corrected

- Restored four missing original gallery image files: two homepage dog images
  and two product/treat images. All six original homepage gallery images are now
  displayed across the homepage, and all five product gallery images are displayed
  across Products and Nutrition. Galleries use static photo layouts rather than
  the Wix slideshow and zoom overlay.
- Confirmed the sale flyer matches the original byte for byte (SHA-256
  `f9c69747144c158649c0fbb26f19555d64862e43128029b86ba72668693cca5f`).
  Restored its old `/_files/ugd/6c144a_2ff0e68cc51341e284eab513e556284e.pdf`
  path alongside `/files/holiday-sale.pdf`.
- Matched holiday-hours wording to the original's Monday–Friday qualification.
- Made the email-draft fallback explicit in the contact button and instructions.
- Fixed the broken keyboard skip link by giving the main content its target ID
  and making it focusable.
- Made Markdown and button links work beneath the GitHub Pages project path.

## Remaining integration and deliberate differences

1. **Contact submission:** The original Wix form displays a submission-confirmation
   message. This static rebuild has no receiving endpoint; `contactFormAction` is
   empty. It opens an email draft, which the visitor must send. Connect a real form
   service and verify inbox delivery before claiming equivalent submission behavior.
   The original form was inspected without sending a message.
2. **Hours status:** The added “Open now” display uses regular weekly hours in the
   Vancouver timezone. It does not account for statutory holidays or exceptional
   closures. The printed holiday-hours notice is retained.
3. **Hosting:** GitHub Pages hosts the rebuild at its project URL. Moving the
   original custom domain requires a separate DNS/custom-domain change.
4. **Presentation:** Text was condensed and reorganized. Original stock CTA artwork
   is replaced with equivalent text links. Original contact photos also appear on
   About. The puppy page remains reachable from Home, Services and the footer,
   rather than the original Services dropdown.
5. **Third parties:** The old Yellow Pages vendor credit/listing link, Facebook Like
   and Tweet widgets, Wix analytics and Wix form backend are not migrated. The
   business Facebook profile link is retained. No replacement tracking was added.

The flyer is the original linked file; matching it does not confirm its sale dates
are current. Brand availability, course availability and business claims were
compared with the original site, not independently confirmed with the business.
