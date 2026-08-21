# Frima Design System
> Extracted from: `Index.tsx`, `SignIn.tsx`, `EditProfile.tsx`, `PropertyDetail.tsx`

---

## Philosophy

The design language is **refined minimalism with luxury undertones**. It prioritizes whitespace, light font weights, and restrained use of color — punctuated by gradient accents for interactive and decorative moments. The overall feel is clean, premium, and modern.

Key principles:
- White backgrounds dominate. Color is used sparingly as an accent, not a base.
- Typography leans light (`font-light`) — headlines never feel heavy.
- Gradients are reserved for buttons, stat cards, and emphasis moments.
- Motion is subtle and purposeful — entrances, hovers, and taps only.
- Cards are borderless or lightly shadowed, never decorative.

---

## Color Palette

### Neutrals (Primary UI)
| Role | Tailwind | Hex |
|---|---|---|
| Background | `bg-white` | `#ffffff` |
| Page background (alt) | `bg-gray-50` | `#f9fafb` |
| Primary text | `text-black` | `#000000` |
| Secondary text | `text-gray-500` | `#6b7280` |
| Muted text | `text-gray-400` | `#9ca3af` |
| Body text | `text-gray-600` | `#4b5563` |
| Borders/dividers | `border-gray-100`, `border-gray-200` | — |

### Brand Gradients (Accent)
These are defined as custom Tailwind tokens. Use for CTAs, stats, and decorative moments only.

```
from-emerald-green to-ocean-teal     → stats card 1
from-electric-blue to-bright-purple  → stats card 2
from-bright-purple to-hot-pink       → stats card 3
from-sunny-orange to-coral-pink      → stats card 4

from-violet-900 to-blue-900          → primary CTA button (default)
from-bright-purple to-electric-blue  → primary CTA button (hover)
from-black to-gray-800               → secondary CTA button (default)
```

### Semantic Colors
| Role | Class |
|---|---|
| Success / verification | `text-emerald-600`, `bg-emerald-500` |
| Luxury navy (headings in detail views) | `text-luxury-navy` |
| Destructive / remove | `hover:text-red-500` |
| Star rating | `fill-yellow-400 text-yellow-400` |

### Custom Token Reference
These tokens are referenced throughout but defined in `tailwind.config`:
- `luxury-navy` — dark navy blue for section headings in detail views
- `emerald-green`, `ocean-teal` — green spectrum
- `electric-blue`, `bright-purple` — blue-purple spectrum
- `hot-pink`, `coral-pink`, `sunny-orange` — warm spectrum

---

## Typography

### Font Families
- **Display font**: `font-display` — used for all hero/section headings. Elegant, editorial.
- **Body font**: Default Tailwind sans — light weight used throughout.

### Font Weights
| Context | Class |
|---|---|
| All headings (hero, section, card) | `font-light` |
| Body / paragraph text | `font-light` |
| Labels, meta info | `font-light` |
| Emphasis (prices, stats) | `font-semibold` or `font-medium` |
| Button labels | `font-light` |

> **Rule**: Default to `font-light`. Use `font-medium` or `font-semibold` only for numerical data (prices, ratings, counts) or badge labels.

### Type Scale
| Element | Class |
|---|---|
| Hero H1 | `text-[clamp(3rem,8vw,7rem)]` + `font-display font-light tracking-tight` |
| Section H2 | `text-[clamp(1.75rem,5vw,3.5rem)]` + `font-display font-light tracking-tight` |
| Section subtitle | `text-[clamp(1rem,2vw,1.25rem)]` + `font-light text-gray-500` |
| Page H1 (non-hero) | `text-4xl md:text-5xl font-light tracking-tight` |
| Card H3 | `text-xl font-light` or `text-lg font-light` |
| Body paragraph | `text-lg font-light leading-relaxed text-gray-500` |
| Small/meta text | `text-sm font-light text-gray-400` or `text-gray-500` |
| Tiny/label | `text-xs font-light` |

### Tracking & Leading
- Headings: `tracking-tight`
- Body paragraphs: `leading-relaxed`
- Truncated card text: `line-clamp-1`, `line-clamp-2`, `line-clamp-3`

---

## Spacing & Layout

### Page Structure
```
min-h-screen bg-white
└── <Header />
└── <main>
    └── max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
└── <Footer />
```

### Section Padding
| Context | Class |
|---|---|
| Standard sections | `py-16 md:py-24` |
| Hero / CTA sections | `py-32` |
| Section header margin | `mb-12` to `mb-20` |

### Grid Layouts
| Context | Class |
|---|---|
| Property / blog cards | `grid md:grid-cols-2 lg:grid-cols-3 gap-8` |
| Two-column forms | `grid md:grid-cols-2 gap-4` |
| Auth split layout | `grid lg:grid-cols-2 gap-12 items-center` |
| Stats row | `grid grid-cols-2 md:grid-cols-4 gap-6` |

---

## Components

### Cards
```jsx
// Standard card (borderless, shadow-only)
<Card className="border-0 shadow-lg">
  <CardHeader>...</CardHeader>
  <CardContent>...</CardContent>
</Card>

// Interactive listing card
<div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow group">
  ...
</div>
```
- No border on content cards (`border-0`)
- Shadow elevates on hover (`shadow-md` → `hover:shadow-xl`)
- `group` class used for coordinating child hover states
- Images inside cards: `group-hover:scale-105 transition-transform duration-300`

### Buttons

**Primary CTA (gradient):**
```jsx
<Button className="bg-gradient-to-r from-violet-900 to-blue-900 hover:from-bright-purple hover:to-electric-blue text-white font-light transition-all duration-500 rounded-md shadow-lg hover:shadow-xl">
  View property
</Button>
```

**Primary solid (black):**
```jsx
<Button className="bg-black hover:bg-gray-800 text-white font-light px-6 py-2 rounded-md">
  Action
</Button>
```

**Outline / secondary:**
```jsx
<Button variant="outline" className="border border-electric-blue text-electric-blue bg-white hover:bg-gradient-to-r hover:from-electric-blue hover:to-bright-purple hover:text-white hover:border-transparent transition-all duration-300 font-light px-8">
  Show more
</Button>
```

**Ghost / tertiary:**
```jsx
<Button variant="ghost" className="text-gray-700 hover:text-black transition-all duration-300 px-8 py-3 font-light">
  Learn more
</Button>
```

**Full-width form button:**
```jsx
<Button className="w-full h-12 bg-black hover:bg-gray-800 text-white text-lg font-light">
  Sign In
</Button>
```

### Form Inputs
```jsx
// Standard input with icon
<div className="relative">
  <IconName className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
  <Input
    className="pl-10 h-12 border-0 bg-white focus:ring-2 focus:ring-black/20 transition-all font-light"
    placeholder="..."
  />
</div>
```
- Height: `h-12` (48px)
- Border: `border-0` (removed), replaced with focus ring
- Focus: `focus:ring-2 focus:ring-black/20`
- Background: `bg-white`
- Font: `font-light`
- Icons: left-anchored at `left-3`, `text-gray-400`

### Labels
```jsx
<Label className="flex items-center">
  <Icon className="h-4 w-4 mr-2" />
  Field Name
</Label>
```

### Badges
```jsx
// Status badge on images
<div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full text-xs font-semibold text-emerald-600 capitalize">
  {status}
</div>

// Verification badge
<Badge variant="default">Verified</Badge>
<Badge variant="secondary">Not Verified</Badge>

// Tag / specialization badge
<Badge variant="outline" className="flex items-center gap-1">
  <span>{tag}</span>
  <X className="h-3 w-3 cursor-pointer hover:text-red-500" />
</Badge>
```

### Tabs
```jsx
<Tabs defaultValue="basic">
  <TabsList>
    <TabsTrigger value="basic">Basic Info</TabsTrigger>
  </TabsList>
  <TabsContent value="basic" className="space-y-6">
    ...
  </TabsContent>
</Tabs>
```

### Loading Spinner
```jsx
// Full-page loader
<div className="animate-spin rounded-full h-8 w-8 border border-gray-200 border-t-black mx-auto" />

// Section loader
<div className="inline-block w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
```

### Empty States
```jsx
<div className="flex justify-center items-center h-80">
  <p className="text-gray-500">No items available.</p>
</div>
```

### Section Headers
```jsx
<div className="text-center mb-12"> {/* or mb-20 for more breathing room */}
  <h2 className="text-[clamp(1.75rem,5vw,3.5rem)] font-display font-light text-black mb-8 tracking-tight">
    Section Title
  </h2>
  <p className="text-[clamp(1rem,2vw,1.25rem)] text-gray-500 max-w-xl mx-auto font-light leading-relaxed">
    Supporting description text.
  </p>
</div>
```

---

## Motion (Framer Motion)

### Animation Variants (reuse these exactly)

```ts
// Staggered container
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

// Fade + slide up child
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

// Card entrance (scale + fade)
const cardVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5 },
  },
  hover: {
    y: -10,
    scale: 1.02,
    transition: { duration: 0.3 },
  },
};
```

### Section Entrance (whileInView)
```jsx
<motion.div
  initial={{ opacity: 0, y: 30 }}
  whileInView={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6 }}
  viewport={{ once: true }}
>
```

### Page Entrance (animate on mount)
```jsx
<motion.div
  initial={{ opacity: 0, x: -50 }}
  animate={{ opacity: 1, x: 0 }}
  transition={{ duration: 0.8 }}
>
```

### Button Micro-interactions
```jsx
// Wrap every button in:
<motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
  <Button>...</Button>
</motion.div>
```

### Card Hover
```jsx
<motion.div whileHover={{ y: -5, scale: 1.02 }}>
  {/* card content */}
</motion.div>
```

### Inline Text Hover
```jsx
<motion.h3 whileHover={{ x: 2 }}>
  {title}
</motion.h3>
```

### Scroll-triggered opacity (inline style)
```jsx
// For elements that use useInView
style={{
  opacity: isInView ? 1 : 0,
  transform: isInView ? "translateY(0)" : "translateY(40px)",
  transition: "opacity 0.6s ease, transform 0.6s ease",
}}
```

---

## Icons

All icons come from `lucide-react`. Standard sizing:

| Size | Class | Use |
|---|---|---|
| Small / inline | `h-4 w-4` | Button icons, input adornments, label icons |
| Medium | `h-5 w-5` | Card actions, tab icons, nav |
| Large | `h-8 w-8` | Feature icons |
| Display | `h-12 w-12` | Empty state, loading |

Icon color defaults: `text-gray-400` (inactive), `text-black` (active), context-specific colors for semantic use (e.g., `text-yellow-400` for stars).

---

## Interaction Patterns

### Hover States
- Cards: `hover:shadow-xl transition-shadow`
- Images in cards: `group-hover:scale-105 transition-transform duration-300`
- Text links: `hover:text-emerald-600 transition-colors` or `hover:opacity-70`
- Buttons: always wrapped in `motion.div` with `whileHover={{ y: -2 }}`

### Focus States
- Inputs: `focus:ring-2 focus:ring-black/20`
- Never use default browser outline

### Transitions
- Standard: `transition-all duration-300`
- Slow/gradient: `transition-all duration-500`
- Color only: `transition-colors`
- Shadow only: `transition-shadow`

---

## Do's and Don'ts

| ✅ Do | ❌ Don't |
|---|---|
| Use `font-light` for all text by default | Use `font-bold` on body copy |
| Use `clamp()` for hero/section headings | Use fixed `text-3xl` on headings without responsive override |
| Use `border-0 shadow-lg` for cards | Use heavy borders on cards |
| Wrap buttons in `motion.div` for micro-interactions | Apply motion directly to `<Button>` |
| Use `viewport={{ once: true }}` on scroll animations | Let animations replay on scroll |
| Use `line-clamp-2` or `line-clamp-3` on card excerpts | Let text overflow cards |
| Use `max-w-xl mx-auto` on subtitle paragraphs | Let subtitle text span full width |
| Default background to `bg-white` | Use gray/neutral page backgrounds except where needed |
