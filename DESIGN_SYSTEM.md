# ProfSale Design System

## Visual Design Guidelines

### Color Palette

#### Primary Colors
- **Amber (Primary Action):** `#FBBF24` - Used for buttons, links, and key actions
- **Slate-950 (Dark Background):** `#030712` - Main dark background
- **White (Light Background):** `#FFFFFF` - Card and panel backgrounds

#### Semantic Colors
- **Success (Emerald):** `#10B981` - Positive states, confirmations
- **Warning (Amber):** `#F59E0B` - Alerts, low stock warnings
- **Danger (Rose):** `#F43F5E` - Errors, deletions, critical alerts
- **Info (Blue):** `#3B82F6` - Information, neutral actions

#### Neutral Colors
- **Slate-500:** `#64748B` - Secondary text, muted content
- **Slate-400:** `#94A3B8` - Borders, dividers
- **Slate-100:** `#F1F5F9` - Light backgrounds, subtle accents
- **Slate-50:** `#F8FAFC` - Very light backgrounds

### Typography

#### Font Stack
```css
font-family: system-ui, -apple-system, sans-serif;
```

#### Heading Styles
- **H1:** 3xl (30px), Semibold (600), Tracking-tight
- **H2:** 2xl (24px), Semibold (600), Tracking-tight
- **H3:** lg (18px), Semibold (600)
- **H4:** base (16px), Semibold (600)

#### Body Text
- **Large:** base (16px), Regular (400)
- **Normal:** sm (14px), Regular (400)
- **Small:** xs (12px), Regular (400)

#### Special Styles
- **Labels:** sm (14px), Semibold (600)
- **Captions:** xs (12px), Medium (500)
- **Muted:** xs (12px), Regular (400), Slate-500

### Spacing Scale

```
2px   (0.5 * 4px)
4px   (1 * 4px)
6px   (1.5 * 4px)
8px   (2 * 4px)
12px  (3 * 4px)
16px  (4 * 4px)
24px  (6 * 4px)
32px  (8 * 4px)
40px  (10 * 4px)
48px  (12 * 4px)
```

### Border Radius

- **Small:** 8px (rounded-lg)
- **Medium:** 12px (rounded-xl)
- **Large:** 16px (rounded-2xl)
- **Extra Large:** 24px (rounded-3xl)

### Shadows

#### Card Shadow
```css
box-shadow: 0 10px 15px -3px rgba(15, 23, 42, 0.1);
```

#### Hover Shadow
```css
box-shadow: 0 20px 25px -5px rgba(15, 23, 42, 0.1);
```

#### Deep Shadow
```css
box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.25);
```

### Component Patterns

#### Cards
```html
<div className="rounded-3xl border border-white/10 bg-white p-6 shadow-lg shadow-slate-900/5">
  <!-- Content -->
</div>
```

#### Buttons
```html
<!-- Primary Button -->
<button className="rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-3 font-semibold text-white transition hover:from-amber-600 hover:to-amber-700">
  Action
</button>

<!-- Secondary Button -->
<button className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-100">
  Action
</button>
```

#### Input Fields
```html
<input 
  type="text"
  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20"
  placeholder="Placeholder text"
/>
```

#### Status Badges
```html
<!-- Success -->
<span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
  ✓ Active
</span>

<!-- Warning -->
<span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
  ⚠️ Warning
</span>

<!-- Danger -->
<span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
  ❌ Error
</span>
```

### Responsive Breakpoints

```
Mobile:    < 640px
Tablet:    640px - 1024px
Desktop:   > 1024px
```

### Interaction Patterns

#### Hover States
- Cards: Increase shadow, slight border color change
- Buttons: Darken gradient, maintain shape
- Links: Change color to amber, underline on hover

#### Focus States
- Inputs: Amber border, ring effect, background change
- Buttons: Outline visible, maintained contrast
- Links: Underline, color change

#### Active States
- Navigation: White background, dark text
- Buttons: Darker gradient
- Tabs: Highlighted with accent color

### Animations

#### Transitions
- **Default:** 200ms ease
- **Slow:** 300ms ease
- **Fast:** 150ms ease

#### Common Animations
```css
transition: all 200ms ease;
transition: box-shadow 300ms ease;
transition: background-color 200ms ease;
transition: border-color 200ms ease;
```

### Accessibility

#### Color Contrast
- **Normal Text:** Minimum 4.5:1 contrast ratio
- **Large Text:** Minimum 3:1 contrast ratio
- **UI Components:** Minimum 3:1 contrast ratio

#### Focus Indicators
- Always visible
- Minimum 2px width
- Sufficient contrast (3:1 minimum)

#### Touch Targets
- Minimum 44x44px for interactive elements
- Proper spacing between touch targets

### Layout Patterns

#### Container
```html
<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
  <!-- Content -->
</div>
```

#### Grid Layouts
```html
<!-- 2 Column -->
<div className="grid grid-cols-1 gap-6 md:grid-cols-2">

<!-- 3 Column -->
<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

<!-- 4 Column -->
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
```

#### Flex Layouts
```html
<!-- Horizontal -->
<div className="flex items-center justify-between gap-4">

<!-- Vertical -->
<div className="flex flex-col gap-4">

<!-- Responsive -->
<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
```

## Implementation Notes

### Using the Design System
1. Always use Tailwind CSS classes for styling
2. Maintain consistent spacing using the scale
3. Use semantic colors for their intended purpose
4. Ensure proper contrast ratios for accessibility
5. Test responsive design on multiple devices
6. Use transitions for smooth interactions

### Best Practices
- Use `rounded-3xl` for card corners
- Use `rounded-2xl` for input/button corners
- Use `rounded-xl` for smaller components
- Use `shadow-lg shadow-slate-900/5` for cards
- Use `border-white/10` for subtle borders
- Use gradient buttons for primary actions
- Use proper spacing with gap and padding
- Always include hover states
- Test on mobile, tablet, and desktop

## Color Usage Examples

### Dashboard Cards
- Success: Emerald gradient
- Warning: Amber gradient
- Info: Blue gradient
- Neutral: Slate gradient

### Status Indicators
- Active/Success: Emerald
- Warning/Low: Amber
- Error/Critical: Rose
- Neutral: Slate

### Buttons
- Primary: Amber gradient
- Secondary: Slate background
- Danger: Rose background
- Success: Emerald background
