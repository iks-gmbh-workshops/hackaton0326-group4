# IKS Corporate Design System
> Reference for webapp development based on the official IKS Designmanual v1.0

---

## Colors

### Primary Colors
| Name       | HEX       | CMYK          | Usage                                      |
|------------|-----------|---------------|--------------------------------------------|
| Cyan       | `#009fe3` | 100/0/0/0     | Main brand color, logo top, interactive elements |
| Dark Blue  | `#005578` | 100/0/0/60    | Headings, primary text accents, CTAs       |
| Light Gray | `#c6c6c6` | 0/0/0/30      | Logo body, backgrounds, dividers           |
| Black      | `#1d1d1b` | 0/0/0/100     | Body text                                  |

### Primary Color CSS Variables
```css
:root {
  --color-cyan:       #009fe3;
  --color-dark-blue:  #005578;
  --color-light-gray: #c6c6c6;
  --color-black:      #1d1d1b;

  /* Text default: 80% black */
  --color-text:       #575756;
  --color-text-light: #808080;
}
```

### Blue Scale (used in logo polygon fragments)
Derived from `#009fe3` and `#005578` mixed toward black in steps:
`100% → 80% → 60% → 40% → 20% → 5%`

### Secondary Colors (earthy pastels — for accents, illustrations, charts)
| HEX       | Name approx.    | CMYK             |
|-----------|-----------------|------------------|
| `#7b8eb0` | Slate Blue      | 57/39/17/4       |
| `#871c37` | Dark Red        | 29/97/59/36      |
| `#e4914c` | Warm Orange     | 8/50/75/1        |
| `#5b3c2e` | Dark Brown      | 42/63/67/59      |
| `#0e4823` | Forest Green    | 92/43/99/50      |
| `#b4b68f` | Olive Beige     | 33/20/48/5       |
| `#84a4ad` | Dove Blue       | 52/24/27/5       |
| `#f4c42e` | Yellow          | 5/23/87/0        |
| `#eeeae5` | Off White       | 8/8/10/0         |
| `#dbd9dd` | Light Lilac     | 16/13/10/1       |

Secondary colors have tint steps at 80%, 60%, 40%, 20%, 10%.

### Color Usage Rules
- Primary colors dominate logo surroundings and body text.
- Secondary colors for supporting elements, charts, illustrations, callout boxes.
- **Never** use colors outside these palettes for text, boxes, or logo backgrounds.
- Polygon graphics: `#84a4ad` on light backgrounds; `#009fe3` on dark backgrounds.
- Images: prefer desaturated, grayscale, or blue-tinted photos — avoid highly saturated competing colors.

---

## Typography

### Fonts
| Role        | Font                  | Weights / Style              |
|-------------|-----------------------|------------------------------|
| **Primary** | Segoe UI              | Light, Regular, Bold         |
| **Headlines** | Merriweather        | Light Italic, Italic only    |
| **Web fallback** | Roboto (sans-serif) | When Segoe UI unavailable |

> ⚠️ Never use Merriweather Regular or Sans Serif. Headlines only, never body text.

### Type Scale (relative, based on document examples)
| Element          | Font                     | Color        | Relative Size |
|------------------|--------------------------|--------------|---------------|
| H1 / Headline    | Merriweather Light Italic | `#005578`   | 100% (e.g. 24pt) |
| Subheadline      | Segoe UI Regular         | `#575756`    | 60%           |
| Section heading  | Segoe UI Semibold        | `#005578`    | 50%           |
| Paragraph heading| Segoe UI Semibold        | `#575756`    | 40%           |
| Caption          | Segoe UI Semibold        | `#575756`    | 30%           |
| Body / Copy      | Segoe UI Light           | `#575756`    | 40%           |
| Body italic / Quote | Segoe UI Italic       | `#575756`    | 40%           |

### CSS Font Stack
```css
:root {
  --font-primary:   'Segoe UI', Roboto, sans-serif;
  --font-headline:  'Merriweather', Georgia, serif;
}

h1, h2 {
  font-family: var(--font-headline);
  font-style: italic;
  font-weight: 300; /* Light Italic */
  color: var(--color-dark-blue);
}

body, p, li, input, button {
  font-family: var(--font-primary);
  font-weight: 300; /* Light */
  color: var(--color-text);
}
```

### Typographic Rules
- **Alignment**: Left-aligned, ragged right (Flattersatz). No justified text.
- **Line length**: 40–80 characters including spaces.
- **Line height**: Balanced — not too tight, not too loose. Use ~1.5 for body.
- **Headings**: Optionally underlined with a thin horizontal rule beneath.
- **Avoid**: centered body text, right-aligned paragraphs, bold decorative fonts.

---

## Logo

### Structure
- Wordmark "IKS" in two layers:
  - **Top ~25% of letter height**: Polygon fragments in the blue/cyan scale
  - **Body**: Subtle gray gradient
- Subtitle below: "Individuelle Softwarelösungen" in 80% black (Segoe UI Regular)

### Variants
| Variant | Description                             |
|---------|-----------------------------------------|
| A       | Wordmark + subtitle (default)           |
| B       | Wordmark + `www.iks-gmbh.com`           |
| C       | Wordmark only (no subtitle)             |

### Safe Zone (Exclusion Zone)
Relative to logo width (B) and height (H):
- Top: `0.5 H`
- Bottom: `0.6 H`
- Left: `0.25 B`
- Right: `0.5 B`
- Gap between wordmark and subtitle: `0.14 H`

### Logo Don'ts
- No rotation or skewing
- No drop shadows
- No frames or borders
- No stretching/distorting
- No non-CI colors
- No other logos combined
- No incorrect subtitle positioning or formatting
- No placement on patterned or heavily saturated backgrounds

---

## Layout & Grid

### Principles
- Use a defined **Satzspiegel** (type area / content zone) — based on the golden ratio.
- Suggested column split: **3/5 content + 2/5 margin** or **4/7 + 2/7 + 1/7** (with margin column).
- Leave a gutter between columns.
- Margin columns ("Marginalspalten") can be left empty for whitespace and emphasis.

### Whitespace
- Generous whitespace is a core design principle — it signals clarity and reliability.
- Elements should breathe; avoid density unless intentional.

### Alignment
- All elements anchor to a **vertical baseline**.
- Logo, dates, and reference lines align to the same vertical axis.

---

## Visual Design Elements

### Polygon Graphics
Two variants used as decorative background elements:

| Element          | Placement                          |
|------------------|------------------------------------|
| **Polygonraster** | Bottom edge of layout             |
| **Polygonwolke**  | Center of layout, behind figures  |

- Thin lines only, no fills.
- Color: `#84a4ad` on light backgrounds; `#009fe3` on dark backgrounds.
- Scale proportionally (keep line weight constant).
- May bleed off the edge of the layout.
- Do **not** overlap with text in ways that reduce readability.

### Images / Photography
- Prefer company photos over stock.
- Recommended treatments: desaturated, grayscale, or blue-tinted overlay.
- Avoid highly saturated or warm-colored images — they compete with primary colors.
- Blue wash overlay (`#005578` at ~60% opacity) works well for hero/chapter images.

---

## Components

### Headline Block
```
[Merriweather Light Italic headline]
─────────────────────────────  ← thin rule
[Segoe UI Regular subheadline]
```
Variants: centered, left-aligned, right-aligned, with/without rule, with color bar background.

### Text Box / Callout
- Background: primary or secondary color
- Text: white or dark, ensure sufficient contrast
- Only use CI-approved colors for backgrounds

### Navigation (from web examples)
```
[IKS Logo]    ÜBER UNS   UNSER ANGEBOT   IKS-KARRIERE   WISSEN
```
- Logo left, nav links right
- Segoe UI, caps or mixed case
- Clean, minimal, no heavy borders

### Buttons / CTAs
- Primary: `#005578` background, white text, Segoe UI Semibold
- Secondary: outlined with `#009fe3`, matching text
- No gradients, no rounded pill shapes — prefer slightly rounded or square

### Cards / Content Blocks
- Clean white or `#eeeae5` background
- `#005578` or `#009fe3` accent (left border or heading)
- Segoe UI body text in `#575756`

---

## Do / Don't Summary

| ✅ Do                                          | ❌ Don't                                      |
|------------------------------------------------|-----------------------------------------------|
| Use primary colors near logo and in headings   | Use off-brand colors for text or UI elements  |
| Use Merriweather Italic for headlines only     | Use Merriweather for body text                |
| Left-aligned ragged-right text                 | Justify body text                             |
| Desaturated or blue-tinted images              | Use highly saturated competing images         |
| Generous whitespace                            | Clutter the layout                            |
| Polygon graphics as decorative background      | Overlay polygons on top of important text     |
| Scale logo proportionally                      | Distort, rotate, or recolor the logo          |
| Draw accent colors from secondary palette      | Invent new colors outside the palette         |

---

## Quick Reference: Key Hex Values

```
Brand Cyan:         #009fe3
Brand Dark Blue:    #005578
Text (default):     #575756
Text (strong):      #1d1d1b
Gray (logo/bg):     #c6c6c6
Off-white bg:       #eeeae5
Dove Blue (polygon light bg): #84a4ad
```