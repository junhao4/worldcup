import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const frontendDir = path.resolve(currentDir, '..');
const designsDir = path.join(frontendDir, '.stitch', 'designs');
const inventoryPath = path.join(designsDir, 'latest-inventory.json');
const assetRoot = path.join(designsDir, 'google-cdn-assets');
const localizedRoot = path.join(designsDir, 'localized');

const typeExtensions = new Map([
  ['application/javascript', '.js'],
  ['application/x-javascript', '.js'],
  ['font/woff2', '.woff2'],
  ['image/avif', '.avif'],
  ['image/gif', '.gif'],
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/svg+xml', '.svg'],
  ['image/webp', '.webp'],
  ['text/css', '.css'],
  ['text/javascript', '.js'],
]);

function normalizeUrl(rawUrl) {
  return rawUrl.replaceAll('&amp;', '&');
}

function stableName(url, extension) {
  const parsed = new URL(url);
  const sourceName = path.basename(parsed.pathname).replace(/[^a-zA-Z0-9._-]/g, '-');
  const hash = createHash('sha1').update(url).digest('hex').slice(0, 12);
  const rawStem = sourceName && sourceName !== '/' ? sourceName.replace(/\.[a-z0-9]+$/i, '') : parsed.hostname.replace(/[^a-zA-Z0-9._-]/g, '-');
  const stem = rawStem.length > 48 ? rawStem.slice(0, 24) : rawStem;

  return `${stem}-${hash}${extension}`;
}

function extensionFor(url, contentType) {
  const fromType = typeExtensions.get(contentType.split(';')[0].trim().toLowerCase());

  if (fromType) {
    return fromType;
  }

  const fromPath = path.extname(new URL(url).pathname);
  return fromPath || '.asset';
}

function bucketFor(url, contentType) {
  const hostname = new URL(url).hostname;
  const baseType = contentType.split(';')[0].trim().toLowerCase();

  if (hostname === 'fonts.googleapis.com') {
    return 'css';
  }

  if (hostname === 'fonts.gstatic.com' || baseType.startsWith('font/')) {
    return 'fonts';
  }

  if (baseType.startsWith('image/')) {
    return 'images';
  }

  if (baseType.includes('javascript')) {
    return 'scripts';
  }

  return 'misc';
}

function localReference(fromDir, targetPath) {
  return path.relative(fromDir, targetPath).replaceAll(path.sep, '/');
}

function extractAssetUrls(html) {
  const urls = new Set();
  const pattern = /https?:\/\/[^"')\s<>]+/g;

  for (const match of html.matchAll(pattern)) {
    const url = normalizeUrl(match[0]);

    if (url === 'https://fonts.googleapis.com' || url === 'https://fonts.gstatic.com') {
      continue;
    }

    if (
      url.startsWith('https://fonts.googleapis.com/css2') ||
      url.startsWith('https://lh3.googleusercontent.com/') ||
      url.startsWith('https://cdn.tailwindcss.com')
    ) {
      urls.add(url);
    }
  }

  return [...urls];
}

function extractFontUrls(css) {
  const urls = new Set();
  const pattern = /url\(([^)]+)\)/g;

  for (const match of css.matchAll(pattern)) {
    const url = match[1].trim().replace(/^['"]|['"]$/g, '');

    if (url.startsWith('https://fonts.gstatic.com/')) {
      urls.add(url);
    }
  }

  return [...urls];
}

async function fetchAsset(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 Stitch asset downloader',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get('content-type') ?? 'application/octet-stream';
  const body = Buffer.from(await response.arrayBuffer());

  return { body, contentType };
}

async function saveAsset(url, preferredBucket) {
  const { body, contentType } = await fetchAsset(url);
  const extension = extensionFor(url, contentType);
  const bucket = preferredBucket ?? bucketFor(url, contentType);
  const filename = stableName(url, extension);
  const outputPath = path.join(assetRoot, bucket, filename);

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, body);

  return {
    bucket,
    contentType,
    filename,
    localPath: outputPath,
    localUrlFromHtml: localReference(localizedRoot, outputPath),
    size: body.length,
    sourceUrl: url,
  };
}

function rewriteHtml(html, urlToAsset) {
  let rewritten = html
    .replace(/^\s*<link[^>]+href="https:\/\/fonts\.googleapis\.com"[^>]*>\s*$/gm, '')
    .replace(/^\s*<link[^>]+href="https:\/\/fonts\.gstatic\.com"[^>]*>\s*$/gm, '');

  for (const [url, asset] of urlToAsset.entries()) {
    rewritten = rewritten.split(url).join(asset.localUrlFromHtml);
    rewritten = rewritten.split(url.replaceAll('&', '&amp;')).join(asset.localUrlFromHtml);
  }

  return rewritten;
}

async function main() {
  const inventory = JSON.parse(await readFile(inventoryPath, 'utf8'));
  const htmlByScreen = new Map();
  const firstPassUrls = new Set();

  await mkdir(assetRoot, { recursive: true });
  await mkdir(localizedRoot, { recursive: true });

  for (const screen of inventory.screens) {
    const htmlPath = path.join(designsDir, screen.files.html);
    const html = await readFile(htmlPath, 'utf8');

    htmlByScreen.set(screen.slug, html);

    for (const url of extractAssetUrls(html)) {
      firstPassUrls.add(url);
    }
  }

  const urlToAsset = new Map();
  const manifestAssets = [];
  const cssAssets = [...firstPassUrls].filter((url) => url.startsWith('https://fonts.googleapis.com/css2'));
  const nonCssAssets = [...firstPassUrls].filter((url) => !url.startsWith('https://fonts.googleapis.com/css2'));

  for (const url of nonCssAssets) {
    const asset = await saveAsset(url);
    urlToAsset.set(url, asset);
    manifestAssets.push(asset);
  }

  for (const url of cssAssets) {
    const { body, contentType } = await fetchAsset(url);
    let css = body.toString('utf8');
    const fontUrls = extractFontUrls(css);

    for (const fontUrl of fontUrls) {
      if (!urlToAsset.has(fontUrl)) {
        const fontAsset = await saveAsset(fontUrl, 'fonts');
        urlToAsset.set(fontUrl, fontAsset);
        manifestAssets.push(fontAsset);
      }

      const fontReference = localReference(path.join(assetRoot, 'css'), urlToAsset.get(fontUrl).localPath);
      css = css.split(fontUrl).join(fontReference);
    }

    const extension = extensionFor(url, contentType);
    const filename = stableName(url, extension);
    const outputPath = path.join(assetRoot, 'css', filename);
    const cssAsset = {
      bucket: 'css',
      contentType,
      filename,
      localPath: outputPath,
      localUrlFromHtml: localReference(localizedRoot, outputPath),
      size: Buffer.byteLength(css),
      sourceUrl: url,
    };

    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, css);
    urlToAsset.set(url, cssAsset);
    manifestAssets.push(cssAsset);
  }

  for (const screen of inventory.screens) {
    const localizedHtml = rewriteHtml(htmlByScreen.get(screen.slug), urlToAsset);
    await writeFile(path.join(localizedRoot, screen.files.html), localizedHtml);
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    note: 'Google CDN and Stitch-hosted assets cached from latest four-screen Stitch design cluster. Localized HTML copies point at these files.',
    projectId: inventory.projectId,
    screens: inventory.screens.map((screen) => screen.slug),
    assets: manifestAssets
      .sort((a, b) => a.sourceUrl.localeCompare(b.sourceUrl))
      .map(({ localPath, ...asset }) => ({
        ...asset,
        localPath: localReference(frontendDir, localPath),
      })),
  };

  await writeFile(path.join(assetRoot, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);

  console.log(`Cached ${manifest.assets.length} CDN assets for ${manifest.screens.length} Stitch screens.`);
  console.log(`Manifest: ${localReference(process.cwd(), path.join(assetRoot, 'manifest.json'))}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
