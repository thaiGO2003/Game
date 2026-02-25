import csv, sys
sys.stdout.reconfigure(encoding='utf-8')

with open(r'p:\DigiGO\games\game\data\units.csv', encoding='utf-8') as f:
    reader = csv.reader(f)
    header = next(reader)
    idx = {h:i for i,h in enumerate(header)}
    roles = {}
    for row in reader:
        if len(row) < 17: continue
        role = row[idx['classType']]
        tier = int(row[idx['tier']])
        uid = row[idx['id']]
        name = row[idx['name']]
        skill = row[idx['skillId']]
        roles.setdefault(role, []).append((tier, uid, name, skill))

skill_ids = set()
skill_data = {}
with open(r'p:\DigiGO\games\game\data\skills.csv', encoding='utf-8') as f:
    reader = csv.reader(f)
    hdr = next(reader)
    for row in reader:
        if len(row) > 0 and row[0].strip() and not row[0].startswith('**') and not row[0].startswith('-'):
            sid = row[0].strip()
            skill_ids.add(sid)
            # Extract key stats
            name = row[1] if len(row)>1 else ''
            desc = row[2][:60] if len(row)>2 else ''
            base = row[6] if len(row)>6 else ''
            scale_stat = row[7] if len(row)>7 else ''
            scale = row[8] if len(row)>8 else ''
            dmg_type = row[5] if len(row)>5 else ''
            effect = row[4] if len(row)>4 else ''
            action = row[3] if len(row)>3 else ''
            skill_data[sid] = {
                'name': name, 'desc': desc, 'base': base, 
                'scaleStat': scale_stat, 'scale': scale,
                'dmgType': dmg_type, 'effect': effect, 'action': action
            }

out = []
for role in ['TANKER','FIGHTER','MAGE','ARCHER','ASSASSIN','SUPPORT']:
    out.append(f'\n=== {role} ===')
    items = sorted(roles.get(role, []), key=lambda x: x[0])
    for t, uid, name, skill in items:
        exists = '✅' if skill in skill_ids else '❌'
        sd = skill_data.get(skill, {})
        stats = f"base={sd.get('base','?')} scale={sd.get('scale','?')} type={sd.get('dmgType','?')}"
        out.append(f'  T{t} {uid:25s} {exists} {skill:35s} {stats}')

with open(r'p:\DigiGO\games\game\_unit_skill_map.txt', 'w', encoding='utf-8') as f:
    f.write('\n'.join(out))
print(f'Written {len(out)} lines')
