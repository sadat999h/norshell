import { ArrowDownRight, ArrowUpRight, CircleArrowRight, Loader2, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "wouter";
import AnimatedContent from "@/components/AnimatedContent";
import ScrollReveal from "@/components/ScrollReveal";
import { trpc } from "@/lib/trpc";
import { filterCollectionProducts, getProductPurchaseUrl } from "@shared/storefront";

const priceFormatter = new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT", maximumFractionDigits: 0 });

export default function Home() {
  const { data, isLoading, isError } = trpc.storefront.get.useQuery();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeCollectionFilter, setActiveCollectionFilter] = useState<number | "all" | "upcoming">("all");
  const heroSlides = (data?.highlights ?? []).filter(highlight => highlight.imageUrl);
  const [heroSlideIndex, setHeroSlideIndex] = useState(0);

  // Auto-advance the hero slideshow every 5s when there's more than one image.
  useEffect(() => {
    if (heroSlides.length < 2) return;
    const timer = setInterval(() => {
      setHeroSlideIndex(index => (index + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  if (isLoading) {
    return <div className="min-h-screen grid place-items-center bg-[#f4f1ed]"><Loader2 className="animate-spin text-[#6d513f]" /></div>;
  }

  if (isError) {
    return <main className="min-h-screen grid place-items-center bg-[#f4f1ed] p-6 text-center"><div><p className="ns-label">Norshell</p><h1 className="ns-display mt-4 text-5xl">The collection is resting.</h1><p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-[#66584f]">We could not load the current storefront. Please refresh the page in a moment.</p><button onClick={() => window.location.reload()} className="ns-buy-button mt-8">Refresh collection</button></div></main>;
  }

  const highlights = data?.highlights ?? [];
  const available = data?.products.filter(product => product.status === "available") ?? [];
  const filterableCategories = (data?.categories ?? []).filter(category => available.some(product => product.categoryId === category.id));
  const upcoming = data?.products.filter(product => product.status === "upcoming") ?? [];
  const filteredCollection = filterCollectionProducts(data?.products ?? [], activeCollectionFilter);
  const story = data?.brandStory;
  const messengerUrl = data?.settings?.messengerUrl || "https://m.me/";

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f5f3ef] text-[#211c18]">
      <header className="absolute inset-x-0 top-0 z-30 flex items-center justify-between bg-[#0b1a3d] px-5 py-6 text-white sm:px-8 lg:px-12">
        <a href="#collection" className="hidden text-xs uppercase tracking-[.18em] lg:block">Collection</a>
        <Link href="/" className="font-serif text-[1.7rem] tracking-[-0.07em] sm:text-3xl">NORSHELL</Link>
        <div className="hidden items-center gap-7 lg:flex"><a href="#story" className="text-xs uppercase tracking-[.18em]">Story</a><Link href="/admin" className="text-xs uppercase tracking-[.18em]">Admin</Link></div>
        <button onClick={() => setMenuOpen(value => !value)} className="grid h-10 w-10 place-items-center lg:hidden" aria-label="Toggle navigation">{menuOpen ? <X /> : <Menu />}</button>
      </header>
      {menuOpen ? <nav className="fixed inset-0 z-20 flex flex-col justify-center gap-7 bg-white px-9 text-4xl text-black lg:hidden"><a onClick={() => setMenuOpen(false)} href="#collection">Collection</a><a onClick={() => setMenuOpen(false)} href="#story">Story</a><Link onClick={() => setMenuOpen(false)} href="/admin">Admin</Link></nav> : null}

      <section className="relative min-h-[min(760px,100svh)] overflow-hidden bg-[#4a3325] text-white">
        {heroSlides.length ? heroSlides.map((slide, index) => (
          <img
            key={slide.id}
            src={slide.imageUrl}
            alt={slide.altText || "Norshell leather collection"}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ease-in-out ${index === heroSlideIndex % heroSlides.length ? "opacity-80" : "opacity-0"}`}
          />
        )) : null}
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/5 to-black/35" />
        {heroSlides.length > 1 ? (
          <div className="absolute inset-x-0 bottom-6 z-10 flex justify-center gap-2 sm:bottom-8">
            {heroSlides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => setHeroSlideIndex(index)}
                aria-label={`Show slide ${index + 1}`}
                aria-current={index === heroSlideIndex % heroSlides.length}
                className={`h-1.5 rounded-full transition-all ${index === heroSlideIndex % heroSlides.length ? "w-6 bg-white" : "w-1.5 bg-white/40"}`}
              />
            ))}
          </div>
        ) : null}
        <div className="relative flex min-h-[min(760px,100svh)] flex-col justify-end px-5 pb-8 pt-32 sm:px-8 sm:pb-10 lg:px-12 lg:pb-14">
          <p className="ns-label text-white/75">Quietly carried</p>
          <div className="mt-5 flex flex-col justify-between gap-8 lg:flex-row lg:items-end"><h1 className="max-w-3xl font-serif text-[clamp(3.75rem,8.4vw,8.25rem)] leading-[.78] tracking-[-.075em]">Leather goods<br /><i className="font-normal">for the in-between.</i></h1><a href="#collection" className="ns-round-link self-start lg:self-auto">Explore the collection <ArrowDownRight size={19} /></a></div>
        </div>
      </section>


      <main>
        <section id="collection" className="px-5 py-24 sm:px-8 lg:px-12 lg:py-32"><div className="mx-auto max-w-7xl"><div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="ns-label">The collection</p><h2 className="ns-display mt-4 text-5xl sm:text-6xl">The daily edit.</h2></div><p className="max-w-xs text-sm leading-6 text-[#66584f]">Thoughtful shapes, tactile finishes, and a measure of room for the essentials.</p></div>
          {available.length ? <><div className="mb-10 flex flex-wrap items-center gap-2" role="group" aria-label="Filter the collection"><button type="button" aria-pressed={activeCollectionFilter === "all"} onClick={() => setActiveCollectionFilter("all")} className={`border px-4 py-2 text-[10px] font-semibold uppercase tracking-[.14em] transition ${activeCollectionFilter === "all" ? "border-[#3f2b20] bg-[#3f2b20] text-white" : "border-[#211c18]/15 bg-white text-[#66584f] hover:border-[#3f2b20]"}`}>All pieces <span className="ml-1 opacity-60">{available.length}</span></button>{filterableCategories.map(category => <button type="button" key={category.id} aria-pressed={activeCollectionFilter === category.id} onClick={() => setActiveCollectionFilter(category.id)} className={`border px-4 py-2 text-[10px] font-semibold uppercase tracking-[.14em] transition ${activeCollectionFilter === category.id ? "border-[#3f2b20] bg-[#3f2b20] text-white" : "border-[#211c18]/15 bg-white text-[#66584f] hover:border-[#3f2b20]"}`}>{category.name} <span className="ml-1 opacity-60">{available.filter(product => product.categoryId === category.id).length}</span></button>)}{upcoming.length ? <button type="button" aria-pressed={activeCollectionFilter === "upcoming"} onClick={() => setActiveCollectionFilter("upcoming")} className={`border px-4 py-2 text-[10px] font-semibold uppercase tracking-[.14em] transition ${activeCollectionFilter === "upcoming" ? "border-[#3f2b20] bg-[#3f2b20] text-white" : "border-[#211c18]/15 bg-white text-[#66584f] hover:border-[#3f2b20]"}`}>Upcoming <span className="ml-1 opacity-60">{upcoming.length}</span></button> : null}</div>
          {filteredCollection.length ? <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">{filteredCollection.map((product, index) => { const image = product.images[0]; const purchaseUrl = getProductPurchaseUrl(product.status, messengerUrl); return <article key={product.id} className={`group ${index === 1 && filteredCollection.length > 1 ? "lg:mt-20" : ""}`}><Link href={`/products/${product.slug}`} className="block overflow-hidden bg-[#ded6cc]"><div className="aspect-[4/5] overflow-hidden">{image ? <img src={image.url} alt={image.altText || product.name} className={`h-full w-full object-cover transition duration-700 ease-[cubic-bezier(.23,1,.32,1)] group-hover:scale-[1.035] ${product.status === "upcoming" ? "grayscale-[15%]" : ""}`} /> : null}</div></Link><div className="mt-4 grid grid-cols-[1fr_auto] gap-4"><div><Link href={`/products/${product.slug}`} className="font-serif text-2xl tracking-[-.04em] hover:underline">{product.name}</Link><p className="mt-1 text-xs text-[#77675c]">{product.material}</p></div><p className="pt-1 text-sm">{product.price !== null ? priceFormatter.format(product.price) : ""}</p></div>{purchaseUrl ? <a href={purchaseUrl} target="_blank" rel="noreferrer" className="ns-buy-button mt-5">Buy Now <ArrowUpRight size={16} /></a> : <span className="mt-5 inline-flex border border-[#211c18]/20 px-3 py-2 text-[10px] font-semibold uppercase tracking-[.14em] text-[#80614d]">Coming soon</span>}</article>; })}</div> : <div className="border-y border-[#211c18]/15 py-10 text-sm text-[#66584f]">No pieces are in this filter yet. <button type="button" onClick={() => setActiveCollectionFilter("all")} className="ml-2 underline underline-offset-4">View all pieces</button></div>}</> : <div className="border-y border-[#211c18]/15 py-10 text-sm text-[#66584f]">The current collection is being prepared.</div>}</div></section>

        {highlights.length ? <section className="bg-[#3e2c22] px-5 py-24 text-[#f5f1eb] sm:px-8 lg:px-12 lg:py-32"><div className="mx-auto max-w-7xl">{highlights.map((highlight, index) => <article key={highlight.id} className={`grid gap-10 ${index ? "mt-24 lg:grid-cols-[.85fr_1.15fr]" : "lg:grid-cols-[1.15fr_.85fr]"} lg:items-center lg:gap-20`}><div className={index ? "lg:order-2" : ""}><AnimatedContent direction="horizontal" reverse={!index} distance={120} duration={1} ease="power3.out" threshold={0.2} className="block w-full"><img src={highlight.imageUrl} alt={highlight.altText || highlight.heading} className="aspect-[4/5] w-full object-cover" /></AnimatedContent></div><div className={index ? "lg:order-1" : ""}><p className="ns-label text-[#d5b8a2]">{highlight.eyebrow || "Norshell"}</p><ScrollReveal containerClassName="!m-0 mt-5" textClassName="ns-display max-w-md !text-5xl !leading-[.93] sm:!text-6xl !font-normal" baseOpacity={0.15} baseRotation={2} blurStrength={6} enableBlur>{highlight.heading}</ScrollReveal><p className="mt-7 max-w-sm text-[15px] leading-7 text-[#eee4db]/75">{highlight.body}</p><a href="#story" className="ns-text-link mt-8 text-[#f5f1eb]">Our point of view <CircleArrowRight size={16} /></a></div></article>)}</div></section> : null}

        {story ? <section id="story" className="grid bg-[#e4ded6] lg:grid-cols-2"><div className="min-h-[60vh] overflow-hidden"><AnimatedContent direction="horizontal" reverse distance={120} duration={1} ease="power3.out" threshold={0.2} className="block h-full w-full"><img src={story.imageUrl} alt={story.altText || story.heading} className="h-full w-full object-cover" /></AnimatedContent></div><div className="flex items-center px-6 py-24 sm:px-12 lg:px-20"><div className="max-w-lg"><p className="ns-label">Norshell, in brief</p><ScrollReveal containerClassName="!m-0 mt-7" textClassName="font-serif !text-4xl !leading-[1.02] tracking-[-.045em] sm:!text-5xl !font-normal" baseOpacity={0.15} baseRotation={2} blurStrength={6} enableBlur>{`“${story.quote}”`}</ScrollReveal><p className="mt-5 text-xs uppercase tracking-[.16em] text-[#80614d]">{story.attribution || "Norshell"}</p><ScrollReveal containerClassName="!m-0 mt-16" textClassName="ns-display !text-4xl sm:!text-5xl !font-normal" baseOpacity={0.15} baseRotation={2} blurStrength={6} enableBlur>{story.heading}</ScrollReveal><p className="mt-6 text-[15px] leading-7 text-[#5d5048]">{story.body}</p></div></div></section> : null}

        <section className="px-5 py-24 sm:px-8 lg:px-12 lg:py-32"><div className="mx-auto max-w-7xl"><div className="mb-12 flex items-end justify-between"><div><p className="ns-label">Arriving next</p><h2 className="ns-display mt-4 text-5xl sm:text-6xl">On the horizon.</h2></div><span className="hidden text-xs uppercase tracking-[.15em] text-[#80614d] sm:block">Watch this space</span></div><div className="grid gap-6 sm:grid-cols-2">{upcoming.map(product => { const image = product.images[0]; return <article key={product.id} className="border-t border-[#211c18]/20 pt-5"><div className="overflow-hidden bg-[#ded6cc]">{image ? <img src={image.url} alt={image.altText || product.name} className="aspect-[16/10] w-full object-cover grayscale-[10%]" /> : null}</div><div className="mt-4 flex items-start justify-between gap-5"><div><h3 className="font-serif text-3xl tracking-[-.04em]">{product.name}</h3><p className="mt-1 text-sm text-[#77675c]">{product.shortDescription}</p></div><span className="shrink-0 border border-[#211c18]/20 px-3 py-1.5 text-[10px] uppercase tracking-[.14em]">Coming soon</span></div></article>; })}</div></div></section>

      </main>
      <footer className="bg-[#211914] px-5 py-10 text-[#f5f1eb] sm:px-8 lg:px-12"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-7 sm:flex-row sm:items-end"><div><p className="font-serif text-4xl tracking-[-.06em]">NORSHELL</p><p className="mt-3 max-w-xs text-sm leading-6 text-[#f5f1eb]/60">Leather goods for the considered everyday.</p></div><div className="flex gap-6 text-xs uppercase tracking-[.14em] text-[#f5f1eb]/70"><a href="#collection">Collection</a><a href="#story">Story</a><Link href="/admin">Admin</Link></div></div></footer>
    </div>
  );
}
