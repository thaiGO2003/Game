# -*- coding: utf-8 -*-
"""
Skill definitions for all 120 units.
Format: skill_id -> {columns dict}
Only columns with values are specified; rest default to empty.
Header: id,name,descriptionVi,actionPattern,effect,damageType,base,scaleStat,scale,
shieldBase,tauntTurns,stunChance,stunTurns,reflectPct,reflectTurns,armorBuff,mdefBuff,
turns,hit1,hit2,lifesteal,echoBase,echoScale,maxHits,sleepChance,sleepTurns,armorBreak,
freezeChance,freezeTurns,splashCount,poisonTurns,poisonPerTurn,shieldScaleStat,shieldScale,
rageGain,maxTargets,selfAtkBuff,assistRate,evadeBuff,atkBuff,buffStats,armorPen,killRage,
diseaseTurns,diseaseDamage
"""

HEADER = "id,name,descriptionVi,actionPattern,effect,damageType,base,scaleStat,scale,shieldBase,tauntTurns,stunChance,stunTurns,reflectPct,reflectTurns,armorBuff,mdefBuff,turns,hit1,hit2,lifesteal,echoBase,echoScale,maxHits,sleepChance,sleepTurns,armorBreak,freezeChance,freezeTurns,splashCount,poisonTurns,poisonPerTurn,shieldScaleStat,shieldScale,rageGain,maxTargets,selfAtkBuff,assistRate,evadeBuff,atkBuff,buffStats,armorPen,killRage,diseaseTurns,diseaseDamage"

COLS = HEADER.split(',')

def make_row(**kw):
    """Build a row dict with defaults = empty string"""
    row = {c: '' for c in COLS}
    row.update(kw)
    return row

# ══════════════════════════════════════════════════════════════
# TANKER SKILLS (20 units)
# T1: bear_ancient, ant_guard, badger_stone, ram_charge
# T2: crab_shell, armadillo_roll, snail_fortress, ox_mountain
# T3: turtle_mire, pangolin_plate, walrus_ice, golem_stone
# T4: buffalo_mist, elephant_guard, yak_highland, mammoth_ancient
# T5: kraken_deep, titan_earth, hydra_swamp, dragon_earth
# ══════════════════════════════════════════════════════════════

TANKER = [
    # T1 - base thấp, kỹ năng đơn giản
    make_row(id='bear_roar', name='Gầm Gừ Uy Hiếp',
        descriptionVi="Gấu Cổ Thụ gầm vang rừng sâu giảm ATK kẻ địch gần nhất và tự hồi HP. 1★ giảm 15%ATK 3 lượt 1 mục tiêu, hồi 10%HP; 2★ giảm 20%ATK 3 lượt 2 mục tiêu, hồi 15%HP; 3★ giảm 25%ATK 4 lượt 3 mục tiêu, hồi 20%HP.",
        actionPattern='SELF', effect='roar_debuff_heal', turns='3', maxTargets='1'),
    make_row(id='unit_skill_ant_guard', name='Kiến Trận Đồ',
        descriptionVi="Kiến Hộ Vệ dựng tường khiên kiên cố tăng Giáp và Kháng Phép cho đồng minh cùng hàng. 1★ +15 Giáp/+10 KP 2 lượt; 2★ +20 Giáp/+14 KP 3 lượt; 3★ +25 Giáp/+18 KP 3 lượt + lan sang hàng bên cạnh.",
        actionPattern='SELF', effect='ally_row_def_buff', armorBuff='15', mdefBuff='10', turns='2'),
    make_row(id='badger_thorns', name='Gai Đá',
        descriptionVi="Lửng Đá kích hoạt lớp gai đá trên mình, tự buff giáp và phản ST vật lý nhận vào kẻ tấn công. 1★ +15 Giáp phản 15% 3 lượt; 2★ +20 Giáp phản 25% 3 lượt; 3★ +30 Giáp phản 35% 4 lượt + gai lan sang đồng minh kề.",
        actionPattern='SELF', effect='self_armor_reflect', reflectPct='0.15', armorBuff='15', turns='3'),
    make_row(id='ram_headbutt', name='Sừng Húc',
        descriptionVi="Cừu Núi lao thẳng húc văng kẻ địch bằng đôi sừng cứng, gây ST vật lý và đẩy lùi. 1★ ST gốc đẩy 1 ô; 2★ +20% ST đẩy 1 ô 30% choáng 1 lượt; 3★ +40% ST đẩy 2 ô 50% choáng 1 lượt.",
        actionPattern='MELEE_FRONT', effect='knockback_charge', damageType='physical', base='18', scaleStat='atk', scale='0.8'),
    # T2 - trung bình
    make_row(id='crab_guard', name='Kẹp Bảo Vệ',
        descriptionVi="Cua Giáp chọn đồng minh HP thấp nhất dùng đôi càng che chắn, hấp thụ một phần ST thay thế. 1★ hấp thụ 30% ST 3 lượt 1 đồng minh; 2★ hấp thụ 40% ST 3 lượt 1 đồng minh; 3★ hấp thụ 50% ST 4 lượt 2 đồng minh yếu nhất.",
        actionPattern='SELF', effect='guardian_pact', turns='3'),
    make_row(id='armadillo_roll', name='Cuộn Tròn',
        descriptionVi="Tatu cuộn tròn mình thành cầu giáp cứng, buff giáp và kháng phép cao, đồng thời giảm ST đòn kế tiếp. 1★ +20 DEF/MDEF 2 lượt giảm 30% đòn kế; 2★ +30 DEF/MDEF 2 lượt giảm 40% đòn kế; 3★ +40 DEF/MDEF 3 lượt giảm 50% đòn kế.",
        actionPattern='SELF', effect='self_def_fortify', armorBuff='20', mdefBuff='20', turns='2'),
    make_row(id='snail_fortress', name='Pháo Đài Di Động',
        descriptionVi="Ốc Sên Pháo Đài rút vào lớp vỏ siêu cứng, tạo khiên và miễn nhiễm mọi CC trong thời gian kích hoạt. 1★ khiên (40+30%DEF) 2 lượt; 2★ khiên (60+40%DEF) 2 lượt; 3★ khiên (80+50%DEF) 3 lượt + khiên tóe sang đồng minh cùng hàng (25% giá trị).",
        actionPattern='SELF', effect='self_shield_immune', shieldBase='40', turns='2', shieldScaleStat='def', shieldScale='0.30'),
    make_row(id='ox_endure', name='Chịu Đựng',
        descriptionVi="Bò Núi tích tụ sức mạnh đại địa, tăng HP tối đa vĩnh viễn và hồi ngay phần HP được thêm. 1★ +12% HP vĩnh viễn hồi 12%HP ngay; 2★ +18% HP vĩnh viễn hồi 18%HP ngay; 3★ +25% HP vĩnh viễn hồi 25%HP ngay + tăng 5 DEF vĩnh viễn.",
        actionPattern='SELF', effect='self_maxhp_boost'),
    # T3 - khá
    make_row(id='turtle_shell', name='Mai Rùa Bất Tử',
        descriptionVi="Rùa Đầm Lầy rút vào mai cổ đại tạo khiên bền; nếu khiên còn nguyên sau 2 lượt thì hồi HP thưởng. 1★ khiên (60+40%DEF) hồi 15%HP nếu còn; 2★ khiên (80+50%DEF) hồi 20%HP nếu còn; 3★ khiên (100+60%DEF) hồi 25%HP + hồi thêm 5%HP/lượt 2 lượt.",
        actionPattern='SELF', effect='resilient_shield', shieldBase='60', turns='2', shieldScaleStat='def', shieldScale='0.40'),
    make_row(id='unit_skill_pangolin_plate', name='Vảy Tê Tê',
        descriptionVi="Tê Tê Thiết Giáp kích hoạt vảy sắc nhọn phản hoàn toàn ST vật lý nhận về, miễn nhiễm với phép. 1★ phản 80% ST vật lý 3 lượt; 2★ phản 100% ST vật lý 3 lượt; 3★ phản 100% ST vật lý 4 lượt + phản 30% ST phép.",
        actionPattern='SELF', effect='pangolin_reflect', reflectPct='1', reflectTurns='3'),
    make_row(id='walrus_frost_aura', name='Hào Quang Băng',
        descriptionVi="Hải Mã Băng phát hào quang băng giá buff DEF và MDEF cho đồng minh lân cận. 1★ 2 đồng minh +15DEF/+12KP 3 lượt; 2★ 3 đồng minh +20DEF/+16KP 3 lượt; 3★ 4 đồng minh +25DEF/+20KP 4 lượt.",
        actionPattern='SELF', effect='frost_aura_buff', armorBuff='15', mdefBuff='12', turns='3', maxTargets='2'),
    make_row(id='golem_anchor', name='Mỏ Neo Đá',
        descriptionVi="Golem Đá đập mạnh xuống đất cắm mỏ neo khiêu khích toàn địch tập trung vào mình và tạo khiên bảo vệ. 1★ taunt 2 lượt khiên (50+25%DEF); 2★ taunt 3 lượt khiên (70+35%DEF) +10 phản công; 3★ taunt 3 lượt khiên (90+45%DEF) +20 phản công toàn đội.",
        actionPattern='MELEE_FRONT', effect='damage_shield_taunt', damageType='physical', base='15', scaleStat='def', scale='0.4', shieldBase='50', tauntTurns='2', shieldScaleStat='def', shieldScale='0.25'),
    # T4 - cao
    make_row(id='buffalo_mist_veil', name='Sương Mù Che Chắn',
        descriptionVi="Trâu Sương Mù triệu hồi lớp sương dày đặc giúp toàn đội né tránh đòn tấn công. 1★ +15% né tránh 2 lượt; 2★ +20% né tránh 3 lượt; 3★ +25% né tránh 3 lượt + 15% phản công khi né thành công.",
        actionPattern='SELF', effect='team_evade_buff', turns='2', evadeBuff='0.15'),
    make_row(id='unit_skill_elephant_guard', name='Voi Giẫm Đạp',
        descriptionVi="Voi Thiết Giáp dậm mạnh xuống đất tạo chấn động AoE 8 ô kề bản thân gây ST vật lý kèm choáng. 1★ 8 ô ST gốc 35% choáng 1 lượt; 2★ 8 ô +20% ST 50% choáng 1 lượt; 3★ 8 ô +40% ST 65% choáng 2 lượt.",
        actionPattern='MELEE_FRONT', effect='aoe_circle_stun', damageType='physical', base='35', scaleStat='atk', scale='1.0', stunChance='0.35', stunTurns='1'),
    make_row(id='yak_warcry', name='Tiếng Thét Chiến',
        descriptionVi="Bò Tây Tạng hét tiếng thét chiến đấu hung hãn, buff ATK cho toàn đội và tự buff DEF cá nhân. 1★ +15%ATK toàn đội 2 lượt +20 DEF bản thân 3 lượt; 2★ +20%ATK toàn đội 3 lượt +30 DEF bản thân; 3★ +25%ATK toàn đội 3 lượt +40 DEF bản thân + cộng +5 nộ toàn đội.",
        actionPattern='SELF', effect='warcry_atk_def', armorBuff='20', turns='3'),
    make_row(id='mammoth_rally', name='Tiếng Gọi Bầy Đàn',
        descriptionVi="Voi Ma Mút phát ra tiếng gọi nguyên thủy hồi nộ toàn đội và tự hồi HP khổng lồ. 1★ +2 nộ toàn đội hồi 12%HP bản thân; 2★ +3 nộ toàn đội hồi 18%HP bản thân; 3★ +4 nộ toàn đội hồi 25%HP bản thân + hồi 8%HP cho toàn đội.",
        actionPattern='SELF', effect='team_rage_self_heal', rageGain='2'),
    # T5 - rất cao
    make_row(id='kraken_grasp', name='Xúc Tu Kìm Kẹp',
        descriptionVi="Kraken Đại Dương phóng xúc tu kìm kẹp kẻ địch mạnh nhất gây ST vật lý lớn và khóa skill mục tiêu. 1★ ST gốc silence 2 lượt 1 mục tiêu; 2★ +20% ST silence 2 lượt 2 mục tiêu; 3★ +40% ST silence 3 lượt 2 mục tiêu + giảm 25% ST chúng.",
        actionPattern='MELEE_FRONT', effect='single_silence_lock', damageType='physical', base='40', scaleStat='def', scale='0.8', turns='2'),
    make_row(id='unit_skill_titan_earth', name='Phúc Lành Đại Địa',
        descriptionVi="Titan Đất kêu gọi sức mạnh đại địa buff Giáp và Kháng Phép toàn đội đồng thời hồi HP đồng minh yếu. 1★ +25 Giáp/KP 3 lượt hồi 60HP yếu nhất; 2★ +35 Giáp/KP 3 lượt hồi 90HP yếu nhất; 3★ +45 Giáp/KP 4 lượt hồi 120HP 2 đồng minh yếu nhất.",
        actionPattern='SELF', effect='team_def_buff', armorBuff='25', mdefBuff='25', turns='3'),
    make_row(id='hydra_regen', name='Tái Sinh Đa Đầu',
        descriptionVi="Cá Nóc Đầm Lầy kích hoạt tái sinh nguyên thủy hồi HP mỗi lượt cho bản thân và đồng minh yếu nhất. 1★ hồi 10%HP bản thân 3 lượt heal 5%HP cho 2 đồng minh; 2★ hồi 15%HP bản thân 3 lượt heal 5%HP cho 3 đồng minh; 3★ hồi 20%HP bản thân 4 lượt heal 8%HP toàn đội.",
        actionPattern='SELF', effect='self_regen_team_heal', maxTargets='2'),
    make_row(id='dragon_earth_wall', name='Tường Đất Rồng',
        descriptionVi="Rồng Đất tạo tường đất khổng lồ ban khiên cho toàn đội, bản thân nhận khiên gấp đôi. 1★ khiên toàn đội (40+25%DEF) 3 lượt; 2★ khiên (60+35%DEF) 3 lượt; 3★ khiên (80+45%DEF) 4 lượt + gai 15 phản công khi khiên bị phá.",
        actionPattern='SELF', effect='team_shield', shieldBase='40', turns='3', shieldScaleStat='def', shieldScale='0.25'),
]

# ══════════════════════════════════════════════════════════════
# FIGHTER SKILLS (20 units)
# ══════════════════════════════════════════════════════════════

FIGHTER = [
    # T1
    make_row(id='unit_skill_tiger_fang', name='Vuốt Hổ Xé Thịt',
        descriptionVi="Hổ Nanh cào xé theo cột dọc, gây ST vật lý và chảy máu. Mốc sao: 1★ ST gốc, chảy máu 2 lượt, 2★ +20% ST, chảy máu 3 lượt, 3★ +40% ST, chảy máu 4 lượt.",
        actionPattern='MELEE_FRONT', effect='column_bleed', damageType='physical', base='18', scaleStat='atk', scale='0.85', turns='2'),
    make_row(id='unit_skill_triceratops_charge', name='Sừng Ba Mũi',
        descriptionVi="Bò Rừng húc bằng ba sừng, gây ST và đẩy lùi. Mốc sao: 1★ ST gốc đẩy 1 ô, 2★ +20% ST đẩy 1 ô +30% choáng, 3★ +40% ST đẩy 2 ô +50% choáng.",
        actionPattern='MELEE_FRONT', effect='knockback_charge', damageType='physical', base='20', scaleStat='atk', scale='0.8'),
    make_row(id='scout_buff_ally', name='Dẫn Đường Săn Mồi',
        descriptionVi="Báo Đốm buff ATK và nộ cho đồng minh cùng hàng. Mốc sao: 1★ +10 ATK +1 nộ, 2★ +15 ATK +2 nộ, 3★ +20 ATK +3 nộ.",
        actionPattern='SELF', effect='scout_buff_ally', atkBuff='10'),
    make_row(id='komodo_venom', name='Nọc Độc Kỳ Đà',
        descriptionVi="Kỳ Đà cắn nhiễm khuẩn, gây ST kèm nọc độc. Mốc sao: 1★ ST gốc, độc 15/lượt 3 lượt, 2★ +20% ST, độc 20/lượt 3 lượt, 3★ +40% ST, độc 25/lượt 4 lượt.",
        actionPattern='MELEE_FRONT', effect='single_strong_poison', damageType='physical', base='18', scaleStat='atk', scale='0.8', poisonTurns='3', poisonPerTurn='15'),
    # T2
    make_row(id='unit_skill_rhino_quake', name='Phản Đòn Địa Chấn',
        descriptionVi="Tê Giác phản đòn cận chiến. Mốc sao: 1★ phản đòn 3 lượt, 2★ phản đòn 4 lượt +15% ST phản, 3★ phản đòn 5 lượt +30% ST phản.",
        actionPattern='SELF', effect='rhino_counter', turns='3'),
    make_row(id='otter_combo', name='Combo Rái Cá',
        descriptionVi="Rái Cá tấn công 2 đòn liên tiếp. Mốc sao: 1★ đòn chính + echo, 2★ +20% ST cả 2 đòn, 3★ +40% ST và echo gây thêm chảy máu 2 lượt.",
        actionPattern='MELEE_FRONT', effect='single_delayed_echo', damageType='physical', base='20', scaleStat='atk', scale='0.85', echoBase='12', echoScale='0.6'),
    make_row(id='kangaroo_uppercut', name='Cú Đấm Bay',
        descriptionVi="Kangaroo tung 2 đòn chân sau. Mốc sao: 1★ 2 đòn ST gốc, 2★ 2 đòn +20% ST, 3★ 3 đòn +40% ST.",
        actionPattern='MELEE_FRONT', effect='double_hit', damageType='physical', base='22', scaleStat='atk', scale='0.9'),
    make_row(id='pack_howl_rage', name='Gọi Bầy',
        descriptionVi="Linh Cẩu tru gọi đồng đội hồi nộ. Mốc sao: 1★ +2 nộ cho 2 đồng minh, 2★ +3 nộ cho 3 đồng minh, 3★ +4 nộ cho toàn hàng.",
        actionPattern='SELF', effect='pack_howl_rage', rageGain='2', maxTargets='2'),
    # T3
    make_row(id='unit_skill_hippo_maul', name='Nện Bùn',
        descriptionVi="Hà Mã nện đất AoE tam giác. Mốc sao: 1★ 3 ô ST gốc, 2★ 5 ô +20% ST, 3★ 8 ô +40% ST.",
        actionPattern='MELEE_FRONT', effect='cone_smash', damageType='physical', base='28', scaleStat='atk', scale='1.1'),
    make_row(id='wolverine_frenzy', name='Cuồng Nộ Hải Ly',
        descriptionVi="Hải Ly kích hoạt cuồng nộ tự buff ATK. Mốc sao: 1★ +35% ATK 3 lượt, 2★ +50% ATK 3 lượt, 3★ +65% ATK 4 lượt.",
        actionPattern='MELEE_FRONT', effect='self_bersek', turns='3'),
    make_row(id='bison_charge', name='Húc Choáng',
        descriptionVi="Bò Rừng húc gây ST kèm choáng. Mốc sao: 1★ ST gốc 45% choáng, 2★ +20% ST 60% choáng, 3★ +40% ST 75% choáng.",
        actionPattern='MELEE_FRONT', effect='damage_stun', damageType='physical', base='28', scaleStat='atk', scale='1.05', stunChance='0.45', stunTurns='1'),
    make_row(id='shark_bite_frenzy', name='Cắn Xé Điên Cuồng',
        descriptionVi="Cá Mập cắn xé hút máu. Mốc sao: 1★ ST gốc hút 25%, 2★ +20% ST hút 35%, 3★ +40% ST hút 45%.",
        actionPattern='MELEE_FRONT', effect='single_burst_lifesteal', damageType='physical', base='30', scaleStat='atk', scale='1.1', lifesteal='0.25'),
    # T4
    make_row(id='unit_skill_beetle_drill', name='Mũi Khoan Xuyên',
        descriptionVi="Bọ Khoan gây ST chuẩn bỏ qua giáp. Mốc sao: 1★ ST gốc 1 mục tiêu, 2★ +20% ST +phá 10 giáp 2 lượt, 3★ +40% ST +phá 20 giáp 2 lượt.",
        actionPattern='MELEE_FRONT', effect='true_single', damageType='true', base='35', scaleStat='atk', scale='1.2'),
    make_row(id='unit_skill_scorpion_king', name='Đuôi Độc Vua',
        descriptionVi="Vua Bọ Cạp chích độc. Mốc sao: 1★ độc 18/lượt 2 lượt, 2★ độc 25/lượt 3 lượt lan 1 ô, 3★ độc 35/lượt 3 lượt lan 2 ô.",
        actionPattern='MELEE_FRONT', effect='single_poison_slow', damageType='physical', base='32', scaleStat='atk', scale='1.15', poisonTurns='2', poisonPerTurn='18'),
    make_row(id='unit_skill_crocodile_bite', name='Cá Sấu Tử Cuộn',
        descriptionVi="Cá Sấu cắn xoay gây chảy máu. Mốc sao: 1★ ST gốc, máu 15/lượt 3 lượt, 2★ +20% ST, máu 20/lượt 3 lượt, 3★ +40% ST, máu 30/lượt 4 lượt.",
        actionPattern='MELEE_FRONT', effect='single_bleed', damageType='physical', base='38', scaleStat='atk', scale='1.4', poisonTurns='3', poisonPerTurn='15'),
    make_row(id='unit_skill_gorilla_smash', name='Cú Đấm Ngàn Cân',
        descriptionVi="Đười Ươi đấm AoE phá giáp. Mốc sao: 1★ 3 ô, phá 15 giáp 2 lượt, 2★ 5 ô, phá 20 giáp 2 lượt, 3★ 8 ô, phá 25 giáp 3 lượt.",
        actionPattern='MELEE_FRONT', effect='cleave_armor_break', damageType='physical', base='35', scaleStat='atk', scale='1.2', armorBreak='15', turns='2'),
    # T5
    make_row(id='unit_skill_lion_general', name='Sư Tử Hống',
        descriptionVi="Sư Tử gầm thét gây ST toàn địch kèm choáng. Mốc sao: 1★ ST gốc 40% choáng, 2★ +20% ST 55% choáng, 3★ +40% ST 70% choáng 2 lượt.",
        actionPattern='RANGED_STATIC', effect='global_stun', damageType='magic', base='40', scaleStat='atk', scale='1.0', stunChance='0.4', stunTurns='1'),
    make_row(id='unit_skill_trex_bite', name='Hàm Bạo Chúa',
        descriptionVi="T-Rex cắn nghiền gây ST khủng phá giáp. Mốc sao: 1★ ST gốc, phá 20 giáp, 2★ +20% ST, phá 30 giáp, 3★ +40% ST, phá 40 giáp xuyên 20% DEF.",
        actionPattern='MELEE_FRONT', effect='single_armor_break', damageType='physical', base='55', scaleStat='atk', scale='2.2', armorBreak='20', turns='2'),
    make_row(id='unit_skill_whale_song', name='Sóng Cổ Đại',
        descriptionVi="Cá Voi tạo sóng thần toàn địch. Mốc sao: 1★ ST gốc đẩy 1 ô, 2★ +20% ST đẩy 1 ô +choáng 30%, 3★ +40% ST đẩy 2 ô +choáng 50%.",
        actionPattern='RANGED_STATIC', effect='global_knockback', damageType='magic', base='45', scaleStat='matk', scale='1.1'),
    make_row(id='unit_skill_chimera_flame', name='Hỏa Ngục Hổ',
        descriptionVi="Hổ Lửa phun lửa thiêu toàn địch. Mốc sao: 1★ ST gốc, cháy 15/lượt 3 lượt, 2★ +20% ST, cháy 22/lượt 3 lượt, 3★ +40% ST, cháy 30/lượt 4 lượt.",
        actionPattern='RANGED_STATIC', effect='global_poison_team', damageType='magic', base='42', scaleStat='matk', scale='1.0', poisonTurns='3', poisonPerTurn='15'),
]

# ══════════════════════════════════════════════════════════════
# MAGE SKILLS (20 units)
# ══════════════════════════════════════════════════════════════

MAGE = [
    # T1
    make_row(id='poison_spit', name='Nhổ Độc',
        descriptionVi="Cóc Độc nhổ bọt độc vào mục tiêu gây ST phép kèm độc cộng dồn. Mốc sao: 1★ độc 12/lượt 2 lượt, 2★ độc 18/lượt 3 lượt, 3★ độc 25/lượt 3 lượt.",
        actionPattern='RANGED_STATIC', effect='single_poison_stack', damageType='magic', base='15', scaleStat='matk', scale='0.6', poisonTurns='2', poisonPerTurn='12'),
    make_row(id='fire_breath_cone', name='Phun Lửa Núi',
        descriptionVi="Kỳ Nhông Núi Lửa phun lửa hình nón gây ST phép kèm đốt cháy. 1★ 3 ô hình nón cháy 10/lượt 2 lượt; 2★ 5 ô nón lớn cháy 15/lượt 2 lượt; 3★ 5 ô nón lớn cháy 20/lượt 3 lượt.",
        actionPattern='RANGED_STATIC', effect='fire_breath_cone', damageType='magic', base='18', scaleStat='matk', scale='0.7', poisonTurns='2', poisonPerTurn='10'),
    make_row(id='fireball_burn', name='Quả Cầu Lửa',
        descriptionVi="Thạch Hỏa phóng quả cầu lửa nổ AoE quanh mục tiêu. 1★ nổ 9 ô ST gốc; 2★ nổ 9 ô +20% ST kèm cháy 10/lượt 2 lượt; 3★ nổ 16 ô +40% ST kèm cháy 15/lượt 3 lượt.",
        actionPattern='RANGED_STATIC', effect='fireball_burn', damageType='magic', base='20', scaleStat='matk', scale='0.75'),
    make_row(id='chain_shock', name='Dòng Điện Tê Liệt',
        descriptionVi="Sứa Điện phóng dòng điện lan sang nhiều mục tiêu ngẫu nhiên, mỗi mục tiêu nhận đủ ST. 1★ lan 2 mục tiêu ST gốc; 2★ lan 3 mục tiêu +20% ST; 3★ lan 4 mục tiêu +40% ST.",
        actionPattern='RANGED_STATIC', effect='chain_shock', damageType='magic', base='18', scaleStat='matk', scale='0.65'),
    # T2
    make_row(id='frost_storm', name='Bão Tuyết',
        descriptionVi="Bão Tuyết gây ST phép lên toàn bộ hàng ngang mục tiêu kèm giảm ATK. 1★ ST gốc −15% ATK 2 lượt; 2★ +20% ST −20% ATK 2 lượt; 3★ +40% ST −25% ATK 3 lượt.",
        actionPattern='RANGED_STATIC', effect='frost_storm', damageType='magic', base='22', scaleStat='matk', scale='0.8', turns='2'),
    make_row(id='ice_blast_freeze', name='Phun Băng',
        descriptionVi="Cóc Băng phun luồng băng cực lạnh vào 1 mục tiêu, gây ST phép và khả năng đóng băng. 1★ 40% đóng băng 1 lượt; 2★ 55% đóng băng 1 lượt; 3★ 70% đóng băng 2 lượt.",
        actionPattern='RANGED_STATIC', effect='ice_blast_freeze', damageType='magic', base='25', scaleStat='matk', scale='0.85', freezeChance='0.40', freezeTurns='1'),
    make_row(id='ink_bomb_blind', name='Bom Mực',
        descriptionVi="Tôm Phun thả bom mực nổ tung AoE, gây ST phép và giảm chính xác kẻ địch trong vùng nổ. 1★ nổ 9 ô −chính xác 2 lượt; 2★ nổ 9 ô +20% ST −chính xác 3 lượt; 3★ nổ 16 ô +40% ST −chính xác 3 lượt.",
        actionPattern='RANGED_STATIC', effect='ink_bomb_blind', damageType='magic', base='20', scaleStat='matk', scale='0.7'),
    make_row(id='ink_blast_debuff', name='Mực Phun Giảm Giáp',
        descriptionVi="Bạch Tuộc Tâm phun mực đen lên toàn bộ cột dọc mục tiêu, gây ST phép và phá giáp. 1★ ST gốc −15% DEF 2 lượt; 2★ +20% ST −20% DEF 2 lượt; 3★ +40% ST −25% DEF 3 lượt.",
        actionPattern='RANGED_STATIC', effect='ink_blast_debuff', damageType='magic', base='22', scaleStat='matk', scale='0.75', turns='2', armorBreak='15'),
    # T3
    make_row(id='unit_skill_storm_mage', name='Lôi Trụ Tách Nhánh',
        descriptionVi="Rắn Lôi dội sét xuống cột mục tiêu rồi lan sang địch gần nhất. 1★ dội cột + lan 2 địch ST gốc; 2★ dội cột + lan 3 địch +20% ST; 3★ dội cột + lan toàn địch +40% ST.",
        actionPattern='RANGED_STATIC', effect='column_plus_splash', damageType='magic', base='30', scaleStat='matk', scale='1.0', splashCount='2'),
    make_row(id='unit_skill_worm_queen', name='Hóa Kén Bướm Gió',
        descriptionVi="Sâu Xanh hóa kén trưởng thành thành Bướm Gió, biến đổi toàn bộ lực chiến đấu. 1★ +50% MATK đòn thường chuyển ST phép; 2★ +50% MATK +buff né 12% toàn đội; 3★ +70% MATK +buff né 20% toàn đội.",
        actionPattern='SELF', effect='metamorphosis', buffStats='{"matk":1.5}'),
    make_row(id='flash_blind', name='Lóe Sáng',
        descriptionVi="Đom Đóm Sáng phát ánh sáng chói lòa làm mù toàn địch, gây ST phép nhỏ kèm giảm chính xác. 1★ −15% CX 2 lượt; 2★ −20% CX 2 lượt +30% mù 1 lượt; 3★ −25% CX 3 lượt +45% mù 1 lượt.",
        actionPattern='RANGED_STATIC', effect='flash_blind', damageType='magic', base='18', scaleStat='matk', scale='0.55'),
    make_row(id='dust_sleep', name='Bụi Mê',
        descriptionVi="Ruồi Đêm Bụi rải bụi mê huyền bí lên AoE 9 ô quanh mục tiêu, gây ST phép kèm ru ngủ. 1★ nổ 9 ô 30% ngủ 1 lượt; 2★ nổ 9 ô +20% ST 45% ngủ 1 lượt; 3★ nổ 16 ô +40% ST 60% ngủ 2 lượt.",
        actionPattern='RANGED_STATIC', effect='dust_sleep', damageType='magic', base='22', scaleStat='matk', scale='0.7', sleepChance='0.30', sleepTurns='1'),
    # T4
    make_row(id='unit_skill_spore_mage', name='Mưa Bào Tử',
        descriptionVi="Nhện Bào Tử rải bào tử độc lên vùng rộng, gây ST phép kèm độc. 1★ AoE 9 ô ST gốc độc 15/lượt 2 lượt; 2★ AoE 9 ô +20% ST độc 22/lượt 3 lượt; 3★ AoE 16 ô +40% ST độc 30/lượt 3 lượt.",
        actionPattern='RANGED_STATIC', effect='aoe_poison', damageType='magic', base='32', scaleStat='matk', scale='1.0', poisonTurns='2', poisonPerTurn='15'),
    make_row(id='plague_spread', name='Dịch Bệnh Lan',
        descriptionVi="Bọ Dịch Hạch phun dịch bệnh lây lan, gây ST phép kèm độc lây sang địch lân cận. 1★ ST gốc độc 12/lượt 3 lượt lan 1 ô kề; 2★ +20% ST độc 18/lượt lan 2 ô kề; 3★ +40% ST độc 25/lượt lan toàn địch.",
        actionPattern='RANGED_STATIC', effect='plague_spread', damageType='magic', base='28', scaleStat='matk', scale='0.85', poisonTurns='3', poisonPerTurn='12'),
    make_row(id='pollen_confuse', name='Phấn Hoa Mê',
        descriptionVi="Ong Phấn Hoa rải phấn mê hoặc lên toàn địch, gây ST phép nhỏ kèm silence. 1★ toàn địch ST gốc 35% silence 1 lượt; 2★ +20% ST 50% silence 1 lượt; 3★ +40% ST 65% silence 2 lượt.",
        actionPattern='RANGED_STATIC', effect='pollen_confuse', damageType='magic', base='20', scaleStat='matk', scale='0.6'),
    make_row(id='unit_skill_beetle_mystic', name='Cầu Vồng Bọ Huyền',
        descriptionVi="Bọ Huyền triệu hồi cột băng khổng lồ giáng xuống cột mục tiêu, gây ST phép lớn kèm đóng băng. 1★ cột dọc ST gốc 40% đóng băng 1 lượt; 2★ +20% ST 55% đóng băng 1 lượt; 3★ +40% ST 70% đóng băng 2 lượt.",
        actionPattern='RANGED_STATIC', effect='column_freeze', damageType='magic', base='35', scaleStat='matk', scale='1.1', freezeChance='0.40', freezeTurns='1'),
    # T5
    make_row(id='unit_skill_dragon_breath', name='Hỏa Ngục Rồng',
        descriptionVi="Rồng Lửa phun lửa nghiệt ngã thiêu rụi toàn bộ chiến trường. 1★ toàn địch ST gốc cháy 18/lượt 3 lượt; 2★ +20% ST cháy 25/lượt 3 lượt; 3★ +40% ST cháy 35/lượt 4 lượt.",
        actionPattern='RANGED_STATIC', effect='global_poison_team', damageType='magic', base='42', scaleStat='matk', scale='1.1', poisonTurns='3', poisonPerTurn='18'),
    make_row(id='unit_skill_kraken_void', name='Xúc Tu Hư Không',
        descriptionVi="Kraken Hư Không triệu hồi xúc tu từ hư không bắn vào mục tiêu ngẫu nhiên, mỗi xúc tu gây ST phép độc lập. 1★ 4 xúc tu ST gốc; 2★ 5 xúc tu +20% ST/xúc tu; 3★ 6 xúc tu +40% ST/xúc tu.",
        actionPattern='RANGED_STATIC', effect='random_multi', damageType='magic', base='40', scaleStat='matk', scale='1.2', maxHits='4'),
    make_row(id='unit_skill_kirin_thunder', name='Phán Quyết Kỳ Lân',
        descriptionVi="Kỳ Lân Lôi triệu hồi sét trời giáng xuống toàn địch, gây ST phép lớn kèm tỷ lệ choáng cao. 1★ toàn địch ST gốc 40% choáng 1 lượt; 2★ +20% ST 55% choáng 1 lượt; 3★ +40% ST 70% choáng 2 lượt.",
        actionPattern='RANGED_STATIC', effect='global_stun', damageType='magic', base='45', scaleStat='matk', scale='1.1', stunChance='0.40', stunTurns='1'),
    make_row(id='unit_skill_lich_undead', name='Lời Nguyền Bất Tử',
        descriptionVi="Lich Bất Tử triệu hồi cột băng địa ngục giáng xuống cột mục tiêu với sức công phá kinh hoàng. 1★ cột dọc ST gốc 50% đóng băng 1 lượt; 2★ +20% ST 65% đóng băng 1 lượt; 3★ +40% ST 80% đóng băng 2 lượt.",
        actionPattern='RANGED_STATIC', effect='column_freeze', damageType='magic', base='48', scaleStat='matk', scale='1.3', freezeChance='0.50', freezeTurns='1'),
]

# ══════════════════════════════════════════════════════════════
# ARCHER SKILLS (20 units)
# ══════════════════════════════════════════════════════════════

ARCHER = [
    # T1
    make_row(id='rock_throw_stun', name='Ném Đá',
        descriptionVi="Khỉ Lao Cành nhặt đá ném mạnh vào mục tiêu gây ST vật lý kèm choáng. 1★ ST gốc 35% choáng 1 lượt; 2★ +20% ST 50% choáng 1 lượt; 3★ +40% ST 65% choáng 1 lượt.",
        actionPattern='RANGED_STATIC', effect='rock_throw_stun', damageType='physical', base='18', scaleStat='atk', scale='0.7', stunChance='0.35', stunTurns='1'),
    make_row(id='multi_sting_poison', name='Châm Liên Hoàn',
        descriptionVi="Ong Bắp Cày phóng kim độc vào nhiều mục tiêu ngẫu nhiên, mỗi kim gây ST vật lý kèm độc. 1★ 2 kim độc 10/lượt 2 lượt; 2★ 3 kim +20% ST độc 15/lượt 2 lượt; 3★ 4 kim +40% ST độc 20/lượt 3 lượt.",
        actionPattern='RANGED_STATIC', effect='multi_sting_poison', damageType='physical', base='15', scaleStat='atk', scale='0.65', maxHits='2', poisonTurns='2', poisonPerTurn='10'),
    make_row(id='heat_seek', name='Tầm Nhiệt',
        descriptionVi="Diều Hâu Săn tự động tìm kẻ địch HP thấp nhất rồi phóng đòn kết liễu. 1★ ST gốc x2 nếu mục tiêu <50% HP; 2★ +20% ST x2 nếu <50% HP; 3★ +40% ST x2 nếu <40% HP.",
        actionPattern='RANGED_STATIC', effect='heat_seek', damageType='physical', base='20', scaleStat='atk', scale='0.75'),
    make_row(id='piercing_shot', name='Lao Xuyên',
        descriptionVi="Cắt Lao bắn mũi tên xuyên toàn bộ kẻ địch cùng hàng, ST giảm 20% mỗi mục tiêu tiếp theo. 1★ xuyên hàng ST gốc; 2★ +20% ST xuyên +giảm ATK 10% 1 lượt; 3★ +40% ST xuyên +giảm ATK 15% 2 lượt.",
        actionPattern='RANGED_STATIC', effect='piercing_shot', damageType='physical', base='18', scaleStat='atk', scale='0.7'),
    # T2
    make_row(id='arrow_rain', name='Mưa Tên',
        descriptionVi="Đại Bàng Xạ Thủ bắn cơn mưa tên ngẫu nhiên, có thể trúng cùng mục tiêu. 1★ bắn 4 tên ST gốc; 2★ bắn 5 tên +20% ST/tên; 3★ bắn 6 tên +40% ST/tên.",
        actionPattern='RANGED_STATIC', effect='arrow_rain', damageType='physical', base='12', scaleStat='atk', scale='0.5', maxHits='4'),
    make_row(id='snipe_execute', name='Mỏ Xuyên Kết Liễu',
        descriptionVi="Diệc Xuyên nhắm bắn chính xác mục tiêu, sát thương nhân đôi nếu mục tiêu máu thấp. 1★ ST gốc x2 nếu <30% HP; 2★ +20% ST x2 nếu <30% HP; 3★ +40% ST x2 nếu <40% HP xuyên 25% giáp.",
        actionPattern='RANGED_STATIC', effect='snipe_execute', damageType='physical', base='22', scaleStat='atk', scale='0.85'),
    make_row(id='beak_disarm', name='Mỏ Kẹp',
        descriptionVi="Chim Mỏ To kẹp chặt vũ khí mục tiêu vô hiệu hóa đòn thường, gây ST vật lý kèm debuff. 1★ ST gốc vô hiệu đòn 1 lượt; 2★ +20% ST vô hiệu 2 lượt; 3★ +40% ST vô hiệu 2 lượt +giảm ATK 15% 1 lượt.",
        actionPattern='RANGED_STATIC', effect='beak_disarm', damageType='physical', base='20', scaleStat='atk', scale='0.8', turns='1'),
    make_row(id='rapid_fire', name='Khoan Liên Tục',
        descriptionVi="Gõ Kiến Khoan bắn liên thanh vào cùng mục tiêu, tổng burst cao. 1★ 3 phát ST gốc; 2★ 4 phát +20% ST/phát; 3★ 5 phát +40% ST/phát.",
        actionPattern='RANGED_STATIC', effect='rapid_fire', damageType='physical', base='10', scaleStat='atk', scale='0.45', maxHits='3'),
    # T3
    make_row(id='unit_skill_owl_nightshot', name='Mũi Tên Ngủ',
        descriptionVi="Cú Đêm bắn tên tẩm thuốc mê nhắm vào kẻ địch nộ cao nhất. 1★ ST gốc 35% ru ngủ 1 mục tiêu 1 lượt; 2★ +20% ST 35% ru ngủ 2 mục tiêu 1 lượt; 3★ +40% ST 35% ru ngủ 3 mục tiêu 1 lượt.",
        actionPattern='RANGED_STATIC', effect='single_sleep', damageType='physical', base='28', scaleStat='atk', scale='1.05', sleepChance='0.35', sleepTurns='1'),
    make_row(id='fish_bomb_aoe', name='Bom Cá',
        descriptionVi="Bồ Nông Bom ném bom cá nổ tung AoE quanh mục tiêu kèm choáng. 1★ nổ 9 ô ST gốc 30% choáng; 2★ nổ 9 ô +20% ST 45% choáng; 3★ nổ 16 ô +40% ST 60% choáng.",
        actionPattern='RANGED_STATIC', effect='fish_bomb_aoe', damageType='physical', base='25', scaleStat='atk', scale='0.9', stunChance='0.30', stunTurns='1'),
    make_row(id='sniper_crit', name='Phát Bắn Tỉa',
        descriptionVi="Cò Bắn Tỉa nhắm vào điểm yếu cơ thể mục tiêu, bỏ qua một phần giáp. 1★ ST gốc xuyên 50% giáp; 2★ +20% ST xuyên 50% giáp +giảm ATK 10% 1 lượt; 3★ +40% ST xuyên 65% giáp +giảm ATK 15% 2 lượt.",
        actionPattern='RANGED_STATIC', effect='sniper_crit', damageType='physical', base='32', scaleStat='atk', scale='1.15', armorPen='0.5'),
    make_row(id='fire_arrow_burn', name='Tên Lửa Hồng',
        descriptionVi="Hồng Hạc Bắn bắn tên lửa cháy gây ST vật lý kèm đốt cháy bào mòn. 1★ ST gốc cháy 12/lượt 3 lượt; 2★ +20% ST cháy 18/lượt 3 lượt; 3★ +40% ST cháy 25/lượt 4 lượt lan 1 ô kề.",
        actionPattern='RANGED_STATIC', effect='fire_arrow_burn', damageType='physical', base='28', scaleStat='atk', scale='1.0', poisonTurns='3', poisonPerTurn='12'),
    # T4
    make_row(id='unit_skill_cat_goldbow', name='Phá Giáp Tiễn',
        descriptionVi="Ong Lửa bắn tên phá giáp tạo cơ hội cho đồng đội dồn damage. 1★ ST gốc phá 15 giáp 2 lượt; 2★ +20% ST phá 22 giáp 2 lượt gây cháy 10/lượt; 3★ +40% ST phá 30 giáp 3 lượt gây cháy 15/lượt.",
        actionPattern='RANGED_STATIC', effect='single_armor_break', damageType='physical', base='32', scaleStat='atk', scale='1.25', armorBreak='15', turns='2'),
    make_row(id='dark_feather_debuff', name='Bão Lông Vũ Đen',
        descriptionVi="Quạ Bão Táp phóng lông vũ đen độc vào nhiều mục tiêu ngẫu nhiên, mỗi lông vũ giảm ATK. 1★ 3 lông vũ ST gốc −15% ATK 2 lượt; 2★ 4 lông vũ +20% ST −20% ATK 2 lượt; 3★ 5 lông vũ +40% ST −25% ATK 3 lượt.",
        actionPattern='RANGED_STATIC', effect='dark_feather_debuff', damageType='physical', base='25', scaleStat='atk', scale='0.85', maxHits='3', turns='2'),
    make_row(id='dive_bomb', name='Bổ Nhào',
        descriptionVi="Diều Hâu Khổng Lồ bổ nhào xuống toàn cột mục tiêu gây ST vật lý lớn kèm phá giáp. 1★ cột dọc ST gốc phá 15 giáp 2 lượt; 2★ +20% ST phá 22 giáp 2 lượt; 3★ +40% ST phá 30 giáp 3 lượt +30% choáng.",
        actionPattern='RANGED_STATIC', effect='dive_bomb', damageType='physical', base='35', scaleStat='atk', scale='1.3', armorBreak='15', turns='2'),
    make_row(id='feather_bleed', name='Lông Vũ Cắt',
        descriptionVi="Hải Âu Gió phóng lông vũ sắc bén vào nhiều mục tiêu ngẫu nhiên gây ST kèm chảy máu. 1★ 3 lông vũ ST gốc chảy máu 10/lượt 2 lượt; 2★ 4 lông vũ +20% ST chảy máu 15/lượt 3 lượt; 3★ 5 lông vũ +40% ST chảy máu 20/lượt 3 lượt.",
        actionPattern='RANGED_STATIC', effect='feather_bleed', damageType='physical', base='30', scaleStat='atk', scale='1.1', maxHits='3', poisonTurns='2', poisonPerTurn='10'),
    # T5
    make_row(id='unit_skill_phoenix_arrow', name='Lông Vũ Bão Táp',
        descriptionVi="Phượng Hoàng Tên phóng lông vũ rực lửa hình nón gây ST vật lý cực mạnh và thiêu đốt. 1★ nón 3 ô ST gốc; 2★ nón 5 ô +20% ST cháy 15/lượt 2 lượt; 3★ nón 5 ô +40% ST cháy 22/lượt 3 lượt.",
        actionPattern='RANGED_STATIC', effect='cone_shot', damageType='physical', base='45', scaleStat='atk', scale='1.6'),
    make_row(id='unit_skill_garuda_divine', name='Bão Kim Thần',
        descriptionVi="Garuda Thần phóng kim thần thiêng liêng vào mục tiêu ngẫu nhiên, mỗi kim gây ST độc lập. 1★ bắn 3 kim ST gốc; 2★ bắn 4 kim +20% ST/kim; 3★ bắn 5 kim +40% ST/kim.",
        actionPattern='RANGED_STATIC', effect='random_multi', damageType='physical', base='42', scaleStat='atk', scale='1.5', maxHits='3'),
    make_row(id='unit_skill_thunderbird_storm', name='Xuyên Hàng Sấm',
        descriptionVi="Chim Sấm Sét bắn tên sét điện xuyên hàng gây ST vật lý lớn kèm choáng. 1★ xuyên hàng tối đa 4 mục tiêu 25% choáng; 2★ +20% ST 4 mục tiêu 40% choáng; 3★ +40% ST 5 mục tiêu 55% choáng.",
        actionPattern='RANGED_STATIC', effect='row_multi', damageType='physical', base='48', scaleStat='atk', scale='1.7', maxHits='4', stunChance='0.25', stunTurns='1'),
    make_row(id='unit_skill_roc_legend', name='Tên Thập Tự Huyền Thoại',
        descriptionVi="Đại Bàng Huyền Thoại bắn tên nổ hình thập (+) gây ST vật lý lên mục tiêu và 4 ô liền kề. 1★ hình + ST gốc; 2★ hình + +20% ST +30% choáng 1 lượt; 3★ hình + +40% ST +50% choáng 1 lượt.",
        actionPattern='RANGED_STATIC', effect='cross_5', damageType='physical', base='50', scaleStat='atk', scale='1.8'),
]

# ══════════════════════════════════════════════════════════════
# ASSASSIN SKILLS (20 units)
# ══════════════════════════════════════════════════════════════

ASSASSIN = [
    # T1
    make_row(id='flame_combo_assassin', name='Lửa Cáo',
        descriptionVi="Cáo Hỏa lao sau lưng mục tiêu tung đòn lửa, gây sát thương vật lý (18 + 0.75x ATK) kèm đốt cháy 8 sát thương/lượt trong 2 lượt. Sát thủ DOT lửa. Mốc sao: 1★ sát thương gốc, 2★ +20% sát thương, 3★ +40% sát thương.",
        actionPattern='ASSASSIN_BACK', effect='flame_combo', damageType='physical', base='18', scaleStat='atk', scale='0.75', poisonTurns='2', poisonPerTurn='8'),
    make_row(id='quick_strike_rage', name='Đâm Nhanh',
        descriptionVi="Chồn Nhanh tấn công chớp nhoáng từ phía sau, gây sát thương vật lý (15 + 0.6x ATK) nhưng hồi +5 nộ bản thân. Sát thủ spam skill. Mốc sao: 1★ sát thương gốc, 2★ +20% sát thương, 3★ +40% sát thương.",
        actionPattern='ASSASSIN_BACK', effect='quick_strike_rage', damageType='physical', base='15', scaleStat='atk', scale='0.6', rageGain='5'),
    make_row(id='web_trap_slow', name='Mạng Tơ Bẫy',
        descriptionVi="Nhện Độc giăng tơ bẫy mục tiêu, gây sát thương vật lý (18 + 0.7x ATK) và giảm ATK 20% trong 2 lượt. Sát thủ debuff. Mốc sao: 1★ sát thương gốc, 2★ +20% sát thương, 3★ +40% sát thương.",
        actionPattern='ASSASSIN_BACK', effect='web_trap_slow', damageType='physical', base='18', scaleStat='atk', scale='0.7', turns='2'),
    make_row(id='sting_paralyze', name='Đuôi Chích',
        descriptionVi="Bọ Cạp Bóng chích đuôi từ phía sau, gây sát thương vật lý (20 + 0.8x ATK) và 40% choáng 1 lượt. Sát thủ duy nhất có CC. Mốc sao: 1★ sát thương gốc, 2★ +20% sát thương, 3★ +40% sát thương.",
        actionPattern='ASSASSIN_BACK', effect='sting_paralyze', damageType='physical', base='20', scaleStat='atk', scale='0.8', stunChance='0.40', stunTurns='1'),
    # T2
    make_row(id='unit_skill_wolf_alpha', name='Tru Hào Sát Thủ',
        descriptionVi="Sói Thủ Lĩnh tru vang rồi lao vào mục tiêu, gây sát thương vật lý (22 + 0.9x ATK) và tự tăng ATK +15 trong 2 lượt. Kích hoạt đòn phụ từ đồng minh (55%). Mốc sao: 1★ sát thương gốc, 2★ +20% sát thương, 3★ +40% sát thương.",
        actionPattern='MELEE_FRONT', effect='self_atk_and_assist', damageType='physical', base='22', scaleStat='atk', scale='0.9', selfAtkBuff='15', assistRate='0.55', turns='2'),
    make_row(id='unit_skill_mosquito_toxic', name='Vòi Hút Máu',
        descriptionVi="Muỗi Độc lao sau cắm vòi hút máu, gây sát thương vật lý (25 + 0.95x ATK) và hút 50% thành máu. Kèm bệnh dịch 8/lượt trong 2 lượt. Mốc sao: 1★ sát thương gốc, 2★ +20% sát thương, 3★ +40% sát thương.",
        actionPattern='ASSASSIN_BACK', effect='lifesteal_disease', damageType='physical', base='25', scaleStat='atk', scale='0.95', lifesteal='0.5', diseaseTurns='2', diseaseDamage='8'),
    make_row(id='stealth_strike', name='Ẩn Đánh',
        descriptionVi="Tắc Kè Ẩn tàng hình rồi tấn công bất ngờ, gây sát thương vật lý (24 + 0.9x ATK) và tự buff né +25% trong 2 lượt. Sát thủ né đòn. Mốc sao: 1★ sát thương gốc, 2★ +20% sát thương, 3★ +40% sát thương.",
        actionPattern='ASSASSIN_BACK', effect='stealth_strike', damageType='physical', base='24', scaleStat='atk', scale='0.9', evadeBuff='0.25', turns='2'),
    make_row(id='double_poison_hit', name='Cắn Độc Kép',
        descriptionVi="Rắn Lục Tấn cắn 2 đòn liên tiếp, mỗi đòn gây sát thương vật lý (12 + 0.5x ATK) kèm độc cộng dồn 8/lượt trong 2 lượt. Mốc sao: 1★ sát thương gốc, 2★ +20% sát thương, 3★ +40% sát thương.",
        actionPattern='ASSASSIN_BACK', effect='double_poison_hit', damageType='physical', base='12', scaleStat='atk', scale='0.5', poisonTurns='2', poisonPerTurn='8'),
    # T3
    make_row(id='unit_skill_bat_blood', name='Cắn Mạch Hút Máu',
        descriptionVi="Dơi Huyết lao sau cắn sâu vào mạch máu, gây sát thương vật lý (30 + 1.15x ATK) và hút 40% thành máu. Sát thủ tự hồi trong trận dài. Mốc sao: 1★ sát thương gốc, 2★ +20% sát thương, 3★ +40% sát thương.",
        actionPattern='ASSASSIN_BACK', effect='single_burst_lifesteal', damageType='physical', base='30', scaleStat='atk', scale='1.15', lifesteal='0.40'),
    make_row(id='x_slash_bleed', name='Kiếm Chém X',
        descriptionVi="Bọ Ngựa Kiếm chém hình X, gây sát thương vật lý (28 + 1.1x ATK) kèm chảy máu 12/lượt trong 3 lượt. Sát thủ DOT chảy máu. Mốc sao: 1★ sát thương gốc, 2★ +20% sát thương, 3★ +40% sát thương.",
        actionPattern='ASSASSIN_BACK', effect='x_slash_bleed', damageType='physical', base='28', scaleStat='atk', scale='1.1', poisonTurns='3', poisonPerTurn='12'),
    make_row(id='backstab_crit', name='Cắn Gáy',
        descriptionVi="Chồn Hương Bóng lẻn sau cắn vào gáy, gây sát thương vật lý (30 + 1.2x ATK). Tấn công từ phía sau sát thương x1.5. Sát thủ backstab. Mốc sao: 1★ sát thương gốc, 2★ +20% sát thương, 3★ +40% sát thương.",
        actionPattern='ASSASSIN_BACK', effect='backstab_crit', damageType='physical', base='30', scaleStat='atk', scale='1.2'),
    make_row(id='silent_kill_stealth', name='Ám Sát Thầm Lặng',
        descriptionVi="Chồn Mink Im ám sát mục tiêu, gây sát thương vật lý (32 + 1.2x ATK). Nếu hạ gục: tàng hình (né +30%) 2 lượt. Mốc sao: 1★ sát thương gốc, 2★ +20% sát thương, 3★ +40% sát thương.",
        actionPattern='ASSASSIN_BACK', effect='silent_kill_stealth', damageType='physical', base='32', scaleStat='atk', scale='1.2', evadeBuff='0.30', turns='2'),
    # T4
    make_row(id='unit_skill_lynx_echo', name='Ảnh Trảm',
        descriptionVi="Châu Chấu Gió lao sau chém rồi để lại bóng ảnh gây đòn trễ (15 + 0.8x ATK). Tổng 2 đòn burst bất ngờ. Mốc sao: 1★ sát thương gốc, 2★ +20% sát thương, 3★ +40% sát thương.",
        actionPattern='ASSASSIN_BACK', effect='single_delayed_echo', damageType='physical', base='35', scaleStat='atk', scale='1.35', echoBase='15', echoScale='0.8'),
    make_row(id='unit_skill_cobra_venom', name='Nọc Tử Thần',
        descriptionVi="Rắn Hổ Mang phun nọc cực mạnh, gây sát thương phép (35 + 1.3x MATK) kèm độc 25/lượt trong 3 lượt. Sát thủ phép DOT. Mốc sao: 1★ sát thương gốc, 2★ +20% sát thương, 3★ +40% sát thương.",
        actionPattern='ASSASSIN_BACK', effect='single_strong_poison', damageType='magic', base='35', scaleStat='matk', scale='1.3', poisonTurns='3', poisonPerTurn='25'),
    make_row(id='scavenge_heal', name='Xé Xác',
        descriptionVi="Kền Kền Ăn Xác xé xác mục tiêu, gây sát thương vật lý (38 + 1.4x ATK). Nếu hạ gục: hồi 30% HP bản thân. Sát thủ tự hồi khi giết. Mốc sao: 1★ sát thương gốc, 2★ +20% sát thương, 3★ +40% sát thương.",
        actionPattern='ASSASSIN_BACK', effect='scavenge_heal', damageType='physical', base='38', scaleStat='atk', scale='1.4'),
    make_row(id='unit_skill_wasp_assassin', name='Lưỡi Kiếm Xuyên',
        descriptionVi="Ong Bắp Cày Sát chém điểm yếu, gây sát thương vật lý (40 + 1.5x ATK) và bỏ qua 40% giáp. Sát thủ xuyên giáp T4. Mốc sao: 1★ sát thương gốc, 2★ +20% sát thương, 3★ +40% sát thương.",
        actionPattern='ASSASSIN_BACK', effect='single_burst_armor_pen', damageType='physical', base='40', scaleStat='atk', scale='1.5', armorPen='0.4'),
    # T5
    make_row(id='unit_skill_panther_void', name='Tất Sát Hoàn Nộ',
        descriptionVi="Báo Hư Không giáng đòn chí tử, gây sát thương vật lý (55 + 2.2x ATK). Nếu hạ gục: hoàn 50% Nộ. Sát thủ execute T5. Mốc sao: 1★ sát thương gốc, 2★ +20% sát thương, 3★ +40% sát thương.",
        actionPattern='ASSASSIN_BACK', effect='assassin_execute_rage_refund', damageType='physical', base='55', scaleStat='atk', scale='2.2', killRage='0.5'),
    make_row(id='death_mark', name='Tử Thần Gõ Cửa',
        descriptionVi="Quạ Tử Thần đánh dấu lời nguyền chết, gây sát thương vật lý (40 + 1.5x ATK). Sau 2 lượt mục tiêu nhận true damage = 25% HP đã mất. Mốc sao: 1★ sát thương gốc, 2★ +20% sát thương, 3★ +40% sát thương.",
        actionPattern='ASSASSIN_BACK', effect='death_mark', damageType='physical', base='40', scaleStat='atk', scale='1.5', turns='2'),
    make_row(id='unit_skill_wraith_shadow', name='Hỏa Ấn Liên Kích',
        descriptionVi="Ma Bóng Tối tung 2 đòn liên tiếp: đòn 1 gây (50 + 1.8x ATK), đòn 2 gây (35 + 1.3x ATK). Tổng burst cực cao. Mốc sao: 1★ sát thương gốc, 2★ +20% sát thương, 3★ +40% sát thương.",
        actionPattern='ASSASSIN_BACK', effect='double_hit', damageType='physical', base='50', scaleStat='atk', scale='1.8'),
    make_row(id='unit_skill_reaper_void', name='Tất Sát Hư Không',
        descriptionVi="Tử Thần Hư Không triệu hồi lưỡi hái, gây sát thương vật lý (60 + 2.5x ATK). Sát thương +50% nếu mục tiêu dưới 30% HP. Sát thủ mạnh nhất. Mốc sao: 1★ sát thương gốc, 2★ +20% sát thương, 3★ +40% sát thương.",
        actionPattern='ASSASSIN_BACK', effect='single_burst', damageType='physical', base='60', scaleStat='atk', scale='2.5'),
]

# ══════════════════════════════════════════════════════════════
# SUPPORT SKILLS (20 units)
# ══════════════════════════════════════════════════════════════

SUPPORT = [
    # T1
    make_row(id='heal_over_time', name='Khúc Ca Sức Sống',
        descriptionVi="Nai Thần Ca hát bài ca sức sống gắn HoT hồi HP mỗi lượt cho đồng minh. 1★ 3 đồng minh hồi 5%HP/lượt 3 lượt; 2★ 4 đồng minh hồi 7%HP/lượt 3 lượt; 3★ toàn đội hồi 8%HP/lượt 4 lượt.",
        actionPattern='SELF', effect='heal_over_time', turns='3', maxTargets='3'),
    make_row(id='peace_heal_reduce', name='Cành Ô Liu',
        descriptionVi="Bồ Câu Hòa Bình trao cành ô liu cho đồng minh yếu nhất, hồi HP và giảm ST nhận. 1★ hồi (20+0.6xMATK) HP giảm 20% ST nhận 1 lượt; 2★ hồi (30+0.8xMATK) HP giảm 25% ST nhận 2 lượt; 3★ hồi (40+1.0xMATK) HP giảm 30% ST nhận 2 lượt cho 2 đồng minh yếu nhất.",
        actionPattern='SELF', effect='peace_heal_reduce_dmg', base='20', scaleStat='matk', scale='0.6', turns='1'),
    make_row(id='bless_rain_mdef', name='Mưa Phước Lành',
        descriptionVi="Hạc Phước triệu hồi mưa phước buff Kháng Phép cho toàn đội chống burst phép. 1★ +15 MDEF toàn đội 2 lượt; 2★ +20 MDEF toàn đội 3 lượt; 3★ +25 MDEF toàn đội 3 lượt + 10% giảm ST phép nhận vĩnh viễn 2 lượt.",
        actionPattern='SELF', effect='bless_rain_mdef', mdefBuff='15', turns='2'),
    make_row(id='light_purify', name='Ánh Sáng Chữa Lành',
        descriptionVi="Đom Đóm Chữa phát ánh sáng thanh tẩy xóa debuff và hồi HP cho đồng minh. 1★ xóa 1 debuff 2 đồng minh hồi 20HP mỗi người; 2★ xóa 2 debuff 3 đồng minh hồi 30HP mỗi người; 3★ xóa 2 debuff đồng đội hồi 40HP mỗi người + tạo khiên 20HP.",
        actionPattern='SELF', effect='light_purify', maxTargets='2'),
    # T2
    make_row(id='mirror_reflect', name='Vảy Gương',
        descriptionVi="Bướm Kính kích hoạt vảy gương tạo khiên và phản ST phép về kẻ tấn công. 1★ khiên (40+20%MATK) phản 25% phép 2 lượt; 2★ khiên (60+30%MATK) phản 35% phép 2 lượt; 3★ khiên (80+40%MATK) phản 45% phép 3 lượt lan khiên sang đồng minh kề.",
        actionPattern='SELF', effect='mirror_reflect', shieldBase='40', turns='2', shieldScaleStat='matk', shieldScale='0.20', reflectPct='0.25', reflectTurns='2'),
    make_row(id='unicorn_atk_buff', name='Sừng Kỳ Lân',
        descriptionVi="Kỳ Lân Sáng ban phước cho đồng minh ATK cao nhất tăng sức mạnh carry. 1★ buff ATK +25% 3 lượt 1 đồng minh; 2★ buff ATK +35% 3 lượt 1 đồng minh khư xắc vào đập; 3★ buff ATK +45% 4 lượt 2 đồng minh ATK cao nhất.",
        actionPattern='SELF', effect='unicorn_atk_buff', turns='3'),
    make_row(id='spring_aoe_heal', name='Suối Nguồn',
        descriptionVi="Tiên Rừng triệu hồi suối nguồn trong lành hồi HP cho toàn bộ đồng minh. 1★ toàn đội hồi (25+0.5xMATK) HP; 2★ toàn đội hồi (35+0.7xMATK) HP + xóa 1 debuff; 3★ toàn đội hồi (45+0.9xMATK) HP + xóa 1 debuff + tạo khiên 20.",
        actionPattern='SELF', effect='spring_aoe_heal', base='25', scaleStat='matk', scale='0.5'),
    make_row(id='root_snare', name='Rễ Cây Ràng Buộc',
        descriptionVi="Yêu Tinh Cây triệu hồi rễ cây quấn chặt mục tiêu gây ST phép kèm silence và tự hồi. 1★ ST gốc silence 1 lượt hồi 10%HP bản thân; 2★ +20% ST silence 2 lượt hồi 15%HP bản thân; 3★ +40% ST silence 2 lượt hồi 20%HP + rễ quấn 2 mục tiêu.",
        actionPattern='RANGED_STATIC', effect='root_snare_debuff', damageType='magic', base='18', scaleStat='matk', scale='0.6', turns='1'),
    # T3
    make_row(id='mimic_rage_buff', name='Bắt Chước',
        descriptionVi="Vẹt Linh Hô bắt chước buff mạnh nhất trong đội rồi trao cho đồng minh chưa có buff kèm tăng nộ. 1★ sao chép 1 buff +1 nộ cho 1 đồng minh; 2★ sao chép 2 buff +2 nộ cho 2 đồng minh; 3★ sao chép 2 buff +3 nộ cho toàn đội + kéo dài buff gốc thêm 1 lượt.",
        actionPattern='SELF', effect='mimic_rage_buff', rageGain='1'),
    make_row(id='soul_link_heal', name='Hồn Hộ Mệnh',
        descriptionVi="Hồn Ma Sáng liên kết linh hồn với đồng minh yếu nhất, hồi cho đồng minh tổng ST mà Hồn Ma nhận. 1★ hồi 100% ST nhận 2 lượt 1 đồng minh; 2★ hồi 120% ST nhận 2 lượt 1 đồng minh; 3★ hồi 150% ST nhận 3 lượt 2 đồng minh yếu nhất.",
        actionPattern='SELF', effect='soul_link_heal', turns='2'),
    make_row(id='mass_cleanse', name='Dòng Nước Thanh Tẩy',
        descriptionVi="Tiên Nước triệu hồi nước tinh khiết xóa debuff và hồi HP cho đồng minh. 1★ xóa cả debuff 1 đồng minh hồi 15%HP; 2★ xóa cả debuff 2 đồng minh hồi 15%HP mỗi người; 3★ xóa cả debuff toàn đội hồi 20%HP mỗi người.",
        actionPattern='SELF', effect='mass_cleanse'),
    make_row(id='wind_shield_ally', name='Gió Hộ Mệnh',
        descriptionVi="Yêu Tinh Gió tạo khiên gió bảo vệ đồng minh yếu nhất. 1★ khiên (35+30%MATK) 2 đồng minh yếu nhất; 2★ khiên (50+40%MATK) 2 đồng minh yếu nhất; 3★ khiên (65+50%MATK) 3 đồng minh yếu nhất + né 10% 2 lượt.",
        actionPattern='SELF', effect='wind_shield_ally', shieldBase='35', shieldScaleStat='matk', shieldScale='0.30', maxTargets='2'),
    # T4
    make_row(id='unit_skill_qilin_breeze', name='Lối Gió Ban Phước',
        descriptionVi="Kỳ Lân Gió tạo luồng gió băng giá buff ATK và né tránh cho đồng minh cùng cột. 1★ cột dọc +12ATK +12% né 2 lượt; 2★ cột dọc +16ATK +16% né 3 lượt; 3★ cột dọc +20ATK +20% né 3 lượt + lan hàng ngang kề cột (+10ATK +10% né).",
        actionPattern='SELF', effect='column_bless', turns='2', evadeBuff='0.12', atkBuff='12'),
    make_row(id='unit_skill_peacock_dazzle', name='Điệu Múa Mê Hoặc',
        descriptionVi="Khổng Tước Vũ múa vũ điệu mê hoặc làm yếu đượng toàn bộ kẻ địch. 1★ toàn địch −30% ATK 2 lượt; 2★ toàn địch −35% ATK 3 lượt 35% silence 1 lượt; 3★ toàn địch −40% ATK 3 lượt 50% silence 1 lượt.",
        actionPattern='RANGED_STATIC', effect='global_debuff_atk', damageType='magic', base='22', scaleStat='matk', scale='0.65', turns='2'),
    make_row(id='unit_skill_swan_grace', name='Khiên Tinh Khiết',
        descriptionVi="Thiên Nga Trắng tạo khiên nước tinh khiết cho đồng minh yếu nhất và xóa debuff. 1★ khiên (70+0.9xMATK) xóa 1 debuff 1 đồng minh; 2★ khiên (95+1.1xMATK) xóa 2 debuff 1 đồng minh; 3★ khiên (120+1.3xMATK) xóa 2 debuff 2 đồng minh yếu nhất.",
        actionPattern='SELF', effect='shield_cleanse', shieldBase='70', shieldScaleStat='matk', shieldScale='0.9'),
    make_row(id='revive_or_heal', name='Thiên Sứ Tái Sinh',
        descriptionVi="Thiên Thần Hộ Vệ cầu nguyện tái sinh đồng minh hoặc heal toàn đội. 1★ 50% hồi sinh đồng minh chết gần nhất 30%HP; không ai chết heal (30+0.4xMATK); 2★ 60% hồi sinh 2 đồng minh 35%HP; heal (40+0.6xMATK); 3★ 70% hồi sinh 2 đồng minh 40%HP; heal (50+0.8xMATK) + xóa 1 debuff toàn đội.",
        actionPattern='SELF', effect='revive_or_heal', base='30', scaleStat='matk', scale='0.4'),
    # T5
    make_row(id='phoenix_rebirth', name='Lửa Bất Diệt',
        descriptionVi="Phượng Hoàng Lửa kích hoạt ngọn lửa bất diệt, tự hồi sinh khi chết và dùng skill heal đồng minh. 1★ hồi sinh 1 lần 30%HP; dùng skill heal đồng minh yếu nhất 40%HP; 2★ hồi sinh 1 lần 40%HP; heal 2 đồng minh 45%HP; 3★ hồi sinh 1 lần 50%HP; heal toàn đội 30%HP + thiêu cả địch 25 khi phượng hoàng tái sinh.",
        actionPattern='SELF', effect='phoenix_rebirth'),
    make_row(id='unit_skill_lizard_elder', name='Phúc Lành Cổ Thụ',
        descriptionVi="Rồng Đất Cổ kêu gọi sức mạnh đại địa bảo vệ toàn đội và hồi HP đồng minh yếu. 1★ toàn đội +22Giáp/+22KP 3 lượt hồi 55HP yếu nhất; 2★ +30Giáp/+30KP 3 lượt hồi 80HP 2 yếu nhất; 3★ +38Giáp/+38KP 4 lượt hồi 110HP 2 yếu nhất + khiên (40+20%DEF) bản thân.",
        actionPattern='SELF', effect='team_def_buff', armorBuff='22', mdefBuff='22', turns='3'),
    make_row(id='unit_skill_seraphim_light', name='Thánh Ca Tái Sinh',
        descriptionVi="Seraphim Ánh Sáng hát thánh ca hồi máu đồng minh yếu nhất. 1★ 3 đồng minh hồi (45+1.3xMATK) HP; 2★ 4 đồng minh hồi (60+1.6xMATK) HP; 3★ toàn đội hồi (75+2.0xMATK) HP + xóa 1 debuff mỗi đồng minh.",
        actionPattern='SELF', effect='dual_heal', base='45', scaleStat='matk', scale='1.3', maxTargets='3'),
    make_row(id='unit_skill_oracle_wisdom', name='Kích Nộ Toàn Đội',
        descriptionVi="Tiên Tri Trí Tuệ hô vang tiếng gọi linh thiêng khưới dậy tinh thần chiến đấu toàn đội. 1★ +2 nộ toàn đội; 2★ +3 nộ toàn đội + hồi 10%HP yếu nhất; 3★ +4 nộ toàn đội + hồi 15%HP 2 đồng minh yếu nhất.",
        actionPattern='SELF', effect='team_rage', rageGain='2'),
]

ALL_SKILLS = TANKER + FIGHTER + MAGE + ARCHER + ASSASSIN + SUPPORT
