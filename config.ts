/**
 * 环境配置文件
 * 功能：管理部署环境相关的配置常量
 */

/**
 * 全局配置对象
 * - API_HOST: 后端 API 服务地址（Cloudflare Workers）
 * - STATIC_HOST: R2 静态资源 CDN 地址（用于访问已上传的文件）
 */
export const CONFIG = {
  API_HOST: 'https://loaf.cnzoe.com',
  STATIC_HOST: 'https://loaf-store.cnzoe.com',
};
