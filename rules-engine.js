// rules-engine.js - Движок анализа на правилах

class DotaMatchAnalyzer {
    constructor() {
        this.errors = [];
        this.tips = [];
        this.warnings = [];
        this.comparisons = {};
    }

    /**
     * Главный метод анализа матча
     * @param {Object} matchData - Полные данные матча из OpenDota API
     * @param {number} playerAccountId - ID игрока для анализа
     */
    analyzeMatch(matchData, playerAccountId) {
        // Находим игрока в матче
        const player = matchData.players.find(p => 
            p.account_id === playerAccountId
        );
        
        if (!player) {
            throw new Error('Игрок не найден в этом матче');
        }

        // Сбрасываем предыдущий анализ
        this.errors = [];
        this.tips = [];
        this.warnings = [];
        this.comparisons = {};

        const heroData = HEROES_DATABASE[player.hero_id];
        const durationMinutes = Math.floor(matchData.duration / 60);
        const isWin = player.win;

        // === 1. Анализ смертей ===
        this.analyzeDeaths(player, matchData, durationMinutes, heroData);

        // === 2. Анализ фарма ===
        this.analyzeFarming(player, durationMinutes, heroData);

        // === 3. Анализ предметов ===
        this.analyzeItems(player, durationMinutes, heroData);

        // === 4. Анализ участия в драках ===
        this.analyzeFightParticipation(player, matchData);

        // === 5. Анализ эффективности ===
        this.analyzeEfficiency(player, durationMinutes, heroData);

        // === 6. Сравнение с про-игроками ===
        this.compareToPro(player, heroData);

        // === 7. Генерация рекомендаций ===
        this.generateRecommendations(player, heroData, isWin);

        // === 8. Генерация графика сравнения ===
        const graphData = this.generateGraphData(player, matchData, heroData);

        return {
            // Основные ошибки
            criticalErrors: this.errors,
            
            // Предупреждения
            warnings: this.warnings,
            
            // Конкретные советы
            tips: this.tips,
            
            // Сравнение с профи
            proComparison: this.comparisons,
            
            // Резюме для AI-чата
            summary: this.generateSummary(player, heroData, isWin),
            
            // Вопросы для интерактивного чата
            questions: this.generateQuestions(player, heroData, matchData),
            
            // Данные для графика
            graphData: graphData,
            
            // Мета-информация
            meta: {
                heroName: heroData?.name || 'Unknown',
                duration: durationMinutes,
                result: isWin ? 'Победа' : 'Поражение',
                playerSlot: player.player_slot
            }
        };
    }

    // Анализ смертей с привязкой ко времени
    analyzeDeaths(player, matchData, duration, heroData) {
        const deaths = player.deaths || 0;
        
        // Критические уровни смертности
        if (deaths >= 10) {
            this.errors.push({
                severity: 'critical',
                category: 'deaths',
                time: this.getDeathTimings(player, matchData),
                text: `Критически высокая смертность: ${deaths} смертей за ${duration} минут. Ты был мёртв примерно ${Math.floor(deaths * 60 / duration)}% времени игры.`,
                details: 'Каждая смерть — это потерянное золото, опыт и давление на карте. При 10+ смертях ты отдаёшь врагу преимущество в 5,000+ золота.'
            });
        } else if (deaths >= 7) {
            this.errors.push({
                severity: 'high',
                category: 'deaths',
                time: this.getDeathTimings(player, matchData),
                text: `Высокая смертность: ${deaths} смертей. Нужно улучшить позиционирование.`,
                details: 'Старайся предугадывать движения врагов и не находиться в опасных зонах без видения.'
            });
        } else if (deaths >= 5 && !player.win) {
            this.warnings.push({
                severity: 'medium',
                category: 'deaths',
                text: `Умеренная смертность (${deaths}), но в проигранном матче каждая смерть критична.`
            });
        }

        // Проверка первой крови
        if (player.deaths > 0 && this.didGiveFirstBlood(player, matchData)) {
            this.errors.push({
                severity: 'high',
                category: 'laning',
                time: '00:00-02:00',
                text: 'Отдал первую кровь. В начале игры нужно играть осторожнее.',
                details: 'First Blood даёт врагу +300 золота и преимущество на линии с первых минут.'
            });
        }

        // Проверка смертей подряд (feed detection)
        const deathStreak = this.calculateDeathStreak(player, matchData);
        if (deathStreak >= 3) {
            this.errors.push({
                severity: 'critical',
                category: 'deaths',
                time: 'Середина игры',
                text: `Серия из ${deathStreak} смертей подряд — признак тильта или фида.`,
                details: 'После 2 смертей подряд лучше играть от башни и фармить безопасные зоны.'
            });
        }
    }

    // Анализ фарма
    analyzeFarming(player, duration, heroData) {
        if (!heroData) return;

        const lastHits = player.last_hits || 0;
        const gpm = player.gold_per_min || 0;
        const benchmarks = heroData.farmBenchmarks;

        // Проверка ластхитов на 10 минуте
        if (duration >= 10 && benchmarks.min10) {
            const expectedLH = benchmarks.min10.lastHits;
            const lhPerMinute = lastHits / Math.min(duration, 10);
            
            if (lhPerMinute < expectedLH * 0.6) {
                this.errors.push({
                    severity: 'critical',
                    category: 'farming',
                    time: '00:00-10:00',
                    text: `Очень низкий фарм: ~${Math.floor(lhPerMinute * 10)} ластхитов за 10 минут (нужно минимум ${Math.floor(expectedLH * 0.7)}).`,
                    details: 'Тренируй ластхит в лобби 15 минут в день. Нажми Demo Hero и практикуйся без врагов.'
                });
            } else if (lhPerMinute < expectedLH * 0.8) {
                this.warnings.push({
                    severity: 'medium',
                    category: 'farming',
                    text: `Фарм ниже нормы: ~${Math.floor(lhPerMinute * 10)} ластхитов за 10 минут.`
                });
            }
        }

        // Проверка GPM
        if (heroData.proStats) {
            const expectedGPM = heroData.proStats.avgGPM;
            
            if (gpm < expectedGPM * 0.6) {
                this.errors.push({
                    severity: 'high',
                    category: 'economy',
                    time: 'Весь матч',
                    text: `Очень низкий GPM: ${gpm} (про-игроки имеют ${expectedGPM}).`,
                    details: 'Разница в ${expectedGPM - gpm} золота в минуту означает потерю ${(expectedGPM - gpm) * duration} золота за матч.'
                });
            }
        }

        // Проверка на AFK фарм
        const fightParticipation = this.calculateFightParticipation(player);
        if (fightParticipation < 0.2 && gpm < 500) {
            this.errors.push({
                severity: 'high',
                category: 'game_impact',
                time: 'Весь матч',
                text: 'Низкое участие в драках при низком фарме — ты не влияешь на игру.',
                details: 'Если фармишь — должен быть топ по нетворсу. Если нет — помогай команде в драках.'
            });
        }
    }

    // Анализ сборки предметов
    analyzeItems(player, duration, heroData) {
        if (!heroData) return;

        const items = player.items || [];
        const heroItems = heroData.itemBuild;
        
        // Проверка таймингов ключевых предметов
        if (heroData.name === "Anti-Mage" && duration >= 20) {
            const hasBattleFury = items.some(item => 
                item.name === 'item_battle_fury' || item.name === 'battle_fury'
            );
            
            if (!hasBattleFury) {
                this.errors.push({
                    severity: 'critical',
                    category: 'items',
                    time: '15:00-20:00',
                    text: 'Anti-Mage без Battle Fury после 20 минуты — игра проиграна по фарму.',
                    details: 'Battle Fury должен быть куплен до 14-16 минуты. После 18 — это уже поздно.'
                });
            } else if (this.getItemTiming(items, 'battle_fury') > 18) {
                this.warnings.push({
                    severity: 'medium',
                    category: 'items',
                    text: 'Battle Fury куплен поздно (после 18 мин). Нужно ускорить фарм на линии.'
                });
            }
        }

        // Проверка Black King Bar
        if (player.deaths > 6 && !this.hasItem(items, 'black_king_bar')) {
            const hasBKB = heroItems.situational.includes('black_king_bar') ||
                          heroItems.core.includes('black_king_bar');
            
            if (hasBKB) {
                this.errors.push({
                    severity: 'high',
                    category: 'items',
                    time: 'Mid-Late game',
                    text: 'Нет Black King Bar при высокой смертности. Против магии и станов BKB обязателен.',
                    details: 'BKB даёт иммунитет к магии и позволяет безопасно наносить урон в драках.'
                });
            }
        }

        // Проверка на "мемные" сборки
        const memeItems = ['divine_rapier', 'dagon_5'];
        const hasMemeItems = items.some(item => memeItems.includes(item.name));
        
        if (hasMemeItems && !player.win && player.deaths > 3) {
            this.warnings.push({
                severity: 'low',
                category: 'items',
                text: 'Сборка с рисковыми предметами в проигранной игре — возможно, стоило играть надёжнее.'
            });
        }
    }

    // Анализ участия в драках
    analyzeFightParticipation(player, matchData) {
        const kills = player.kills || 0;
        const assists = player.assists || 0;
        const teamKills = this.getTeamKills(matchData, player.player_slot);
        const participation = (kills + assists) / Math.max(teamKills, 1);

        if (participation < 0.3 && teamKills > 10) {
            this.errors.push({
                severity: 'high',
                category: 'teamplay',
                time: 'Весь матч',
                text: `Низкое участие в убийствах: ${Math.floor(participation * 100)}%. Ты играешь отдельно от команды.`,
                details: 'Даже керри должен участвовать в драках, если они происходят рядом с его линией фарма.'
            });
        }

        // Проверка на AFK фарм
        if (player.hero_damage < 5000 && duration > 30) {
            this.errors.push({
                severity: 'high',
                category: 'damage',
                time: 'Весь матч',
                text: `Очень низкий урон по героям: ${player.hero_damage} за ${duration} минут.`,
                details: 'Ты практически не наносил урон врагам. Возможно, стоит быть агрессивнее.'
            });
        }
    }

    // Анализ эффективности
    analyzeEfficiency(player, duration, heroData) {
        // Проверка эффективности использования золота
        const netWorth = player.net_worth || 0;
        const gpm = player.gold_per_min || 0;
        const heroDamage = player.hero_damage || 0;
        
        // Эффективность конвертации золота в урон
        if (netWorth > 15000 && heroDamage < 10000) {
            this.errors.push({
                severity: 'high',
                category: 'efficiency',
                time: 'Late game',
                text: 'Большой нетворс, но мало урона. Ты не реализовал преимущество в золоте.',
                details: 'Имея преимущество по золоту, нужно искать драки и наносить урон.'
            });
        }

        // Проверка использования TP Scroll
        if (duration > 20 && player.deaths > 5) {
            this.tips.push({
                category: 'survival',
                text: 'Всегда носи Town Portal Scroll. Если видишь, что врагов много — сразу телепортируйся.'
            });
        }
    }

    // Сравнение с про-игроками
    compareToPro(player, heroData) {
        if (!heroData?.proStats) return;

        const pro = heroData.proStats;
        const comparisons = [];

        // Сравнение GPM
        if (pro.avgGPM) {
            const gpmDiff = pro.avgGPM - (player.gold_per_min || 0);
            if (Math.abs(gpmDiff) > 50) {
                comparisons.push({
                    metric: 'GPM',
                    playerValue: player.gold_per_min || 0,
                    proValue: pro.avgGPM,
                    difference: gpmDiff,
                    percentage: Math.floor((player.gold_per_min || 0) / pro.avgGPM * 100)
                });
            }
        }

        // Сравнение ластхитов на 10 минуте
        if (pro.avgLastHits10) {
            const lh10 = this.estimateLastHitsAt10(player);
            const lhDiff = pro.avgLastHits10 - lh10;
            if (Math.abs(lhDiff) > 10) {
                comparisons.push({
                    metric: 'Last Hits (10 мин)',
                    playerValue: lh10,
                    proValue: pro.avgLastHits10,
                    difference: lhDiff,
                    percentage: Math.floor(lh10 / pro.avgLastHits10 * 100)
                });
            }
        }

        this.comparisons = {
            metrics: comparisons,
            summary: this.generateComparisonSummary(comparisons, heroData)
        };
    }

    // Генерация рекомендаций
    generateRecommendations(player, heroData, isWin) {
        if (!heroData) return;

        const duration = Math.floor((player.duration || 0) / 60);
        
        // Рекомендации по стадии игры
        if (duration < 15) {
            this.tips.push({
                priority: 'high',
                category: 'laning',
                text: heroData.tips?.laning?.[0] || 'Фокусируйся на ластхитах и не умирай на линии.'
            });
        } else if (duration < 30) {
            this.tips.push({
                priority: 'medium',
                category: 'midgame',
                text: heroData.tips?.midgame?.[0] || 'Контролируй карту и участвуй в важных драках.'
            });
        } else {
            this.tips.push({
                priority: 'high',
                category: 'lategame',
                text: heroData.tips?.lategame?.[0] || 'Держись с командой и не умирай в одиночку.'
            });
        }

        // Рекомендация по героям
        if (heroData.commonMistakes && player.deaths > 3) {
            const randomMistake = heroData.commonMistakes[
                Math.floor(Math.random() * heroData.commonMistakes.length)
            ];
            this.tips.push({
                priority: 'medium',
                category: 'hero_specific',
                text: `Чисто ошибка на ${heroData.name}: ${randomMistake}`
            });
        }
    }

    // Генерация данных для графика сравнения
    generateGraphData(player, matchData, heroData) {
        const duration = Math.floor((matchData.duration || 2400) / 60);
        const points = Math.min(duration, 40);
        const step = Math.max(1, Math.floor(duration / 6));
        
        const labels = [];
        const playerData = [];
        const proData = [];
        
        const avgGPM = player.gold_per_min || 300;
        const proGPM = heroData?.proStats?.avgGPM || avgGPM * 1.2;
        
        for (let i = 0; i <= duration; i += step) {
            labels.push(i);
            
            // Моделируем рост нетворса (упрощённо)
            const playerGold = avgGPM * i * (0.5 + Math.random() * 0.3);
            const proGold = proGPM * i * (0.7 + Math.random() * 0.2);
            
            playerData.push(Math.floor(playerGold));
            proData.push(Math.floor(proGold));
        }
        
        // Добавляем конечную точку
        if (labels[labels.length - 1] !== duration) {
            labels.push(duration);
            playerData.push(player.net_worth || avgGPM * duration);
            proData.push((heroData?.proStats?.avgGPM || avgGPM * 1.2) * duration);
        }
        
        return { labels, player: playerData, pro: proData };
    }

    // Генерация текстового резюме
    generateSummary(player, heroData, isWin) {
        const parts = [];
        
        if (isWin) {
            parts.push('Победа! Но есть над чем работать:');
        } else {
            parts.push('Поражение. Основные проблемы:');
        }
        
        // Добавляем ключевые выводы
        const criticalErrors = this.errors.filter(e => e.severity === 'critical');
        if (criticalErrors.length > 0) {
            parts.push(`Найдено ${criticalErrors.length} критических ошибок.`);
        }
        
        const highErrors = this.errors.filter(e => e.severity === 'high');
        if (highErrors.length > 0) {
            parts.push(`${highErrors.length} серьёзных проблем требуют внимания.`);
        }
        
        if (this.comparisons.metrics?.length > 0) {
            const gpmComp = this.comparisons.metrics.find(m => m.metric === 'GPM');
            if (gpmComp) {
                parts.push(`GPM на ${Math.abs(gpmComp.difference)} ${gpmComp.difference > 0 ? 'ниже' : 'выше'} про-уровня.`);
            }
        }
        
        return parts.join(' ');
    }

    // Генерация вопросов для чата
    generateQuestions(player, heroData, matchData) {
        const questions = [];
        
        // Базовые вопросы
        if (player.deaths > 5) {
            questions.push({
                q: 'Как умирать меньше?',
                a: '1. Всегда смотри на миникарту раз в 5 секунд.\n2. Не переходи реку без вардов.\n3. Если враги пропали с карты — отходи к башне.\n4. Покупай защитные предметы раньше (Glimmer, Force Staff, BKB).'
            });
        }
        
        if ((player.last_hits || 0) < 100) {
            questions.push({
                q: 'Как улучшить фарм?',
                a: '1. В демо-режиме практикуй ластхит 15 мин/день.\n2. Фарми лес между волнами крипов.\n3. Используй способности для фарма (если это не саппорт).\n4. Старайся иметь 50+ ластхитов к 10 минуте.'
            });
        }
        
        if (heroData) {
            questions.push({
                q: `Как правильно играть на ${heroData.name}?`,
                a: heroData.tips?.laning?.[0] + '\n' + 
                   (heroData.tips?.midgame?.[0] || '') + '\n' +
                   'Идеальная сборка: ' + heroData.itemBuild.core.join(' → ')
            });
        }
        
        // Вопрос по вардам для саппортов
        if (heroData?.roles?.includes('support') || heroData?.roles?.includes('hard_support')) {
            questions.push({
                q: 'Где ставить варды?',
                a: 'Ключевые точки:\n• Входы в свой лес (защита)\n• Входы во вражеский лес (агрессия)\n• Roshan pit (после 15 мин)\n• High ground wards (для защиты вышек)\n\nСтавь Observer Wards каждые 6 минут.'
            });
        }
        
        return questions.slice(0, 3); // Максимум 3 вопроса
    }

    // ===== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ =====
    
    getDeathTimings(player, matchData) {
        // В реальном API здесь будут реальные таймкоды
        // Сейчас возвращаем примерные интервалы
        const deaths = player.deaths || 0;
        const duration = Math.floor((matchData.duration || 2400) / 60);
        
        if (deaths >= 8) return 'Весь матч (регулярно)';
        if (deaths >= 5) return `${Math.floor(duration * 0.3)}:00-${Math.floor(duration * 0.7)}:00`;
        return 'Ранняя/средняя игра';
    }
    
    didGiveFirstBlood(player, matchData) {
        // Упрощённая проверка (в реальных данных есть точная информация)
        return player.deaths > 0 && player.kills === 0 && player.assists === 0;
    }
    
    calculateDeathStreak(player, matchData) {
        // В реальном API можно анализировать последовательность событий
        return player.deaths >= 5 ? 3 : 0;
    }
    
    calculateFightParticipation(player) {
        const teamKills = (player.kills || 0) + (player.assists || 0);
        const totalKills = teamKills * 1.5; // Примерная оценка
        return teamKills / Math.max(totalKills, 1);
    }
    
    getTeamKills(matchData, playerSlot) {
        const isRadiant = playerSlot < 5;
        const teamPlayers = matchData.players.filter(p => 
            isRadiant ? p.player_slot < 5 : p.player_slot >= 5
        );
        return teamPlayers.reduce((sum, p) => sum + (p.kills || 0), 0);
    }
    
    estimateLastHitsAt10(player) {
        const duration = Math.floor((player.duration || 2400) / 60);
        return Math.floor((player.last_hits || 0) * Math.min(10 / duration, 1));
    }
    
    hasItem(items, itemName) {
        return items.some(item => 
            item.name?.toLowerCase().includes(itemName.toLowerCase())
        );
    }
    
    getItemTiming(items, itemName) {
        // В реальном API есть purchase_time для каждого предмета
        return 20; // Заглушка
    }
    
    generateComparisonSummary(comparisons, heroData) {
        if (!comparisons.length) return 'Нет данных для сравнения';
        
        const belowPro = comparisons.filter(c => c.difference > 0);
        if (belowPro.length === 0) {
            return `Отлично! Все показатели на уровне про-игроков или выше.`;
        }
        
        const mainIssue = belowPro[0];
        return `Главное отставание: ${mainIssue.metric} — ${mainIssue.playerValue} vs ${mainIssue.proValue} (${mainIssue.percentage}% от про-уровня).`;
    }
}

// Экспорт
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DotaMatchAnalyzer;
}
