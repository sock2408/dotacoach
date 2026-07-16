// server.js - Бэкенд для анализа матчей (не может работать на GitHub Pages!)
const express = require('express');
const axios = require('axios');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
app.use(express.json());

// Инициализация OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// CORS для GitHub Pages
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// Эндпоинт для анализа матча
app.post('/api/analyze-match', async (req, res) => {
    try {
        const { matchData, playerData } = req.body;
        
        const analysis = await analyzeMatchWithGPT(matchData, playerData);
        res.json(analysis);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Функция анализа через GPT-4
async function analyzeMatchWithGPT(matchData, playerData) {
    const prompt = `
    Ты — профессиональный аналитик Dota 2. Проанализируй этот матч:

    Герой игрока: ${playerData.hero_name}
    KDA: ${playerData.kills}/${playerData.deaths}/${playerData.assists}
    GPM: ${playerData.gold_per_min}
    XPM: ${playerData.xp_per_min}
    Длительность: ${matchData.duration} минут
    Результат: ${playerData.win ? 'Победа' : 'Поражение'}

    Предметы: ${playerData.items.join(', ')}
    Last hits: ${playerData.last_hits}
    Net worth: ${playerData.net_worth}

    Дай разбор в следующем формате:
    1. Критические ошибки (укажи таймкоды если есть)
    2. Сравнение с про-игроком на этом герое
    3. 3 конкретных совета по улучшению
    4. Ответы на частые вопросы игрока
    `;

    const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo",
        messages: [
            { role: "system", content: "Ты эксперт по Dota 2, который даёт конструктивную критику и советы." },
            { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1000
    });

    return JSON.parse(completion.choices[0].message.content);
}

app.listen(3000, () => console.log('AI Analyzer API на порту 3000'));
