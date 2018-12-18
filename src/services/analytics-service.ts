
declare var amplitude;

export default class AnalyticsService {

  static async logEvent(event): Promise<void> {

    if (amplitude) {
      amplitude.getInstance().logEvent(event);
    }
  }

}
