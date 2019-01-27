import SettingsService from './settings-service';

declare var amplitude;

export default class AnalyticsService {
  static async logEvent(event: string): Promise<void> {
    if (amplitude && (await SettingsService.getAnalyticsSetting())) {
      amplitude.getInstance().logEvent(event);
    }
  }
}
