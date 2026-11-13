/** 純函式：可在瀏覽器與 Node.js 執行，不依賴後端。 */
export const UNIT_GROUPS = {
  length: { label: '長度', units: { m: ['公尺 (m)', 1], km: ['公里 (km)', 1000], cm: ['公分 (cm)', 0.01], mm: ['毫米 (mm)', 0.001], inch: ['英吋 (in)', 0.0254], ft: ['英尺 (ft)', 0.3048] } },
  mass: { label: '重量', units: { kg: ['公斤 (kg)', 1], g: ['公克 (g)', 0.001], lb: ['磅 (lb)', 0.45359237], oz: ['盎司 (oz)', 0.028349523125] } },
  area: { label: '面積', units: { sqm: ['平方公尺 (m²)', 1], ping: ['坪', 400 / 121], ha: ['公頃 (ha)', 10000], sqft: ['平方英尺 (ft²)', 0.09290304] } },
  speed: { label: '速度', units: { kmh: ['公里／小時', 1], ms: ['公尺／秒', 3.6], mph: ['英里／小時', 1.609344] } },
  temperature: { label: '溫度', units: { C: ['攝氏 (°C)', 1], F: ['華氏 (°F)', 1], K: ['克耳文 (K)', 1] } },
};
export function convertUnit(category, from, to, amount) {
  if (!Number.isFinite(amount)) throw new Error('請輸入有效的數值');
  const group = UNIT_GROUPS[category];
  if (!group || !group.units[from] || !group.units[to]) throw new Error('不支援的單位組合');
  if (category === 'temperature') {
    const kelvin = from === 'C' ? amount + 273.15 : from === 'F' ? (amount - 32) * 5 / 9 + 273.15 : amount;
    if (kelvin < -1e-8) throw new Error('溫度不能低於絕對零度');
    return to === 'C' ? kelvin - 273.15 : to === 'F' ? (kelvin - 273.15) * 9 / 5 + 32 : kelvin;
  }
  return amount * group.units[from][1] / group.units[to][1];
}
export function dateDifference(a, b, inclusive = false) {
  const parse = (s) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) throw new Error('日期格式錯誤');
    const [y, m, d] = s.split('-').map(Number);
    const stamp = Date.UTC(y, m - 1, d);
    const date = new Date(stamp);
    if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) throw new Error('無效日期');
    return stamp;
  };
  const delta = Math.round((parse(b) - parse(a)) / 86400000);
  return { signedDays: delta, days: Math.abs(delta) + (inclusive ? 1 : 0) };
}
export function discount(originalPrice, offPercent, quantity = 1) {
  if (![originalPrice, offPercent, quantity].every(Number.isFinite) || originalPrice < 0 || offPercent < 0 || offPercent > 100 || !Number.isInteger(quantity) || quantity < 1) throw new Error('請確認價格、折扣百分比及數量');
  const originalTotal = originalPrice * quantity;
  return { originalTotal, saved: originalTotal * offPercent / 100, final: originalTotal * (1 - offPercent / 100) };
}
export function textStats(str) {
  const chars = Array.from(str);
  return {
    characters: chars.length,
    withoutSpaces: chars.filter(c => !/\s/u.test(c)).length,
    lines: str ? str.split(/\r\n|\r|\n/).length : 0,
    bytes: new TextEncoder().encode(str).length,
  };
}
export function combineDecibels(levels) {
  if (!Array.isArray(levels) || levels.length === 0 || levels.some(v => !Number.isFinite(v))) throw new Error('至少輸入一筆有效分貝數值');
  // 以最大值作參考，避免數值極大時溢位。
  const max = Math.max(...levels);
  return max + 10 * Math.log10(levels.reduce((sum, v) => sum + 10 ** ((v - max) / 10), 0));
}
export function parseDecibels(input) {
  const parts = input.split(/[\s,，、;；]+/).filter(Boolean);
  if (!parts.length || parts.length > 1000) throw new Error('請輸入 1 至 1000 筆分貝數值');
  const nums = parts.map(p => Number(p));
  if (nums.some(n => !Number.isFinite(n))) throw new Error('資料中含有無效分貝數值');
  return nums;
}
export function generatePassword(length, options, randomBytes) {
  const pools = [options.lower && 'abcdefghjkmnpqrstuvwxyz', options.upper && 'ABCDEFGHJKMNPQRSTUVWXYZ', options.digits && '23456789', options.symbols && '!@#$%&*_-+=?'].filter(Boolean);
  if (!pools.length || !Number.isInteger(length) || length < 8 || length > 64) throw new Error('請選擇字元類型，長度介於 8–64');
  const all = pools.join('');
  // rejection sampling，避免 byte % pool.length 的機率偏差。
  const pick = chars => {
    const ceiling = Math.floor(256 / chars.length) * chars.length;
    while (true) {
      const byte = randomBytes(1)[0];
      if (byte < ceiling) return chars[byte % chars.length];
    }
  };
  let result = pools.map(pick);
  while (result.length < length) result.push(pick(all));
  for (let i = result.length - 1; i > 0; i--) {
    const limit = Math.floor(4294967296 / (i + 1)) * (i + 1);
    let n;
    do {
      const bytes = randomBytes(4);
      n = (bytes[0] * 16777216 + bytes[1] * 65536 + bytes[2] * 256 + bytes[3]) >>> 0;
    } while (n >= limit);
    const j = n % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result.join('');
}
