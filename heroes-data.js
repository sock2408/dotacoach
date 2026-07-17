// heroes-data.js - База знаний по всем героям Dota 2

const HEROES_DATABASE = {
    // Anti-Mage
    1: {
        name: "Anti-Mage",
        shortName: "AM",
        roles: ["carry"],
        attackType: "melee",
        primaryAttribute: "agility",
        
        // Нормативы фарма для этого героя
        farmBenchmarks: {
            min10: { lastHits: 50, denies: 15, netWorth: 3500 },
            min20: { lastHits: 150, netWorth: 8000, shouldHaveBattlefury: true },
            min30: { lastHits: 250, netWorth: 16000 }
        },
        
        // Идеальная сборка предметов
        itemBuild: {
            early: ["quelling_blade", "tango", "slippers_of_agility", "circlet"],
            core: ["power_treads", "battle_fury", "manta_style"],
            situational: ["black_king_bar", "abyssal_blade", "butterfly", "skadi"],
            luxury: ["satanic", "monkey_king_bar", "nullifier"]
        },
        
        // Счётчики (герои, против которых силён)
        strongAgainst: ["medusa", "wraith_king", "storm_spirit"],
        weakAgainst: ["axe", "legion_commander", "bloodseeker", "faceless_void"],
        
        // Советы по стадиям игры
        tips: {
            laning: [
                "Стоять на линии до 6 уровня, потом уходить в лес",
                "Использовать Blink для добивания крипов и уклонения от хараса",
                "Не тратить ману на постоянные прыжки — только для эскейпа"
            ],
            midgame: [
                "После Battle Fury фармить лес и волны, не участвовать в драках",
                "Следить за картой — если враги показались, пушить другую линию",
                "К 25 минуте должен быть Manta Style"
            ],
            lategame: [
                "В драках ждать, пока враги используют станы, потом врываться",
                "Фокусить вражеского саппорта первым",
                "Использовать Abyssal Blade на вражеского керри"
            ]
        },
        
        // Частые ошибки новичков
        commonMistakes: [
            "Слишком раннее участие в драках (до Battle Fury)",
            "Неправильное использование Blink — прыжок в 5 врагов",
            "Игнорирование лесных крипов между волнами",
            "Покупка Battle Fury позже 18 минуты"
        ],
        
        // Средние показатели про-игроков (Immortal ранг)
        proStats: {
            avgGPM: 650,
            avgXPM: 750,
            avgLastHits10: 60,
            avgKDA: 4.2,
            avgWinrate: 51.5,
            avgBattleFuryTiming: 13 // минуты
        }
    },
    
    // Crystal Maiden
    2: {
        name: "Crystal Maiden",
        shortName: "CM",
        roles: ["support", "hard_support"],
        attackType: "ranged",
        primaryAttribute: "intelligence",
        
        farmBenchmarks: {
            min10: { lastHits: 15, denies: 5, netWorth: 1500 },
            min20: { lastHits: 30, netWorth: 3500, shouldHaveGlimmer: true }
        },
        
        itemBuild: {
            early: ["tango", "clarity", "branches", "wind_lace"],
            core: ["tranquil_boots", "glimmer_cape", "force_staff"],
            situational: ["ghost_scepter", "aeon_disk", "blink_dagger"],
            luxury: ["black_king_bar", "aghanims_scepter", "octarine_core"]
        },
        
        strongAgainst: ["phantom_assassin", "templar_assassin", "meepo"],
        weakAgainst: ["pudge", "nyx_assassin", "spirit_breaker"],
        
        tips: {
            laning: [
                "Стоять за спиной керри, не показываться врагам",
                "Использовать Crystal Nova для хараса и замедления",
                "Всегда носить Town Portal Scroll для помощи другим линиям"
            ],
            midgame: [
                "Ставить Observer Wards на входах в лес и у Roshan'а",
                "Держаться позади команды в драках, не лезть вперёд",
                "Использовать Glimmer Cape для спасения союзников"
            ],
            lategame: [
                "Ваша задача — не умереть первой и применить ульт",
                "Стоять в деревьях во время Freezing Field",
                "Купить Black King Bar для безопасного каста ульты"
            ]
        },
        
        commonMistakes: [
            "Слишком агрессивная позиция на линии",
            "Забывать ставить варды перед важными объектами",
            "Кастовать ульту на открытом пространстве без BKB",
            "Не носить Town Portal Scroll для помощи союзникам"
        ],
        
        proStats: {
            avgGPM: 280,
            avgXPM: 350,
            avgLastHits10: 20,
            avgKDA: 2.8,
            avgWinrate: 49.8,
            avgWardsPlaced: 12
        }
    },
    
    // Invoker
    3: {
        name: "Invoker",
        shortName: "Inv",
        roles: ["mid", "carry"],
        attackType: "ranged",
        primaryAttribute: "intelligence",
        
        farmBenchmarks: {
            min10: { lastHits: 45, denies: 20, netWorth: 3800 },
            min20: { lastHits: 140, netWorth: 8500, shouldHaveMidas: true }
        },
        
        itemBuild: {
            early: ["null_talisman", "tango", "branches"],
            core: ["hand_of_midas", "travel_boots", "aghanims_scepter"],
            situational: ["black_king_bar", "blink_dagger", "octarine_core"],
            luxury: ["refresher_orb", "scythe_of_vyse", "shivas_guard"]
        },
        
        strongAgainst: ["meepo", "phantom_lancer", "naga_siren"],
        weakAgainst: ["broodmother", "kunkka", "templar_assassin"],
        
        tips: {
            laning: [
                "На линии использовать Forge Spirit для хараса и фарма",
                "Контролировать руны с помощью Sun Strike",
                "После 6 уровня сразу выучить Invoke"
            ],
            midgame: [
                "Гангать другие линии с Tornado + EMP комбо",
                "Не забывать фармить лес между гангами",
                "Держать одну руну всегда активированной для быстрого комбо"
            ],
            lategame: [
                "В драках начинать с Tornado + EMP + Meteor",
                "Держать Refresher Orb для двойного комбо",
                "Использовать Ghost Walk для эскейпа"
            ]
        },
        
        commonMistakes: [
            "Неправильная комбинация скиллов в драке",
            "Забывать использовать Forge Spirit",
            "Поздно покупать Aghanim's Scepter",
            "Плохой тайминг Tornado + EMP"
        ],
        
        proStats: {
            avgGPM: 580,
            avgXPM: 680,
            avgLastHits10: 55,
            avgKDA: 3.8,
            avgWinrate: 50.2,
            avgMidasTiming: 7
        }
    }
};

// Экспорт для использования в других файлах
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HEROES_DATABASE;
}
