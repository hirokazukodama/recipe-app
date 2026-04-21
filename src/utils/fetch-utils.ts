import * as cheerio from 'cheerio'

export interface ExtractedPageData {
  title: string
  description: string
  imageUrl?: string
  textContent: string
}

/**
 * YouTubeのURLから動画IDを抽出する
 */
export function extractYouTubeId(url: string): string | null {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
  const match = url.match(regex)
  return match ? match[1] : null
}

/**
 * 指定したURLからHTMLを取得し、メタデータと本文を抽出する
 */
export async function fetchPageData(url: string): Promise<ExtractedPageData> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.statusText}`)
  }

  const html = await response.text()
  const $ = cheerio.load(html)

  // 1. 基本メタデータの抽出
  const title = $('title').text() || $('meta[property="og:title"]').attr('content') || ''
  const description = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || ''
  
  // 2. 画像の抽出 (og:image を優先、なければ JSON-LD)
  let imageUrl = $('meta[property="og:image"]').attr('content') || $('meta[name="twitter:image"]').attr('content')
  
  if (!imageUrl) {
    // JSON-LD (Schema.org Recipe) の探索
    const jsonLdScripts = $('script[type="application/ld+json"]').get()
    for (const script of jsonLdScripts) {
      try {
        const data = JSON.parse($(script).html() || '{}')
        const recipe = Array.isArray(data) 
          ? data.find((item: any) => item['@type'] === 'Recipe') 
          : (data['@type'] === 'Recipe' || data['@context']?.includes('schema.org') ? data : null)
        
        if (recipe && recipe.image) {
          imageUrl = Array.isArray(recipe.image) ? recipe.image[0] : (typeof recipe.image === 'string' ? recipe.image : recipe.image.url)
          break
        }
      } catch (e) {
        // ignore invalid json
      }
    }
  }

  // 3. 本文の抽出とクレンジング
  // 不要な要素を削除
  $('script, style, nav, footer, header, iframe, noscript, ads, .ads, .sidebar, #sidebar').remove()

  // レシピサイトに特化したコンテナがあれば優先的に取得
  let content = ''
  const recipeContainer = $('.recipe-content, .recipe-main, article, main').first()
  if (recipeContainer.length > 0) {
    content = recipeContainer.text()
  } else {
    content = $('body').text()
  }

  // 空白の整理
  const textContent = content
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .trim()

  return {
    title,
    description,
    imageUrl,
    textContent,
  }
}
