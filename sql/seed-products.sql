-- Seed the products table from the original products.json.
-- Safe to run more than once: INSERT IGNORE skips ids already present,
-- so it will never overwrite a product you have since edited in the admin panel.

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
  '<path fill=\x27currentColor\x27 d=\x27M30 26 Q50 6 70 26 L70 34 Q50 24 30 34 Z\x27/><rect x=\x2730\x27 y=\x2730\x27 width=\x2740\x27 height=\x2755\x27 rx=\x2710\x27 fill=\x27currentColor\x27/><rect x=\x2710\x27 y=\x2734\x27 width=\x2718\x27 height=\x2734\x27 rx=\x278\x27 fill=\x27currentColor\x27 transform=\x27rotate(-15 19 51)\x27/><rect x=\x2772\x27 y=\x2734\x27 width=\x2718\x27 height=\x2734\x27 rx=\x278\x27 fill=\x27currentColor\x27 transform=\x27rotate(15 81 51)\x27/><rect x=\x2740\x27 y=\x2760\x27 width=\x2720\x27 height=\x2714\x27 rx=\x274\x27 fill=\x27rgba(0,0,0,0.15)\x27/><circle cx=\x2745\x27 cy=\x2734\x27 r=\x272\x27 fill=\x27rgba(0,0,0,0.25)\x27/><circle cx=\x2755\x27 cy=\x2734\x27 r=\x272\x27 fill=\x27rgba(0,0,0,0.25)\x27/>',
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
  '<path fill=\x27currentColor\x27 d=\x27M12 66 Q12 54 24 52 L50 44 Q62 40 72 46 L86 54 Q92 57 92 64 L92 70 Q92 74 88 74 L18 74 Q12 74 12 68 Z\x27/><rect x=\x2712\x27 y=\x2770\x27 width=\x2780\x27 height=\x278\x27 rx=\x274\x27 fill=\x27rgba(0,0,0,0.2)\x27/><path fill=\x27rgba(0,0,0,0.15)\x27 d=\x27M24 52 L50 44 Q54 50 50 56 L28 62 Z\x27/>',
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
  '<rect x=\x2728\x27 y=\x2726\x27 width=\x2744\x27 height=\x2758\x27 rx=\x2716\x27 fill=\x27currentColor\x27/><path d=\x27M38 26 Q38 12 50 12 Q62 12 62 26\x27 fill=\x27none\x27 stroke=\x27currentColor\x27 stroke-width=\x277\x27 stroke-linecap=\x27round\x27/><rect x=\x2736\x27 y=\x2738\x27 width=\x2728\x27 height=\x2718\x27 rx=\x275\x27 fill=\x27rgba(0,0,0,0.18)\x27/><rect x=\x2742\x27 y=\x2762\x27 width=\x2716\x27 height=\x2716\x27 rx=\x274\x27 fill=\x27rgba(0,0,0,0.12)\x27/>',
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
  '<rect x=\x2730\x27 y=\x2716\x27 width=\x2740\x27 height=\x2710\x27 rx=\x272\x27 fill=\x27currentColor\x27/><path fill=\x27currentColor\x27 d=\x27M30 26 h18 l-3 58 h-13 z\x27/><path fill=\x27currentColor\x27 d=\x27M52 26 h18 l-2 58 h-13 z\x27/><rect x=\x2730\x27 y=\x2726\x27 width=\x2740\x27 height=\x274\x27 fill=\x27rgba(0,0,0,0.15)\x27/><rect x=\x2747\x27 y=\x2726\x27 width=\x276\x27 height=\x2715\x27 fill=\x27rgba(0,0,0,0.1)\x27/>',
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
  '<path fill=\x27currentColor\x27 d=\x27M40 16 H60 V56 H72 A11 11 0 0 1 72 78 H50 A10 10 0 0 1 40 68 Z\x27/><rect x=\x2740\x27 y=\x2716\x27 width=\x2720\x27 height=\x277\x27 fill=\x27rgba(0,0,0,0.2)\x27/><rect x=\x2740\x27 y=\x2760\x27 width=\x2712\x27 height=\x275\x27 fill=\x27rgba(0,0,0,0.12)\x27/>',
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
  '<rect x=\x2728\x27 y=\x2728\x27 width=\x2744\x27 height=\x279\x27 rx=\x272\x27 fill=\x27currentColor\x27/><path fill=\x27currentColor\x27 d=\x27M28 37 H72 L69 58 Q66 70 56 70 Q50 70 50 61 Q50 70 44 70 Q34 70 31 58 Z\x27/><rect x=\x2728\x27 y=\x2737\x27 width=\x2744\x27 height=\x273\x27 fill=\x27rgba(0,0,0,0.15)\x27/>',
  4.5,
  256,
  25,
  1
);

