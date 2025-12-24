/**
 * API Key 认证管理
 * 功能：管理 API Key 的存储、获取和清除
 */

const API_KEY_STORAGE_KEY = 'geek_drive_api_key';

export const authManager = {
  /**
   * 保存 API Key 到 localStorage
   */
  saveApiKey: (apiKey: string): void => {
    localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
  },

  /**
   * 获取保存的 API Key
   */
  getApiKey: (): string | null => {
    return localStorage.getItem(API_KEY_STORAGE_KEY);
  },

  /**
   * 清除保存的 API Key（退出登录）
   */
  clearApiKey: (): void => {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
  },

  /**
   * 检查是否已认证
   */
  isAuthenticated: (): boolean => {
    return !!authManager.getApiKey();
  }
};

