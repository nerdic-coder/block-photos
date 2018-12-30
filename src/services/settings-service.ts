declare var blockstack;

export default class SettingsService {
  static getSettings() {
    JSON.parse(blockstack.getFile('settings.json'));
  }
}
