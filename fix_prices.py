import re

files = {
    "src/app/dashboard/admin/listings/page.tsx": [
        ("formatPrice(selectedListing.price)", "selectedListing.price != null ? formatPrice(selectedListing.price) : '\u2014'"),
    ],
    "src/app/dashboard/admin/page.tsx": [
        ("formatPrice(l.price)", "l.price != null ? formatPrice(l.price) : '\u2014'"),
    ],
    "src/app/dashboard/admin/users/page.tsx": [
        ("formatPrice(l.price)", "l.price != null ? formatPrice(l.price) : '\u2014'"),
    ],
}

for filepath, replacements in files.items():
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    for old, new in replacements:
        content = content.replace(old, new)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Fixed {filepath}")

# Fix recently-viewed.tsx - replace price display with category (homepage crash fix)
rv_path = "src/components/listings/recently-viewed.tsx"
with open(rv_path, "r", encoding="utf-8") as f:
    content = f.read()
content = content.replace(
    '<p className="text-blue-600 dark:text-blue-400 font-semibold text-xs mt-1">{formatPrice(item.price)}</p>',
    '<p className="text-blue-600 dark:text-blue-400 font-semibold text-xs mt-1 capitalize">{item.category}</p>'
)
with open(rv_path, "w", encoding="utf-8") as f:
    f.write(content)
print(f"Fixed {rv_path}")

# Remove unused formatPrice import from admin/favorites/page.tsx
fav_path = "src/app/dashboard/admin/favorites/page.tsx"
with open(fav_path, "r", encoding="utf-8") as f:
    content = f.read()
content = content.replace('import { formatPrice } from "@/lib/constants";\n', "")
with open(fav_path, "w", encoding="utf-8") as f:
    f.write(content)
print(f"Fixed {fav_path}")

print("All done!")
