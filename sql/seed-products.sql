-- Seed the products table from products.json.
--
-- GENERATED FILE - do not edit by hand. Produced by: php sql/build-seed.php
--
-- Safe to run more than once: INSERT IGNORE skips ids already present, so it
-- never overwrites a product edited in the admin panel.

INSERT IGNORE INTO products
  (id, name, price, category, blurb, icon_color, icon_bg, icon_svg, rating, reviews, stock, active)
VALUES (
  'nebula-hoodie',
  'Nebula Hoodie',
  68.00,
  'Outerwear',
  'A heavyweight fleece hoodie with a brushed interior, dropped shoulders, and a kangaroo pocket. Built for cold mornings.',
  '#6d28d9',
  'radial-gradient(circle, #ede9fe, #c4b5fd)',
  '<path fill=''currentColor'' d=''M30 26 Q50 6 70 26 L70 34 Q50 24 30 34 Z''/><rect x=''30'' y=''30'' width=''40'' height=''55'' rx=''10'' fill=''currentColor''/><rect x=''10'' y=''34'' width=''18'' height=''34'' rx=''8'' fill=''currentColor'' transform=''rotate(-15 19 51)''/><rect x=''72'' y=''34'' width=''18'' height=''34'' rx=''8'' fill=''currentColor'' transform=''rotate(15 81 51)''/><rect x=''40'' y=''60'' width=''20'' height=''14'' rx=''4'' fill=''rgba(0,0,0,0.15)''/><circle cx=''45'' cy=''34'' r=''2'' fill=''rgba(0,0,0,0.25)''/><circle cx=''55'' cy=''34'' r=''2'' fill=''rgba(0,0,0,0.25)''/>',
  4.6,
  214,
  25,
  1
);

INSERT IGNORE INTO products
  (id, name, price, category, blurb, icon_color, icon_bg, icon_svg, rating, reviews, stock, active)
VALUES (
  'solstice-sneakers',
  'Solstice Sneakers',
  92.00,
  'Footwear',
  'Lightweight everyday sneakers with a breathable knit upper and a cushioned sole made for standing all day.',
  '#c2410c',
  'radial-gradient(circle, #ffedd5, #fdba74)',
  '<path fill=''currentColor'' d=''M12 66 Q12 54 24 52 L50 44 Q62 40 72 46 L86 54 Q92 57 92 64 L92 70 Q92 74 88 74 L18 74 Q12 74 12 68 Z''/><rect x=''12'' y=''70'' width=''80'' height=''8'' rx=''4'' fill=''rgba(0,0,0,0.2)''/><path fill=''rgba(0,0,0,0.15)'' d=''M24 52 L50 44 Q54 50 50 56 L28 62 Z''/>',
  4.4,
  168,
  25,
  1
);

INSERT IGNORE INTO products
  (id, name, price, category, blurb, icon_color, icon_bg, icon_svg, rating, reviews, stock, active)
VALUES (
  'aurora-backpack',
  'Aurora Backpack',
  54.00,
  'Accessories',
  'A 20L daypack with a padded laptop sleeve, water-resistant shell, and enough pockets to keep you organized.',
  '#0f766e',
  'radial-gradient(circle, #ccfbf1, #5eead4)',
  '<rect x=''28'' y=''26'' width=''44'' height=''58'' rx=''16'' fill=''currentColor''/><path d=''M38 26 Q38 12 50 12 Q62 12 62 26'' fill=''none'' stroke=''currentColor'' stroke-width=''7'' stroke-linecap=''round''/><rect x=''36'' y=''38'' width=''28'' height=''18'' rx=''5'' fill=''rgba(0,0,0,0.18)''/><rect x=''42'' y=''62'' width=''16'' height=''16'' rx=''4'' fill=''rgba(0,0,0,0.12)''/>',
  4.7,
  302,
  25,
  1
);

INSERT IGNORE INTO products
  (id, name, price, category, blurb, icon_color, icon_bg, icon_svg, rating, reviews, stock, active)
VALUES (
  'meridian-chinos',
  'Meridian Chinos',
  58.00,
  'Bottoms',
  'Straight-leg cotton chinos with a touch of stretch, a clean tapered ankle, and pockets that actually hold a phone.',
  '#92400e',
  'radial-gradient(circle, #fef3c7, #fcd34d)',
  '<rect x=''30'' y=''16'' width=''40'' height=''10'' rx=''2'' fill=''currentColor''/><path fill=''currentColor'' d=''M30 26 h18 l-3 58 h-13 z''/><path fill=''currentColor'' d=''M52 26 h18 l-2 58 h-13 z''/><rect x=''30'' y=''26'' width=''40'' height=''4'' fill=''rgba(0,0,0,0.15)''/><rect x=''47'' y=''26'' width=''6'' height=''15'' fill=''rgba(0,0,0,0.1)''/>',
  4.3,
  97,
  25,
  1
);

INSERT IGNORE INTO products
  (id, name, price, category, blurb, icon_color, icon_bg, icon_svg, rating, reviews, stock, active)
VALUES (
  'cloudstep-socks',
  'Cloudstep Socks (3-pack)',
  14.00,
  'Socks',
  'Cushioned combed-cotton crew socks with a reinforced heel and a ribbed cuff that stays up all day.',
  '#9f1239',
  'radial-gradient(circle, #ffe4e6, #fda4af)',
  '<path fill=''currentColor'' d=''M40 16 H60 V56 H72 A11 11 0 0 1 72 78 H50 A10 10 0 0 1 40 68 Z''/><rect x=''40'' y=''16'' width=''20'' height=''7'' fill=''rgba(0,0,0,0.2)''/><rect x=''40'' y=''60'' width=''12'' height=''5'' fill=''rgba(0,0,0,0.12)''/>',
  4.8,
  421,
  25,
  1
);

INSERT IGNORE INTO products
  (id, name, price, category, blurb, icon_color, icon_bg, icon_svg, rating, reviews, stock, active)
VALUES (
  'everyday-boxer-briefs',
  'Everyday Boxer Briefs (2-pack)',
  22.00,
  'Underwear',
  'Breathable modal-blend boxer briefs with a soft waistband and a no-ride-up leg that stays put.',
  '#1e40af',
  'radial-gradient(circle, #dbeafe, #93c5fd)',
  '<rect x=''28'' y=''28'' width=''44'' height=''9'' rx=''2'' fill=''currentColor''/><path fill=''currentColor'' d=''M28 37 H72 L69 58 Q66 70 56 70 Q50 70 50 61 Q50 70 44 70 Q34 70 31 58 Z''/><rect x=''28'' y=''37'' width=''44'' height=''3'' fill=''rgba(0,0,0,0.15)''/>',
  4.5,
  256,
  25,
  1
);

