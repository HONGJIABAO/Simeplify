const fs = require('fs');
const path = require('path');

const appJsonPath = path.resolve(__dirname, '../app.json');
const distDir = path.resolve(__dirname, '../dist');

if (!fs.existsSync(distDir)) {
  console.error(`Dist directory not found at: ${distDir}`);
  process.exit(1);
}

// Read baseUrl from app.json
let baseUrl = '/Simeplify';
try {
  const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
  baseUrl = appJson?.expo?.experiments?.baseUrl || baseUrl;
} catch (err) {
  console.warn('Could not read app.json, using default baseUrl:', baseUrl);
}

console.log(`Configuring GitHub Pages deployment for baseUrl: "${baseUrl}"`);

// Clean baseUrl tokens: e.g. "/Simeplify/testing-kwei" -> ["Simeplify", "testing-kwei"]
const segments = baseUrl.split('/').filter(Boolean);
const repoName = segments[0] || 'Simeplify';
const branchFolder = segments.length > 1 ? segments.slice(1).join('/') : null;

if (branchFolder) {
  console.log(`Branch subfolder detected: "${branchFolder}". Organizing dist layout...`);
  
  const targetDir = path.join(distDir, branchFolder);
  const tempDir = path.join(distDir, '_export_temp');

  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tempDir, { recursive: true });

  // Move all existing items from dist into tempDir, excluding any previous branchFolder
  const items = fs.readdirSync(distDir);
  for (const item of items) {
    if (item === '_export_temp' || item === branchFolder) continue;
    const src = path.join(distDir, item);
    const dest = path.join(tempDir, item);
    fs.renameSync(src, dest);
  }

  // Remove existing targetDir if present and rename tempDir to targetDir
  if (fs.existsSync(targetDir)) {
    fs.rmSync(targetDir, { recursive: true, force: true });
  }
  fs.renameSync(tempDir, targetDir);

  // In targetDir (e.g. dist/testing-kwei):
  // 1. Create .nojekyll
  fs.writeFileSync(path.join(targetDir, '.nojekyll'), '');
  // 2. Ensure 404.html exists for SPA fallback
  const branchIndex = path.join(targetDir, 'index.html');
  const branch404 = path.join(targetDir, '404.html');
  if (fs.existsSync(branchIndex) && !fs.existsSync(branch404)) {
    fs.copyFileSync(branchIndex, branch404);
  }
  console.log(`✓ Structured branch static files inside dist/${branchFolder}/`);

  // In root distDir:
  // 1. Root .nojekyll
  fs.writeFileSync(path.join(distDir, '.nojekyll'), '');

  // 2. Root index.html redirecting to branch
  const redirectHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Simeplify - ${branchFolder}</title>
  <meta http-equiv="refresh" content="0; url=/${repoName}/${branchFolder}/">
  <script>
    window.location.replace("/${repoName}/${branchFolder}/" + window.location.search + window.location.hash);
  </script>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #faf6f1; color: #5c4033; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
  <div style="text-align: center; padding: 24px; max-width: 480px; background: white; border-radius: 16px; box-shadow: 0 4px 12px rgba(92, 64, 51, 0.08);">
    <h2 style="margin-top: 0; color: #566549;">🌿 Simeplify</h2>
    <p style="color: #666; margin-bottom: 16px;">Redirecting to the <strong>${branchFolder}</strong> preview...</p>
    <a href="/${repoName}/${branchFolder}/" style="display: inline-block; background-color: #566549; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 600;">Open Preview</a>
  </div>
</body>
</html>`;
  fs.writeFileSync(path.join(distDir, 'index.html'), redirectHtml, 'utf8');

  // 3. Root 404.html fallback
  const root404Html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Simeplify Redirecting...</title>
  <script>
    var path = window.location.pathname;
    if (!path.startsWith('/${repoName}/${branchFolder}')) {
      window.location.replace('/${repoName}/${branchFolder}/');
    } else {
      window.location.replace('/${repoName}/${branchFolder}/');
    }
  </script>
</head>
<body>
  <p>Redirecting to <a href="/${repoName}/${branchFolder}/">Simeplify (${branchFolder})</a>...</p>
</body>
</html>`;
  fs.writeFileSync(path.join(distDir, '404.html'), root404Html, 'utf8');

  console.log(`✓ Created root index.html and 404.html redirecting to /${repoName}/${branchFolder}/`);
} else {
  // Standard root deployment
  fs.writeFileSync(path.join(distDir, '.nojekyll'), '');
  const rootIndex = path.join(distDir, 'index.html');
  const root404 = path.join(distDir, '404.html');
  if (fs.existsSync(rootIndex) && !fs.existsSync(root404)) {
    fs.copyFileSync(rootIndex, root404);
  }
  console.log('✓ Configured root dist deployment with .nojekyll and 404.html');
}

console.log('Static web export is ready for GitHub Pages deployment.');
