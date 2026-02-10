'use client';

import { useState, useEffect } from 'react';

const CACHE_KEY = 'lowdefy-github-stats';
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

export function useGitHubStats() {
  const [stats, setStats] = useState({
    stars: 2600,
    latestVersion: '4.5.2',
    loading: true,
    error: null,
  });

  useEffect(() => {
    async function fetchStats() {
      // Check cache first
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          setStats({ ...data, loading: false, error: null });
          return;
        }
      }

      try {
        const [repoRes, releasesRes] = await Promise.all([
          fetch('https://api.github.com/repos/lowdefy/lowdefy'),
          fetch('https://api.github.com/repos/lowdefy/lowdefy/releases/latest'),
        ]);

        if (!repoRes.ok || !releasesRes.ok) {
          throw new Error('Failed to fetch GitHub data');
        }

        const repoData = await repoRes.json();
        const releaseData = await releasesRes.json();

        const newStats = {
          stars: repoData.stargazers_count,
          latestVersion: releaseData.tag_name?.replace('v', '') || '4.5.2',
        };

        // Cache the results
        localStorage.setItem(CACHE_KEY, JSON.stringify({ data: newStats, timestamp: Date.now() }));

        setStats({ ...newStats, loading: false, error: null });
      } catch (error) {
        setStats((prev) => ({ ...prev, loading: false, error: 'Failed to fetch stats' }));
      }
    }

    fetchStats();
  }, []);

  return stats;
}

export function formatStars(count) {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
}
