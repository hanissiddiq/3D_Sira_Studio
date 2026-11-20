-- DATA CONTOH (opsional) agar papan antrean / fleet / material langsung terisi saat dicoba.
-- Ganti dengan data armada & stok Anda sendiri. Aman dijalankan ulang (on conflict do nothing).
insert into public.printers (name, model, nozzle) values
  ('X1C-01', 'Bambu Lab X1-Carbon', '0.4mm'),
  ('X1C-02', 'Bambu Lab X1-Carbon', '0.4mm'),
  ('A1-01',  'Bambu Lab A1',        '0.4mm')
on conflict (name) do nothing;

insert into public.materials (name, type, color_name, color_hex, stock_rolls, grams_per_roll, low_stock_rolls, cost_per_kg)
select * from (values
  ('Bambu PLA Matte', 'PLA+',  'Slate Grey',   '#64748b', 6.0, 1000, 2, 250000),
  ('PLA Silk',        'PLA',   'Electric Cyan','#22d3ee', 3.5, 1000, 2, 280000),
  ('PETG Carbon',     'PETG',  'Black',        '#1f2937', 1.5, 1000, 2, 300000)
) as v(name, type, color_name, color_hex, stock_rolls, grams_per_roll, low_stock_rolls, cost_per_kg)
where not exists (select 1 from public.materials);
