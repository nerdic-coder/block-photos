
export default class AnalyticsService {

  static async logEvent(event) {
    if (window.gtag) {
      window.gtag('event', event);
    }
    if (window.amplitude) {
      window.amplitude.getInstance().logEvent(event);
    }
  }

}
