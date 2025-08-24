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
    avatarUrl: user.avatar_url,
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
<svg width="750" height="250" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#74dcc4;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#4597e9;stop-opacity:1" />
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="5" stdDeviation="10" flood-color="rgba(0,0,0,0.3)"/>
    </filter>
    <mask id="avatarMask">
      <rect width="120" height="120" rx="60" ry="60" fill="white"/>
    </mask>
  </defs>

  <!-- 背景 -->
  <rect x="10" y="10" rx="25" ry="25" width="730" height="230" fill="url(#grad)" filter="url(#shadow)"/>

  <!-- 头像 -->
  <image href="${avatarUrl}" x="30" y="65" width="120" height="120" mask="url(#avatarMask)"/>

  <!-- 用户名和简介 -->
  <text x="170" y="100" font-size="30" fill="white" font-family="Fira Code" font-weight="bold">${name}</text>
  <text x="170" y="135" font-size="16" fill="white" font-family="Fira Code">${bio}</text>

  <!-- 数据卡片 -->
  <g font-family="Fira Code" fill="white" font-weight="bold">
    <rect x="170" y="150" width="120" height="50" rx="12" ry="12" fill="rgba(255,255,255,0.2)"/>
    <text x="180" y="180" font-size="18">Repos: ${repos}</text>

    <rect x="310" y="150" width="120" height="50" rx="12" ry="12" fill="rgba(255,255,255,0.2)"/>
    <text x="320" y="180" font-size="18">Stars: ${stars}</text>

    <rect x="450" y="150" width="120" height="50" rx="12" ry="12" fill="rgba(255,255,255,0.2)"/>
    <text x="460" y="180" font-size="18">Followers: ${followers}</text>

    <rect x="590" y="150" width="120" height="50" rx="12" ry="12" fill="rgba(255,255,255,0.2)"/>
    <text x="600" y="180" font-size="18">Contribs: ${contributions}</text>

    <rect x="450" y="205" width="260" height="35" rx="12" ry="12" fill="rgba(255,255,255,0.2)"/>
    <text x="460" y="230" font-size="16">Pinned Projects: ${pinned}</text>
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
