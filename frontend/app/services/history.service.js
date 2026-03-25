import { apiRequest } from './api';

export async function fetchHistory(userId, token) {
  try {
    const data = await apiRequest(`/api/history/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return { success: true, history: data.history || [] };
  } catch (error) {
    return { success: false, message: error.message, history: [] };
  }
}

export async function fetchGameDetail(gameId, token) {
  try {
    const data = await apiRequest(`/api/history/game/${gameId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return { success: true, game: data.game };
  } catch (error) {
    return { success: false, message: error.message };
  }
}
