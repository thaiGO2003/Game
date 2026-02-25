# -*- coding: utf-8 -*-
"""
Build script: sinh skills.csv sạch từ _skill_data.py
Chạy: python _build_skills.py
"""
import csv, io, sys
sys.stdout.reconfigure(encoding='utf-8')

from _skill_data import ALL_SKILLS, COLS

OUT_PATH = r'p:\DigiGO\games\game\data\skills.csv'

# Validate uniqueness
ids = [row['id'] for row in ALL_SKILLS]
dupes = [x for x in ids if ids.count(x) > 1]
if dupes:
    print(f'❌ DUPLICATE IDs: {set(dupes)}')
    sys.exit(1)

print(f'✅ {len(ALL_SKILLS)} skills, 0 duplicates')

# Write CSV
with open(OUT_PATH, 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=COLS, quoting=csv.QUOTE_MINIMAL)
    writer.writeheader()
    for row in ALL_SKILLS:
        writer.writerow(row)

print(f'✅ Written to {OUT_PATH}')

# Quick verify: re-read and check IDs
with open(OUT_PATH, encoding='utf-8') as f:
    reader = csv.DictReader(f)
    rows = list(reader)
print(f'✅ Verified: {len(rows)} rows in CSV')
