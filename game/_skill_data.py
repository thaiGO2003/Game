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
        descriptionVi="Gấu Cổ Thụ gầm vang rừng sâu, giảm ATK 15% của 2 kẻ địch gần nhất trong 3 lượt và tự hồi 10% HP tối đa. Hiệu quả khi đứng tiền tuyến hấp thụ sát thương. Mốc sao: 1★ hiệu lực gốc, 2★ +20% hiệu lực, 3★ +40% hiệu lực.",
        actionPattern='SELF', effect='roar_debuff_heal', turns='3', maxTargets='2'),
    make_row(id='unit_skill_ant_guard', name='Kiến Trận Đồ',
        descriptionVi="Kiến Hộ Vệ dựng tường khiên kiên cố, tăng +15 Giáp và +10 Kháng Phép cho toàn bộ đồng minh cùng hàng trong 2 lượt. Biến hàng tank thành bức tường thành vững chắc. Mốc sao: 1★ hiệu lực gốc, 2★ +20% hiệu lực, 3★ +40% hiệu lực.",
        actionPattern='SELF', effect='ally_row_def_buff', armorBuff='15', mdefBuff='10', turns='2'),
    make_row(id='badger_thorns', name='Gai Đá',
        descriptionVi="Lửng Đá kích hoạt lớp gai đá trên cơ thể, tự buff giáp +15 và phản 15% sát thương vật lý nhận được trong 3 lượt. Kẻ địch cận chiến tấn công sẽ bị chích gai gây sát thương ngược. Mốc sao: 1★ hiệu lực gốc, 2★ +20% hiệu lực, 3★ +40% hiệu lực.",
        actionPattern='SELF', effect='self_armor_reflect', reflectPct='0.15', armorBuff='15', turns='3'),
    make_row(id='ram_headbutt', name='Sừng Húc',
        descriptionVi="Cừu Núi Húc lao thẳng về phía trước húc văng kẻ địch bằng đôi sừng cứng như thép, gây sát thương vật lý (18 + 0.8x ATK) và đẩy lùi mục tiêu ra sau 1 ô. Phá vỡ đội hình tuyến đầu đối phương. Mốc sao: 1★ sát thương gốc, 2★ +20% sát thương, 3★ +40% sát thương.",
        actionPattern='MELEE_FRONT', effect='knockback_charge', damageType='physical', base='18', scaleStat='atk', scale='0.8'),
    # T2 - trung bình
    make_row(id='crab_guard', name='Kẹp Bảo Vệ',
        descriptionVi="Cua Giáp chọn đồng minh yếu nhất trên chiến trường và dùng đôi càng khổng lồ che chắn, hấp thụ 30% sát thương thay cho đồng minh đó trong 3 lượt. Biến Cua thành lá chắn sống bảo vệ carry. Mốc sao: 1★ hiệu lực gốc, 2★ +20% hiệu lực, 3★ +40% hiệu lực.",
        actionPattern='SELF', effect='guardian_pact', turns='3'),
    make_row(id='armadillo_roll', name='Cuộn Tròn',
        descriptionVi="Tatu Cuộn tròn mình thành quả cầu giáp cứng, tự tăng DEF +20 và MDEF +20 trong 2 lượt, đồng thời giảm 50% sát thương từ đòn tấn công kế tiếp. Phòng thủ tuyệt đối trong thời gian ngắn. Mốc sao: 1★ hiệu lực gốc, 2★ +20% hiệu lực, 3★ +40% hiệu lực.",
        actionPattern='SELF', effect='self_def_fortify', armorBuff='20', mdefBuff='20', turns='2'),
    make_row(id='snail_fortress', name='Pháo Đài Di Động',
        descriptionVi="Ốc Sên Pháo Đài rút vào lớp vỏ kiên cố tạo khiên bảo vệ (40 + 30% DEF) và miễn nhiễm mọi hiệu ứng khống chế trong 2 lượt. Tanker chống burst và CC hiệu quả. Mốc sao: 1★ hiệu lực gốc, 2★ +20% hiệu lực, 3★ +40% hiệu lực.",
        actionPattern='SELF', effect='self_shield_immune', shieldBase='40', turns='2', shieldScaleStat='def', shieldScale='0.30'),
    make_row(id='ox_endure', name='Chịu Đựng',
        descriptionVi="Bò Núi tích tụ sức mạnh đại địa, tự tăng HP tối đa +12% vĩnh viễn và hồi đầy phần HP được thêm. Tanker càng đánh càng trâu, hiệu quả trong trận đánh kéo dài. Mốc sao: 1★ hiệu lực gốc, 2★ +20% hiệu lực, 3★ +40% hiệu lực.",
        actionPattern='SELF', effect='self_maxhp_boost'),
    # T3 - khá
    make_row(id='turtle_shell', name='Mai Rùa Bất Tử',
        descriptionVi="Rùa Đầm Lầy rút vào lớp mai cổ đại tạo khiên lớn (60 + 40% DEF). Nếu khiên không bị phá vỡ sau 2 lượt thì hồi 15% HP tối đa. Tanker phòng thủ kéo dài cực mạnh. Mốc sao: 1★ hiệu lực gốc, 2★ +20% hiệu lực, 3★ +40% hiệu lực.",
        actionPattern='SELF', effect='resilient_shield', shieldBase='60', turns='2', shieldScaleStat='def', shieldScale='0.40'),
    make_row(id='unit_skill_pangolin_plate', name='Vảy Tê Tê',
        descriptionVi="Tê Tê Thiết Giáp kích hoạt lớp vảy sắc nhọn, phản lại 80% sát thương vật lý nhận được trong 3 lượt. Tướng phép và sát thương chuẩn hoàn toàn miễn nhiễm với phản đòn này. Mốc sao: 1★ hiệu lực gốc, 2★ +20% hiệu lực, 3★ +40% hiệu lực.",
        actionPattern='SELF', effect='pangolin_reflect', reflectPct='1', reflectTurns='3'),
    make_row(id='walrus_frost_aura', name='Hào Quang Băng',
        descriptionVi="Hải Mã Băng phát ra hào quang băng giá, buff DEF +15 và MDEF +12 cho 2 đồng minh lân cận trong 3 lượt. Tăng cường phòng thủ cho cả cụm tank. Mốc sao: 1★ hiệu lực gốc, 2★ +20% hiệu lực, 3★ +40% hiệu lực.",
        actionPattern='SELF', effect='frost_aura_buff', armorBuff='15', mdefBuff='12', turns='3', maxTargets='2'),
    make_row(id='golem_anchor', name='Mỏ Neo Đá',
        descriptionVi="Golem Đá đập mạnh xuống đất cắm mỏ neo đá, khiêu khích toàn bộ kẻ địch tấn công mình trong 2 lượt và tự tạo khiên bảo vệ (50 + 25% DEF). Gây sát thương vật lý nhẹ (15 + 0.4x DEF). Mốc sao: 1★ hiệu lực gốc, 2★ +20% hiệu lực, 3★ +40% hiệu lực.",
        actionPattern='MELEE_FRONT', effect='damage_shield_taunt', damageType='physical', base='15', scaleStat='def', scale='0.4', shieldBase='50', tauntTurns='2', shieldScaleStat='def', shieldScale='0.25'),
    # T4 - cao
    make_row(id='buffalo_mist_veil', name='Sương Mù Che Chắn',
        descriptionVi="Trâu Sương Mù triệu hồi lớp sương dày đặc bao phủ chiến trường, tăng né tránh +15% cho toàn bộ đồng minh trong 2 lượt. Giúp toàn đội né đòn hiệu quả hơn, đặc biệt chống sát thủ. Mốc sao: 1★ hiệu lực gốc, 2★ +20% hiệu lực, 3★ +40% hiệu lực.",
        actionPattern='SELF', effect='team_evade_buff', turns='2', evadeBuff='0.15'),
    make_row(id='unit_skill_elephant_guard', name='Voi Giẫm Đạp',
        descriptionVi="Voi Thiết Giáp dậm mạnh xuống đất gây chấn động, gây sát thương vật lý (35 + 1.0x ATK) lên 8 ô kề sát quanh bản thân và có 35% tỷ lệ làm choáng 1 lượt. Tanker kiểm soát đám đông diện rộng. Mốc sao: 1★ sát thương gốc, 2★ +20% sát thương, 3★ +40% sát thương.",
        actionPattern='MELEE_FRONT', effect='aoe_circle_stun', damageType='physical', base='35', scaleStat='atk', scale='1.0', stunChance='0.35', stunTurns='1'),
    make_row(id='yak_warcry', name='Tiếng Thét Chiến',
        descriptionVi="Bò Tây Tạng hét vang tiếng thét chiến đấu, buff ATK +15% cho toàn đội trong 2 lượt và tự tăng DEF +20 trong 3 lượt. Kết hợp tấn công và phòng thủ cho toàn đội. Mốc sao: 1★ hiệu lực gốc, 2★ +20% hiệu lực, 3★ +40% hiệu lực.",
        actionPattern='SELF', effect='warcry_atk_def', armorBuff='20', turns='3'),
    make_row(id='mammoth_rally', name='Tiếng Gọi Bầy Đàn',
        descriptionVi="Voi Ma Mút phát ra tiếng gọi nguyên thủy, hồi +2 nộ cho tất cả đồng minh và tự hồi 12% HP tối đa. Tăng tốc nộ toàn đội, giúp đồng đội tung chiêu nhanh hơn. Mốc sao: 1★ hiệu lực gốc, 2★ +20% hiệu lực, 3★ +40% hiệu lực.",
        actionPattern='SELF', effect='team_rage_self_heal', rageGain='2'),
    # T5 - rất cao
    make_row(id='kraken_grasp', name='Xúc Tu Kìm Kẹp',
        descriptionVi="Xoáy Nước Khổng Lồ phóng xúc tu khổng lồ kìm kẹp kẻ địch mạnh nhất, gây sát thương vật lý (40 + 0.8x DEF) và khóa skill mục tiêu trong 2 lượt. Vô hiệu hóa carry đối phương hoàn toàn. Mốc sao: 1★ sát thương gốc, 2★ +20% sát thương, 3★ +40% sát thương.",
        actionPattern='MELEE_FRONT', effect='single_silence_lock', damageType='physical', base='40', scaleStat='def', scale='0.8', turns='2'),
    make_row(id='unit_skill_titan_earth', name='Phúc Lành Đại Địa',
        descriptionVi="Titan Đất kêu gọi sức mạnh đại địa ẩn sâu, tăng +25 Giáp và +25 Kháng Phép cho toàn bộ đồng minh trong 3 lượt. Đồng thời hồi 60 HP cho đồng minh yếu nhất. Buff phòng thủ mạnh nhất game. Mốc sao: 1★ hiệu lực gốc, 2★ +20% hiệu lực, 3★ +40% hiệu lực.",
        actionPattern='SELF', effect='team_def_buff', armorBuff='25', mdefBuff='25', turns='3'),
    make_row(id='hydra_regen', name='Tái Sinh Đa Đầu',
        descriptionVi="Cá Nóc Đầm Lầy kích hoạt khả năng tái sinh nguyên thủy, hồi 10% HP bản thân mỗi lượt và hồi 5% HP cho 2 đồng minh yếu nhất. Tanker tự hồi phục vô tận trong trận đánh dài. Mốc sao: 1★ hiệu lực gốc, 2★ +20% hiệu lực, 3★ +40% hiệu lực.",
        actionPattern='SELF', effect='self_regen_team_heal', maxTargets='2'),
    make_row(id='dragon_earth_wall', name='Tường Đất Rồng',
        descriptionVi="Rồng Đất tạo tường đất khổng lồ bảo vệ toàn đội, tạo khiên cho toàn bộ đồng minh (40 + 25% DEF), bản thân nhận khiên gấp đôi. Phòng thủ toàn diện cấp cao nhất. Mốc sao: 1★ hiệu lực gốc, 2★ +20% hiệu lực, 3★ +40% hiệu lực.",
        actionPattern='SELF', effect='team_shield', shieldBase='40', turns='3', shieldScaleStat='def', shieldScale='0.25'),
]

# ══════════════════════════════════════════════════════════════
# FIGHTER SKILLS (20 units)
# ══════════════════════════════════════════════════════════════

FIGHTER = [
    # T1
    make_row(id='unit_skill_tiger_fang', name='Vuốt Hổ Xé Thịt',
        descriptionVi="Hổ Nanh lao lên và cào xé mục tiêu phía trước, gây sát thương vật lý (18 + 0.85x ATK) lên mục tiêu chính và gây chảy máu 2 lượt. Đấu sĩ bậc thấp gây damage ổn định. Mốc sao: 1★ sát thương gốc, 2★ +20% sát thương, 3★ +40% sát thương.",
        actionPattern='MELEE_FRONT', effect='column_bleed', damageType='physical', base='18', scaleStat='atk', scale='0.85', turns='2'),
    make_row(id='unit_skill_triceratops_charge', name='Sừng Ba Mũi',
        descriptionVi="Bò Rừng Xung Phong lao thẳng về phía trước húc văng kẻ địch bằng ba sừng, gây sát thương vật lý (20 + 0.8x ATK) và đẩy lùi mục tiêu 1 ô. Phá vỡ đội hình tuyến đầu. Mốc sao: 1★ sát thương gốc, 2★ +20% sát thương, 3★ +40% sát thương.",
        actionPattern='MELEE_FRONT', effect='knockback_charge', damageType='physical', base='20', scaleStat='atk', scale='0.8'),
    make_row(id='scout_buff_ally', name='Dẫn Đường Săn Mồi',
        descriptionVi="Báo Đốm Săn trinh sát chiến trường và chỉ huy đồng đội, buff ATK +10 và +1 nộ cho đồng minh cùng hàng. Hỗ trợ đấu sĩ khác tung chiêu nhanh hơn. Mốc sao: 1★ hiệu lực gốc, 2★ +20% hiệu lực, 3★ +40% hiệu lực.",
        actionPattern='SELF', effect='scout_buff_ally', atkBuff='10'),
    make_row(id='komodo_venom', name='Nọc Độc Kỳ Đà',
        descriptionVi="Kỳ Đà Khổng Lồ cắn mạnh vào mục tiêu bằng hàm răng nhiễm khuẩn, gây sát thương vật lý (18 + 0.8x ATK) kèm nọc độc 15 sát thương/lượt trong 3 lượt. Độc bào mòn máu địch hiệu quả. Mốc sao: 1★ sát thương gốc, 2★ +20% sát thương, 3★ +40% sát thương.",
        actionPattern='MELEE_FRONT', effect='single_strong_poison', damageType='physical', base='18', scaleStat='atk', scale='0.8', poisonTurns='3', poisonPerTurn='15'),
    # T2
    make_row(id='unit_skill_rhino_quake', name='Phản Đòn Địa Chấn',
        descriptionVi="Tê Giác Địa Chấn tích tụ năng lượng vào lớp da dày, mỗi khi bị kẻ địch cận chiến tấn công sẽ lập tức húc trả gây sát thương vật lý. Hiệu ứng kéo dài 3 lượt. Khắc chế sát thủ. Mốc sao: 1★ hiệu lực gốc, 2★ +20% hiệu lực, 3★ +40% hiệu lực.",
        actionPattern='SELF', effect='rhino_counter', turns='3'),
    make_row(id='otter_combo', name='Combo Rái Cá',
        descriptionVi="Rái Cá Sông tấn công nhanh rồi bổ thêm đòn vọng vào mục tiêu, gây sát thương vật lý chính (20 + 0.85x ATK) sau đó đòn vọng gây thêm (12 + 0.6x ATK). Tổng 2 đòn tạo burst bất ngờ. Mốc sao: 1★ sát thương gốc, 2★ +20% sát thương, 3★ +40% sát thương.",
        actionPattern='MELEE_FRONT', effect='single_delayed_echo', damageType='physical', base='20', scaleStat='atk', scale='0.85', echoBase='12', echoScale='0.6'),
    make_row(id='kangaroo_uppercut', name='Cú Đấm Bay',
        descriptionVi="Kangaroo Đấm tung 2 đòn liên tiếp bằng chân sau mạnh mẽ, mỗi đòn gây sát thương vật lý (22 + 0.9x ATK). Đấu sĩ combo nhanh với tổng sát thương cao. Mốc sao: 1★ sát thương gốc, 2★ +20% sát thương, 3★ +40% sát thương.",
        actionPattern='MELEE_FRONT', effect='double_hit', damageType='physical', base='22', scaleStat='atk', scale='0.9'),
    make_row(id='pack_howl_rage', name='Gọi Bầy',
        descriptionVi="Linh Cẩu Bầy tru gọi đồng đội, hồi +2 nộ cho tất cả đồng minh cùng hàng. Giúp đấu sĩ đồng hàng nhanh chóng tung chiêu thức, chiến thuật bầy đàn cực mạnh. Mốc sao: 1★ hiệu lực gốc, 2★ +20% hiệu lực, 3★ +40% hiệu lực.",
        actionPattern='SELF', effect='pack_howl_rage', rageGain='2', maxTargets='2'),
    # T3
    make_row(id='unit_skill_hippo_maul', name='Nện Bùn',
        descriptionVi="Hà Mã Nện nện mạnh xuống đất vào 3 ô phía trước theo dải tam giác, gây sát thương vật lý (28 + 1.1x ATK) lên toàn bộ mục tiêu trúng đòn. Kiểm soát tốt tuyến đầu diện rộng. Mốc sao: 1★ sát thương gốc, 2★ +20% sát thương, 3★ +40% sát thương.",
        actionPattern='MELEE_FRONT', effect='cone_smash', damageType='physical', base='28', scaleStat='atk', scale='1.1'),
    make_row(id='wolverine_frenzy', name='Cuồng Nộ Hải Ly',
        descriptionVi="Hải Ly Cuồng Nộ kích hoạt trạng thái cuồng nộ, tự tăng ATK 35% trong 3 lượt rồi lao vào tấn công mãnh liệt. Đấu sĩ tự buff sát thương cực mạnh, đổi phòng thủ lấy tấn công. Mốc sao: 1★ hiệu lực gốc, 2★ +20% hiệu lực, 3★ +40% hiệu lực.",
        actionPattern='MELEE_FRONT', effect='self_bersek', turns='3'),
    make_row(id='bison_charge', name='Húc Choáng',
        descriptionVi="Bò Rừng Dẫm lao đến húc mạnh mục tiêu bằng cặp sừng thép, gây sát thương vật lý (28 + 1.05x ATK) và có 45% tỷ lệ choáng 1 lượt. Đấu sĩ gây sát thương kèm khống chế. Mốc sao: 1★ sát thương gốc, 2★ +20% sát thương, 3★ +40% sát thương.",
        actionPattern='MELEE_FRONT', effect='damage_stun', damageType='physical', base='28', scaleStat='atk', scale='1.05', stunChance='0.45', stunTurns='1'),
    make_row(id='shark_bite_frenzy', name='Cắn Xé Điên Cuồng',
        descriptionVi="Cá Mập Điên cắn xé mục tiêu điên cuồng, gây sát thương vật lý (30 + 1.1x ATK) và hút 25% sát thương gây ra thành máu. Đấu sĩ tự hồi phục khi tấn công, sống dai trong trận dài. Mốc sao: 1★ sát thương gốc, 2★ +20% sát thương, 3★ +40% sát thương.",
        actionPattern='MELEE_FRONT', effect='single_burst_lifesteal', damageType='physical', base='30', scaleStat='atk', scale='1.1', lifesteal='0.25'),
    # T4
    make_row(id='unit_skill_beetle_drill', name='Mũi Khoan Xuyên',
        descriptionVi="Bọ Khoan Giáp xuyên thẳng vào mục tiêu bằng mũi khoan sắc bén, gây sát thương chuẩn (35 + 1.2x ATK) bỏ qua giáp và kháng phép. Đặc biệt hiệu quả chống tanker giáp dày. Mốc sao: 1★ sát thương gốc, 2★ +20% sát thương, 3★ +40% sát thương.",
        actionPattern='MELEE_FRONT', effect='true_single', damageType='true', base='35', scaleStat='atk', scale='1.2'),
    make_row(id='unit_skill_scorpion_king', name='Đuôi Độc Vua',
        descriptionVi="Vua Bọ Cạp chích đuôi vào mục tiêu, gây sát thương vật lý (32 + 1.15x ATK) và gây độc 18 sát thương/lượt trong 2 lượt. Ở sao cao độc lan sang ô liền kề. Mốc sao: 1★ sát thương gốc, 2★ +20% sát thương, 3★ +40% sát thương.",
        actionPattern='MELEE_FRONT', effect='single_poison_slow', damageType='physical', base='32', scaleStat='atk', scale='1.15', poisonTurns='2', poisonPerTurn='18'),
    make_row(id='unit_skill_crocodile_bite', name='Cá Sấu Tử Cuộn',
        descriptionVi="Cá Sấu Đầm cắn chặt mục tiêu và xoay tròn, gây sát thương vật lý (38 + 1.4x ATK) và làm mục tiêu chảy máu 15 sát thương/lượt trong 3 lượt. Đấu sĩ single-target cực mạnh. Mốc sao: 1★ sát thương gốc, 2★ +20% sát thương, 3★ +40% sát thương.",
        actionPattern='MELEE_FRONT', effect='single_bleed', damageType='physical', base='38', scaleStat='atk', scale='1.4', poisonTurns='3', poisonPerTurn='15'),
    make_row(id='unit_skill_gorilla_smash', name='Cú Đấm Ngàn Cân',
        descriptionVi="Đười Ươi Phẫn Nộ đấm mạnh xuống đất, gây sát thương vật lý (35 + 1.2x ATK) lên mục tiêu và 2 kẻ địch bên cạnh, đồng thời giảm 15 giáp trong 2 lượt. Đấu sĩ phá giáp diện rộng. Mốc sao: 1★ sát thương gốc, 2★ +20% sát thương, 3★ +40% sát thương.",
        actionPattern='MELEE_FRONT', effect='cleave_armor_break', damageType='physical', base='35', scaleStat='atk', scale='1.2', armorBreak='15', turns='2'),
    # T5
    make_row(id='unit_skill_lion_general', name='Sư Tử Hống',
        descriptionVi="Sư Tử Chiến Tướng gầm thét dũng mãnh, gây sát thương phép (40 + 1.0x ATK) lên toàn bộ kẻ địch và có 40% tỷ lệ làm choáng 1 lượt. Kỹ năng khống chế diện rộng cấp cao nhất của đấu sĩ. Mốc sao: 1★ sát thương gốc, 2★ +20% sát thương, 3★ +40% sát thương.",
        actionPattern='RANGED_STATIC', effect='global_stun', damageType='magic', base='40', scaleStat='atk', scale='1.0', stunChance='0.4', stunTurns='1'),
    make_row(id='unit_skill_trex_bite', name='Hàm Bạo Chúa',
        descriptionVi="Bạo Chúa T-Rex cắn nghiền mục tiêu với hàm răng khổng lồ, gây sát thương vật lý (55 + 2.2x ATK) và giảm 20 giáp trong 2 lượt. Sát thương đơn mục tiêu cao nhất của đấu sĩ. Mốc sao: 1★ sát thương gốc, 2★ +20% sát thương, 3★ +40% sát thương.",
        actionPattern='MELEE_FRONT', effect='single_armor_break', damageType='physical', base='55', scaleStat='atk', scale='2.2', armorBreak='20', turns='2'),
    make_row(id='unit_skill_whale_song', name='Sóng Cổ Đại',
        descriptionVi="Cá Voi Cổ Đại tạo sóng thần khổng lồ, gây sát thương phép (45 + 1.1x MATK) lên toàn bộ kẻ địch và đẩy lùi hàng trước 1 ô. Phá vỡ đội hình địch hoàn toàn. Mốc sao: 1★ sát thương gốc, 2★ +20% sát thương, 3★ +40% sát thương.",
        actionPattern='RANGED_STATIC', effect='global_knockback', damageType='magic', base='45', scaleStat='matk', scale='1.1'),
    make_row(id='unit_skill_chimera_flame', name='Hỏa Ngục Hổ',
        descriptionVi="Hổ Lửa phun lửa thiêu đốt toàn bộ kẻ địch, gây sát thương phép (42 + 1.0x MATK) và nhiễm cháy 15 sát thương/lượt trong 3 lượt. Đấu sĩ sát thương phép diện rộng cấp cao. Mốc sao: 1★ sát thương gốc, 2★ +20% sát thương, 3★ +40% sát thương.",
        actionPattern='RANGED_STATIC', effect='global_poison_team', damageType='magic', base='42', scaleStat='matk', scale='1.0', poisonTurns='3', poisonPerTurn='15'),
]

# ══════════════════════════════════════════════════════════════
# MAGE SKILLS (20 units)
# ══════════════════════════════════════════════════════════════

MAGE = [
    # T1
    make_row(id='poison_spit', name='Nhổ Độc',
        descriptionVi="Cóc Độc nhổ bọt độc vào mục tiêu, gây sát thương phép (15 + 0.6x MATK) và nhiễm độc cộng dồn 12 sát thương/lượt trong 2 lượt. Pháp sư bào mòn máu hiệu quả. Mốc sao: 1★ sát thương gốc, 2★ +20% sát thương, 3★ +40% sát thương.",
        actionPattern='RANGED_STATIC', effect='single_poison_stack', damageType='magic', base='15', scaleStat='matk', scale='0.6', poisonTurns='2', poisonPerTurn='12'),
    make_row(id='fire_breath_cone', name='Phun Lửa Núi',
        descriptionVi="Kỳ Nhông Núi Lửa phun lửa vào 3 ô phía trước theo hình nón, gây sát thương phép (18 + 0.7x MATK) và đốt cháy mục tiêu 10 sát thương/lượt trong 2 lượt. Pháp sư vùng ảnh hưởng bậc thấp. Mốc sao: 1★ sát thương gốc, 2★ +20% sát thương, 3★ +40% sát thương.",
        actionPattern='RANGED_STATIC', effect='fire_breath_cone', damageType='magic', base='18', scaleStat='matk', scale='0.7', poisonTurns='2', poisonPerTurn='10'),
    make_row(id='fireball_burn', name='Quả Cầu Lửa',
        descriptionVi="Thạch Hỏa phóng quả cầu lửa nổ tại vị trí mục tiêu, gây sát thương phép (20 + 0.75x MATK) lên mục tiêu và 8 ô kề sát. Sát thương diện rộng của pháp sư bậc thấp. Mốc sao: 1★ sát thương gốc, 2★ +20% sát thương, 3★ +40% sát thương.",
        actionPattern='RANGED_STATIC', effect='fireball_burn', damageType='magic', base='20', scaleStat='matk', scale='0.75'),
    make_row(id='chain_shock', name='Dòng Điện Tê Liệt',
        descriptionVi="Sứa Điện phóng dòng điện lan sang 2 mục tiêu ngẫu nhiên gần đó, gây sát thương phép (18 + 0.65x MATK) mỗi mục tiêu. Pháp sư đa mục tiêu bậc thấp. Mốc sao: 1★ sát thương gốc, 2★ +20% sát thương, 3★ +40% sát thương.",
        actionPattern='RANGED_STATIC', effect='chain_shock', damageType='magic', base='18', scaleStat='matk', scale='0.65'),
    # T2
    make_row(id='frost_storm', name='Bão Tuyết',
        descriptionVi="Chuồn Chuồn Băng triệu hồi bão tuyết gây sát thương phép (22 + 0.8x MATK) lên nguyên hàng ngang và giảm ATK mục tiêu 15% trong 2 lượt. Pháp sư kiểm soát diện rộng. Mốc sao: 1★ sát thương gốc, 2★ +20% sát thương, 3★ +40% sát thương.",
        actionPattern='RANGED_STATIC', effect='frost_storm', damageType='magic', base='22', scaleStat='matk', scale='0.8', turns='2'),
    make_row(id='ice_blast_freeze', name='Phun Băng',
        descriptionVi="Cóc Băng phun luồng băng cực lạnh vào mục tiêu, gây sát thương phép (25 + 0.85x MATK) và có 40% tỷ lệ đóng băng 1 lượt. Pháp sư đóng băng khống chế hiệu quả. Mốc sao: 1★ sát thương gốc, 2★ +20% sát thương, 3★ +40% sát thương.",
        actionPattern='RANGED_STATIC', effect='ice_blast_freeze', damageType='magic', base='25', scaleStat='matk', scale='0.85', freezeChance='0.40', freezeTurns='1'),
    make_row(id='ink_bomb_blind', name='Bom Mực',
        descriptionVi="Tôm Phun phun mực tạo bom mực nổ tại 9 ô vuông quanh mục tiêu, gây sát thương phép (20 + 0.7x MATK) và giảm chính xác kẻ địch trong 2 lượt. Pháp sư vùng rộng debuff. Mốc sao: 1★ sát thương gốc, 2★ +20% sát thương, 3★ +40% sát thương.",
        actionPattern='RANGED_STATIC', effect='ink_bomb_blind', damageType='magic', base='20', scaleStat='matk', scale='0.7'),
    make_row(id='ink_blast_debuff', name='Mực Phun Giảm Giáp',
        descriptionVi="Bạch Tuộc Tâm phun mực lên nguyên cột mục tiêu, gây sát thương phép (22 + 0.75x MATK) và giảm DEF 15% trong 2 lượt. Pháp sư hỗ trợ phá giáp cho đồng đội. Mốc sao: 1★ sát thương gốc, 2★ +20% sát thương, 3★ +40% sát thương.",
        actionPattern='RANGED_STATIC', effect='ink_blast_debuff', damageType='magic', base='22', scaleStat='matk', scale='0.75', turns='2', armorBreak='15'),
    # T3
    make_row(id='unit_skill_storm_mage', name='Lôi Trụ Tách Nhánh',
        descriptionVi="Rắn Lôi dội sét xuống cột mục tiêu gây sát thương phép (30 + 1.0x MATK), sau đó lan sang 2 kẻ địch gần nhất gây sát thương đầy đủ. Pháp sư sét liên hoàn cực mạnh. Mốc sao: 1★ sát thương gốc, 2★ +20% sát thương, 3★ +40% sát thương.",
        actionPattern='RANGED_STATIC', effect='column_plus_splash', damageType='magic', base='30', scaleStat='matk', scale='1.0', splashCount='2'),
    make_row(id='unit_skill_worm_queen', name='Hóa Kén Bướm Gió',
        descriptionVi="Sâu Xanh hóa kén để trưởng thành thành Bướm Gió, tăng mạnh MATK +50% và đòn đánh thường chuyển thành sát thương phép. Nếu đạt 2★, toàn đội được buff né tránh. Biến đổi hoàn toàn chiến đấu. Mốc sao: 1★ hiệu lực gốc, 2★ +20% hiệu lực, 3★ +40% hiệu lực.",
        actionPattern='SELF', effect='metamorphosis', buffStats='{"matk":1.5}'),
    make_row(id='flash_blind', name='Lóe Sáng',
        descriptionVi="Đom Đóm Sáng phát ra ánh sáng chói lòa, gây sát thương phép nhỏ (18 + 0.55x MATK) lên toàn bộ kẻ địch và giảm chính xác 15% trong 2 lượt. Pháp sư debuff diện rộng. Mốc sao: 1★ sát thương gốc, 2★ +20% sát thương, 3★ +40% sát thương.",
        actionPattern='RANGED_STATIC', effect='flash_blind', damageType='magic', base='18', scaleStat='matk', scale='0.55'),
    make_row(id='dust_sleep', name='Bụi Mê',
        descriptionVi="Ruồi Đêm Bụi rải bụi mê huyền bí lên 9 ô vuông quanh mục tiêu, gây sát thương phép (22 + 0.7x MATK) và có 30% tỷ lệ ru ngủ 1 lượt. Pháp sư khống chế vùng rộng. Mốc sao: 1★ sát thương gốc, 2★ +20% sát thương, 3★ +40% sát thương.",
        actionPattern='RANGED_STATIC', effect='dust_sleep', damageType='magic', base='22', scaleStat='matk', scale='0.7', sleepChance='0.30', sleepTurns='1'),
    # T4
    make_row(id='unit_skill_spore_mage', name='Mưa Bào Tử',
        descriptionVi="Nhện Bào Tử rải bào tử độc lên vùng rộng quanh mục tiêu, gây sát thương phép (32 + 1.0x MATK) và nhiễm độc 15 sát thương/lượt trong 2 lượt. Pháp sư vùng rộng + DOT cấp cao. Mốc sao: 1★ sát thương gốc, 2★ +20% sát thương, 3★ +40% sát thương.",
        actionPattern='RANGED_STATIC', effect='aoe_poison', damageType='magic', base='32', scaleStat='matk', scale='1.0', poisonTurns='2', poisonPerTurn='15'),
    make_row(id='plague_spread', name='Dịch Bệnh Lan',
        descriptionVi="Bọ Dịch Hạch phun dịch bệnh lên mục tiêu, gây sát thương phép (28 + 0.85x MATK) và dịch bệnh lan sang kẻ địch lân cận gây 12 sát thương/lượt trong 3 lượt. Pháp sư DOT lây lan. Mốc sao: 1★ sát thương gốc, 2★ +20% sát thương, 3★ +40% sát thương.",
        actionPattern='RANGED_STATIC', effect='plague_spread', damageType='magic', base='28', scaleStat='matk', scale='0.85', poisonTurns='3', poisonPerTurn='12'),
    make_row(id='pollen_confuse', name='Phấn Hoa Mê',
        descriptionVi="Phù Thủy Ong rải phấn hoa mê hoặc lên toàn bộ kẻ địch, gây sát thương phép nhỏ (20 + 0.6x MATK) và có 35% tỷ lệ im lặng mục tiêu 1 lượt. Pháp sư silence diện rộng. Mốc sao: 1★ sát thương gốc, 2★ +20% sát thương, 3★ +40% sát thương.",
        actionPattern='RANGED_STATIC', effect='pollen_confuse', damageType='magic', base='20', scaleStat='matk', scale='0.6'),
    make_row(id='unit_skill_beetle_mystic', name='Cầu Vồng Bọ Huyền',
        descriptionVi="Bọ Huyền triệu hồi cột băng khổng lồ đánh toàn bộ địch trong cùng cột, gây sát thương phép (35 + 1.1x MATK) và 40% đóng băng 1 lượt. Pháp sư băng cấp cao. Mốc sao: 1★ sát thương gốc, 2★ +20% sát thương, 3★ +40% sát thương.",
        actionPattern='RANGED_STATIC', effect='column_freeze', damageType='magic', base='35', scaleStat='matk', scale='1.1', freezeChance='0.40', freezeTurns='1'),
    # T5
    make_row(id='unit_skill_dragon_breath', name='Hỏa Ngục Rồng',
        descriptionVi="Rồng Lửa phun lửa thiêu đốt toàn bộ kẻ địch trên chiến trường, gây sát thương phép (42 + 1.1x MATK) và nhiễm cháy 18 sát thương/lượt trong 3 lượt. Pháp sư sát thương diện rộng cấp cao nhất. Mốc sao: 1★ sát thương gốc, 2★ +20% sát thương, 3★ +40% sát thương.",
        actionPattern='RANGED_STATIC', effect='global_poison_team', damageType='magic', base='42', scaleStat='matk', scale='1.1', poisonTurns='3', poisonPerTurn='18'),
    make_row(id='unit_skill_kraken_void', name='Xúc Tu Hư Không',
        descriptionVi="Kraken Hư Không triệu hồi xúc tu từ hư không, gây sát thương phép (40 + 1.2x MATK) lên 4 mục tiêu ngẫu nhiên. Mỗi xúc tu gây sát thương độc lập. Pháp sư đa mục tiêu T5. Mốc sao: 1★ sát thương gốc, 2★ +20% sát thương, 3★ +40% sát thương.",
        actionPattern='RANGED_STATIC', effect='random_multi', damageType='magic', base='40', scaleStat='matk', scale='1.2', maxHits='4'),
    make_row(id='unit_skill_kirin_thunder', name='Phán Quyết Kỳ Lân',
        descriptionVi="Kỳ Lân Lôi triệu hồi sét trời giáng xuống toàn bộ kẻ địch, gây sát thương phép (45 + 1.1x MATK) và 40% tỷ lệ choáng 1 lượt. Pháp sư khống chế toàn trường mạnh nhất. Mốc sao: 1★ sát thương gốc, 2★ +20% sát thương, 3★ +40% sát thương.",
        actionPattern='RANGED_STATIC', effect='global_stun', damageType='magic', base='45', scaleStat='matk', scale='1.1', stunChance='0.40', stunTurns='1'),
    make_row(id='unit_skill_lich_undead', name='Lời Nguyền Bất Tử',
        descriptionVi="Lich Bất Tử triệu hồi cột băng khổng lồ đánh toàn bộ địch trong cùng cột, gây sát thương phép (48 + 1.3x MATK) và 50% đóng băng 1 lượt. Pháp sư băng cấp cao nhất với tỷ lệ CC kinh hoàng. Mốc sao: 1★ sát thương gốc, 2★ +20% sát thương, 3★ +40% sát thương.",
        actionPattern='RANGED_STATIC', effect='column_freeze', damageType='magic', base='48', scaleStat='matk', scale='1.3', freezeChance='0.50', freezeTurns='1'),
]

# ══════════════════════════════════════════════════════════════
# ARCHER SKILLS (20 units)
# ══════════════════════════════════════════════════════════════

ARCHER = [
    # T1
    make_row(id='rock_throw_stun', name='Ném Đá',
        descriptionVi="Khỉ Lao Cành nhặt đá ném mạnh vào mục tiêu, gây sát thương vật lý (18 + 0.7x ATK) và 35% choáng 1 lượt. Xạ thủ đơn mục tiêu có CC. Mốc sao: 1★ sát thương gốc, 2★ +20% sát thương, 3★ +40% sát thương.",
        actionPattern='RANGED_STATIC', effect='rock_throw_stun', damageType='physical', base='18', scaleStat='atk', scale='0.7', stunChance='0.35', stunTurns='1'),
    make_row(id='multi_sting_poison', name='Châm Liên Hoàn',
        descriptionVi="Ong Bắp Cày phóng kim độc vào 2 mục tiêu ngẫu nhiên, mỗi kim gây sát thương vật lý (15 + 0.65x ATK) kèm độc 10 sát thương/lượt trong 2 lượt. Mốc sao: 1★ sát thương gốc, 2★ +20% sát thương, 3★ +40% sát thương.",
        actionPattern='RANGED_STATIC', effect='multi_sting_poison', damageType='physical', base='15', scaleStat='atk', scale='0.65', maxHits='2', poisonTurns='2', poisonPerTurn='10'),
    make_row(id='heat_seek', name='Tầm Nhiệt',
        descriptionVi="Diều Hâu Săn tự động tìm kẻ địch HP thấp nhất, gây sát thương vật lý (20 + 0.75x ATK). Nếu mục tiêu dưới 50% HP, sát thương x2. Xạ thủ kết liễu. Mốc sao: 1★ sát thương gốc, 2★ +20% sát thương, 3★ +40% sát thương.",
        actionPattern='RANGED_STATIC', effect='heat_seek', damageType='physical', base='20', scaleStat='atk', scale='0.75'),
    make_row(id='piercing_shot', name='Lao Xuyên',
        descriptionVi="Cắt Lao bắn mũi tên xuyên tất cả kẻ địch cùng hàng, gây sát thương vật lý (18 + 0.7x ATK). Sát thương giảm 20% mỗi mục tiêu tiếp theo. Mốc sao: 1★ sát thương gốc, 2★ +20% sát thương, 3★ +40% sát thương.",
        actionPattern='RANGED_STATIC', effect='piercing_shot', damageType='physical', base='18', scaleStat='atk', scale='0.7'),
    # T2
    make_row(id='arrow_rain', name='Mưa Tên',
        descriptionVi="Đại Bàng Xạ Thủ bắn 4 mũi tên ngẫu nhiên, mỗi mũi gây sát thương vật lý (12 + 0.5x ATK). Có thể trùng mục tiêu. Xạ thủ đa mục tiêu. Mốc sao: 1★ sát thương gốc, 2★ +20% sát thương, 3★ +40% sát thương.",
        actionPattern='RANGED_STATIC', effect='arrow_rain', damageType='physical', base='12', scaleStat='atk', scale='0.5', maxHits='4'),
    make_row(id='snipe_execute', name='Mỏ Xuyên Kết Liễu',
        descriptionVi="Diệc Xuyên nhắm bắn chính xác mục tiêu, gây sát thương vật lý (22 + 0.85x ATK). Nếu mục tiêu dưới 30% HP, sát thương x2. Xạ thủ kết liễu. Mốc sao: 1★ sát thương gốc, 2★ +20% sát thương, 3★ +40% sát thương.",
        actionPattern='RANGED_STATIC', effect='snipe_execute', damageType='physical', base='22', scaleStat='atk', scale='0.85'),
    make_row(id='beak_disarm', name='Mỏ Kẹp',
        descriptionVi="Chim Mỏ To kẹp vũ khí mục tiêu, gây sát thương vật lý (20 + 0.8x ATK) và vô hiệu hóa đòn thường 1 lượt. Xạ thủ debuff. Mốc sao: 1★ sát thương gốc, 2★ +20% sát thương, 3★ +40% sát thương.",
        actionPattern='RANGED_STATIC', effect='beak_disarm', damageType='physical', base='20', scaleStat='atk', scale='0.8', turns='1'),
    make_row(id='rapid_fire', name='Khoan Liên Tục',
        descriptionVi="Gõ Kiến Khoan bắn 3 phát liên tục vào cùng mục tiêu, mỗi phát gây sát thương vật lý (10 + 0.45x ATK). Tổng 3 phát burst cao. Mốc sao: 1★ sát thương gốc, 2★ +20% sát thương, 3★ +40% sát thương.",
        actionPattern='RANGED_STATIC', effect='rapid_fire', damageType='physical', base='10', scaleStat='atk', scale='0.45', maxHits='3'),
    # T3
    make_row(id='unit_skill_owl_nightshot', name='Mũi Tên Ngủ',
        descriptionVi="Cú Đêm bắn tên tẩm thuốc mê, gây sát thương vật lý (28 + 1.05x ATK). Chọn kẻ địch nộ cao nhất ru ngủ: 1★ ru 1, 2★ ru 2, 3★ ru 3, tỷ lệ 35%/mục tiêu. Mốc sao: 1★ sát thương gốc, 2★ +20% sát thương, 3★ +40% sát thương.",
        actionPattern='RANGED_STATIC', effect='single_sleep', damageType='physical', base='28', scaleStat='atk', scale='1.05', sleepChance='0.35', sleepTurns='1'),
    make_row(id='fish_bomb_aoe', name='Bom Cá',
        descriptionVi="Bồ Nông Bom ném bom cá nổ tại mục tiêu, gây sát thương vật lý (25 + 0.9x ATK) lên mục tiêu và 8 ô kề sát, 30% choáng 1 lượt. Xạ thủ AoE. Mốc sao: 1★ sát thương gốc, 2★ +20% sát thương, 3★ +40% sát thương.",
        actionPattern='RANGED_STATIC', effect='fish_bomb_aoe', damageType='physical', base='25', scaleStat='atk', scale='0.9', stunChance='0.30', stunTurns='1'),
    make_row(id='sniper_crit', name='Phát Bắn Tỉa',
        descriptionVi="Cò Bắn Tỉa bắn vào điểm yếu mục tiêu, gây sát thương vật lý (32 + 1.15x ATK) và bỏ qua 50% giáp. Xạ thủ single-target cực mạnh. Mốc sao: 1★ sát thương gốc, 2★ +20% sát thương, 3★ +40% sát thương.",
        actionPattern='RANGED_STATIC', effect='sniper_crit', damageType='physical', base='32', scaleStat='atk', scale='1.15', armorPen='0.5'),
    make_row(id='fire_arrow_burn', name='Tên Lửa Hồng',
        descriptionVi="Hồng Hạc Bắn bắn tên lửa cháy, gây sát thương vật lý (28 + 1.0x ATK) kèm đốt cháy 12 sát thương/lượt trong 3 lượt. Xạ thủ DOT. Mốc sao: 1★ sát thương gốc, 2★ +20% sát thương, 3★ +40% sát thương.",
        actionPattern='RANGED_STATIC', effect='fire_arrow_burn', damageType='physical', base='28', scaleStat='atk', scale='1.0', poisonTurns='3', poisonPerTurn='12'),
    # T4
    make_row(id='unit_skill_cat_goldbow', name='Phá Giáp Tiễn',
        descriptionVi="Ong Lửa bắn tên phá giáp, gây sát thương vật lý (32 + 1.25x ATK) và giảm 15 giáp mục tiêu trong 2 lượt. Setup cho đồng đội dồn damage. Mốc sao: 1★ sát thương gốc, 2★ +20% sát thương, 3★ +40% sát thương.",
        actionPattern='RANGED_STATIC', effect='single_armor_break', damageType='physical', base='32', scaleStat='atk', scale='1.25', armorBreak='15', turns='2'),
    make_row(id='dark_feather_debuff', name='Bão Lông Vũ Đen',
        descriptionVi="Quạ Bão Táp phóng 3 lông vũ đen vào 3 mục tiêu ngẫu nhiên, gây sát thương vật lý (25 + 0.85x ATK) mỗi mục tiêu và giảm ATK 15% trong 2 lượt. Mốc sao: 1★ sát thương gốc, 2★ +20% sát thương, 3★ +40% sát thương.",
        actionPattern='RANGED_STATIC', effect='dark_feather_debuff', damageType='physical', base='25', scaleStat='atk', scale='0.85', maxHits='3', turns='2'),
    make_row(id='dive_bomb', name='Bổ Nhào',
        descriptionVi="Diều Hâu Khổng Lồ bổ nhào xuống nguyên cột mục tiêu, gây sát thương vật lý (35 + 1.3x ATK) và giảm 15 giáp trong 2 lượt. Xạ thủ AoE cột. Mốc sao: 1★ sát thương gốc, 2★ +20% sát thương, 3★ +40% sát thương.",
        actionPattern='RANGED_STATIC', effect='dive_bomb', damageType='physical', base='35', scaleStat='atk', scale='1.3', armorBreak='15', turns='2'),
    make_row(id='feather_bleed', name='Lông Vũ Cắt',
        descriptionVi="Hải Âu Gió phóng 3 lông vũ sắc nhọn vào 3 mục tiêu ngẫu nhiên, gây sát thương vật lý (30 + 1.1x ATK) kèm chảy máu 10/lượt trong 2 lượt. Mốc sao: 1★ sát thương gốc, 2★ +20% sát thương, 3★ +40% sát thương.",
        actionPattern='RANGED_STATIC', effect='feather_bleed', damageType='physical', base='30', scaleStat='atk', scale='1.1', maxHits='3', poisonTurns='2', poisonPerTurn='10'),
    # T5
    make_row(id='unit_skill_phoenix_arrow', name='Lông Vũ Bão Táp',
        descriptionVi="Phượng Hoàng Tên phóng lông vũ rực lửa vào 3 ô hình nón, gây sát thương vật lý (45 + 1.6x ATK). Xạ thủ AoE cone T5 cực mạnh. Mốc sao: 1★ sát thương gốc, 2★ +20% sát thương, 3★ +40% sát thương.",
        actionPattern='RANGED_STATIC', effect='cone_shot', damageType='physical', base='45', scaleStat='atk', scale='1.6'),
    make_row(id='unit_skill_garuda_divine', name='Bão Kim Thần',
        descriptionVi="Garuda Thần phóng kim thần vào mục tiêu ngẫu nhiên: 1★ bắn 3, 2★ bắn 4, 3★ bắn 5 mục tiêu. Mỗi kim gây sát thương vật lý (42 + 1.5x ATK). Mốc sao: 1★ sát thương gốc, 2★ +20% sát thương, 3★ +40% sát thương.",
        actionPattern='RANGED_STATIC', effect='random_multi', damageType='physical', base='42', scaleStat='atk', scale='1.5', maxHits='3'),
    make_row(id='unit_skill_thunderbird_storm', name='Xuyên Hàng Sấm',
        descriptionVi="Chim Sấm Sét bắn tên sét xuyên hàng, gây sát thương vật lý (48 + 1.7x ATK) cho tối đa 4 mục tiêu kèm 25% choáng 1 lượt. Mốc sao: 1★ sát thương gốc, 2★ +20% sát thương, 3★ +40% sát thương.",
        actionPattern='RANGED_STATIC', effect='row_multi', damageType='physical', base='48', scaleStat='atk', scale='1.7', maxHits='4', stunChance='0.25', stunTurns='1'),
    make_row(id='unit_skill_roc_legend', name='Tên Thập Tự Huyền Thoại',
        descriptionVi="Đại Bàng Huyền Thoại bắn tên nổ hình thập (+) vào mục tiêu, gây sát thương vật lý (50 + 1.8x ATK) lên mục tiêu và 4 ô liền kề. Mốc sao: 1★ sát thương gốc, 2★ +20% sát thương, 3★ +40% sát thương.",
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
        descriptionVi="Nai Thần Ca hát bài ca sức sống, gắn HoT cho 3 đồng minh, hồi 5% HP mỗi lượt trong 3 lượt. Hỗ trợ hồi máu ổn định. Mốc sao: 1★ hiệu lực gốc, 2★ +20% hiệu lực, 3★ +40% hiệu lực.",
        actionPattern='SELF', effect='heal_over_time', turns='3', maxTargets='3'),
    make_row(id='peace_heal_reduce', name='Cành Ô Liu',
        descriptionVi="Bồ Câu Hòa Bình trao cành ô liu cho đồng minh yếu nhất, hồi (20 + 0.6x MATK) HP và giảm 20% damage nhận 1 lượt. Mốc sao: 1★ hiệu lực gốc, 2★ +20% hiệu lực, 3★ +40% hiệu lực.",
        actionPattern='SELF', effect='peace_heal_reduce_dmg', base='20', scaleStat='matk', scale='0.6', turns='1'),
    make_row(id='bless_rain_mdef', name='Mưa Phước Lành',
        descriptionVi="Hạc Phước triệu hồi mưa phước, buff MDEF +15 cho toàn đội trong 2 lượt. Chống burst phép hiệu quả. Mốc sao: 1★ hiệu lực gốc, 2★ +20% hiệu lực, 3★ +40% hiệu lực.",
        actionPattern='SELF', effect='bless_rain_mdef', mdefBuff='15', turns='2'),
    make_row(id='light_purify', name='Ánh Sáng Chữa Lành',
        descriptionVi="Đom Đóm Chữa phát ánh sáng thanh tẩy, xóa 1 debuff của 2 đồng minh và hồi 20 HP mỗi người. Hỗ trợ cleanse. Mốc sao: 1★ hiệu lực gốc, 2★ +20% hiệu lực, 3★ +40% hiệu lực.",
        actionPattern='SELF', effect='light_purify', maxTargets='2'),
    # T2
    make_row(id='mirror_reflect', name='Vảy Gương',
        descriptionVi="Bướm Kính kích hoạt vảy gương, tạo khiên (40 + 20% MATK) và phản 25% sát thương phép trong 2 lượt. Hỗ trợ chống phép. Mốc sao: 1★ hiệu lực gốc, 2★ +20% hiệu lực, 3★ +40% hiệu lực.",
        actionPattern='SELF', effect='mirror_reflect', shieldBase='40', turns='2', shieldScaleStat='matk', shieldScale='0.20', reflectPct='0.25', reflectTurns='2'),
    make_row(id='unicorn_atk_buff', name='Sừng Kỳ Lân',
        descriptionVi="Kỳ Lân Sáng ban phước cho đồng minh ATK cao nhất, buff ATK +25% trong 3 lượt. Tăng sức mạnh carry. Mốc sao: 1★ hiệu lực gốc, 2★ +20% hiệu lực, 3★ +40% hiệu lực.",
        actionPattern='SELF', effect='unicorn_atk_buff', turns='3'),
    make_row(id='spring_aoe_heal', name='Suối Nguồn',
        descriptionVi="Tiên Rừng triệu hồi suối nguồn hồi (25 + 0.5x MATK) HP cho tất cả đồng minh. Heal toàn đội. Mốc sao: 1★ hiệu lực gốc, 2★ +20% hiệu lực, 3★ +40% hiệu lực.",
        actionPattern='SELF', effect='spring_aoe_heal', base='25', scaleStat='matk', scale='0.5'),
    make_row(id='root_snare', name='Rễ Cây Ràng Buộc',
        descriptionVi="Yêu Tinh Cây triệu hồi rễ cây quấn mục tiêu, gây sát thương phép (18 + 0.6x MATK) và silence 1 lượt, tự hồi 10% HP. Mốc sao: 1★ sát thương gốc, 2★ +20% sát thương, 3★ +40% sát thương.",
        actionPattern='RANGED_STATIC', effect='root_snare_debuff', damageType='magic', base='18', scaleStat='matk', scale='0.6', turns='1'),
    # T3
    make_row(id='mimic_rage_buff', name='Bắt Chước',
        descriptionVi="Vẹt Linh Hô bắt chước buff mạnh nhất trong đội rồi trao cho đồng minh chưa có buff. Kèm +1 nộ. Hỗ trợ chiến thuật linh hoạt. Mốc sao: 1★ hiệu lực gốc, 2★ +20% hiệu lực, 3★ +40% hiệu lực.",
        actionPattern='SELF', effect='mimic_rage_buff', rageGain='1'),
    make_row(id='soul_link_heal', name='Hồn Hộ Mệnh',
        descriptionVi="Hồn Ma Sáng liên kết linh hồn với đồng minh yếu nhất, hồi 100% damage mà Hồn Ma nhận trong 2 lượt cho đồng minh đó. Mốc sao: 1★ hiệu lực gốc, 2★ +20% hiệu lực, 3★ +40% hiệu lực.",
        actionPattern='SELF', effect='soul_link_heal', turns='2'),
    make_row(id='mass_cleanse', name='Dòng Nước Thanh Tẩy',
        descriptionVi="Tiên Nước triệu hồi nước tinh khiết, xóa tất cả debuff 1 đồng minh và hồi 15% HP. Hỗ trợ cleanse mạnh. Mốc sao: 1★ hiệu lực gốc, 2★ +20% hiệu lực, 3★ +40% hiệu lực.",
        actionPattern='SELF', effect='mass_cleanse'),
    make_row(id='wind_shield_ally', name='Gió Hộ Mệnh',
        descriptionVi="Yêu Tinh Gió tạo khiên gió (35 + 30% MATK) cho 2 đồng minh yếu nhất. Bảo vệ carry hiệu quả. Mốc sao: 1★ hiệu lực gốc, 2★ +20% hiệu lực, 3★ +40% hiệu lực.",
        actionPattern='SELF', effect='wind_shield_ally', shieldBase='35', shieldScaleStat='matk', shieldScale='0.30', maxTargets='2'),
    # T4
    make_row(id='unit_skill_qilin_breeze', name='Lối Gió Ban Phước',
        descriptionVi="Kỳ Lân Gió tạo luồng gió, tăng +12 ATK và +12% né tránh cho đồng minh cùng cột 2 lượt. Hỗ trợ buff cột. Mốc sao: 1★ hiệu lực gốc, 2★ +20% hiệu lực, 3★ +40% hiệu lực.",
        actionPattern='SELF', effect='column_bless', turns='2', evadeBuff='0.12', atkBuff='12'),
    make_row(id='unit_skill_peacock_dazzle', name='Điệu Múa Mê Hoặc',
        descriptionVi="Khổng Tước Vũ múa mê hoặc, giảm 30% ATK toàn bộ kẻ địch trong 2 lượt. Khắc chế đội hình vật lý. Mốc sao: 1★ hiệu lực gốc, 2★ +20% hiệu lực, 3★ +40% hiệu lực.",
        actionPattern='RANGED_STATIC', effect='global_debuff_atk', damageType='magic', base='22', scaleStat='matk', scale='0.65', turns='2'),
    make_row(id='unit_skill_swan_grace', name='Khiên Tinh Khiết',
        descriptionVi="Thiên Nga Trắng tạo khiên nước tinh khiết (70 + 0.9x MATK) cho đồng minh yếu nhất và xóa 1 debuff. Bảo vệ carry. Mốc sao: 1★ hiệu lực gốc, 2★ +20% hiệu lực, 3★ +40% hiệu lực.",
        actionPattern='SELF', effect='shield_cleanse', shieldBase='70', shieldScaleStat='matk', shieldScale='0.9'),
    make_row(id='revive_or_heal', name='Thiên Sứ Tái Sinh',
        descriptionVi="Thiên Thần Hộ Vệ cầu nguyện tái sinh: 50% hồi sinh đồng minh chết gần nhất với 30% HP. Nếu không ai chết, heal toàn đội (30 + 0.4x MATK). Mốc sao: 1★ hiệu lực gốc, 2★ +20% hiệu lực, 3★ +40% hiệu lực.",
        actionPattern='SELF', effect='revive_or_heal', base='30', scaleStat='matk', scale='0.4'),
    # T5
    make_row(id='phoenix_rebirth', name='Lửa Bất Diệt',
        descriptionVi="Phượng Hoàng Lửa kích hoạt lửa bất diệt, tự hồi sinh khi chết 1 lần (passive). Dùng skill: heal đồng minh yếu nhất 40% HP. Mốc sao: 1★ hiệu lực gốc, 2★ +20% hiệu lực, 3★ +40% hiệu lực.",
        actionPattern='SELF', effect='phoenix_rebirth'),
    make_row(id='unit_skill_lizard_elder', name='Phúc Lành Cổ Thụ',
        descriptionVi="Rồng Đất Cổ kêu gọi sức mạnh đại địa, tăng +22 Giáp và +22 Kháng Phép toàn đội 3 lượt. Hồi 55 HP cho đồng minh yếu nhất. Mốc sao: 1★ hiệu lực gốc, 2★ +20% hiệu lực, 3★ +40% hiệu lực.",
        actionPattern='SELF', effect='team_def_buff', armorBuff='22', mdefBuff='22', turns='3'),
    make_row(id='unit_skill_seraphim_light', name='Thánh Ca Tái Sinh',
        descriptionVi="Seraphim Ánh Sáng hát thánh ca, hồi máu cho 3 đồng minh yếu nhất (45 + 1.3x MATK). Hỗ trợ heal mạnh nhất. Mốc sao: 1★ hiệu lực gốc, 2★ +20% hiệu lực, 3★ +40% hiệu lực.",
        actionPattern='SELF', effect='dual_heal', base='45', scaleStat='matk', scale='1.3', maxTargets='3'),
    make_row(id='unit_skill_oracle_wisdom', name='Kích Nộ Toàn Đội',
        descriptionVi="Tiên Tri Trí Tuệ hô vang tiếng gọi linh thiêng, cộng +2 nộ cho tất cả đồng minh. Tăng tốc tung chiêu toàn đội. Mốc sao: 1★ hiệu lực gốc, 2★ +20% hiệu lực, 3★ +40% hiệu lực.",
        actionPattern='SELF', effect='team_rage', rageGain='2'),
]

ALL_SKILLS = TANKER + FIGHTER + MAGE + ARCHER + ASSASSIN + SUPPORT
