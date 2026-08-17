UPDATE public.articles
SET body_md = replace(body_md,
  'a 650 nm laser through a diffraction grating viewed in a dark room with rated eyewear,',
  'a 650 nm laser through a diffraction grating viewed in a dark room,')
WHERE id = '59de4734-5296-4a28-98e0-9cf3de83ac83';

UPDATE public.content_translations
SET translated_text = replace(translated_text,
  'un láser de 650 nm a través de una rejilla de difracción visto en una habitación oscura con gafas homologadas—',
  'un láser de 650 nm a través de una rejilla de difracción visto en una habitación oscura—')
WHERE id = 'a4f769e5-92f3-4701-85da-f61aaae2f634';

UPDATE public.content_translations
SET translated_text = replace(translated_text,
  'ein 650 nm Laser durch ein Beugungsgitter, betrachtet in einem dunklen Raum mit zertifizierter Schutzbrille –',
  'ein 650 nm Laser durch ein Beugungsgitter, betrachtet in einem dunklen Raum –')
WHERE id = 'a57f6929-36ba-4d1d-a858-d62d16ac437c';