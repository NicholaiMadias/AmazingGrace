# Amazing-Grace
Welcome to Amazing Grace Home Living. Providing secure, all-inclusive housing in Tampa and Largo

## Site Sections

### 🏠 Home / Listings (`/`)
The main homepage featuring property listings for Amazing Grace Home Living.

### 🎮 Arcade (`/arcade/`)
The Nexus Arcade hub — play faith-based games including **Mystery of the Seven Stars** and **Match Maker**.

- URL: `https://amazinggracehl.org/arcade/`
- Tracks level progress via `progression.js` (localStorage-backed)
- Displays a 7-star progress map updated on each Match Maker level completion
- Certificate viewer: `https://amazinggracehl.org/arcade/certificates/`

### ✝️ Ministry (`/ministry/`)
Faith-based content and ministry resources.

### 🗺️ Galleries (`/galleries/`)
Photo galleries for individual properties.

---

## ⚠️ Admin Dashboard (`/admin/`) — Experimental

> **Not linked in primary navigation.** This section is intentionally off-nav and isolated
> so that login prompts, 404s, or experimental features do not affect the main site.

The Sovereign Matrix Admin Dashboard provides browser-based tooling for user management,
audit logging, diagnostics, and admin key generation. It uses a localStorage shim for
demo/dev use and is designed to be upgraded to Firebase Auth in production.

- URL: `https://amazinggracehl.org/admin/`
- Login: `https://amazinggracehl.org/admin/login.html`
- **Demo accounts** (active on `localhost` / `*.github.io` only):
  - `owner@matrix.dev` / any password (4+ chars)
  - `superadmin@matrix.dev` / any password
  - `admin@matrix.dev` / any password


---

## 🏠 Property Addresses

| Reference | Full Address | Gallery Path |
|---|---|---|
| 1144 | 1144 7th St NW, Largo, FL 33770 | `/galleries/1144-7th-street/` |
| 1142 | 1142 7th St NW, Largo, FL 33770 | `/galleries/1142-7th-street/` |
| 926 | **926 E Poinsettia Ave, Tampa, FL 33612, United States** | `/galleries/926-poinsettia/` |
| Tampa *(archived/inactive)* | Tampa Property, Tampa, FL *(archived/inactive gallery)* | `/galleries/tampa-property/` |

> **Note for contributors:** The active listings are `1144`, `1142`, and `926-poinsettia`. The 926 listing is in **Tampa** (not Largo). When referencing this property in code, copy, or file names use the `926-poinsettia` slug but always display the full address `926 E Poinsettia Ave, Tampa, FL 33612`. The separate `tampa-property` gallery is retained only as an archived/inactive reference and should not be treated as a current listing.

---

## 📁 Asset Folder Structure

```
public/assets/
├── logo.png                     ← Site nav logo (8.7 KB, 120×80 px)
├── icon-192.png                 ← PWA icon
├── icon-512.png                 ← PWA icon
├── icon-512-maskable.png        ← PWA maskable icon
│
├── images/                      ← High-res property thumbnails + illustrations
│   ├── property-1144.svg        ← 1144 7th St NW, Largo
│   ├── property-1142.svg        ← 1142 7th St NW, Largo
│   ├── property-926.svg         ← 926 E Poinsettia Ave, Tampa
│   ├── property-tampa.svg       ← Tampa Property
│   └── supernova_explosion.svg  ← Game illustration
│
├── icons/                       ← Small game-optimised icons & sprite frames
│   ├── star_crystal_gold.svg
│   ├── star_crystal_blue.svg
│   ├── star_crystal_purple.svg
│   ├── star_crystal_red.svg
│   └── <name>_frame_N.png      ← Star Matrix animation sprites (add when ready)
│
└── audio/                       ← MP3 music & SFX (drop files here)
    └── (e.g. storm.mp3, badge.mp3, exploration.mp3 …)
        served at /assets/audio/<filename>.mp3
```

Gallery photo sets live under `public/galleries/<slug>/` and are indexed by `images.json` in each folder.

