# Typography alignment: Homepage listings heading

## Context
During review of PR #80 (https://github.com/NicholaiMadias/Amazing-Grace/pull/80), the previously suggested "add a wrapper" patch for the homepage listings typography was found to be **incorrect for this repo**.

Facts verified from the PR branch:
- The homepage listings area is already wrapped:
  - `<section class="section section-alt starburst-overlay" id="listings">`
- The global font is already applied:
  - `body { font-family: 'Inter', sans-serif; }`

## Root cause (actual)
1. **Orbitron headings vs Inter body**
   The homepage uses:
   - `.section-heading { font-family: 'Orbitron', sans-serif; }`
   So the `🏘️ Available Rooms` heading renders in Orbitron (condensed / different metrics) compared to Inter body text.

2. **Emoji baseline shifts**
   Emoji glyphs are rendered by OS emoji fonts (Apple Color Emoji / Segoe UI Emoji / Noto Color Emoji), which can alter baseline and line-height perception.

3. **Listings contain many micro-typography styles**
   Components like `.listing-title`, `.amenity-badge`, `.btn-sm` use varied font sizes/weights which can increase perceived inconsistency.

## Minimal, production-safe patch (scoped to Listings only)
### CSS override
```css
/* Make Listings heading match body typography (Inter instead of Orbitron) */
#listings .section-heading {
  font-family: 'Inter', sans-serif;
  letter-spacing: normal;
  font-weight: 600;
}

/* Emoji isolation to reduce baseline distortion */
#listings .section-heading span.emoji {
  display: inline-block;
  transform: translateY(2px);
  margin-right: 0.35rem;
}
```

### HTML adjustment (heading only)
Change the listings heading from inline emoji text to an isolated span:

```html
<h2 class="section-heading">
  <span class="emoji" aria-hidden="true">🏘️</span>
  Available Rooms
</h2>
```

## Commit message suggestion
`fix(homepage): align Listings heading typography and stabilize emoji baseline`

- Override Orbitron for `#listings .section-heading` to use Inter
- Normalize letter-spacing and font-weight
- Isolate emoji to avoid baseline distortion
- Keep Orbitron for other section headings
