# Norshell Website Implementation Prompt

> **Task:** Adapt the supplied `e-commerce_demo-main.zip` project into a production-ready, responsive **Norshell** leather-goods storefront. Preserve useful working project infrastructure from the ZIP, but replace its storefront experience, data model, styling, copy, and interactions to meet this brief.

## Role and Objective

You are a senior full-stack product designer and engineer. Build **Norshell**, a premium leather-goods brand website with a calm, contemporary luxury-editorial look. Use the supplied Ralph Lauren Collection page only as a high-level reference for pacing, editorial composition, image-led storytelling, immersive section transitions, and restrained motion. Do **not** copy its source code, text, product imagery, logos, brand identifiers, proprietary assets, or exact page composition. Write all brand copy and interface text originally for Norshell.

The finished application must combine a public-facing leather-products storefront with a secure, authenticated, role-protected administration area. The administrator must control all storefront content, product inventory, images, categories, editorial highlights, homepage quote, brand story, and the global Messenger purchase destination.

## Design Direction

Create an elegant, polished visual system using a palette of **warm light gray, saddle brown, deep espresso brown, and white**. The design should feel tactile, quiet, and considered rather than flashy. Use substantial editorial typography for headings, a clean readable sans-serif for operational UI, generous whitespace, close-up leather texture photography, full-bleed image moments, and precisely controlled alignment.

The public website should be responsive from small mobile screens through large desktop displays. Use an editorial rhythm of wide visual panels, carefully sized text blocks, product grids, and occasional asymmetric compositions. Add refined scroll and hover behavior: image crops may subtly shift, text may reveal softly, cards may lift almost imperceptibly, and buttons may have a crisp press response. Keep ordinary interface motion under 300ms, respect `prefers-reduced-motion`, and avoid distracting parallax, large bouncing effects, or animation that blocks reading or shopping.

## Public Storefront Requirements

Build the public website around the following sections and routes. All public content must be read from the database; the page must display appropriate loading, empty, and error states.

| Area | Requirements |
|---|---|
| Header and navigation | Provide a minimal, responsive header with the Norshell wordmark, collection navigation, story/highlights links, and an inconspicuous admin entry point. Use a mobile menu that is keyboard accessible. |
| Hero and editorial introduction | Use original Norshell copy that introduces crafted leather goods. Feature a large editorial image area, a concise seasonal statement, and a link that scrolls or routes to the collection. |
| Collection | Display available products in categories managed by the administrator. Each product card must show its image, name, optional short material line, and price. Include product detail pages or dialogs with fuller copy, multiple images if available, category, material, and care notes. |
| Product purchase action | Each **available** product must show exactly one primary **Buy Now** action. This action must open the single global Messenger URL configured by the administrator, in a new tab with safe link attributes. Do not provide an Add to Cart, cart count, checkout, wish list, quantity selector, or any other competing purchase action. |
| Highlights | Show image-led editorial highlight cards or a section that the administrator can edit. The administrator must be able to replace highlight imagery, headline, label, and supporting copy. |
| Brand story | Present an original Norshell brand story in an editorial text-and-image section. The administrator must be able to update the quote, story heading, body text, and associated image. |
| Upcoming products | Add a distinct upcoming-products area. Upcoming products are visible for discovery but must clearly be marked **Coming Soon** and must not display a Buy Now action. |
| Payment information | Display Cash on Delivery, bKash, and SSLCommerz as disabled, clearly labelled **Coming Soon** payment options. Do not integrate payment APIs, SDKs, checkout, transaction forms, or live payment processing. |
| Footer | Include concise original brand copy, collection anchors, the relevant payment-coming-soon notice, social/contact placeholders only when actual links exist, and the admin entry link. |

## Content and Commerce Rules

The site sells leather products only. Use original Norshell sample product names and copy during initial setup, but ensure all content can be changed from the dashboard. Never invent customer reviews, star ratings, testimonials, purchase counts, stock urgency messages, or social-proof claims.

The global Messenger URL is the only buying destination. It must be stored in the site settings table, editable by an administrator, validated as a secure `https://` URL, and used consistently by all available-product Buy Now actions. A product may have an `available` or `upcoming` status. Available products have exactly one Buy Now action. Upcoming products have no Buy Now action.

## Admin Authentication and Authorization

Provide a dedicated `/admin/login` route for administrator sign-in and an `/admin` dashboard route. Authentication must use the supplied application’s authentication system. Protect all dashboard routes and all write operations on the server. A public visitor or a signed-in non-admin user must be unable to read private dashboard data or create, update, delete, or upload content.

Use a clear role model. Only users with the `admin` role may access the dashboard. The project owner may be provisioned as the initial administrator according to the existing application authentication configuration. Unauthenticated users should be redirected from private routes to `/admin/login`; unauthorized users should receive a clear access-denied state.

## Admin Dashboard Requirements

Use a practical, responsive dashboard layout with a persistent desktop sidebar and mobile navigation. Keep the dashboard visually consistent with the Norshell design system, but prioritize clarity and efficiency over editorial spectacle.

| Dashboard module | Administrator capabilities |
|---|---|
| Overview | Show concise counts for available products, upcoming products, categories, and highlights. |
| Products | Create, edit, delete, search, and filter products. Fields should include name, slug, category, price, material, short description, full description, care details, display order, status, and images. Include validation and confirmation before destructive deletion. |
| Categories | Create, edit, reorder, and delete categories. Prevent deletion or guide reassignment when a category is still used by products. |
| Highlights | Create, edit, reorder, and delete editorial highlight entries, including image, eyebrow, heading, and body copy. |
| Brand story | Update the homepage quote, attribution if desired, story heading, body copy, and editorial image. |
| Store settings | View and edit the global Messenger purchase link. Validate the URL before saving. Clearly explain that every product Buy Now action uses this single link. |
| Media upload | Upload product, highlight, and editorial images to secure managed file storage. Validate MIME type and practical file size, generate safe unique storage keys, save only file metadata and URLs in the database, and show thumbnails with replace/remove actions. Do not store raw file bytes in database columns. |

## Data Model and Backend Requirements

Use the project’s existing server, authentication, database, and storage patterns. Extend the database with normalized tables such as `categories`, `products`, `productImages`, `highlights`, `brandStory`, and `storeSettings`. Include timestamps and ordering fields where useful. Make the product slug unique, associate products with categories, and apply referential integrity appropriate to the selected database.

Implement authenticated admin-only server procedures or endpoints for all dashboard mutations. Public read endpoints/procedures must expose only active storefront content. Validate every input server-side with schemas, normalize data as necessary, return useful error messages, and avoid trusting client-supplied role values.

Use secure managed file storage for image uploads. Store each uploaded image using a meaningful namespaced key, for example `products/<product-id>/<generated-filename>`, and save its URL, key, alt text, and display order in the database. Ensure public product images render with meaningful alt text and that image replacement removes or supersedes obsolete references safely.

## Engineering and Quality Standards

First inspect the ZIP and retain compatible existing components where they serve the brief. Do not rewrite infrastructure without reason. Follow the existing stack conventions, use typed server-client contracts, and keep database schema, migrations, server queries, and UI synchronized.

Create accessible forms, buttons, menus, dialogs, status labels, and keyboard navigation. Use semantic heading hierarchy, visible focus states, labels for controls, meaningful image alternatives, sensible contrast, and responsive layouts. Account for loading, no-content, failed-image, validation, authentication, and API error states.

Add automated tests for key server-side authorization and content-management rules. At minimum, verify that non-admin users cannot mutate products/settings; that only available products expose the Messenger destination; that the global Messenger URL is validated and used for Buy Now; and that upcoming products never show a Buy Now action. Run the project type check and tests before presenting the completed work.

## Deliverables

Provide the updated source project with database migrations, secure storage integration, public storefront, protected admin dashboard, responsive styling, and automated tests. Include a short README section that explains how to grant the first user the `admin` role, configure the global Messenger URL, upload images, and manage products/categories/highlights. Clearly state that Cash on Delivery, bKash, and SSLCommerz are visual coming-soon options only and are not connected to payment processing.

## Acceptance Criteria

The work is complete when the following conditions are all true:

1. The supplied ZIP is adapted into a responsive Norshell leather-only storefront with original content and a light gray, brown, and white luxury-editorial identity.
2. The public experience includes product collection/category browsing, product details, highlights, brand story, and upcoming products.
3. Every available product has exactly one Buy Now action that opens the administrator-configured global Messenger URL; no cart or active payment flow exists.
4. Cash on Delivery, bKash, and SSLCommerz appear only as clearly marked coming-soon options.
5. Only authenticated `admin` users can access the dashboard or modify products, categories, images, highlights, brand story, or store settings.
6. Product and editorial content persists in the database, while uploaded images use secure managed file storage with URL/key metadata stored in the database.
7. The admin can create, edit, delete, categorize, and mark products as upcoming; replace highlight imagery; update quote/story content; and edit the global Messenger link.
8. The project passes type checking and automated tests, and the user interface has been checked at mobile and desktop sizes.
