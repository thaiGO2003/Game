"""
Audit: so sanh star descriptions trong skills.csv voi logic code
"""
import csv, re, sys

sys.stdout.reconfigure(encoding='utf-8')

def parse_star_details(desc):
    results = {}
    parts = re.split(r'(?=\d[★⭐])', desc)
    for part in parts:
        m = re.match(r'^(\d)[★⭐]\s*(.+?)$', part.strip())
        if m:
            star = int(m.group(1))
            text = m.group(2).strip().rstrip(';.,')
            results[star] = text
    return results

def extract_numbers(text):
    info = {}
    pcts = re.findall(r'(\d+)%', text)
    if pcts: info['pct'] = [int(x) for x in pcts]
    turns = re.findall(r'(\d+)\s*luot', text.replace('ợ','o').replace('ượ','uo'))
    if not turns:
        turns = re.findall(r'(\d+)\s*l', text)
    if turns: info['turns'] = [int(x) for x in turns[:2]]
    targets = re.findall(r'(\d+)\s*(?:dong minh|muc tieu|ke dich|d)', text.replace('ồ','o').replace('ụ','u'))
    if 'toan doi' in text.replace('à','a').replace('ộ','o') or 'toan bo' in text.replace('à','a').replace('ộ','o'):
        info['global'] = True
    return info

with open('data/skills.csv', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    skills = list(reader)

out = open('_audit_result.txt', 'w', encoding='utf-8')

out.write("="*80 + "\n")
out.write("AUDIT: Skill Star Descriptions\n")
out.write("="*80 + "\n")

for skill in skills:
    sid = skill['id'].strip()
    effect = skill.get('effect','').strip()
    desc = skill.get('descriptionVi','').strip()
    base = skill.get('base','').strip()
    scale = skill.get('scale','').strip()
    turns = skill.get('turns','').strip()
    maxT = skill.get('maxTargets','').strip()
    maxH = skill.get('maxHits','').strip()
    
    star_details = parse_star_details(desc)
    if not star_details:
        continue
    
    out.write(f"\n{'_'*60}\n")
    out.write(f"{sid} (effect: {effect})\n")
    out.write(f"  CSV: base={base} scale={scale} turns={turns} maxT={maxT} maxH={maxH}\n")
    
    for star in [1, 2, 3]:
        if star in star_details:
            text = star_details[star]
            out.write(f"  *{star}: {text}\n")

out.close()
print("Done! Written to _audit_result.txt")
