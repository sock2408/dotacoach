// База данных матчей (три разных матча с уникальным контентом)
const matchDatabase = [
    {
        id: 1,
        hero: { name: "Anti-Mage", short: "AM", color: "bg-blue-700" },
        KDA: { kills: 12, deaths: 3, assists: 8 },
        result: "win",
        errors: [
            { time: "08:20", text: "Не использовал Blink для эскейпа, смерть на линии." },
            { time: "22:10", text: "Неверный выбор цели в драке, фокус на саппорте вместо керри." }
        ],
        aiSummary: "Ты продемонстрировал отличный фарм, но ранние смерти замедлили темп. В драках нужно лучше выбирать приоритетные цели. Твой нетворс был ниже про-игрока на 15%.",
        questions: [
            { q: "Как улучшить фарм в сложной линии?", a: "Используй Blink для отвода крипов и уклонения от хараса. В сложных матч-апах покупай Ring of Health раньше." },
            { q: "Когда стоит роумить на Anti-Mage?", a: "На Anti-Mage роуминг неэффективен до Battle Fury. Сосредоточься на фарме леса и линии, пока не соберешь Manta Style." },
            { q: "Что делать против сильных дебафферов?", a: "Покупай Black King Bar после Manta Style. Включай его до того, как враг наложит стан." }
        ],
        graph: {
            labels: [0, 5, 10, 15, 20, 25, 30, 35, 40],
            player: [0, 800, 2200, 4000, 7000, 10000, 13000, 17000, 20000],
            pro: [0, 900, 2500, 4500, 7500, 11000, 14500, 19000, 23000]
        }
    },
    {
        id: 2,
        hero: { name: "Crystal Maiden", short: "CM", color: "bg-cyan-600" },
        KDA: { kills: 1, deaths: 8, assists: 12 },
        result: "lose",
        errors: [
            { time: "05:15", text: "Слишком агрессивная позиция на линии, отдала первую кровь." },
            { time: "14:30", text: "Не поставила Observer Ward перед гангом, что привело к смерти керри." }
        ],
        aiSummary: "Ты хорошо роумила, но позиционирование и своевременность вардов подвело. Ты отстала по опыту из-за смертей на линии. Старайся играть безопаснее в первые 10 минут.",
        questions: [
            { q: "Где я должен был вардить?", a: "На 14-й минуте нужно было поставить вард у входа в лес Radiant, чтобы заметить ганг на мид. Сейчас рекомендую вардить ближе к руинам." },
            { q: "Как не умирать на линии?", a: "Используй деревья для укрытия, не подходи к крипам без нужды. Прижимайся к башне, если враг агрессивен. И всегда имей при себе Town Portal Scroll." },
            { q: "Какие предметы помогут выжить?", a: "Glimmer Cape и Force Staff — твои лучшие друзья. С ними ты спасешь и себя, и союзников. Против магии собирай Hood of Defiance." }
        ],
        graph: {
            labels: [0, 5, 10, 15, 20, 25, 30, 35, 40],
            player: [0, 400, 1200, 1800, 2500, 3500, 4500, 5500, 6500],
            pro: [0, 600, 1600, 2400, 3400, 4600, 6000, 7500, 9000]
        }
    },
    {
        id: 3,
        hero: { name: "Invoker", short: "Inv", color: "bg-purple-700" },
        KDA: { kills: 8, deaths: 4, assists: 14 },
        result: "win",
        errors: [
            { time: "10:45", text: "Не использовал Sun Strike по убегающему врагу с низким HP." },
            { time: "25:00", text: "Неправильная комбинация скиллов в решающей драке." }
        ],
        aiSummary: "У тебя хорошее понимание героя, но упущенные киллы и ошибки в комбо стоили нескольких тимфайтов. В поздней игре старайся заранее выбирать позицию для каста.",
        questions: [
            { q: "Как лучше использовать Tornado+EMP?", a: "Бросай Tornado, затем сразу EMP в центр подбрасываемых врагов. Тайминг должен быть идеальным — сразу после приземления они получат урон и потерю маны." },
            { q: "Когда покупать Aghanim?", a: "После Boots of Travel и Blink Dagger. Это даст мощный Cataclysm в драках. Если игра затягивается, бери после основных артефактов." },
            { q: "Как распределить сферы на ранней стадии?", a: "Для Quas-Wex — 4 в Quas и 4 в Wex к 10 уровню, затем ульт. Для Exort — 4 в Exort, 1 в Quas к 7 уровню. Это даст сильные Sun Strike." }
        ],
        graph: {
            labels: [0, 5, 10, 15, 20, 25, 30, 35, 40],
            player: [0, 700, 1900, 3500, 5500, 8000, 10500, 13500, 16500],
            pro: [0, 750, 2000, 3700, 5800, 8500, 11200, 14500, 18000]
        }
    }
];

// Глобальное состояние
let selectedMatchIndex = 0;
let analysisPerformed = false;

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
// Статические ранг/ммр (не меняются)
const playerRank = document.getElementById('playerRank');
const playerMmr = document.getElementById('playerMmr');

// Функция перерисовки списка матчей в сайдбаре
function renderMatchList() {
    matchListContainer.innerHTML = matchDatabase.map((match, index) => {
        const isActive = (index === selectedMatchIndex);
        const resultColor = match.result === 'win' ? 'text-green-400' : 'text-red-400';
        const resultText = match.result === 'win' ? 'Победа' : 'Поражение';
        return `
            <div data-index="${index}" 
                 class="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all hover:bg-gray-800 ${isActive ? 'match-active' : 'bg-gray-850'} border border-transparent hover:border-gray-700"
                 onclick="selectMatch(${index})">
                <div class="w-10 h-10 rounded-full ${match.hero.color} flex items-center justify-center text-white font-bold flex-shrink-0 shadow-md">
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

// Функция отображения ошибок
function renderErrors(errors) {
    errorsContainer.innerHTML = errors.map(err => `
        <div class="flex gap-3 p-3 bg-red-900/20 border-l-4 border-red-500 rounded-r-lg fade-in">
            <span class="text-red-400 font-mono font-bold text-sm bg-red-900/40 px-2 py-0.5 rounded">${err.time}</span>
            <p class="text-gray-300 text-sm">${err.text}</p>
        </div>
    `).join('');
}

// Функция управления чатом ИИ
function renderAIChat(match) {
    // Очищаем чат, оставляем только резюме
    aiChatContainer.innerHTML = `
        <div class="flex gap-3 items-start fade-in">
            <div class="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-1">
                <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100 2h3a1 1 0 100-2h-3z"/>
                </svg>
            </div>
            <div class="bg-gray-800 rounded-lg p-3 text-sm text-gray-200 flex-1">
                ${match.aiSummary}
            </div>
        </div>
    `;

    // Рендерим кнопки вопросов
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

// Обработчик нажатия на вопрос
function askQuestion(matchIndex, questionIndex) {
    const match = matchDatabase[matchIndex];
    const qa = match.questions[questionIndex];
    // Добавляем ответ в чат
    const answerDiv = document.createElement('div');
    answerDiv.className = 'flex gap-3 items-start fade-in';
    answerDiv.innerHTML = `
        <div class="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-1">
            <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100 2h3a1 1 0 100-2h-3z"/>
            </svg>
        </div>
        <div class="bg-gray-800 rounded-lg p-3 text-sm text-gray-200 flex-1">
            <p class="text-blue-300 text-xs mb-1 font-semibold">Ответ на: «${qa.q}»</p>
            ${qa.a}
        </div>
    `;
    aiChatContainer.appendChild(answerDiv);
    // Деактивируем кнопку, чтобы не спамить
    const buttons = questionButtonsContainer.querySelectorAll('button');
    if (buttons[questionIndex]) {
        buttons[questionIndex].disabled = true;
        buttons[questionIndex].classList.add('opacity-50', 'cursor-not-allowed');
    }
}

// Отрисовка SVG-графика сравнения
function drawGraph(graphData) {
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
        <!-- Горизонтальные линии сетки -->
        ${[0, 0.25, 0.5, 0.75, 1].map(f => {
            const y = 200 - padding.bottom - f * h;
            return `<line x1="${padding.left}" y1="${y}" x2="${padding.left + w}" y2="${y}" stroke="#374151" stroke-dasharray="4" />`;
        }).join('')}
        <!-- Оси -->
        <line x1="${padding.left}" y1="${200 - padding.bottom}" x2="${padding.left + w}" y2="${200 - padding.bottom}" stroke="#4B5563" />
        <line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${200 - padding.bottom}" stroke="#4B5563" />
        <!-- Подписи минут -->
        ${labels.map((l, i) => `<text x="${xScale(i)}" y="${200 - 5}" fill="#9CA3AF" font-size="9" text-anchor="middle">${l}'</text>`).join('')}
        <!-- Линия игрока -->
        <polyline fill="none" stroke="#3B82F6" stroke-width="2.5" points="${playerPoints}" />
        <!-- Линия про -->
        <polyline fill="none" stroke="#FBBF24" stroke-width="2.5" points="${proPoints}" />
        <!-- Точки игрока -->
        ${player.map((v, i) => `<circle cx="${xScale(i)}" cy="${yScale(v)}" r="3.5" fill="#3B82F6" />`).join('')}
        <!-- Точки про -->
        ${pro.map((v, i) => `<circle cx="${xScale(i)}" cy="${yScale(v)}" r="3.5" fill="#FBBF24" />`).join('')}
    `;
}

// Выбор матча и обновление интерфейса
function selectMatch(index) {
    selectedMatchIndex = index;
    const match = matchDatabase[index];
    renderMatchList();
    renderErrors(match.errors);
    renderAIChat(match);
    drawGraph(match.graph);
}

// Запуск анализа
function performAnalysis() {
    const steamId = steamInput.value.trim();
    if (!steamId) {
        alert('Введите Steam ID или Dota ID');
        return;
    }

    // Показываем загрузку
    loadingOverlay.classList.remove('hidden');
    // Имитация задержки 1.5 секунды
    setTimeout(() => {
        // Скрываем загрузку и placeholder, показываем основной контент
        loadingOverlay.classList.add('hidden');
        placeholder.classList.add('hidden');
        mainContent.classList.remove('hidden');
        
        // Обновляем шапку
        playerIdDisplay.textContent = steamId;
        // Ранг и MMR статичны, уже заданы

        analysisPerformed = true;
        // Выбираем первый матч
        selectMatch(0);
    }, 1500);
}

// Обработчики событий
analyzeBtn.addEventListener('click', performAnalysis);
steamInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') performAnalysis();
});

// Инициализация: скрываем основной контент до анализа
mainContent.classList.add('hidden');
placeholder.classList.remove('hidden');
// Сбрасываем ID
playerIdDisplay.textContent = 'Неизвестно';
