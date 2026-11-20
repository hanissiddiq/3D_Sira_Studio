"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDict } from "@/components/layout/LanguageProvider";
import { useCartHydrated, useCartStore } from "@/hooks/useCart";
import { useDebounce } from "@/hooks/useDebounce";
import { computeTotals, type Tier } from "@/lib/pricing";
import { PROVINCES } from "@/lib/provinces";
import { formatRupiah } from "@/lib/utils";
import { checkoutFormSchema, type CheckoutFormValues, type CreateOrderInput } from "@/lib/validations/order";
import { checkoutAction } from "@/app/(storefront)/checkout/actions";
import { BulkDiscountBanner } from "./BulkDiscountBanner";
import { CartSummary } from "./CartSummary";

interface ShippingOption { courier: string; service: string; label: string; cost: number; etaDays: string }

function FieldError({ msg }: { msg?: string }) {
  return msg ? <p className="text-sm text-red-600">{msg}</p> : null;
}

export function CheckoutForm({ tiers }: { tiers: Tier[] }) {
  const t = useDict().checkout;
  const tc = useDict().cart;
  const items = useCartStore((s) => s.items);
  const clear = useCartStore((s) => s.clear);
  const hydrated = useCartHydrated();
  const totals = computeTotals(items, tiers);

  const [options, setOptions] = useState<ShippingOption[]>([]);
  const [loadingRates, setLoadingRates] = useState(false);
  const [ratesError, setRatesError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState<{ orderCode: string; total: number } | null>(null);
  const [isPending, startTransition] = useTransition();

  const { register, handleSubmit, watch, setValue, formState: { errors } } =
    useForm<CheckoutFormValues>({
      resolver: zodResolver(checkoutFormSchema),
      defaultValues: { name: "", email: "", phone: "", address: "", city: "", province: "", postalCode: "", shippingKey: "" },
    });

  const province = watch("province");
  const shippingKey = watch("shippingKey");
  const debouncedProvince = useDebounce(province, 300);

  // Ongkir dihitung server berdasarkan provinsi + berat; muat ulang jika isi keranjang berubah
  const rateItems = useMemo(
    () => items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
    [items],
  );
  const rateKey = JSON.stringify(rateItems);

  useEffect(() => {
    if (!debouncedProvince || rateItems.length === 0) { setOptions([]); return; }
    const ctrl = new AbortController();
    setLoadingRates(true); setRatesError(null);
    fetch("/api/shipping/rates", {
      method: "POST", headers: { "Content-Type": "application/json" }, signal: ctrl.signal,
      body: JSON.stringify({ province: debouncedProvince, items: rateItems }),
    })
      .then((r) => r.json())
      .then((json) => {
        if (!json.ok) throw new Error(json.error ?? "Gagal menghitung ongkir.");
        setOptions(json.options);
        setValue("shippingKey", "");
      })
      .catch((e) => { if (e.name !== "AbortError") { setOptions([]); setRatesError(e.message); } })
      .finally(() => { if (!ctrl.signal.aborted) setLoadingRates(false); });
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedProvince, rateKey]);

  const selected = options.find((o) => `${o.courier}:${o.service}` === shippingKey) ?? null;

  const onSubmit = (v: CheckoutFormValues) => {
    if (!selected) return;
    setFormError(null);
    const input: CreateOrderInput = {
      customer: { name: v.name, email: v.email, phone: v.phone },
      shipping: {
        address: v.address, city: v.city, province: v.province, postalCode: v.postalCode,
        courier: selected.courier, service: selected.service,
      },
      items: items.map((i) => ({
        productId: i.productId, quantity: i.quantity,
        customization: {
          primaryColor: i.customization.primaryColor, secondaryColor: i.customization.secondaryColor,
          text: i.customization.text, font: i.customization.font,
          logoPath: i.customization.logoPath, snapshotPath: i.customization.snapshotPath,
        },
      })),
    };
    startTransition(async () => {
      const res = await checkoutAction(input);
      if (res.ok) { clear(); setDone({ orderCode: res.orderCode, total: res.total }); }
      else setFormError(res.error);
    });
  };

  if (done) {
    return (
      <Card className="mx-auto max-w-lg">
        <CardHeader><CardTitle>{t.doneTitle}</CardTitle></CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p>{t.yourCode}</p>
          <p className="rounded-md bg-muted p-3 text-center font-mono text-xl font-semibold">{done.orderCode}</p>
          <p>{t.payTotal} <span className="font-semibold">{formatRupiah(done.total)}</span></p>
          <p className="text-muted-foreground">
            {t.pendingNote}
          </p>
          <Button asChild className="w-full"><Link href="/orders">{t.track}</Link></Button>
        </CardContent>
      </Card>
    );
  }

  if (!hydrated) return <p className="text-sm text-muted-foreground">{t.loading}</p>;
  if (items.length === 0) {
    return (
      <div className="space-y-4 py-12 text-center">
        <p className="text-muted-foreground">{tc.empty}</p>
        <Button asChild><Link href="/product">{tc.browse}</Link></Button>
      </div>
    );
  }

  const input = "flex h-9 w-full rounded-md border bg-background px-3 text-sm";
  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle>{t.orderer}</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5"><Label htmlFor="name">{t.fullName}</Label>
              <Input id="name" autoComplete="name" {...register("name")} /><FieldError msg={errors.name?.message} /></div>
            <div className="space-y-1.5"><Label htmlFor="phone">{t.phone}</Label>
              <Input id="phone" type="tel" autoComplete="tel" placeholder="08xxxxxxxxxx" {...register("phone")} /><FieldError msg={errors.phone?.message} /></div>
            <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="email">{t.email}</Label>
              <Input id="email" type="email" autoComplete="email" {...register("email")} /><FieldError msg={errors.email?.message} /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{t.addressTitle}</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="address">{t.fullAddress}</Label>
              <textarea id="address" rows={3} autoComplete="street-address" {...register("address")}
                className="flex w-full rounded-md border bg-background px-3 py-2 text-sm" /><FieldError msg={errors.address?.message} /></div>
            <div className="space-y-1.5"><Label htmlFor="province">{t.province}</Label>
              <select id="province" {...register("province")} className={input}>
                <option value="">{t.chooseProvince}</option>
                {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select><FieldError msg={errors.province?.message} /></div>
            <div className="space-y-1.5"><Label htmlFor="city">{t.city}</Label>
              <Input id="city" autoComplete="address-level2" {...register("city")} /><FieldError msg={errors.city?.message} /></div>
            <div className="space-y-1.5"><Label htmlFor="postalCode">{t.postal}</Label>
              <Input id="postalCode" inputMode="numeric" maxLength={5} autoComplete="postal-code" {...register("postalCode")} /><FieldError msg={errors.postalCode?.message} /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{t.shipping}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {!province && <p className="text-sm text-muted-foreground">{t.pickProvince}</p>}
            {loadingRates && <p className="text-sm text-muted-foreground">{t.calcShipping}</p>}
            {ratesError && <p role="alert" className="text-sm text-red-600">{ratesError}</p>}
            {options.map((o) => {
              const key = `${o.courier}:${o.service}`;
              return (
                <label key={key} className="flex cursor-pointer items-center justify-between rounded-md border p-3 text-sm has-[:checked]:border-primary">
                  <span className="flex items-center gap-3">
                    <input type="radio" value={key} {...register("shippingKey")} />
                    <span>{o.label} <span className="text-muted-foreground">· {t.eta(o.etaDays)}</span></span>
                  </span>
                  <span className="font-medium">{formatRupiah(o.cost)}</span>
                </label>
              );
            })}
            <FieldError msg={errors.shippingKey?.message} />
          </CardContent>
        </Card>
      </div>

      <Card className="h-fit lg:sticky lg:top-20">
        <CardHeader><CardTitle>{t.summary}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-2 text-sm">
            {items.map((i) => (
              <li key={i.id} className="flex justify-between gap-2">
                <span className="truncate">{i.quantity}× {i.name}</span>
              </li>
            ))}
          </ul>
          <BulkDiscountBanner tiers={tiers} totalQty={totals.totalQty}
            discountPercent={totals.discountPercent} nextTier={totals.nextTier} />
          <CartSummary subtotal={totals.subtotal} discount={totals.discount}
            discountPercent={totals.discountPercent} shippingCost={selected?.cost ?? null} total={totals.total} />
          {formError && <p role="alert" className="text-sm text-red-600">{formError}</p>}
          <Button type="submit" className="w-full" disabled={isPending || !selected}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {t.createOrder}
          </Button>
          <p className="text-xs text-muted-foreground">{t.finalNote}</p>
        </CardContent>
      </Card>
    </form>
  );
}
