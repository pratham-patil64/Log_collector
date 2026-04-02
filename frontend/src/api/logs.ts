// src/api/logs.ts

export async function fetchLogs(page: number = 1, limit: number = 10) {
  const res = await fetch(`http://localhost:6001/logs?page=${page}&limit=${limit}`);
  if (!res.ok) {
    throw new Error("Failed to fetch logs");
  }
  return res.json();
}

export async function searchNormal(q: string, page: number = 1, limit: number = 10) {
  const res = await fetch(
    `http://localhost:6001/search/normal?q=${encodeURIComponent(q)}&page=${page}&limit=${limit}`
  );
  return res.json();
}

export async function searchGin(query: string, page: number, limit: number) {
  const res = await fetch(
    `http://localhost:6001/search/gin?q=${query}&page=${page}&limit=${limit}`
  );
  return res.json();
}

// NEW: Fetch options to populate dropdowns
export async function fetchFilterOptions() {
  const res = await fetch("http://localhost:6001/logs/filter-options");
  if (!res.ok) {
    throw new Error("Failed to fetch filter options");
  }
  return res.json();
}

// NEW: Fetch logs using the new filter endpoint
export async function fetchFilteredLogs(appName: string, level: string, service: string, page: number = 1, limit: number = 10) {
  const params = new URLSearchParams();
  if (appName) params.append("app_name", appName);
  if (level) params.append("level", level);
  if (service) params.append("service", service);
  params.append("page", page.toString());
  params.append("limit", limit.toString());
  
  const res = await fetch(`http://localhost:6001/logs/filter?${params.toString()}`);
  if (!res.ok) {
    throw new Error("Failed to fetch filtered logs");
  }
  return res.json();
}

export async function fetchStats() {
  const res = await fetch("http://localhost:6001/logs/stats");
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
}

export function exportLogs(format: 'csv' | 'json' = 'json') {
  window.open(`http://localhost:6001/logs/export?format=${format}`, '_blank');
}