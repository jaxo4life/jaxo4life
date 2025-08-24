// generate-github-card.js
import fs from 'fs';
import fetch from 'node-fetch';

const username = 'jaxo4life';
const avatarUrl = `https://github.com/${username}.png`;

async function fetchStats() {
  const headers = { 'Accept': 'application/vnd.github.v3+json' };
  const userResp = await fetch(`https://api.github.com/users/${username}`, { headers });
  const userData = await userResp.json();

  const reposResp = await fetch(`https://api.github.com/users/${username}/repos?per_page=100`, { headers });
  const reposData = await reposResp.json();

  const stars = reposData.reduce((acc, repo) => acc + repo.stargazers_count, 0);

  return {
    repos: userData.public_repos,
    stars,
    followers: userData.followers
  };
}

function generateSVG({ repos, stars, followers }) {
  return `
<svg width="700" height="200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#74dcc4;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#4597e9;stop-opacity:1" />
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="5" stdDeviation="10" flood-color="rgba(0,0,0,0.3)"/>
    </filter>
  </defs>

  <rect x="10" y="10" rx="20" ry="20" width="680" height="180" fill="url(#grad)" filter="url(#shadow)" />

  <circle cx="70" cy="100" r="50" fill="#ffffff" />
  <image href="${avatarUrl}" x="20" y="50" width="100" height="100" clip-path="circle(50%)"/>

  <text x="150" y="80" font-size="28" fill="white" font-family="Fira Code" font-weight="bold">${username}</text>
  <text x="150" y="115" font-size="16" fill="white" font-family="Fira Code">Full-stack & Blockchain</text>

  <g font-family="Fira Code" fill="white" font-weight="bold">
    <rect x="150" y="130" width="120" height="50" rx="10" ry="10" fill="rgba(255,255,255,0.2)" />
    <text x="160" y="160" font-size="18">Repos: ${repos}</text>

    <rect x="280" y="130" width="120" height="50" rx="10" ry="10" fill="rgba(255,255,255,0.2)" />
    <text x="290" y="160" font-size="18">Stars: ${stars}</text>

    <rect x="410" y="130" width="120" height="50" rx="10" ry="10" fill="rgba(255,255,255,0.2)" />
    <text x="420" y="160" font-size="18">Followers: ${followers}</text>
  </g>
</svg>`;
}

(async () => {
  const stats = await fetchStats();
  const svgContent = generateSVG(stats);
  fs.writeFileSync('assets/github-card.svg', svgContent);
  console.log('✅ GitHub Stats SVG 更新完成！');
})();
