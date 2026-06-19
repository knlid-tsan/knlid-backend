export function notifyModerationChanged() {
  window.dispatchEvent(new CustomEvent('moderation-counts-changed'));
}
