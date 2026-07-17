// script.js - Основной скрипт с интеграцией Rules Engine

// Инициализация анализатора
const analyzer = new DotaMatchAnalyzer();

// База данных матчей (теперь будет наполняться из API + анализа)
let matchDatabase = [];

// ... (весь предыдущий код script.js остаётся) ...

// Обновлённая функция performAnalysis
async function performAnalysis() {
    const steamId = steamInput.value.trim();
    if (!steamId) {
        alert('Введите Steam ID');
        return;
    }

    loadingOverlay.classList.remove('hidden');
    placeholder.classList.add('hidden');
    
    try {
        // 1. Конвертируем Steam ID
        const accountId = convertSteamId(steamId);
        
        // 2. Получаем данные из OpenDota API
        const playerResponse = await fetch(
            `https://api.opendota.com/api/players/${accountId}`
        );
        
        if (!playerResponse.ok) {
            throw new Error('Игрок не найден. Проверьте ID или сделайте профиль публичным.');
        }
        
        const playerData = await playerResponse.json();
        
        // 3. Обновляем информацию в шапке
        playerIdDisplay.textContent = playerData.profile?.personaname || steamId;
        document.getElementById('playerAvatar').src = playerData.profile?.avatarfull || '';
        
        const mmr = playerData.mmr_estimate?.estimate || 'N/A';
        playerMmr.textContent = `${mmr} MMR`;
        playerRank.textContent = getRankName(playerData.rank_tier);
        
        // 4. Получаем последние матчи
        const matchesResponse = await fetch(
            `https://api.opendota.com/api/players/${accountId}/recentMatches`
        );
        const recentMatches = await matchesResponse.json();
        
        // 5. Получаем детали матчей и анализируем
        matchDatabase = [];
        
        for (const matchSummary of recentMatches.slice(0, 5)) {
            try {
                // Запрашиваем детали матча
                let matchDetail = await fetchMatchDetails(matchSummary.match_id);
                
                if (!matchDetail) {
                    // Если матч не распаршен, запрашиваем парсинг
                    await fetch(`https://api.opendota.com/api/request/${matchSummary.match_id}`, {
                        method: 'POST'
                    });
                    
                    // Используем базовую информацию из recentMatches
                    matchDetail = createMinimalMatchData(matchSummary, accountId);
                }
                
                // Запускаем анализ на правилах
                const analysis = analyzer.analyzeMatch(matchDetail, accountId);
                
                // Добавляем в базу
                matchDatabase.push({
                    id: matchSummary.match_id,
                    hero: {
                        name: analysis.meta.heroName,
                        short: analysis.meta.heroName.substring(0, 3),
                        color: getHeroColor(matchSummary.hero_id)
                    },
                    KDA: {
                        kills: matchSummary.kills,
                        deaths: matchSummary.deaths,
                        assists: matchSummary.assists
                    },
                    result: matchSummary.player_slot < 5 === matchSummary.radiant_win ? 'win' : 'lose',
                    errors: analysis.criticalErrors,
                    warnings: analysis.warnings,
                    tips: analysis.tips,
                    aiSummary: analysis.summary,
                    questions: analysis.questions,
                    proComparison: analysis.proComparison,
                    graph: analysis.graphData
                });
                
            } catch (error) {
                console.warn(`Не удалось проанализировать матч ${matchSummary.match_id}:`, error);
            }
        }
        
        // 6. Показываем результаты
        loadingOverlay.classList.add('hidden');
        mainContent.classList.remove('hidden');
        placeholder.classList.add('hidden');
        
        if (matchDatabase.length > 0) {
            selectMatch(0);
        } else {
            alert('Не удалось загрузить матчи. Попробуйте позже.');
        }
        
    } catch (error) {
        loadingOverlay.classList.add('hidden');
        console.error('Ошибка:', error);
        alert(`Ошибка: ${error.message}`);
    }
}

// Получение деталей матча
async function fetchMatchDetails(matchId) {
    try {
        const response = await fetch(`https://api.opendota.com/api/matches/${matchId}`);
        if (response.ok) {
            return await response.json();
        }
    } catch (error) {
        console.warn('Матч не найден:', matchId);
    }
    return null;
}

// Создание минимальных данных матча
function createMinimalMatchData(summary, accountId) {
    return {
        match_id: summary.match_id,
        duration: summary.duration,
        players: [{
            account_id: accountId,
            player_slot: summary.player_slot,
            hero_id: summary.hero_id,
            kills: summary.kills,
            deaths: summary.deaths,
            assists: summary.assists,
            gold_per_min: summary.gold_per_min || 0,
            xp_per_min: summary.xp_per_min || 0,
            last_hits: summary.last_hits || 0,
            denies: summary.denies || 0,
            net_worth: summary.gold_per_min * (summary.duration / 60),
            hero_damage: summary.hero_damage || 0,
            items: summary.items || [],
            win: summary.player_slot < 5 ? summary.radiant_win : !summary.radiant_win
        }]
    };
}

// Получение цвета героя
function getHeroColor(heroId) {
    const colorMap = {
        1: 'bg-blue-700',   // Anti-Mage
        2: 'bg-cyan-600',   // Crystal Maiden
        3: 'bg-purple-700'  // Invoker
    };
    return colorMap[heroId] || 'bg-gray-600';
}

// Вспомогательные функции
function convertSteamId(steamId) {
    if (steamId.length === 17) {
        return parseInt(BigInt(steamId) - BigInt('76561197960265728'));
    }
    return parseInt(steamId);
}

function getRankName(rankTier) {
    if (!rankTier) return 'Unknown';
    const ranks = ['Herald', 'Guardian', 'Crusader', 'Archon', 'Legend', 'Ancient', 'Divine', 'Immortal'];
    const tier = Math.floor(rankTier / 10) - 1;
    const stars = rankTier % 10;
    return ranks[tier] ? `${ranks[tier]} [${stars}]` : 'Immortal';
}
