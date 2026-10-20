# HOVUCA motion assets

Six original motifs based on the people, violet foundation, and red/green orbit ribbons in `/Hovuca.png`. Colors are visual approximations of the raster logo, independent of the site's forest/coral UI tokens. These are companion assets, not an approved replacement or exact trace of the logo. The existing site logo is preserved.

| Asset | Suggested use | Playback |
| --- | --- | --- |
| `community-orbit` | Page / section loading | Loop |
| `community-dots` | Inline / button loading | Loop |
| `care-heart` | Donation processing | Loop |
| `growing-together` | Program loading / progress | Loop |
| `learning-pages` | Course / document loading | Loop |
| `success-embrace` | Submission confirmation | Once |

Each SVG uses a transparent 128 × 128 canvas and named groups. Each matching JSON contains native Lottie shape layers at 30 fps for two seconds. No fonts, bitmap dependencies, masks, expressions, or external assets. SVGs are editable source art; the JSON files already contain animation.

Open `preview.html` for the static contact sheet. Use `/brand-motion/<name>.json` as a Lottie player's animation URL. Set `loop: false` for success; set `loop: true` for loaders. Recommended sizes: dots 32–48 px, other motifs 48–96 px. Lottie player integration is intentionally left for the subsequent animation integration task; no player dependency has been added.

When integrating, respect `prefers-reduced-motion`: display the SVG rather than autoplaying. Keep an accessible text label such as “Loading courses…” on the parent status element; hide decorative animation from assistive technology. A decorative animation must not replace the actual network or form state. Progress motifs are indeterminate, not numeric progress indicators.

Regenerate all vectors and animations with `node frontend/scripts/generate-brand-motion.mjs` from the repository root. Geometry, palette, layer names, and timing share a single source in that script. Update the script rather than editing generated files.
