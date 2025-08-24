// generate-github-card.js
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

const username = 'jaxo4life';
const outputDir = 'assets';
const outputFile = path.join(outputDir, 'github-card.svg');

// 确保目录存在
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

// XML 转义
function escapeXML(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// 获取 GitHub 数据
async function fetchStats() {
  const headers = { 'Accept': 'application/vnd.github.v3+json' };

  const userResp = await fetch(`https://api.github.com/users/${username}`, { headers });
  const user = await userResp.json();

  const reposResp = await fetch(`https://api.github.com/users/${username}/repos?per_page=100`, { headers });
  const reposData = await reposResp.json();

  const stars = reposData.reduce((acc, r) => acc + r.stargazers_count, 0);
  const pinnedResp = await fetch(`https://gh-pinned-repos.egoist.dev/?username=${username}`);
  const pinnedData = await pinnedResp.json();

  // Contributions 这里用示例值，如需精确可用 GitHub API v4（GraphQL）
  const contributions = user.public_repos * 10; // 简单示例

  return {
    avatarUrl: "https://raw.githubusercontent.com/jaxo4life/jaxo4life/main/assets/avatar.png",
    name: user.login,
    bio: user.bio || 'Full-stack & Blockchain',
    repos: user.public_repos,
    stars,
    followers: user.followers,
    contributions,
    pinned: pinnedData.length
  };
}

// 生成 SVG
function generateSVG({ avatarUrl, name, bio, repos, stars, followers, contributions, pinned }) {
  bio = escapeXML(bio);
  name = escapeXML(name);

  return `
<svg width="750" height="260" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- 蓝黑渐变背景 -->
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0f2027;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#203a43;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#2c5364;stop-opacity:1" />
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="rgba(0,0,0,0.5)"/>
    </filter>
    <mask id="avatarMask">
      <circle cx="75" cy="130" r="60" fill="white"/>
    </mask>
  </defs>

  <!-- 背景卡片 -->
  <rect x="10" y="10" rx="20" ry="20" width="730" height="240" fill="url(#grad)" filter="url(#shadow)"/>

  <!-- 头像 -->
  <image href="${avatarUrl}" x="15" y="70" width="120" height="120" mask="url(#avatarMask)"/>

  <!-- 用户名和简介 -->
  <text x="160" y="115" font-size="28" fill="white" font-family="Fira Code, monospace" font-weight="bold">${name}</text>
  <text x="160" y="145" font-size="16" fill="white" font-family="Fira Code, monospace">${bio}</text>

  <!-- 数据卡片 -->
  <g font-family="Fira Code, monospace" fill="white" font-weight="bold">
    <rect x="160" y="170" width="120" height="45" rx="10" ry="10" fill="rgba(255,255,255,0.15)"/>
    <text x="170" y="200" font-size="16">Repos: ${repos}</text>

    <rect x="295" y="170" width="120" height="45" rx="10" ry="10" fill="rgba(255,255,255,0.15)"/>
    <text x="305" y="200" font-size="16">Stars: ${stars}</text>

    <rect x="430" y="170" width="140" height="45" rx="10" ry="10" fill="rgba(255,255,255,0.15)"/>
    <text x="440" y="200" font-size="16">Followers: ${followers}</text>

    <rect x="585" y="170" width="140" height="45" rx="10" ry="10" fill="rgba(255,255,255,0.15)"/>
    <text x="595" y="200" font-size="16">Contribs: ${contributions}</text>

    <rect x="430" y="220" width="295" height="30" rx="10" ry="10" fill="rgba(255,255,255,0.15)"/>
    <text x="440" y="242" font-size="14">Pinned Projects: ${pinned}</text>
  </g>
</svg>`;
}

// 主函数
(async () => {
  try {
    const stats = await fetchStats();
    const svgContent = generateSVG(stats);
    fs.writeFileSync(outputFile, svgContent);
    console.log('✅ 动态 GitHub Stats SVG 已生成！');
  } catch (err) {
    console.error('❌ 生成 SVG 出错:', err);
  }
})();
