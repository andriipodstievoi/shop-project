-- Repairs the drawn illustrations on an installation seeded before the
-- generator was fixed.
--
-- GENERATED FILE - do not edit by hand. Produced by: php sql/build-seed.php
--
-- Symptom: icon_svg reads fill=x27currentColorx27 instead of
-- fill='currentColor', because the earlier seed wrote a literal \x27 where an
-- apostrophe belonged, and every illustration renders as nothing.
--
-- Only the three icon columns are touched. Names, prices, stock, descriptions
-- and anything else edited in the admin panel are left exactly as they are.

UPDATE products SET
  icon_color = '#6d28d9',
  icon_bg    = 'radial-gradient(circle, #ede9fe, #c4b5fd)',
  icon_svg   = '<path fill=''currentColor'' d=''M30 26 Q50 6 70 26 L70 34 Q50 24 30 34 Z''/><rect x=''30'' y=''30'' width=''40'' height=''55'' rx=''10'' fill=''currentColor''/><rect x=''10'' y=''34'' width=''18'' height=''34'' rx=''8'' fill=''currentColor'' transform=''rotate(-15 19 51)''/><rect x=''72'' y=''34'' width=''18'' height=''34'' rx=''8'' fill=''currentColor'' transform=''rotate(15 81 51)''/><rect x=''40'' y=''60'' width=''20'' height=''14'' rx=''4'' fill=''rgba(0,0,0,0.15)''/><circle cx=''45'' cy=''34'' r=''2'' fill=''rgba(0,0,0,0.25)''/><circle cx=''55'' cy=''34'' r=''2'' fill=''rgba(0,0,0,0.25)''/>'
WHERE id = 'nebula-hoodie';

UPDATE products SET
  icon_color = '#c2410c',
  icon_bg    = 'radial-gradient(circle, #ffedd5, #fdba74)',
  icon_svg   = '<path fill=''currentColor'' d=''M12 66 Q12 54 24 52 L50 44 Q62 40 72 46 L86 54 Q92 57 92 64 L92 70 Q92 74 88 74 L18 74 Q12 74 12 68 Z''/><rect x=''12'' y=''70'' width=''80'' height=''8'' rx=''4'' fill=''rgba(0,0,0,0.2)''/><path fill=''rgba(0,0,0,0.15)'' d=''M24 52 L50 44 Q54 50 50 56 L28 62 Z''/>'
WHERE id = 'solstice-sneakers';

UPDATE products SET
  icon_color = '#0f766e',
  icon_bg    = 'radial-gradient(circle, #ccfbf1, #5eead4)',
  icon_svg   = '<rect x=''28'' y=''26'' width=''44'' height=''58'' rx=''16'' fill=''currentColor''/><path d=''M38 26 Q38 12 50 12 Q62 12 62 26'' fill=''none'' stroke=''currentColor'' stroke-width=''7'' stroke-linecap=''round''/><rect x=''36'' y=''38'' width=''28'' height=''18'' rx=''5'' fill=''rgba(0,0,0,0.18)''/><rect x=''42'' y=''62'' width=''16'' height=''16'' rx=''4'' fill=''rgba(0,0,0,0.12)''/>'
WHERE id = 'aurora-backpack';

UPDATE products SET
  icon_color = '#92400e',
  icon_bg    = 'radial-gradient(circle, #fef3c7, #fcd34d)',
  icon_svg   = '<rect x=''30'' y=''16'' width=''40'' height=''10'' rx=''2'' fill=''currentColor''/><path fill=''currentColor'' d=''M30 26 h18 l-3 58 h-13 z''/><path fill=''currentColor'' d=''M52 26 h18 l-2 58 h-13 z''/><rect x=''30'' y=''26'' width=''40'' height=''4'' fill=''rgba(0,0,0,0.15)''/><rect x=''47'' y=''26'' width=''6'' height=''15'' fill=''rgba(0,0,0,0.1)''/>'
WHERE id = 'meridian-chinos';

UPDATE products SET
  icon_color = '#9f1239',
  icon_bg    = 'radial-gradient(circle, #ffe4e6, #fda4af)',
  icon_svg   = '<path fill=''currentColor'' d=''M40 16 H60 V56 H72 A11 11 0 0 1 72 78 H50 A10 10 0 0 1 40 68 Z''/><rect x=''40'' y=''16'' width=''20'' height=''7'' fill=''rgba(0,0,0,0.2)''/><rect x=''40'' y=''60'' width=''12'' height=''5'' fill=''rgba(0,0,0,0.12)''/>'
WHERE id = 'cloudstep-socks';

UPDATE products SET
  icon_color = '#1e40af',
  icon_bg    = 'radial-gradient(circle, #dbeafe, #93c5fd)',
  icon_svg   = '<rect x=''28'' y=''28'' width=''44'' height=''9'' rx=''2'' fill=''currentColor''/><path fill=''currentColor'' d=''M28 37 H72 L69 58 Q66 70 56 70 Q50 70 50 61 Q50 70 44 70 Q34 70 31 58 Z''/><rect x=''28'' y=''37'' width=''44'' height=''3'' fill=''rgba(0,0,0,0.15)''/>'
WHERE id = 'everyday-boxer-briefs';

