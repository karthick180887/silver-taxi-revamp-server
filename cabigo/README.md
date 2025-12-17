# Cabigo - Programmatic SEO Taxi Booking Website

A modern, SEO-optimized taxi booking website built with Next.js 15, TypeScript, and CSS Modules. This project demonstrates programmatic SEO best practices while avoiding Google's spam policy violations.

## 🚀 Features

- **Programmatic Pages**: Dynamic city and route pages generated from data
- **SEO Optimized**: Unique content, JSON-LD schema, sitemap, robots.txt
- **Premium UI**: Dark theme with gradients, glassmorphism, and animations
- **Accessible**: Semantic HTML, skip links, keyboard navigation
- **Performance**: Optimized build, minimal JavaScript, CSS Modules
- **Type-Safe**: Full TypeScript implementation

## 📂 Project Structure

```
cabigo/
├── app/
│   ├── globals.css         # Design system & global styles
│   ├── layout.tsx          # Root layout with SEO metadata
│   ├── page.tsx            # Homepage
│   ├── sitemap.ts          # Dynamic sitemap generator
│   ├── robots.ts           # Robots.txt configuration
│   ├── not-found.tsx       # Custom 404 page
│   ├── locations/          # Locations hub page
│   ├── routes/             # Routes hub page
│   ├── taxi-in-[city]/     # Dynamic city pages
│   ├── taxi-[slug]/        # Dynamic route pages
│   ├── about/              # About page (E-E-A-T signals)
│   └── contact/            # Contact page
├── components/
│   └── layout/
│       ├── Header.tsx      # Responsive header
│       └── Footer.tsx      # Footer with internal links
├── lib/
│   └── data/
│       ├── locations.ts    # City data model
│       └── routes.ts       # Route data model
└── public/                 # Static assets
```

## 🛡️ SEO Safety Compliance

This project follows Google's Search Essentials and avoids spam policy violations:

### ✅ No Doorway Pages
- Each page has **unique, substantial content** (local tips, scenic notes, FAQs)
- Pages serve distinct user intents (different cities, different routes)
- No near-duplicate pages with template-only differences

### ✅ No Scaled Content Abuse
- Data model includes rich, unique attributes per entity
- Each city has unique: description, local tips, landmarks, highlights
- Each route has unique: scenic notes, popular stops, price comparison

### ✅ No Keyword Stuffing
- Natural language throughout
- Keywords in appropriate places (title, H1, meta) without over-optimization
- Content reads naturally for users

### ✅ Helpful, People-First Content
- Practical information (pricing, duration, tips)
- About page with team info (E-E-A-T signals)
- Contact page with multiple channels
- FAQs answering real user questions

## 🔧 Technical SEO Implementation

| Feature | Implementation |
|---------|---------------|
| **Metadata** | Per-page unique titles and descriptions |
| **Canonical URLs** | Explicit canonicals on all pages |
| **Sitemap** | Dynamic `sitemap.ts` with all pages |
| **Robots.txt** | Configured via `robots.ts` |
| **JSON-LD Schema** | TaxiService, FAQPage, ItemList, Organization |
| **Open Graph** | Full OG and Twitter card support |
| **Breadcrumbs** | Semantic navigation on all inner pages |
| **404 Handling** | Custom not-found page |

## 📊 Page Types & Value Proposition

### Hub Pages (High-Quality Indexes)
- `/locations` - All cities with service summary
- `/routes` - All routes with quick comparison

### City Detail Pages (`/taxi-in-[city]`)
Unique content per city:
- City-specific description and highlights
- Local tips from "locals"
- Temperature and timezone info
- Airport/railway station codes
- Services with city-specific pricing
- FAQ with city-specific answers

### Route Detail Pages (`/taxi-[slug]`)
Unique content per route:
- Scenic notes describing the journey
- Distance, duration, road condition
- Toll information
- Popular stops on the way
- Price comparison with alternatives (train, bus, flight)
- Vehicle options with pricing
- Route-specific FAQ

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 🔍 Verification Commands

```bash
# Check build
npm run build

# Lint code
npm run lint

# Type check
npx tsc --noEmit
```

## 📈 Lighthouse Score Targets

- Performance: 90+
- Accessibility: 90+
- Best Practices: 90+
- SEO: 95+

## 🔮 Future Enhancements

1. **Booking API Integration**: Real booking functionality
2. **CMS Integration**: Headless CMS for content management
3. **More Cities**: Expand location database
4. **Blog**: Travel guides for additional SEO value
5. **User Reviews**: Real testimonials (when available)

## ⚠️ Deployment Notes

Before deploying to production:
1. Replace placeholder phone numbers with real ones
2. Update `metadataBase` URL in `layout.tsx`
3. Add real images to `/public/images/`
4. Set up Google Search Console verification
5. Configure analytics

## 📄 License

MIT License - Feel free to use this as a template for your own projects.
