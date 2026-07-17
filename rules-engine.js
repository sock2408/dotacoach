// rules-engine.js - Движок анализа матчей на правилах

class DotaMatchAnalyzer {
    constructor() {
        this.errors = [];
        this.tips = [];
        this.warnings = [];
        this.comparisons = {};
    }

    analyzeMatch(matchData, playerAccountId) {
        const player = matchData.players.find(p => p.account_id === playerAccountId);
        
        if (!player) {
            throw new Error('Игрок не найден в этом матче');
        }

        this.errors = [];
        this.tips = [];
        this.warnings = [];
        this.comparisons = {};

        const heroData = HEROES_DATABASE[player.hero_id] || null;
        const durationMinutes = Math.floor((matchData.duration || 2400) / 60);
        const isWin = player.win !== undefined ? player.win : 
                      (player.player_slot < 5 === matchData.radiant_win);

        // Анализируем
        this.analyzeDeaths(player, matchData, durationMinutes);
        this.analyzeFarming(player, durationMinutes, heroData);
        this.analyzeItems(player, durationMinutes, heroData);
        this.analyzeFightParticipation(player, matchData);
        this.compareToPro(player, heroData);
        this.generateTips(player, heroData, isWin);

        const graphData = this.generateGraphData(player, matchData, heroData);

        return {
            criticalErrors: this.errors,
            warnings: this.warnings,
            tips: this.tips,
            proComparison: this.comparisons,
            summary: this.makeSummary(player, heroData, isWin),
            questions: this.makeQuestions(player, heroData),
            graphData: graphData,
            meta: {
                heroName: heroData?.name || `Hero ${player.hero_id}`,
                duration: durationMinutes,
                result: isWin ? 'Победа' : 'Поражение'
            }
        };
    }

    analyzeDeaths(player, matchData, duration) {
        const deaths = player.deaths || 0;
        
        if (deaths >= 10) {
            this.errors.push({
                severity: 'critical',
                time: 'Весь матч',
                text: `Критически высокая смертность: ${deaths} смертей за ${duration} мин.`
            });
        } else if (deaths >= 7) {
            this.errors.push({
                severity: 'high',
                time: 'Весь матч',
                text: `Высокая смертность: ${deaths} смертей. Улучши позиционирование.`
            });
        }

        if (player.deaths >= 3 && player.kills === 0 && player.assists === 0) {
            this.errors.push({
                severity: 'high',
                time: 'Ранняя игра',
                text: 'Отдал первую кровь и не смог вернуться в игру.'
            });
        }
    }

    analyzeFarming(player, duration, heroData) {
        const lastHits = player.last_hits || 0;
        const gpm = player.gold_per_min || 0;
        
        if (duration >= 10 && lastHits < duration * 3) {
            this.errors.push({
                severity: 'high',
                time: '00:00-10:00',
                text: `Очень низкий фарм: ~${lastHits} ластхитов за ${duration} мин. Нужно минимум ${duration * 4}.`
            });
        }

        if (heroData?.proStats && gpm < heroData.proStats.avgGPM * 0.6) {
            this.errors.push({
                severity: 'high',
                time: 'Весь матч',
                text: `Низкий GPM: ${gpm} (про-игроки: ${heroData.proStats.avgGPM}).`
            });
        }
    }

    analyzeItems(player, duration, heroData) {
        if (!heroData) return;
        
        const hasBKB = player.items?.some(item => 
            item.name?.includes('black_king_bar')
        );
        
        if (player.deaths > 6 && !hasBKB && heroData.itemBuild.situational.includes('black_king_bar')) {
            this.errors.push({
                severity: 'high',
                time: 'Mid-Late game',
                text: 'Нет Black King Bar при высокой смертности. BKB обязателен против магии и станов.'
            });
        }
    }

    analyzeFightParticipation(player, matchData) {
        const heroDamage = player.hero_damage || 0;
        const duration = Math.floor((matchData.duration || 2400) / 60);
        
        if (heroDamage < 5000 && duration > 30) {
            this.errors.push({
                severity: 'high',
                time: 'Весь матч',
                text: `Очень низкий урон по героям: ${heroDamage} за ${duration} мин.`
            });
        }
    }

    compareToPro(player, heroData) {
        if (!heroData?.proStats) return;
        
        const pro = heroData.proStats;
        const comparisons = [];
        
        if (pro.avgGPM && player.gold_per_min) {
            comparisons.push({
                metric: 'GPM',
                playerValue: player.gold_per_min,
                proValue: pro.avgGPM,
                difference: pro.avgGPM - player.gold_per_min
            });
        }
        
        this.comparisons = { metrics: comparisons };
    }

    generateTips(player, heroData, isWin) {
        if (!heroData) return;
        
        if (isWin) {
            this.tips.push({ text: 'Хорошая игра! Продолжай в том же духе.' });
        } else {
            this.tips.push({ text: 'Сфокусируйся на фарме и позиционировании в следующей игре.' });
        }
        
        if (heroData.commonMistakes?.length > 0) {
            this.tips.push({
                text: `Совет для ${heroData.name}: ${heroData.commonMistakes[0]}`
            });
        }
    }

    generateGraphData(player, matchData, heroData) {
        const duration = Math.floor((matchData.duration || 2400) / 60);
        const labels = [0, 5, 10, 15, 20, 25, 30, 35, 40].filter(m => m <= duration);
        const playerData = labels.map(m => Math.floor((player.gold_per_min || 300) * m * 0.8));
        const proData = labels.map(m => Math.floor((heroData?.proStats?.avgGPM || 400) * m * 0.9));
        
        if (labels[labels.length - 1] !== duration) {
            labels.push(duration);
            playerData.push(player.net_worth || (player.gold_per_min || 300) * duration);
            proData.push((heroData?.proStats?.avgGPM || 400) * duration);
        }
        
        return { labels, player: playerData, pro: proData };
    }

    makeSummary(player, heroData, isWin) {
        const parts = [];
        parts.push(isWin ? '✅ Победа!' : '❌ Поражение.');
        
        if (this.errors.length > 0) {
            parts.push(`Найдено ${this.errors.length} критических проблем.`);
        }
        
        if (this.comparisons.metrics?.length > 0) {
            const gpm = this.comparisons.metrics[0];
            parts.push(`GPM: ${gpm.playerValue} (про: ${gpm.proValue}).`);
        }
        
        return parts.join(' ');
    }

    makeQuestions(player, heroData) {
        const questions = [];
        
        if (player.deaths > 5) {
            questions.push({
                q: 'Как умирать меньше?',
                a: 'Смотри на миникарту каждые 5 секунд. Не переходи реку без вардов. Если враги пропали — отходи к башне.'
            });
        }
        
        if ((player.last_hits || 0) < 100) {
            questions.push({
                q: 'Как улучшить фарм?',
                a: 'Тренируй ластхит в демо-режиме 15 мин/день. Фарми лес между волнами. Старайся иметь 50+ ластхитов к 10 минуте.'
            });
        }
        
        if (heroData) {
            questions.push({
                q: `Как играть на ${heroData.name}?`,
                a: heroData.tips?.laning?.[0] || 'Фокусируйся на ластхитах и не умирай.'
            });
        }
        
        return questions.slice(0, 3);
    }
}
