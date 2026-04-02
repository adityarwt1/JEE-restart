#!/usr/bin/env node

const { exec } = require('child_process');

const query = process.argv[2];
const token = process.argv[3] || 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjE3NzUyNzk4MjkuMDIzLCJkYXRhIjp7Il9pZCI6IjY1NjVkYWZlZWU0M2I1YmIwYzU5MDc1YyIsInVzZXJuYW1lIjoiOTI0NDUyNDU2NSIsImZpcnN0TmFtZSI6IkFkaXR5YSIsImxhc3ROYW1lIjoiUmF3YXQiLCJvcmdhbml6YXRpb24iOnsiX2lkIjoiNWViMzkzZWU5NWZhYjc0NjhhNzlkMTg5Iiwid2Vic2l0ZSI6InBoeXNpY3N3YWxsYWguY29tIiwibmFtZSI6IlBoeXNpY3N3YWxsYWgifSwiZW1haWwiOiJhZGl0eWFyYXdhdG5ldzI0ODdAZ21haWwuY29tIiwicm9sZXMiOlsiNWIyN2JkOTY1ODQyZjk1MGE3NzhjNmVmIiwiNWNjOTVhMmU4YmRlNGQ2NmRlNDAwYjM3Il0sImNvdW50cnlHcm91cCI6IklOIiwidHlwZSI6IlVTRVIifSwianRpIjoiQnFYLTBNSjlTUFNnX1NWTHpCczhwZ182NTY1ZGFmZWVlNDNiNWJiMGM1OTA3NWMiLCJpYXQiOjE3NzQ2NzUwMjl9.u23InTLGYR6Lo0QN8cxLq3-Exq0etmeZlZKIYrJjpQw';

if (!query) {
  console.error('Usage: node searchesLakshyaAndAjuna.js <query> [token]');
  process.exit(1);
}

const batches = [
  {
    name: 'lakshya2026',
    fetchUrl: `https://api.penpencil.co/batch-service/v3/batch-subject-schedules/6779345c20fa0756e4a7fd08/study-content/search?query=${encodeURIComponent(query)}&page=1&limit=10&type=LECTURES`,
    openUrl: `https://www.pw.live/study-v2/batches/lakshya-jee-2026-626411/batch-overview?came_from=study_page&search=open&q=${encodeURIComponent(query)}#Subjects_2`,
  },
  {
    name: 'lakshya2027',
    openUrl: `http://pw.live/study-v2/batches/lakshya-jee-2027-181537/batch-overview?came_from=study_page&search=open&q=${encodeURIComponent(query)}#Subjects_2`,
  },
  {
    name: 'arjuna2026',
    fetchUrl: `https://api.penpencil.co/batch-service/v3/batch-subject-schedules/65dc6fbabb55350018d555b7/study-content/search?query=${encodeURIComponent(query)}&page=1&limit=10&type=LECTURES`,
    openUrl: `https://www.pw.live/study-v2/batches/arjuna-jee-2026-700192/batch-overview?came_from=study_page&search=open&q=${encodeURIComponent(query)}#Subjects_2`,
  },
  {
    name: 'restart',
    fetchUrl: `https://api.penpencil.co/batch-service/v3/batch-subject-schedules/6960d1d20549bb69d7d7e872/study-content/search?query=${encodeURIComponent(query)}&page=1&limit=10&type=LECTURES`,
    openUrl: `https://www.pw.live/study-v2/batches/11th-jee-restart-2026-216170/batch-overview?came_from=study_page&search=open&q=${encodeURIComponent(query)}#Subjects_2`,
  },
];

async function fetchBatch(batch) {
  if (!batch.fetchUrl) return;

  try {
    const response = await fetch(batch.fetchUrl, {
      method: 'GET',
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    console.log(`\n${batch.name} batch logs:`);
    console.log(data);
  } catch (error) {
    console.error(`Failed to fetch ${batch.name} batch:`, error.message || error);
  }
}

function openUrl(url) {
  let command;
  if (process.platform === 'win32') {
    command = `start "" "${url}"`;
  } else if (process.platform === 'darwin') {
    command = `open "${url}"`;
  } else {
    command = `xdg-open "${url}"`;
  }
  exec(command, (error) => {
    if (error) {
      console.error(`Failed to open URL: ${url}`, error.message || error);
    }
  });
}

(async () => {
  await Promise.all(batches.map(fetchBatch));
  batches.forEach((batch) => {
    if (batch.openUrl) {
      openUrl(batch.openUrl);
    }
  });
})();
