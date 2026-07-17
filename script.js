// script.js - Основная логика

const analyzer = new DotaMatchAnalyzer();
let matchDatabase = [];
let selectedMatchIndex = 0;

// DOM элементы
const analyzeBtn = document.getElementById('analyzeBtn');
const steamInput = document.getElementById('steamIdInput');
const loadingOverlay = document.getElementById('loadingOverlay');
const placeholder = document.getElementById('placeholder');
const mainContent = document.getElementById('mainContent');
const matchListContainer = document.getElementById('matchList');
const errorsContainer = document.getElementById('errorsContainer');
const aiChatContainer = document.getElementById('aiChat');
const questionButtonsContainer = document.getElementById('questionButtons');
const graphSvg = document.getElementById('graphSvg');
const playerIdDisplay = document.getElementById('playerIdDisplay');
const playerRank = document.getElementById('playerRank');
const playerMmr = document.getElementById('playerMmr');
const playerAvatar = document.getElementById('playerAvatar');
const defaultAvatar = document.getElementById('defaultAvatar');

// Рендер списка матчей
function renderMatchList() {
    if (matchDatabase.length === 0) {
        matchListContainer.innerHTML = '<p class="text-gray-500 text-sm">Нет матчей</p>';
        return;
    }
    
    matchListContainer.innerHTML = matchDatabase.map((match, index) => {
        const isActive = index === selectedMatchIndex;
        const resultColor = match.result === 'win' ? 'text-green-400' : 'text-red-400';
        const resultText = match.result === 'win' ? 'Победа' : 'Поражение';
        return `
            <div data-index="${index}" 
                 class="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all hover:bg-gray-800 ${isActive ? 'match-active' : ''} border border-transparent hover:border-gray-700"
                 onclick="selectMatch(${index})">
                <div class="w-10 h-10 rounded-full ${match.hero.color || 'bg-gray-600'} flex items-center justify-center text-white font-bold flex-shrink-0 shadow-md">
                    ${match.hero.short}
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-semibold truncate">${match.hero.name}</p>
                    <p class="text-xs text-gray-400">${match.KDA.kills}/${match.KDA.deaths}/${match.KDA.assists} <span class="${resultColor} ml-1">${resultText}</span></p>
                </div>
            </div>
        `;
    }).join('');
}

// Рендер ошибок
function renderErrors(errors) {
    if (!errors || errors.length === 0) {
        errorsContainer.innerHTML = '<p class="text-green-400 text-sm">✅ Критических ошибок не найдено!</p>';
        return;
    }
    
    errorsContainer.innerHTML = errors.map(err => `
        <div class="flex gap-3 p-3 bg-red-900/20 border-l-4 border-red-500 rounded-r-lg fade-in">
            <span class="text-red-400 font-mono font-bold text-sm bg-red-900/40 px-2 py-0.5 rounded">${err.time}</span>
            <p class="text-gray-300 text-sm">${err.text}</p>
        </div>
    `).join('');
}

// Рендер AI чата
function renderAIChat(match) {
    aiChatContainer.innerHTML = `
        <div class="flex gap-3 items-start fade-in">
            <div class="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-1">
                <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100 2h3a1 1 0 100-2h-3z"/>
                </svg>
            </div>
            <div class="bg-gray-800 rounded-lg p-3 text-sm text-gray-200 flex-1">
                ${match.aiSummary || 'Анализ недоступен'}
            </div>
        </div>
    `;

    questionButtonsContainer.innerHTML = match.questions.map((q, qIndex) => `
        <button onclick="askQuestion(${selectedMatchIndex}, ${qIndex})" 
                class="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-blue-300 text-sm font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-1">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            ${q.q}
        </button>
    `).join('');
}

// Обработчик вопроса
function askQuestion(matchIndex, questionIndex) {
    const match = matchDatabase[matchIndex];
    const qa = match.questions[questionIndex];
    
    const answerDiv = document.createElement('div');
    answerDiv.className = 'flex gap-3 items-start fade-in';
    answerDiv.innerHTML = `
        <div class="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-1">
            <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5z"/>
            </svg>
        </div>
        <div class="bg-gray-800 rounded-lg p-3 text-sm text-gray-200 flex-1">
            <p class="text-blue-300 text-xs mb-1 font-semibold">Ответ: «${qa.q}»</p>
            ${qa.a}
        </div>
    `;
    aiChatContainer.appendChild(answerDiv);
    
    const buttons = questionButtonsContainer.querySelectorAll('button');
    if (buttons[questionIndex]) {
        buttons[questionIndex].disabled = true;
        buttons[questionIndex].classList.add('opacity-50', 'cursor-not-allowed');
    }
}

// Отрисовка графика
function drawGraph(graphData) {
    if (!graphData) return;
    
    const { labels, player, pro } = graphData;
    const maxVal = Math.max(...player, ...pro) * 1.1;
    const padding = { left: 35, right: 15, top: 15, bottom: 25 };
    const w = 400 - padding.left - padding.right;
    const h = 200 - padding.top - padding.bottom;

    const xScale = (i) => padding.left + (i / (labels.length - 1)) * w;
    const yScale = (v) => 200 - padding.bottom - (v / maxVal) * h;

    const playerPoints = player.map((v, i) => `${xScale(i)},${yScale(v)}`).join(' ');
    const proPoints = pro.map((v, i) => `${xScale(i)},${yScale(v)}`).join(' ');

    graphSvg.innerHTML = `
        ${[0, 0.25, 0.5, 0.75, 1].map(f => {
            const y = 200 - padding.bottom - f * h;
            return `<line x1="${padding.left}" y1="${y}" x2="${padding.left + w}" y2="${y}" stroke="#374151" stroke-dasharray="4" />`;
        }).join('')}
        <line x1="${padding.left}" y1="${200 - padding.bottom}" x2="${padding.left + w}" y2="${200 - padding.bottom}" stroke="#4B5563" />
        <line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${200 - padding.bottom}" stroke="#4B5563" />
        ${labels.map((l, i) => `<text x="${xScale(i)}" y="${200 - 5}" fill="#9CA3AF" font-size="9" text-anchor="middle">${l}'</text>`).join('')}
        <polyline fill="none" stroke="#3B82F6" stroke-width="2.5" points="${playerPoints}" />
        <polyline fill="none" stroke="#FBBF24" stroke-width="2.5" points="${proPoints}" />
        ${player.map((v, i) => `<circle cx="${xScale(i)}" cy="${yScale(v)}" r="3.5" fill="#3B82F6" />`).join('')}
        ${pro.map((v, i) => `<circle cx="${xScale(i)}" cy="${yScale(v)}" r="3.5" fill="#FBBF24" />`).join('')}
    `;
}

// Выбор матча
function selectMatch(index) {
    selectedMatchIndex = index;
    const match = matchDatabase[index];
    renderMatchList();
    renderErrors(match.errors);
    renderAIChat(match);
    drawGraph(match.graph);
}

// Конвертация Steam ID
function convertSteamId(steamId) {
    steamId = steamId.toString().trim();
    if (steamId.length === 17 && steamId.startsWith('7656')) {
        return Number(BigInt(steamId) - BigInt('76561197960265728'));
    }
    return parseInt(steamId);
}

// Получение звания
function getRankName(rankTier) {
    if (!rankTier) return 'Unknown';
    const ranks = ['Herald', 'Guardian', 'Crusader', 'Archon', 'Legend', 'Ancient', 'Divine', 'Immortal'];
    const tier = Math.floor(rankTier / 10) - 1;
    const stars = rankTier % 10;
    return ranks[tier] ? `${ranks[tier]} [${stars}]` : 'Immortal';
}

// Основная функция анализа
async function performAnalysis() {
    const steamId = steamInput.value.trim();
    if (!steamId) {
        alert('Введите Steam ID');
        return;
    }

    loadingOverlay.classList.remove('hidden');
    
    try {
        const accountId = convertSteamId(steamId);
        
        // Получаем данные игрока
        const playerResponse = await fetch(`https://api.opendota.com/api/players/${accountId}`);
        if (!playerResponse.ok) throw new Error('Игрок не найден');
        const playerData = await playerResponse.json();
        
        // Обновляем шапку
        playerIdDisplay.textContent = playerData.profile?.personaname || steamId;
        if (playerData.profile?.avatarfull) {
            playerAvatar.src = playerData.profile.avatarfull;
            playerAvatar.style.display = 'block';
            defaultAvatar.style.display = 'none';
        }
        playerMmr.textContent = `${playerData.mmr_estimate?.estimate || 'N/A'} MMR`;
        playerRank.textContent = getRankName(playerData.rank_tier);
        
        // Получаем матчи
        const matchesResponse = await fetch(`https://api.opendota.com/api/players/${accountId}/recentMatches`);
        const recentMatches = await matchesResponse.json();
        
        // Анализируем
        matchDatabase = [];
        
        for (const matchSummary of recentMatches.slice(0, 5)) {
            try {
                // Пробуем получить детали
                let matchDetail = null;
                try {
                    const detailResponse = await fetch(`https://api.opendota.com/api/matches/${matchSummary.match_id}`);
                    if (detailResponse.ok) {
                        matchDetail = await detailResponse.json();
                    }
                } catch (e) {
                    console.warn('Детали матча недоступны:', matchSummary.match_id);
                }
                
                // Если нет деталей, создаём из summary
                if (!matchDetail) {
                    matchDetail = {
                        match_id: matchSummary.match_id,
                        duration: matchSummary.duration || 1800,
                        radiant_win: matchSummary.radiant_win,
                        players: [{
                            account_id: accountId,
                            player_slot: matchSummary.player_slot,
                            hero_id: matchSummary.hero_id,
                            kills: matchSummary.kills || 0,
                            deaths: matchSummary.deaths || 0,
                            assists: matchSummary.assists || 0,
                            gold_per_min: matchSummary.gold_per_min || 0,
                            xp_per_min: matchSummary.xp_per_min || 0,
                            last_hits: matchSummary.last_hits || 0,
                            net_worth: (matchSummary.gold_per_min || 0) * ((matchSummary.duration || 1800) / 60),
                            hero_damage: matchSummary.hero_damage || 0,
                            items: matchSummary.items || [],
                            win: matchSummary.player_slot < 5 ? matchSummary.radiant_win : !matchSummary.radiant_win
                        }]
                    };
                }
                
                const analysis = analyzer.analyzeMatch(matchDetail, accountId);
                
                const heroData = HEROES_DATABASE[matchSummary.hero_id];
                
                matchDatabase.push({
                    id: matchSummary.match_id,
                    hero: {
                        name: heroData?.name || `Hero ${matchSummary.hero_id}`,
                        short: heroData?.shortName || `H${matchSummary.hero_id}`,
                        color: 'bg-gray-600'
                    },
                    KDA: {
                        kills: matchSummary.kills || 0,
                        deaths: matchSummary.deaths || 0,
                        assists: matchSummary.assists || 0
                    },
                    result: matchSummary.player_slot < 5 === matchSummary.radiant_win ? 'win' : 'lose',
                    errors: analysis.criticalErrors,
                    warnings: analysis.warnings,
                    tips: analysis.tips,
                    aiSummary: analysis.summary,
                    questions: analysis.questions,
                    graph: analysis.graphData
                });
            } catch (e) {
                console.warn('Ошибка анализа матча:', matchSummary.match_id, e);
            }
        }
        
        loadingOverlay.classList.add('hidden');
        mainContent.classList.remove('hidden');
        placeholder.classList.add('hidden');
        
        if (matchDatabase.length > 0) {
            selectMatch(0);
        } else {
            alert('Не удалось загрузить матчи. Убедитесь, что профиль публичный.');
        }
        
    } catch (error) {
        loadingOverlay.classList.add('hidden');
        console.error('Ошибка:', error);
        alert('Ошибка: ' + error.message);
    }
}

// Обработчики событий
analyzeBtn.addEventListener('click', performAnalysis);
steamInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') performAnalysis();
});

// Начальное состояние
mainContent.classList.add('hidden');
placeholder.classList.remove('hidden');
