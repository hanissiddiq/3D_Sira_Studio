import { CartDrawer } from "@/components/cart/CartDrawer";
import { CartHydrator } from "@/components/cart/CartHydrator";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { getBulkTiers } from "@/lib/data";

export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const tiers = await getBulkTiers();
  return (
    <div className="flex min-h-svh flex-col">
      <CartHydrator />
      <Navbar />
      <div className="flex-1">{children}</div>
      <Footer />
      <CartDrawer tiers={tiers} />
    </div>
  );
}
