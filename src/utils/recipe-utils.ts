/**
 * 数値を自然な分数の文字列に変換する（日本のレシピ形式）
 */
function toNaturalAmount(num: number): string {
  const rounded = Math.round(num * 100) / 100;
  
  // よくある分数の変換
  if (rounded === 0.5) return '1/2';
  if (rounded === 0.25) return '1/4';
  if (rounded === 0.75) return '3/4';
  if (rounded === 0.33) return '1/3';
  if (rounded === 0.67) return '2/3';
  if (rounded === 0.13) return '1/8';
  
  // 1.5, 2.5 などの対応 (1 1/2)
  if (rounded > 1 && rounded % 1 === 0.5) {
    return `${Math.floor(rounded)}と1/2`;
  }

  return rounded.toString();
}

/**
 * 人数に応じて材料の分量を計算する
 */
export function scaleAmount(
  amount: number | null | undefined, 
  baseServings: number | null | undefined, 
  targetServings: number
): string | null {
  if (amount === null || amount === undefined) return null;
  
  const base = baseServings || 1;
  const scaled = (amount / base) * targetServings;
  
  return toNaturalAmount(scaled);
}

/**
 * 分量と単位を組み合わせた表示用テキストを生成する
 */
export function formatIngredientAmount(
  amount: string | null, 
  unit: string | null, 
  originalText: string | null
): string {
  if (amount === null) return originalText || '';
  
  const u = unit || '';
  // 日本のレシピで「単位 + 数値」となる代表的なもの
  const prefixUnits = ['大さじ', '小さじ', 'カップ'];
  
  if (prefixUnits.some(pu => u.includes(pu))) {
    return `${u}${amount}`;
  }
  
  return `${amount}${u}`;
}
