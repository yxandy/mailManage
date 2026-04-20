-- 批量导入 iCloud Hide My Email 历史数据（从 JSON 一次性导入）
-- 使用说明：
-- 1) 把 payload.doc 中的 '{}' 替换为你导出的完整 JSON（你发的那份结构可直接用）。
-- 2) 在 Supabase SQL Editor 或 psql 执行本脚本。
-- 3) 脚本会自动去重：已存在且未软删除（deleted_at is null）的 email_name 不会重复插入。

begin;

with payload as (
  select
    -- 把这里替换成完整 JSON（建议直接粘贴到 $$...$$ 之间，无需转义双引号）
    $$ {
    "success": true,
    "timestamp": 1776660145,
    "result": {
        "forwardToEmails": [
            "yxandy@126.com",
            "yxandybowen@icloud.com"
        ],
        "hmeEmails": [
            {
                "origin": "ON_DEMAND",
                "anonymousId": "h7fx5rh75t1231",
                "domain": "",
                "forwardToEmail": "yxandy@126.com",
                "hme": "roses_goad_0f@icloud.com",
                "label": "glo",
                "note": "",
                "createTimestamp": 1776141857553,
                "isActive": true,
                "recipientMailId": ""
            },
            {
                "origin": "ON_DEMAND",
                "anonymousId": "bj4whjdyqk7348",
                "domain": "",
                "forwardToEmail": "yxandy@126.com",
                "hme": "adobe-hertz.76@icloud.com",
                "label": "glp",
                "note": "",
                "createTimestamp": 1776126531372,
                "isActive": true,
                "recipientMailId": ""
            },
            {
                "origin": "ON_DEMAND",
                "anonymousId": "4k6h5wfxmj1231",
                "domain": "",
                "forwardToEmail": "yxandy@126.com",
                "hme": "12forge_lychees@icloud.com",
                "label": "glp",
                "note": "",
                "createTimestamp": 1776212916834,
                "isActive": true,
                "recipientMailId": ""
            },
            {
                "origin": "ON_DEMAND",
                "anonymousId": "jtr8bgg64h1231",
                "domain": "",
                "forwardToEmail": "yxandy@126.com",
                "hme": "grazers_62_mediate@icloud.com",
                "label": "glp",
                "note": "",
                "createTimestamp": 1776299408908,
                "isActive": true,
                "recipientMailId": ""
            },
            {
                "origin": "ON_DEMAND",
                "anonymousId": "qt5vpv5wx25309",
                "domain": "",
                "forwardToEmail": "yxandy@126.com",
                "hme": "cramp.unkept7h@icloud.com",
                "label": "glp",
                "note": "",
                "createTimestamp": 1776415182864,
                "isActive": true,
                "recipientMailId": ""
            },
            {
                "origin": "ON_DEMAND",
                "anonymousId": "bydhpfngjz3270",
                "domain": "",
                "forwardToEmail": "yxandy@126.com",
                "hme": "fixings.jabs.1b@icloud.com",
                "label": "glp",
                "note": "",
                "createTimestamp": 1776047716783,
                "isActive": true,
                "recipientMailId": ""
            },
            {
                "origin": "ON_DEMAND",
                "anonymousId": "2ftrx6ctyc5309",
                "domain": "",
                "forwardToEmail": "yxandy@126.com",
                "hme": "pout-keener-3m@icloud.com",
                "label": "glp",
                "note": "",
                "createTimestamp": 1776088010591,
                "isActive": true,
                "recipientMailId": ""
            },
            {
                "origin": "ON_DEMAND",
                "anonymousId": "m5ccpbgtpb5309",
                "domain": "",
                "forwardToEmail": "yxandy@126.com",
                "hme": "racks-writers8e@icloud.com",
                "label": "glp",
                "note": "",
                "createTimestamp": 1776390295765,
                "isActive": true,
                "recipientMailId": ""
            },
            {
                "origin": "ON_DEMAND",
                "anonymousId": "kbnsjd8qsf9387",
                "domain": "",
                "forwardToEmail": "yxandy@126.com",
                "hme": "plank_6_mercies@icloud.com",
                "label": "glp",
                "note": "",
                "createTimestamp": 1776163211542,
                "isActive": true,
                "recipientMailId": ""
            },
            {
                "origin": "ON_DEMAND",
                "anonymousId": "hwtdgm67nc5309",
                "domain": "",
                "forwardToEmail": "yxandy@126.com",
                "hme": "66_bight.chorizo@icloud.com",
                "label": "glp",
                "note": "",
                "createTimestamp": 1775984907469,
                "isActive": true,
                "recipientMailId": ""
            },
            {
                "origin": "ON_DEMAND",
                "anonymousId": "n46rp4qkv27348",
                "domain": "",
                "forwardToEmail": "yxandy@126.com",
                "hme": "fan-trifold-8p@icloud.com",
                "label": "glp",
                "note": "",
                "createTimestamp": 1776439402402,
                "isActive": true,
                "recipientMailId": ""
            },
            {
                "origin": "ON_DEMAND",
                "anonymousId": "74fw4n8dnh7348",
                "domain": "",
                "forwardToEmail": "yxandy@126.com",
                "hme": "poultry.crinkly9u@icloud.com",
                "label": "glp",
                "note": "",
                "createTimestamp": 1776180914900,
                "isActive": true,
                "recipientMailId": ""
            },
            {
                "origin": "ON_DEMAND",
                "anonymousId": "yvxjpmc7xg3270",
                "domain": "",
                "forwardToEmail": "yxandy@126.com",
                "hme": "temper.rushers81@icloud.com",
                "label": "glp",
                "note": "",
                "createTimestamp": 1776339560046,
                "isActive": true,
                "recipientMailId": ""
            },
            {
                "origin": "ON_DEMAND",
                "anonymousId": "jmgvxndwmj9387",
                "domain": "",
                "forwardToEmail": "yxandy@126.com",
                "hme": "exempts.molts.7k@icloud.com",
                "label": "glp",
                "note": "",
                "createTimestamp": 1776094511276,
                "isActive": true,
                "recipientMailId": ""
            },
            {
                "origin": "ON_DEMAND",
                "anonymousId": "9gjfthjgzg5309",
                "domain": "",
                "forwardToEmail": "yxandy@126.com",
                "hme": "tilt_cline8a@icloud.com",
                "label": "glp",
                "note": "",
                "createTimestamp": 1776154013661,
                "isActive": true,
                "recipientMailId": ""
            },
            {
                "origin": "ON_DEMAND",
                "anonymousId": "s4vm54dzn63270",
                "domain": "",
                "forwardToEmail": "yxandy@126.com",
                "hme": "aid.gages9b@icloud.com",
                "label": "glp",
                "note": "",
                "createTimestamp": 1775954940967,
                "isActive": true,
                "recipientMailId": ""
            },
            {
                "origin": "ON_DEMAND",
                "anonymousId": "2gh47jh9fb1231",
                "domain": "",
                "forwardToEmail": "yxandy@126.com",
                "hme": "stealer.urgent-16@icloud.com",
                "label": "glp",
                "note": "",
                "createTimestamp": 1776446083981,
                "isActive": true,
                "recipientMailId": ""
            },
            {
                "origin": "ON_DEMAND",
                "anonymousId": "2bvkrgbgnf5309",
                "domain": "",
                "forwardToEmail": "yxandy@126.com",
                "hme": "fitted.junkets8m@icloud.com",
                "label": "glp",
                "note": "",
                "createTimestamp": 1776507693323,
                "isActive": true,
                "recipientMailId": ""
            },
            {
                "origin": "ON_DEMAND",
                "anonymousId": "r2brhqj6qj3270",
                "domain": "",
                "forwardToEmail": "yxandy@126.com",
                "hme": "41_blitz.heaven@icloud.com",
                "label": "glp",
                "note": "",
                "createTimestamp": 1776173097127,
                "isActive": true,
                "recipientMailId": ""
            },
            {
                "origin": "ON_DEMAND",
                "anonymousId": "ygtsdmbmsg9387",
                "domain": "",
                "forwardToEmail": "yxandy@126.com",
                "hme": "lodes-brevet-8a@icloud.com",
                "label": "glp",
                "note": "",
                "createTimestamp": 1776385501376,
                "isActive": true,
                "recipientMailId": ""
            },
            {
                "origin": "ON_DEMAND",
                "anonymousId": "vj2c42284b1231",
                "domain": "",
                "forwardToEmail": "yxandy@126.com",
                "hme": "sane_lizards_7p@icloud.com",
                "label": "glp",
                "note": "",
                "createTimestamp": 1776169166233,
                "isActive": true,
                "recipientMailId": ""
            },
            {
                "origin": "ON_DEMAND",
                "anonymousId": "4vjqx4jb2x3270",
                "domain": "",
                "forwardToEmail": "yxandy@126.com",
                "hme": "86.overall_purdah@icloud.com",
                "label": "glp",
                "note": "",
                "createTimestamp": 1776310347523,
                "isActive": true,
                "recipientMailId": ""
            },
            {
                "origin": "ON_DEMAND",
                "anonymousId": "8msrw24hgv5309",
                "domain": "",
                "forwardToEmail": "yxandy@126.com",
                "hme": "gambles-pinky-4x@icloud.com",
                "label": "glp",
                "note": "",
                "createTimestamp": 1776231316125,
                "isActive": true,
                "recipientMailId": ""
            },
            {
                "origin": "ON_DEMAND",
                "anonymousId": "m48jk9j49b7348",
                "domain": "",
                "forwardToEmail": "yxandy@126.com",
                "hme": "tapirs_cranium_6e@icloud.com",
                "label": "glp",
                "note": "",
                "createTimestamp": 1776248134782,
                "isActive": true,
                "recipientMailId": ""
            },
            {
                "origin": "ON_DEMAND",
                "anonymousId": "6q64k7svth5309",
                "domain": "",
                "forwardToEmail": "yxandy@126.com",
                "hme": "aldrin.timing8x@icloud.com",
                "label": "glp",
                "note": "",
                "createTimestamp": 1776480211933,
                "isActive": true,
                "recipientMailId": ""
            },
            {
                "origin": "ON_DEMAND",
                "anonymousId": "t8z5552f269387",
                "domain": "",
                "forwardToEmail": "yxandy@126.com",
                "hme": "71.skiffs-turnip@icloud.com",
                "label": "glp",
                "note": "",
                "createTimestamp": 1776520549919,
                "isActive": true,
                "recipientMailId": ""
            },
            {
                "origin": "ON_DEMAND",
                "anonymousId": "p2kfpk9pqr3270",
                "domain": "",
                "forwardToEmail": "yxandy@126.com",
                "hme": "outsole_fourths1a@icloud.com",
                "label": "glp",
                "note": "",
                "createTimestamp": 1776218559424,
                "isActive": true,
                "recipientMailId": ""
            },
            {
                "origin": "ON_DEMAND",
                "anonymousId": "v7yyk6t5q67348",
                "domain": "",
                "forwardToEmail": "yxandy@126.com",
                "hme": "burgess_outsize6j@icloud.com",
                "label": "glp",
                "note": "",
                "createTimestamp": 1776331644971,
                "isActive": true,
                "recipientMailId": ""
            },
            {
                "origin": "ON_DEMAND",
                "anonymousId": "cj7pj8xvx57348",
                "domain": "",
                "forwardToEmail": "yxandy@126.com",
                "hme": "myopic-alleys0i@icloud.com",
                "label": "glp",
                "note": "",
                "createTimestamp": 1776176925860,
                "isActive": true,
                "recipientMailId": ""
            },
            {
                "origin": "ON_DEMAND",
                "anonymousId": "vgvwb9jpg41231",
                "domain": "",
                "forwardToEmail": "yxandy@126.com",
                "hme": "kola22.purple@icloud.com",
                "label": "glp",
                "note": "",
                "createTimestamp": 1776500237980,
                "isActive": true,
                "recipientMailId": ""
            },
            {
                "origin": "ON_DEMAND",
                "anonymousId": "kmq2vgmpnc9387",
                "domain": "",
                "forwardToEmail": "yxandy@126.com",
                "hme": "squires_trot8c@icloud.com",
                "label": "glp",
                "note": "",
                "createTimestamp": 1776081460144,
                "isActive": true,
                "recipientMailId": ""
            },
            {
                "origin": "ON_DEMAND",
                "anonymousId": "9js24rcsj83270",
                "domain": "",
                "forwardToEmail": "yxandy@126.com",
                "hme": "yogi.naivety_3f@icloud.com",
                "label": "glp",
                "note": "",
                "createTimestamp": 1776345186653,
                "isActive": true,
                "recipientMailId": ""
            },
            {
                "origin": "ON_DEMAND",
                "anonymousId": "xtnxz2dgd45309",
                "domain": "",
                "forwardToEmail": "yxandy@126.com",
                "hme": "72bay_rainier@icloud.com",
                "label": "glp",
                "note": "",
                "createTimestamp": 1776222982444,
                "isActive": true,
                "recipientMailId": ""
            },
            {
                "origin": "ON_DEMAND",
                "anonymousId": "fym4ncp9wd7348",
                "domain": "",
                "forwardToEmail": "yxandy@126.com",
                "hme": "pokers-panoply-4n@icloud.com",
                "label": "glp",
                "note": "",
                "createTimestamp": 1776474784933,
                "isActive": true,
                "recipientMailId": ""
            },
            {
                "origin": "ON_DEMAND",
                "anonymousId": "pkwwtv5n6s9387",
                "domain": "",
                "forwardToEmail": "yxandy@126.com",
                "hme": "toggle_56taverns@icloud.com",
                "label": "glp",
                "note": "",
                "createTimestamp": 1776575979709,
                "isActive": true,
                "recipientMailId": ""
            },
            {
                "origin": "ON_DEMAND",
                "anonymousId": "nx8r796v7c5309",
                "domain": "",
                "forwardToEmail": "yxandy@126.com",
                "hme": "18setts_fault@icloud.com",
                "label": "glp",
                "note": "",
                "createTimestamp": 1775956388072,
                "isActive": true,
                "recipientMailId": ""
            },
            {
                "origin": "ON_DEMAND",
                "anonymousId": "pjqsv5vnw61231",
                "domain": "",
                "forwardToEmail": "yxandy@126.com",
                "hme": "barcode-flues-4n@icloud.com",
                "label": "glp",
                "note": "",
                "createTimestamp": 1776075057707,
                "isActive": true,
                "recipientMailId": ""
            },
            {
                "origin": "ON_DEMAND",
                "anonymousId": "g26p4dq9vr7348",
                "domain": "",
                "forwardToEmail": "yxandy@126.com",
                "hme": "lathe_meaty_39@icloud.com",
                "label": "glp",
                "note": "",
                "createTimestamp": 1776495331953,
                "isActive": true,
                "recipientMailId": ""
            },
            {
                "origin": "ON_DEMAND",
                "anonymousId": "rjfrbtz2hk7348",
                "domain": "",
                "forwardToEmail": "yxandy@126.com",
                "hme": "loots_muddle3t@icloud.com",
                "label": "glp",
                "note": "",
                "createTimestamp": 1775920291998,
                "isActive": true,
                "recipientMailId": ""
            },
            {
                "origin": "ON_DEMAND",
                "anonymousId": "hv9qm6qz259387",
                "domain": "",
                "forwardToEmail": "yxandy@126.com",
                "hme": "rovers-way7d@icloud.com",
                "label": "glp",
                "note": "",
                "createTimestamp": 1775994036363,
                "isActive": true,
                "recipientMailId": ""
            },
            {
                "origin": "ON_DEMAND",
                "anonymousId": "shtz446vnk1231",
                "domain": "",
                "forwardToEmail": "yxandy@126.com",
                "hme": "vogue_ampoule57@icloud.com",
                "label": "glp",
                "note": "",
                "createTimestamp": 1776092352083,
                "isActive": true,
                "recipientMailId": ""
            },
            {
                "origin": "ON_DEMAND",
                "anonymousId": "my9jh9mvsr7348",
                "domain": "",
                "forwardToEmail": "yxandy@126.com",
                "hme": "likable_pushers.9x@icloud.com",
                "label": "glp",
                "note": "",
                "createTimestamp": 1776004424971,
                "isActive": true,
                "recipientMailId": ""
            },
            {
                "origin": "ON_DEMAND",
                "anonymousId": "n7yqz5x6847348",
                "domain": "",
                "forwardToEmail": "yxandy@126.com",
                "hme": "beyond.bunker_6r@icloud.com",
                "label": "glp",
                "note": "",
                "createTimestamp": 1776581553402,
                "isActive": true,
                "recipientMailId": ""
            },
            {
                "origin": "ON_DEMAND",
                "anonymousId": "65xrw49sng5309",
                "domain": "",
                "forwardToEmail": "yxandy@126.com",
                "hme": "stepped_tankful.5h@icloud.com",
                "label": "glp",
                "note": "",
                "createTimestamp": 1775970675804,
                "isActive": true,
                "recipientMailId": ""
            },
            {
                "origin": "ON_DEMAND",
                "anonymousId": "d6dzxprw7b7348",
                "domain": "",
                "forwardToEmail": "yxandy@126.com",
                "hme": "honkers-bagels.8l@icloud.com",
                "label": "glp",
                "note": "",
                "createTimestamp": 1776120024344,
                "isActive": true,
                "recipientMailId": ""
            },
            {
                "origin": "ON_DEMAND",
                "anonymousId": "kpbht9frqg3270",
                "domain": "",
                "forwardToEmail": "yxandy@126.com",
                "hme": "maltier_34_cleaver@icloud.com",
                "label": "glp",
                "note": "",
                "createTimestamp": 1776145639876,
                "isActive": true,
                "recipientMailId": ""
            },
            {
                "origin": "ON_DEMAND",
                "anonymousId": "xn9w8ztnbg9387",
                "domain": "",
                "forwardToEmail": "yxandy@126.com",
                "hme": "twines_quahogs5o@icloud.com",
                "label": "glp",
                "note": "",
                "createTimestamp": 1776322895742,
                "isActive": true,
                "recipientMailId": ""
            },
            {
                "origin": "ON_DEMAND",
                "anonymousId": "xnwkyrnzdt7348",
                "domain": "",
                "forwardToEmail": "yxandy@126.com",
                "hme": "amyloid.sirloin.5l@icloud.com",
                "label": "glp",
                "note": "",
                "createTimestamp": 1776449323012,
                "isActive": true,
                "recipientMailId": ""
            },
            {
                "origin": "ON_DEMAND",
                "anonymousId": "c9tcpk4tz47348",
                "domain": "",
                "forwardToEmail": "yxandy@126.com",
                "hme": "fuzzy.bonuses19@icloud.com",
                "label": "glp",
                "note": "",
                "createTimestamp": 1776237071134,
                "isActive": true,
                "recipientMailId": ""
            },
            {
                "origin": "ON_DEMAND",
                "anonymousId": "wrr8s68stn5309",
                "domain": "",
                "forwardToEmail": "yxandy@126.com",
                "hme": "19.gaudier_mosque@icloud.com",
                "label": "glp",
                "note": "",
                "createTimestamp": 1776305480423,
                "isActive": true,
                "recipientMailId": ""
            },
            {
                "origin": "ON_DEMAND",
                "anonymousId": "4grxwg9q6h5309",
                "domain": "",
                "forwardToEmail": "yxandy@126.com",
                "hme": "uptown-bungler.7n@icloud.com",
                "label": "glp",
                "note": "",
                "createTimestamp": 1775974449910,
                "isActive": true,
                "recipientMailId": ""
            },
            {
                "origin": "ON_DEMAND",
                "anonymousId": "kgxhgvrt2w3270",
                "domain": "",
                "forwardToEmail": "yxandy@126.com",
                "hme": "taken57.nervier@icloud.com",
                "label": "glp",
                "note": "",
                "createTimestamp": 1776150079534,
                "isActive": true,
                "recipientMailId": ""
            },
            {
                "origin": "ON_DEMAND",
                "anonymousId": "xycnxk7yrh7348",
                "domain": "",
                "forwardToEmail": "yxandy@126.com",
                "hme": "pronged_bumbles4m@icloud.com",
                "label": "glp",
                "note": "",
                "createTimestamp": 1776133581213,
                "isActive": true,
                "recipientMailId": ""
            },
            {
                "origin": "ON_DEMAND",
                "anonymousId": "qxzj4zxc2t5309",
                "domain": "",
                "forwardToEmail": "yxandy@126.com",
                "hme": "forced.seismic9g@icloud.com",
                "label": "glp",
                "note": "",
                "createTimestamp": 1776159144540,
                "isActive": true,
                "recipientMailId": ""
            },
            {
                "origin": "ON_DEMAND",
                "anonymousId": "chqfkxhpyh3270",
                "domain": "",
                "forwardToEmail": "yxandy@126.com",
                "hme": "color.drinks.7p@icloud.com",
                "label": "glp",
                "note": "",
                "createTimestamp": 1776427372646,
                "isActive": true,
                "recipientMailId": ""
            },
            {
                "origin": "ON_DEMAND",
                "anonymousId": "syv4kbrr2s7348",
                "domain": "",
                "forwardToEmail": "yxandy@126.com",
                "hme": "winger_shear.7j@icloud.com",
                "label": "glp",
                "note": "",
                "createTimestamp": 1776526775036,
                "isActive": true,
                "recipientMailId": ""
            },
            {
                "origin": "ON_DEMAND",
                "anonymousId": "d99228jwfn7348",
                "domain": "",
                "forwardToEmail": "yxandy@126.com",
                "hme": "saint_auras.91@icloud.com",
                "label": "glp",
                "note": "",
                "createTimestamp": 1776531023394,
                "isActive": true,
                "recipientMailId": ""
            },
            {
                "origin": "ON_DEMAND",
                "anonymousId": "xfx2bpsqgx1231",
                "domain": "",
                "forwardToEmail": "yxandy@126.com",
                "hme": "tasty70_written@icloud.com",
                "label": "glp",
                "note": "",
                "createTimestamp": 1776410868624,
                "isActive": true,
                "recipientMailId": ""
            },
            {
                "origin": "ON_DEMAND",
                "anonymousId": "jqkfczpj575309",
                "domain": "",
                "forwardToEmail": "yxandy@126.com",
                "hme": "magneto_tiffs0o@icloud.com",
                "label": "glp",
                "note": "",
                "createTimestamp": 1776137900231,
                "isActive": true,
                "recipientMailId": ""
            },
            {
                "origin": "ON_DEMAND",
                "anonymousId": "bppg6t7x645309",
                "domain": "",
                "forwardToEmail": "yxandy@126.com",
                "hme": "milkier_roaring5z@icloud.com",
                "label": "glp",
                "note": "",
                "createTimestamp": 1776327060795,
                "isActive": true,
                "recipientMailId": ""
            },
            {
                "origin": "ON_DEMAND",
                "anonymousId": "6f52ssd4h91231",
                "domain": "",
                "forwardToEmail": "yxandy@126.com",
                "hme": "hazmat.brunch.6g@icloud.com",
                "label": "glp",
                "note": "",
                "createTimestamp": 1776378441079,
                "isActive": true,
                "recipientMailId": ""
            },
            {
                "origin": "ON_DEMAND",
                "anonymousId": "nf95fbrt6g1231",
                "domain": "",
                "forwardToEmail": "yxandy@126.com",
                "hme": "clamors.augers_0u@icloud.com",
                "label": "glp",
                "note": "",
                "createTimestamp": 1776293042032,
                "isActive": true,
                "recipientMailId": ""
            },
            {
                "origin": "ON_DEMAND",
                "anonymousId": "zkf5bvd4jk5309",
                "domain": "",
                "forwardToEmail": "yxandy@126.com",
                "hme": "guffaw_octanes_3d@icloud.com",
                "label": "glp",
                "note": "",
                "createTimestamp": 1776403774507,
                "isActive": true,
                "recipientMailId": ""
            },
            {
                "origin": "ON_DEMAND",
                "anonymousId": "r22yr28rn69387",
                "domain": "",
                "forwardToEmail": "yxandy@126.com",
                "hme": "upper_decoys_0a@icloud.com",
                "label": "glp",
                "note": "",
                "createTimestamp": 1775962291917,
                "isActive": true,
                "recipientMailId": ""
            },
            {
                "origin": "ON_DEMAND",
                "anonymousId": "ymghht4xb59387",
                "domain": "",
                "forwardToEmail": "yxandy@126.com",
                "hme": "musings_onuses.6m@icloud.com",
                "label": "glp",
                "note": "",
                "createTimestamp": 1776398916043,
                "isActive": true,
                "recipientMailId": ""
            },
            {
                "origin": "ON_DEMAND",
                "anonymousId": "8dn2gs469x7348",
                "domain": "",
                "forwardToEmail": "yxandy@126.com",
                "hme": "screen.chick.0g@icloud.com",
                "label": "glp",
                "note": "",
                "createTimestamp": 1776557030028,
                "isActive": true,
                "recipientMailId": ""
            },
            {
                "origin": "ON_DEMAND",
                "anonymousId": "fsg6k42rqd3270",
                "domain": "",
                "forwardToEmail": "yxandy@126.com",
                "hme": "fades.microbe.8v@icloud.com",
                "label": "glp",
                "note": "",
                "createTimestamp": 1775924663479,
                "isActive": true,
                "recipientMailId": ""
            },
            {
                "origin": "ON_DEMAND",
                "anonymousId": "6k55rp5qnn9387",
                "domain": "",
                "forwardToEmail": "yxandy@126.com",
                "hme": "tough_chad_3l@icloud.com",
                "label": "glp",
                "note": "",
                "createTimestamp": 1775926767596,
                "isActive": true,
                "recipientMailId": ""
            },
            {
                "origin": "ON_DEMAND",
                "anonymousId": "kbrk7b6chz5309",
                "domain": "",
                "forwardToEmail": "yxandy@126.com",
                "hme": "85_edge_face@icloud.com",
                "label": "glp",
                "note": "",
                "createTimestamp": 1776394626332,
                "isActive": true,
                "recipientMailId": ""
            },
            {
                "origin": "ON_DEMAND",
                "anonymousId": "m2gzhjx6zy1231",
                "domain": "",
                "forwardToEmail": "yxandy@126.com",
                "hme": "lignin-wig.01@icloud.com",
                "label": "glp",
                "note": "",
                "createTimestamp": 1776515609480,
                "isActive": true,
                "recipientMailId": ""
            },
            {
                "origin": "ON_DEMAND",
                "anonymousId": "bv56ftw75n1231",
                "domain": "",
                "forwardToEmail": "yxandy@126.com",
                "hme": "tusk_slipped_8l@icloud.com",
                "label": "glp",
                "note": "",
                "createTimestamp": 1776568181846,
                "isActive": true,
                "recipientMailId": ""
            },
            {
                "origin": "ON_DEMAND",
                "anonymousId": "qq6ckm4pvt7348",
                "domain": "",
                "forwardToEmail": "yxandy@126.com",
                "hme": "62_rippers_land@icloud.com",
                "label": "glp",
                "note": "",
                "createTimestamp": 1775979824808,
                "isActive": true,
                "recipientMailId": ""
            },
            {
                "origin": "ON_DEMAND",
                "anonymousId": "kchhjbmrqr7348",
                "domain": "",
                "forwardToEmail": "yxandy@126.com",
                "hme": "snare_invert_7n@icloud.com",
                "label": "glp",
                "note": "",
                "createTimestamp": 1776253262323,
                "isActive": true,
                "recipientMailId": ""
            },
            {
                "origin": "ON_DEMAND",
                "anonymousId": "xvcyn4ffwt7348",
                "domain": "",
                "forwardToEmail": "yxandy@126.com",
                "hme": "90ocher-cuffed@icloud.com",
                "label": "glp",
                "note": "",
                "createTimestamp": 1776316895209,
                "isActive": true,
                "recipientMailId": ""
            },
            {
                "origin": "ON_DEMAND",
                "anonymousId": "2r8bhtv8j65309",
                "domain": "",
                "forwardToEmail": "yxandy@126.com",
                "hme": "shogun.lots90@icloud.com",
                "label": "glp",
                "note": "",
                "createTimestamp": 1776355245044,
                "isActive": true,
                "recipientMailId": ""
            },
            {
                "origin": "ON_DEMAND",
                "anonymousId": "jhkk25gg7k1231",
                "domain": "",
                "forwardToEmail": "yxandy@126.com",
                "hme": "slash-fusion3z@icloud.com",
                "label": "glp",
                "note": "",
                "createTimestamp": 1776243623289,
                "isActive": true,
                "recipientMailId": ""
            },
            {
                "origin": "ON_DEMAND",
                "anonymousId": "9fyfspnrx41231",
                "domain": "",
                "forwardToEmail": "yxandy@126.com",
                "hme": "27_primate.eat@icloud.com",
                "label": "glp",
                "note": "",
                "createTimestamp": 1776350884889,
                "isActive": true,
                "recipientMailId": ""
            },
            {
                "origin": "ON_DEMAND",
                "anonymousId": "2hd66nvfkc7348",
                "domain": "",
                "forwardToEmail": "yxandy@126.com",
                "hme": "papacy.razors.4k@icloud.com",
                "label": "glp",
                "note": "",
                "createTimestamp": 1776058868648,
                "isActive": true,
                "recipientMailId": ""
            },
            {
                "origin": "ON_DEMAND",
                "anonymousId": "zwt2k2xcsp1231",
                "domain": "",
                "forwardToEmail": "yxandy@126.com",
                "hme": "pelagic89edifice@icloud.com",
                "label": "glp",
                "note": "",
                "createTimestamp": 1776260545410,
                "isActive": true,
                "recipientMailId": ""
            },
            {
                "origin": "ON_DEMAND",
                "anonymousId": "sywg5qxfrp7348",
                "domain": "",
                "forwardToEmail": "yxandy@126.com",
                "hme": "62_grazes.daemon@icloud.com",
                "label": "lcp",
                "note": "",
                "createTimestamp": 1776586397111,
                "isActive": true,
                "recipientMailId": ""
            },
            {
                "origin": "ON_DEMAND",
                "anonymousId": "94xbw42f5q5309",
                "domain": "",
                "forwardToEmail": "yxandy@126.com",
                "hme": "snooze_melees9f@icloud.com",
                "label": "lgp",
                "note": "",
                "createTimestamp": 1776590753727,
                "isActive": true,
                "recipientMailId": ""
            },
            {
                "origin": "ON_DEMAND",
                "anonymousId": "km2zmyz7zn7348",
                "domain": "",
                "forwardToEmail": "yxandy@126.com",
                "hme": "46-maned-looms@icloud.com",
                "label": "lgp",
                "note": "",
                "createTimestamp": 1776657683938,
                "isActive": true,
                "recipientMailId": ""
            },
            {
                "origin": "ON_DEMAND",
                "anonymousId": "6v8567vqkp3270",
                "domain": "",
                "forwardToEmail": "yxandy@126.com",
                "hme": "dates_nozzles72@icloud.com",
                "label": "lgp",
                "note": "",
                "createTimestamp": 1776597146240,
                "isActive": true,
                "recipientMailId": ""
            },
            {
                "origin": "ON_DEMAND",
                "anonymousId": "8m94vjvw4w7348",
                "domain": "",
                "forwardToEmail": "yxandy@126.com",
                "hme": "solvent_ponies3y@icloud.com",
                "label": "lgp",
                "note": "",
                "createTimestamp": 1776614234227,
                "isActive": true,
                "recipientMailId": ""
            },
            {
                "origin": "ON_DEMAND",
                "anonymousId": "bbhgrnb5by7348",
                "domain": "",
                "forwardToEmail": "yxandy@126.com",
                "hme": "teases-toned-00@icloud.com",
                "label": "lgp",
                "note": "",
                "createTimestamp": 1776657391548,
                "isActive": true,
                "recipientMailId": ""
            },
            {
                "origin": "ON_DEMAND",
                "anonymousId": "6p8dtjy9nm5309",
                "domain": "",
                "forwardToEmail": "yxandy@126.com",
                "hme": "few96flare@icloud.com",
                "label": "lgp",
                "note": "",
                "createTimestamp": 1776658531448,
                "isActive": true,
                "recipientMailId": ""
            },
            {
                "origin": "ON_DEMAND",
                "anonymousId": "m5bxd6wztb7348",
                "domain": "",
                "forwardToEmail": "yxandy@126.com",
                "hme": "toolbox-eared.4b@icloud.com",
                "label": "lgp",
                "note": "",
                "createTimestamp": 1776659749976,
                "isActive": true,
                "recipientMailId": ""
            },
            {
                "origin": "ON_DEMAND",
                "anonymousId": "hs482npdcy5309",
                "domain": "",
                "forwardToEmail": "yxandy@126.com",
                "hme": "doublet_tempter.84@icloud.com",
                "label": "lgp",
                "note": "",
                "createTimestamp": 1776656790849,
                "isActive": true,
                "recipientMailId": ""
            },
            {
                "origin": "ON_DEMAND",
                "anonymousId": "dhnsccrysf9387",
                "domain": "",
                "forwardToEmail": "yxandy@126.com",
                "hme": "conical_insider.8a@icloud.com",
                "label": "lgp",
                "note": "",
                "createTimestamp": 1776650010953,
                "isActive": true,
                "recipientMailId": ""
            },
            {
                "origin": "ON_DEMAND",
                "anonymousId": "b4syx6v7jn9387",
                "domain": "",
                "forwardToEmail": "yxandy@126.com",
                "hme": "moneys.loading-2g@icloud.com",
                "label": "lgp",
                "note": "",
                "createTimestamp": 1776638981780,
                "isActive": true,
                "recipientMailId": ""
            },
            {
                "origin": "ON_DEMAND",
                "anonymousId": "tb8sbpp64v5309",
                "domain": "",
                "forwardToEmail": "yxandy@126.com",
                "hme": "bucket-chock.6a@icloud.com",
                "label": "lgp",
                "note": "",
                "createTimestamp": 1776601729141,
                "isActive": true,
                "recipientMailId": ""
            }
        ],
        "selectedForwardTo": "yxandy@126.com"
    }
}$$::jsonb as doc
),
raw_items as (
  select
    lower(trim(item->>'hme')) as email_name,
    case
      when (item ? 'createTimestamp') and nullif(item->>'createTimestamp', '') is not null then
        to_timestamp((item->>'createTimestamp')::numeric / 1000.0)
      else null
    end as created_ts
  from payload p
  cross join lateral jsonb_array_elements(
    case
      when jsonb_typeof(p.doc->'result'->'hmeEmails') = 'array' then p.doc->'result'->'hmeEmails'
      when jsonb_typeof(p.doc->'hmeEmails') = 'array' then p.doc->'hmeEmails'
      else '[]'::jsonb
    end
  ) as item
),
normalized as (
  select distinct on (email_name)
    email_name,
    created_ts
  from raw_items
  where email_name is not null and email_name <> ''
  order by email_name, created_ts desc nulls last
),
to_insert as (
  select
    n.email_name,
    n.created_ts
  from normalized n
  left join public.email_accounts ea
    on ea.email_name = n.email_name
   and ea.deleted_at is null
  where ea.id is null
),
inserted as (
  insert into public.email_accounts (
    email_name,
    source,
    user_name,
    birthday,
    registered_at,
    registered_location,
    is_registered_cg,
    cg_registered_at,
    is_linked_s2a,
    linked_at,
    is_expired,
    expired_at
  )
  select
    t.email_name,
    'icloud-hme-batch-import',
    null,
    null,
    t.created_ts,
    'icloud',
    true,
    t.created_ts,
    true,
    case when t.created_ts is not null then t.created_ts + interval '1 day' else null end,
    false,
    null
  from to_insert t
  returning id, email_name
)
select
  (select count(*) from raw_items) as payload_total_count,
  (select count(*) from normalized) as payload_unique_count,
  (select count(*) from inserted) as inserted_count,
  (select count(*) from normalized) - (select count(*) from inserted) as skipped_as_duplicate_count;

commit;
