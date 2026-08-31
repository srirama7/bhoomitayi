const fs = require('fs');

const fixes = [
  ['src/app/dashboard/admin/listings/page.tsx', 'formatPrice(selectedListing.price)', "selectedListing.price != null ? formatPrice(selectedListing.price) : '\u2014'"],
  ['src/app/dashboard/admin/page.tsx', 'formatPrice(l.price)', "l.price != null ? formatPrice(l.price) : '\u2014'"],
  ['src/app/dashboard/admin/users/page.tsx', 'formatPrice(l.price)', "l.price != null ? formatPrice(l.price) : '\u2014'"],
];

fixes.forEach(([file, from, to]) => {
  let c = fs.readFileSync(file, 'utf8');
  c = c.split(from).join(to);
  fs.writeFileSync(file, c, 'utf8');
  console.log('Fixed:', file);
});

// Fix recently-viewed.tsx - homepage crash (price display -> category)
let rv = fs.readFileSync('src/components/listings/recently-viewed.tsx', 'utf8');
rv = rv.replace('{formatPrice(item.price)}', '{item.category}');
fs.writeFileSync('src/components/listings/recently-viewed.tsx', rv, 'utf8');
console.log('Fixed: recently-viewed.tsx');

// Remove unused import from admin/favorites
let fav = fs.readFileSync('src/app/dashboard/admin/favorites/page.tsx', 'utf8');
fav = fav.replace('import { formatPrice } from "@/lib/constants";\n', '');
fav = fav.replace("import { formatPrice } from \"@/lib/constants\";\r\n", '');
fs.writeFileSync('src/app/dashboard/admin/favorites/page.tsx', fav, 'utf8');
console.log('Fixed: admin/favorites/page.tsx');

console.log('All done!');
