"""
Audit: so sánh star descriptions trong skills.csv với logic code CombatScene.js
Trích xuất các con số cụ thể (%, turns, targets) từ description để kiểm tra.
"""
import csv, re

def parse_star_details(desc):
    """Parse star-specific text from descriptionVi"""
    results = {}
    # Find star patterns: 1★ text; 2★ text; 3★ text
    parts = re.split(r'(?=\d[★⭐])', desc)
    for part in parts:
        m = re.match(r'^(\d)[★⭐]\s*(.+?)$', part.strip())
        if m:
            star = int(m.group(1))
            text = m.group(2).strip().rstrip(';.,')
            results[star] = text
    return results

def extract_numbers(text):
    """Extract key numbers from star description text"""
    info = {}
    # % values
    pcts = re.findall(r'(\d+)%', text)
    if pcts: info['pct'] = [int(x) for x in pcts]
    # turns/lượt
    turns = re.findall(r'(\d+)\s*lượt', text)
    if turns: info['turns'] = [int(x) for x in turns]
    # targets (đồng minh/mục tiêu)
    targets = re.findall(r'(\d+)\s*(?:đồng minh|mục tiêu|kẻ địch)', text)
    if targets: info['targets'] = [int(x) for x in targets]
    # toàn đội/toàn bộ
    if 'toàn đội' in text or 'toàn bộ' in text:
        info['global'] = True
    return info

with open('data/skills.csv', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    skills = list(reader)

print("="*80)
print("AUDIT: Skill Star Descriptions - Trích xuất con số từ mô tả")
print("="*80)

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
    
    print(f"\n{'─'*60}")
    print(f"📋 {sid} (effect: {effect})")
    print(f"   CSV: base={base} scale={scale} turns={turns} maxT={maxT} maxH={maxH}")
    
    for star in [1, 2, 3]:
        if star in star_details:
            text = star_details[star]
            nums = extract_numbers(text)
            print(f"   ★{star}: {text}")
            if nums:
                print(f"       → Parsed: {nums}")
