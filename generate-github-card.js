// generate-github-card.js
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

const username = 'jaxo4life';
const outputDir = 'assets';
const outputFile = path.join(outputDir, 'github-card.svg');

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

// XML 转义
function escapeXML(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// 把远程图片转为 data URI（Base64 内联）
async function toDataURI(url) {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Fetch failed: ${resp.status} ${resp.statusText}`);
  const buf = Buffer.from(await resp.arrayBuffer());
  const mime = resp.headers.get('content-type') || 'image/png';
  return `data:${mime};base64,${buf.toString('base64')}`;
}

// 获取 GitHub 数据
async function fetchStats() {
  const headers = { 'Accept': 'application/vnd.github.v3+json' };

  const userResp = await fetch(`https://api.github.com/users/${username}`, { headers });
  if (!userResp.ok) throw new Error(`User fetch failed: ${userResp.status}`);
  const user = await userResp.json();

  const reposResp = await fetch(`https://api.github.com/users/${username}/repos?per_page=100`, { headers });
  if (!reposResp.ok) throw new Error(`Repos fetch failed: ${reposResp.status}`);
  const reposData = await reposResp.json();

  const stars = Array.isArray(reposData)
    ? reposData.reduce((acc, r) => acc + (r.stargazers_count || 0), 0)
    : 0;

  // pinned 可能失败，做容错
  let pinnedCount = 0;
  try {
    const pinnedResp = await fetch(`https://gh-pinned-repos.egoist.dev/?username=${username}`);
    if (pinnedResp.ok) {
      const pinnedData = await pinnedResp.json();
      pinnedCount = Array.isArray(pinnedData) ? pinnedData.length : 0;
    }
  } catch (_) { /* ignore */ }

  // 贡献数示例（如需精确请改 GraphQL）
  const contributions = (user.public_repos || 0) * 10;

  // 头像：优先你的仓库头像 → 退回 GitHub 头像；两者都转 Base64 内联，避免外链被拦
  const preferredAvatar = `https://raw.githubusercontent.com/${username}/${username}/main/assets/avatar.png`;
  let avatarDataURI;
  try {
    avatarDataURI = await toDataURI(preferredAvatar);
  } catch {
    const fallback = `${user.avatar_url}${user.avatar_url.includes('?') ? '&' : '?'}s=240`;
    avatarDataURI = await toDataURI(fallback);
  }

  return {
    avatarUrl: avatarDataURI,
    name: user.login || username,
    bio: user.bio || 'Full-stack & Blockchain',
    repos: user.public_repos || 0,
    stars,
    followers: user.followers || 0,
    contributions,
    pinned: pinnedCount
  };
}

// 生成 SVG（蓝黑渐变 + 优化布局 + 文字微光）
function generateSVG({ avatarUrl, name, bio, repos, stars, followers, contributions, pinned }) {
  bio = escapeXML(bio);
  name = escapeXML(name);

  return `
<svg width="750" height="260" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <!-- 蓝黑渐变背景 -->
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a0f1f"/>
      <stop offset="55%" stop-color="#0e1a2b"/>
      <stop offset="100%" stop-color="#000810"/>
    </linearGradient>

    <!-- 投影 -->
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="rgba(0,0,0,0.5)"/>
    </filter>

    <!-- 文字微光 -->
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="1.2" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>

    <!-- 头像裁剪 -->
    <clipPath id="avatarClip">
      <circle cx="75" cy="130" r="60"/>
    </clipPath>
  </defs>

  <!-- 背景卡片 -->
  <rect x="10" y="10" rx="22" ry="22" width="730" height="240" fill="url(#grad)" filter="url(#shadow)"/>

  <!-- 头像 -->
  <image x="15" y="70" width="120" height="120" clip-path="url(#avatarClip)"
         preserveAspectRatio="xMidYMid slice"
         href="${avatarUrl}" xlink:href="${avatarUrl}"/>

  <!-- 文案 -->
  <g font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, 'Fira Code', monospace" fill="#ffffff">
    <text x="160" y="112" font-size="28" font-weight="700" filter="url(#glow)">${name}</text>
    <text x="160" y="142" font-size="16" opacity="0.9">${bio}</text>
  </g>

  <!-- 数据块 -->
  <g font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, 'Fira Code', monospace" fill="#ffffff" font-weight="700">
    <!-- pill 样式参数 -->
    <g opacity="0.9">
      <rect x="160" y="168" width="125" height="46" rx="12" ry="12" fill="rgba(255,255,255,0.12)"/>
      <rect x="300" y="168" width="125" height="46" rx="12" ry="12" fill="rgba(255,255,255,0.12)"/>
      <rect x="440" y="168" width="125" height="46" rx="12" ry="12" fill="rgba(255,255,255,0.12)"/>
      <rect x="590" y="168" width="145" height="46" rx="12" ry="12" fill="rgba(255,255,255,0.12)"/>
      <rect x="160" y="220" width="200" height="30" rx="12" ry="12" fill="rgba(255,255,255,0.12)"/>
    </g>

    <text x="170" y="197" font-size="16">Repos: ${repos}</text>
    <text x="310" y="197" font-size="16">Stars: ${stars}</text>
    <text x="450" y="197" font-size="16">Contribs: ${contributions}</text>
    <text x="600" y="197" font-size="16">Followers: ${followers}</text>
    <text x="170" y="241" font-size="14" font-weight="600">Pinned Projects: ${pinned}</text>
  </g>
</svg>`;
}

// 主函数
(async () => {
  try {
    const stats = await fetchStats();
    const svgContent = generateSVG(stats);
    fs.writeFileSync(outputFile, svgContent, 'utf8');
    console.log('✅ 动态 GitHub Stats SVG 已生成！', outputFile);
  } catch (err) {
    console.error('❌ 生成 SVG 出错:', err);
  }
})();
