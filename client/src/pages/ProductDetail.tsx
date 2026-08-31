import { ArrowLeft, ArrowUpRight, Check, Loader2, Sparkles } from "lucide-react";
import { Link, useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { getProductPurchaseUrl } from "@shared/storefront";

const priceFormatter = new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT", maximumFractionDigits: 0 });

export default function ProductDetail() {
  const [, params] = useRoute("/products/:slug");
  const { data, isLoading, isError } = trpc.storefront.get.useQuery();
  const product = data?.products.find(item => item.slug === params?.slug);

  if (isLoading) {
    return <div className="min-h-screen grid place-items-center bg-[#f4f1ed]"><Loader2 className="animate-spin text-[#6d513f]" /></div>;
  }

  if (isError) {
    return <main className="min-h-screen grid place-items-center bg-[#f4f1ed] p-6 text-center"><div><p className="ns-label">Norshell collection</p><h1 className="ns-display mt-4 text-5xl">This page needs a moment.</h1><Link href="/" className="ns-text-link mt-8 inline-flex">Return to collection <ArrowLeft size={15} /></Link></div></main>;
  }

  if (!product) {
    return (
      <main className="min-h-screen grid place-items-center bg-[#f4f1ed] p-6 text-center">
        <div><p className="ns-label mb-5">Norshell collection</p><h1 className="ns-display text-5xl">This piece is not here.</h1><Link href="/" className="ns-text-link mt-8 inline-flex">Return to collection <ArrowLeft size={15} /></Link></div>
      </main>
    );
  }

  const image = product.images[0];
  const purchaseUrl = getProductPurchaseUrl(product.status, data?.settings?.messengerUrl);

  return (
    <main className="min-h-screen bg-[#f5f3ef] text-[#211c18]">
      <header className="flex items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
        <Link href="/" className="font-serif text-2xl tracking-[-0.05em]">NORSHELL</Link>
        <Link href="/#collection" className="ns-text-link"><ArrowLeft size={14} /> Collection</Link>
      </header>
      <section className="grid min-h-[calc(100vh-76px)] lg:grid-cols-[1.12fr_.88fr]">
        <div className="min-h-[55vh] bg-[#ddd4ca] lg:min-h-full">
          {image ? <img src={image.url} alt={image.altText || product.name} className="h-full w-full object-cover" /> : null}
        </div>
        <div className="flex items-center px-6 py-14 sm:px-10 lg:px-16">
          <div className="max-w-md">
            <p className="ns-label">{product.categoryName || "Leather goods"}</p>
            <h1 className="ns-display mt-5 text-5xl leading-[.92] sm:text-6xl">{product.name}</h1>
            <div className="mt-8 flex items-center justify-between border-y border-[#211c18]/15 py-4 text-sm"><span>{product.material || "Leather goods"}</span><span>{product.price !== null ? priceFormatter.format(product.price) : "Price on request"}</span></div>
            <p className="mt-8 text-[15px] leading-7 text-[#53483f]">{product.description || product.shortDescription}</p>
            {product.care ? <div className="mt-8 border-l border-[#9e765d] pl-4"><p className="ns-label">Care</p><p className="mt-2 text-sm leading-6 text-[#66584f]">{product.care}</p></div> : null}
            {purchaseUrl ? (
              <a href={purchaseUrl} target="_blank" rel="noreferrer" className="ns-buy-button mt-10">Buy Now <ArrowUpRight size={17} /></a>
            ) : (
              <div className="mt-10 inline-flex items-center gap-2 border border-[#211c18]/20 px-5 py-3 text-xs uppercase tracking-[.15em]"><Sparkles size={14} /> Coming soon</div>
            )}
            <div className="mt-12 flex items-center gap-2 text-xs text-[#66584f]"><Check size={14} className="text-[#8a624d]" /> Cash on Delivery, bKash, and SSLCommerz are coming soon.</div>
          </div>
        </div>
      </section>
    </main>
  );
}
