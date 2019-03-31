import localForage from 'localforage';

export default class CacheService {
  static async getItem(itemId: string): Promise<any> {
    return localForage.getItem(itemId);
  }

  static async setItem(itemId: string, itemValue: any): Promise<any> {
    return localForage.setItem(itemId, itemValue);
  }

  static async deleteItem(itemId: string): Promise<any> {
    return localForage.removeItem(itemId);
  }

  static async clear(): Promise<any> {
    return localForage.clear();
  }
}
