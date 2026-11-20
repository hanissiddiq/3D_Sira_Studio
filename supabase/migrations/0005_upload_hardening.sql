-- SVG dapat memuat script dan akan dibuka staf lewat signed URL: tolak untuk upload pelanggan.
update storage.buckets
   set allowed_mime_types = array['image/png','image/jpeg','image/webp']
 where id = 'customer-uploads';
