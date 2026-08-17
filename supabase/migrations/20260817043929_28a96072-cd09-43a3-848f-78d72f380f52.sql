UPDATE public.articles
SET body_md = replace(
      replace(body_md,
        'including the eyewear class and the safety steps',
        'including the safety steps'),
      'a 650 nm laser, a diffraction grating, a dark room, and laser-rated eyewear appropriate to the source,',
      'a 650 nm laser, a diffraction grating, and a dark room,')
WHERE id = '59de4734-5296-4a28-98e0-9cf3de83ac83';

UPDATE public.content_translations
SET translated_text = replace(
      replace(translated_text,
        'incluida la clase de gafas de protección y los pasos de seguridad',
        'incluidos los pasos de seguridad'),
      'un láser de 650 nm, una rejilla de difracción, una habitación oscura y gafas de protección homologadas para láser e idóneas para la fuente,',
      'un láser de 650 nm, una rejilla de difracción y una habitación oscura,')
WHERE id = 'a4f769e5-92f3-4701-85da-f61aaae2f634';

UPDATE public.content_translations
SET translated_text = replace(
      replace(translated_text,
        'einschließlich der Schutzbrillenklasse und der Sicherheitsmaßnahmen',
        'einschließlich der Sicherheitsmaßnahmen'),
      'ein 650 nm Laser, ein Beugungsgitter, ein dunkler Raum und eine für die Quelle geeignete Laserschutzbrille –',
      'ein 650 nm Laser, ein Beugungsgitter und ein dunkler Raum –')
WHERE id = 'a57f6929-36ba-4d1d-a858-d62d16ac437c';