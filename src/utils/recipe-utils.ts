/**
 * 数値を自然な分数の文字列に変換する（日本のレシピ形式）
 */
function toNaturalAmount(num: number): string {
  const rounded = Math.round(num * 100) / 100;

  if (rounded === 0.5) return '1/2';
  if (rounded === 0.25) return '1/4';
  if (rounded === 0.75) return '3/4';
  if (rounded === 0.33) return '1/3';
  if (rounded === 0.67) return '2/3';
  if (rounded === 0.13) return '1/8';

  if (rounded > 1 && rounded % 1 === 0.5) {
    return `${Math.floor(rounded)}と1/2`;
  }

  return rounded.toString();
}

/**
 * テキスト（「大さじ1」「300g」「1/2個」等）から先頭の数値を抽出する
 */
function extractNumberFromText(text: string): number | null {
  // 分数（例: 1/2）を最優先で検索
  const fractionMatch = text.match(/(\d+)\/(\d+)/);
  if (fractionMatch) {
    return parseInt(fractionMatch[1]) / parseInt(fractionMatch[2]);
  }
  // 整数 or 小数（例: 300, 1.5）
  const numMatch = text.match(/[\d.]+/);
  if (numMatch) {
    return parseFloat(numMatch[0]);
  }
  return null;
}

/**
 * 人数に応じて材料の分量を計算する。
 * amount_valueがある場合はそれを使い、nullの場合はoriginal_textから数値を抽出してスケーリングする。
 */
export function scaleAmount(
  amount: number | null | undefined,
  baseServings: number | null | undefined,
  targetServings: number
): string | null {
  const base = baseServings || 1;

  if (amount !== null && amount !== undefined) {
    const scaled = (amount / base) * targetServings;
    return toNaturalAmount(scaled);
  }

  return null;
}

/**
 * 表示用の分量テキストを生成する。
 * scaledAmountがnullの場合はoriginal_textからのフォールバック解析も行う。
 */
export function formatIngredientAmount(
  scaledAmount: string | null,
  unit: string | null,
  originalText: string | null,
  baseServings?: number | null,
  targetServings?: number
): string {
  const u = unit || '';
  const prefixUnits = ['大さじ', '小さじ', 'カップ'];

  // amount_valueからスケーリングできた場合
  if (scaledAmount !== null) {
    if (prefixUnits.some(pu => u.includes(pu))) {
      return `${u}${scaledAmount}`;
    }
    return `${scaledAmount}${u}`;
  }

  // フォールバック: original_textから数値を抽出してスケーリングを試みる
  if (originalText && baseServings !== undefined && targetServings !== undefined) {
    const base = baseServings || 1;
    const extracted = extractNumberFromText(originalText);
    if (extracted !== null) {
      const scaled = (extracted / base) * targetServings;
      const scaledStr = toNaturalAmount(scaled);
      // 元のテキストの数値部分を置き換えて返す
      const replaced = originalText.replace(/(\d+\/\d+|[\d.]+)/, scaledStr);
      return replaced;
    }
    // 数値が取れない場合（「少々」「適量」etc）はそのまま返す
    return originalText;
  }

  return originalText || '';
}
