import { z } from "zod";
import { customizationSchema } from "./customizer";

export const orderItemInput = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).max(500),
  customization: customizationSchema,
});

export const createOrderSchema = z.object({
  customer: z.object({
    name: z.string().trim().min(2).max(100),
    email: z.string().trim().toLowerCase().email().max(200),
    phone: z.string().trim().regex(/^(\+62|62|0)8[0-9]{8,12}$/, "Nomor HP tidak valid"),
  }),
  shipping: z.object({
    address: z.string().trim().min(10).max(300),
    city: z.string().trim().min(2).max(100),
    province: z.string().trim().min(2).max(100),
    postalCode: z.string().regex(/^\d{5}$/, "Kode pos 5 digit"),
    courier: z.string().min(2).max(50),
    service: z.string().min(1).max(50),
  }),
  items: z.array(orderItemInput).min(1).max(50),
});
export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const lookupOrderSchema = z.object({
  orderCode: z.string().trim().toUpperCase().regex(/^SIRA-[A-F0-9]{8}$/),
  email: z.string().trim().toLowerCase().email(),
});

// Skema flat untuk form checkout (UI). Aturan field diambil dari createOrderSchema agar tidak menyimpang.
const c = createOrderSchema.shape.customer.shape;
const s = createOrderSchema.shape.shipping.shape;
export const checkoutFormSchema = z.object({
  name: c.name, email: c.email, phone: c.phone,
  address: s.address, city: s.city, province: s.province, postalCode: s.postalCode,
  shippingKey: z.string().min(1, "Pilih metode pengiriman"),
});
export type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;
