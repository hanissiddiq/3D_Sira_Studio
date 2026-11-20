"use client";

import { useEffect, useState } from "react";
import { Loader2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDict } from "@/components/layout/LanguageProvider";
import { useCartStore } from "@/hooks/useCart";
import { use3DSnapshot } from "@/hooks/use3DSnapshot";
import { makeThumbnail } from "@/lib/image";
import { uploadDesignAssets } from "@/lib/uploads";
import { formatRupiah } from "@/lib/utils";
import type { CustomizerConfig } from "@/lib/validations/product";
import { ColorPicker } from "./ColorPicker";
import { LogoUploader } from "./LogoUploader";
import { TextControls } from "./TextControls";
import { ThreeCanvasLazy } from "./ThreeCanvasLazy";
import type { FontKey } from "./ThreeCanvas";

interface Props {
  productId: string;
  slug: string;
  name: string;
  modelUrl: string | null;
  config: CustomizerConfig;
  basePrice: number;
  textFee: number;
  logoFee: number;
}

export function ProductCustomizer({ productId, slug, name, modelUrl, config, basePrice, textFee, logoFee }: Props) {
  const t = useDict().product;
  const [primary, setPrimary] = useState(config.primary.defaultColor);
  const [secondary, setSecondary] = useState(config.secondary.defaultColor);
  const [text, setText] = useState("");
  const [font, setFont] = useState<FontKey>("sans");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const { captureRef, capture } = use3DSnapshot();
  const addItem = useCartStore((s) => s.addItem);
  const openDrawer = useCartStore((s) => s.openDrawer);

  // Bebaskan object URL lama agar tidak bocor memori
  useEffect(() => () => { if (logoUrl) URL.revokeObjectURL(logoUrl); }, [logoUrl]);

  const hasText = config.text.enabled && text.trim().length > 0;
  const hasLogo = config.logo.enabled && !!logoUrl && !!logoFile;
  const estimate = basePrice + (hasText ? textFee : 0) + (hasLogo ? logoFee : 0);

  const handleAdd = async () => {
    setAdding(true); setAddError(null);
    try {
      // 1) tangkap tampilan 3D (gagal menangkap tidak menggagalkan penambahan)
      let snapshot: Blob | undefined;
      let thumbnail: string | undefined;
      const dataUrl = capture();
      if (dataUrl) {
        snapshot = await (await fetch(dataUrl)).blob();
        thumbnail = await makeThumbnail(dataUrl).catch(() => undefined);
      }
      // 2) unggah logo + snapshot lewat signed upload dari server
      const uploaded = await uploadDesignAssets({ logoFile: hasLogo ? logoFile : null, snapshot });
      // 3) masukkan ke keranjang
      addItem({
        productId, slug, name, basePrice, textFee, logoFee, quantity, thumbnail,
        customization: {
          primaryColor: primary,
          secondaryColor: config.secondary.enabled ? secondary : undefined,
          text: hasText ? text.trim() : undefined,
          font,
          logoPath: uploaded.logoPath,
          snapshotPath: uploaded.snapshotPath,
        },
      });
      openDrawer();
    } catch (e) {
      console.error("add to cart:", e);
      setAddError(e instanceof Error ? e.message : t.addFailed);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="lg:sticky lg:top-20 lg:self-start">
        <ThreeCanvasLazy
          className="h-[380px] w-full overflow-hidden rounded-xl border bg-muted/40 md:h-[540px]"
          modelUrl={modelUrl} config={config} captureRef={captureRef}
          state={{
            primaryColor: primary,
            secondaryColor: config.secondary.enabled ? secondary : undefined,
            text: hasText ? text.trim() : undefined,
            font, logoUrl,
          }}
        />
        <p className="mt-2 text-center text-xs text-muted-foreground">{t.dragHint}</p>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold">{t.customize(name)}</h2>
          <p className="text-sm text-muted-foreground">{t.liveHint}</p>
        </div>

        {config.primary.enabled && <ColorPicker label={config.primary.label} value={primary} onChange={setPrimary} />}
        {config.secondary.enabled && <ColorPicker label={config.secondary.label} value={secondary} onChange={setSecondary} />}
        {config.text.enabled && (
          <TextControls text={text} font={font} maxLength={config.text.maxLength}
            onTextChange={setText} onFontChange={setFont} />
        )}
        {config.logo.enabled && (
          <LogoUploader logoUrl={logoUrl}
            onChange={(file) => { setLogoFile(file); setLogoUrl(file ? URL.createObjectURL(file) : null); }} />
        )}

        <div className="space-y-4 rounded-lg border p-4">
          <div>
            <p className="text-sm text-muted-foreground">{t.estimate}</p>
            <p className="text-2xl font-bold">{formatRupiah(estimate)}</p>
            {(hasText || hasLogo) && (
              <p className="mt-1 text-xs text-muted-foreground">
                {t.includes([hasText && t.feeText(formatRupiah(textFee)), hasLogo && t.feeLogo(formatRupiah(logoFee))].filter(Boolean).join(" + "))}
              </p>
            )}
            <p className="mt-2 text-xs text-muted-foreground">{t.serverNote}</p>
          </div>

          <div className="flex items-end gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="qty">{t.quantity}</Label>
              <Input id="qty" type="number" min={1} max={500} className="w-24" value={quantity}
                onChange={(e) => setQuantity(Math.min(500, Math.max(1, Math.floor(Number(e.target.value)) || 1)))} />
            </div>
            <Button type="button" className="flex-1" onClick={handleAdd} disabled={adding}>
              {adding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShoppingBag className="mr-2 h-4 w-4" />}
              {adding ? t.saving : t.addToCart}
            </Button>
          </div>
          {addError && <p role="alert" className="text-sm text-red-600">{addError}</p>}
        </div>
      </div>
    </div>
  );
}
