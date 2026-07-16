// api.js - Модуль для работы с OpenDota API

class DotaAPI {
    constructor() {
        this.baseURL = 'https://api.opendota.com/api';
    }

    // Получить ID игрока по Steam32 ID
    async getPlayerBySteamId(steamId) {
        try {
            // Конвертируем Steam64 в Steam32 если нужно
            const accountId = this.convertToAccountId(steamId);
            const response = await fetch(`${this.baseURL}/players/${accountId}`);
            if (!response.ok) throw new Error('Игрок не найден');
            return await response.json();
        } catch (error) {
            console.error('Ошибка получения игрока:', error);
            return null;
        }
    }

    // Получить последние матчи игрока
    async getRecentMatches(accountId, limit = 3) {
        try {
            const response = await fetch(
                `${this.baseURL}/players/${accountId}/recentMatches`
            );
            if (!response.ok) throw new Error('Матчи не найдены');
            const matches = await response.json();
            return matches.slice(0, limit);
        } catch (error) {
            console.error('Ошибка получения матчей:', error);
            return [];
        }
    }

    // Получить детальную информацию о матче
    async getMatchDetails(matchId) {
        try {
            const response = await fetch(`${this.baseURL}/matches/${matchId}`);
            if (!response.ok) throw new Error('Матч не найден');
            return await response.json();
        } catch (error) {
            console.error('Ошибка получения деталей матча:', error);
            return null;
        }
    }

    // Получить статистику про-игроков для сравнения
    async getProPlayerStats(heroId) {
        try {
            const response = await fetch(
                `${this.baseURL}/heroes/${heroId}/matchups`
            );
            if (!response.ok) throw new Error('Статистика не найдена');
            return await response.json();
        } catch (error) {
            console.error('Ошибка получения статов профи:', error);
            return null;
        }
    }

    // Вспомогательная функция конвертации Steam ID
    convertToAccountId(steamId) {
        // Если это Steam64 ID (17 цифр)
        if (steamId.length === 17) {
            return BigInt(steamId) - BigInt('76561197960265728');
        }
        // Если уже Steam32 ID
        return steamId;
    }
}

export default DotaAPI;
