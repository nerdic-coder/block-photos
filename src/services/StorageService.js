export default class StorageService {

  constructor() {
    this.storage = window.localStorage;
  }

  getItem(itemId) {
    return this.storage.getItem(itemId);
  }

  setItem(itemId, itemValue) {
    this.storage.setItem(itemId, itemValue);
  }

  clear() {
    window.localStorage.clear();
  }
}
