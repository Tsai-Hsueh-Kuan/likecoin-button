function hexString(buffer) {
  const byteArray = new Uint8Array(buffer);
  const hexCodes = [...byteArray].map((value) => {
    const hexCode = value.toString(16);
    const paddedHexCode = hexCode.padStart(2, '0');
    return paddedHexCode;
  });
  return hexCodes.join('');
}

function digestMessage(message) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  return window.crypto.subtle.digest('SHA-256', data);
}

export async function setTrackerUser({ user }) {
  if (window.doNotTrack || navigator.doNotTrack) return;
  window.dataLayer = window.dataLayer || [];
  try {
    let hashedId = await digestMessage(user);
    hashedId = hexString(hashedId);
    window.dataLayer.push({
      userId: hashedId,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
  }
  if (window.fbq) {
    const userPayload = {};
    if (user) userPayload.external_id = user;
    window.fbq('init', process.env.FACEBOOK_PIXEL_ID, userPayload);
  }
}

export function logTrackerEvent(
  vue,
  category,
  action,
  label,
  value,
) {
  try {
    // do not track
    if (window.doNotTrack || navigator.doNotTrack) return;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'customEvent',
      category,
      action,
      label,
      value,
    });
    if (window.fbq) window.fbq('trackCustom', `${category}_${action}`, { label });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('logging error:');
    // eslint-disable-next-line no-console
    console.error(err);
  }
}

export default logTrackerEvent;
