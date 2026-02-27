import fs from "fs";
import path from "path";

function ensureDirectoryExists(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function generateCSVData(data, nombreArchivo) {
  if (!data || data.length === 0) {
    console.log("No data to generate CSV file.");
    return;
  }

  const headers = Object.keys(data[0]);
  const csvContent = data.map(obj =>
    headers.map(key => `"${String(obj[key]).replace(/"/g, '""')}"`).join(",")
  ).join("\n");
  const headerRow = headers.join(",") + "\n";
  const csvData = headerRow + csvContent;

  ensureDirectoryExists(`${nombreArchivo}.csv`);
  fs.writeFile(`${nombreArchivo}.csv`, csvData, (err) => {
    if (err) throw err;
    console.log(`Data has been successfully exported to ${nombreArchivo}.csv`);
    console.log(`📊 The CSV file contains ${data.length} ${data.length === 1 ? 'record' : 'records'} with ${headers.length} ${headers.length === 1 ? 'column' : 'columns'}.`);
  });
}

export function generateCSVPlayerStats(data, fileName) {
  console.log("generateCSVPlayerStats");
  const headers = ['Name', ...Object.keys(data[0].stats)];
  const headerRow = headers.join(",") + "\n";

  const rows = data.map(player => {
    const values = [player.name, ...headers.slice(1).map(header => player.stats[header])];
    return values.join(",");
  }).join("\n");

  const csvContent = headerRow + rows;
  ensureDirectoryExists(`${fileName}.csv`);
  fs.writeFileSync(`${fileName}.csv`, csvContent);
  console.log(`📊 The CSV file contains ${data.length} ${data.length === 1 ? 'record' : 'records'} with ${headers.length} ${headers.length === 1 ? 'column' : 'columns'}.`);
}

export function generateCSVStatsMatch(data, fileName) {
  const columnTitles = 'Home Score,Category,Away Score\n';
  const csvData = columnTitles + data;
  ensureDirectoryExists(`${fileName}.csv`);
  fs.writeFile(`${fileName}.csv`, csvData, (err) => {
    if (err) {
      console.error('Error writing CSV file:', err);
    } else {
      console.log('CSV file successfully generated:', `${fileName}.csv`);
      const rowCount = data ? data.split('\n').filter(r => r.trim()).length : 0;
      console.log(`📊 The CSV file contains ${rowCount} ${rowCount === 1 ? 'record' : 'records'}.`);
    }
  });
}

export function generateCSVDataResults(data, nombreArchivo) {
  if (!data || data.length === 0) {
    console.log("No data to generate CSV file.");
    return;
  }

  const headers = Object.keys(data[0]);
  const headerRow = headers.join(",") + "\n";
  const csvContent = data.map(obj =>
    headers.map(key => obj[key] !== null ? obj[key] : "").join(",")
  ).join("\n");

  const csvData = headerRow + csvContent;
  ensureDirectoryExists(`${nombreArchivo}.csv`);
  fs.writeFile(`${nombreArchivo}.csv`, csvData, (err) => {
    if (err) throw err;
    console.log(`Data has been successfully exported to ${nombreArchivo}.csv`);
    console.log(`📊 The CSV file contains ${data.length} ${data.length === 1 ? 'record' : 'records'} with ${headers.length} ${headers.length === 1 ? 'column' : 'columns'}.`);
  });
}

export function generateCSVPointByPoint(data, fileName, ids) {
  console.log("generateCSVPointByPoint", ids);
  
  const csvData = data.map((item) => `${ids},${item.score}`).join('\n');
  console.log('ID:', ids);
  
  ensureDirectoryExists(`${fileName}.csv`);
  fs.writeFile(`${fileName}.csv`, csvData, (err) => {
    if (err) {
      console.error('Error writing CSV file:', err);
    } else {
      console.log('CSV file successfully generated:', `${fileName}.csv`);
      console.log(`📊 The CSV file contains ${data.length} ${data.length === 1 ? 'record' : 'records'}.`);
    }
  });
}

export const generateCSVFromObject = (data, filePath) => {
  const headers = [];
  const values = [];

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'object') {
      for (const [subKey, subValue] of Object.entries(value)) {
        headers.push(`${key}_${subKey}`);
        values.push(subValue);
      }
    } else {
      headers.push(key);
      values.push(value);
    }
  }

  const csvContent = `${headers.join(',')}\n${values.join(',')}`;
  ensureDirectoryExists(`${filePath}.csv`);
  fs.writeFileSync(`${filePath}.csv`, csvContent, 'utf8');
  console.log(`CSV file created at ${filePath}.csv`);
  console.log(`📊 The CSV file contains 1 record with ${headers.length} ${headers.length === 1 ? 'field' : 'fields'}.`);
};

export function generateCSVOdds(data, fileName) {
  if (!data || data.length === 0) {
    console.log("No odds data to generate CSV file.");
    return;
  }

  const headers = Object.keys(data[0]);
  const headerRow = headers.join(",") + "\n";
  const csvContent = data.map(obj =>
    headers.map(key => `"${String(obj[key] || '').replace(/"/g, '""')}"`).join(",")
  ).join("\n");

  const csvData = headerRow + csvContent;
  ensureDirectoryExists(`${fileName}.csv`);
  fs.writeFile(`${fileName}.csv`, csvData, (err) => {
    if (err) throw err;
    console.log(`Odds CSV exported to ${fileName}.csv`);
    console.log(`📊 The CSV file contains ${data.length} ${data.length === 1 ? 'record' : 'records'} with ${headers.length} ${headers.length === 1 ? 'column' : 'columns'}.`);
  });
}

export function generateCSVHeadToHead(data, fileName) {
  if (!data) {
    console.log("No H2H data to generate CSV file.");
    return;
  }

  const sections = ['homeLastMatches', 'awayLastMatches', 'directMatches'];
  let csvContent = '';

  sections.forEach((section) => {
    const matches = data[section] || [];
    if (matches.length > 0) {
      csvContent += `\n--- ${section} ---\n`;
      csvContent += 'date,event,homeTeam,awayTeam,result\n';
      matches.forEach((m) => {
        csvContent += `"${m.date}","${m.event}","${m.homeTeam}","${m.awayTeam}","${m.result}"\n`;
      });
    }
  });

  ensureDirectoryExists(`${fileName}.csv`);
  fs.writeFile(`${fileName}.csv`, csvContent.trim(), (err) => {
    if (err) throw err;
    console.log(`H2H CSV exported to ${fileName}.csv`);
    const totalMatches = sections.reduce((sum, s) => sum + (data[s] || []).length, 0);
    const activeSections = sections.filter(s => (data[s] || []).length > 0).length;
    console.log(`📊 The CSV file contains ${totalMatches} ${totalMatches === 1 ? 'record' : 'records'} across ${activeSections} ${activeSections === 1 ? 'section' : 'sections'}.`);
  });
}

export function generateCSVStandings(data, fileName) {
  if (!data || data.length === 0) {
    console.log("No standings data to generate CSV file.");
    return;
  }

  const headers = Object.keys(data[0]);
  const headerRow = headers.join(",") + "\n";
  const csvContent = data.map(obj =>
    headers.map(key => `"${String(obj[key] || '').replace(/"/g, '""')}"`).join(",")
  ).join("\n");

  const csvData = headerRow + csvContent;
  ensureDirectoryExists(`${fileName}.csv`);
  fs.writeFile(`${fileName}.csv`, csvData, (err) => {
    if (err) throw err;
    console.log(`Standings CSV exported to ${fileName}.csv`);
    console.log(`📊 The CSV file contains ${data.length} ${data.length === 1 ? 'record' : 'records'} with ${headers.length} ${headers.length === 1 ? 'column' : 'columns'}.`);
  });
}

export function generateCSVCountriesAndLeagues(data, fileName) {
  if (!data || data.length === 0) {
    console.log("No countries/leagues data to generate CSV file.");
    return;
  }

  const headers = Object.keys(data[0]);
  const headerRow = headers.join(",") + "\n";
  const csvContent = data.map(obj =>
    headers.map(key => `"${String(obj[key] || '').replace(/"/g, '""')}"`).join(",")
  ).join("\n");

  const csvData = headerRow + csvContent;
  ensureDirectoryExists(`${fileName}.csv`);
  fs.writeFile(`${fileName}.csv`, csvData, (err) => {
    if (err) throw err;
    console.log(`Countries & Leagues CSV exported to ${fileName}.csv`);
    console.log(`📊 The CSV file contains ${data.length} ${data.length === 1 ? 'record' : 'records'} with ${headers.length} ${headers.length === 1 ? 'column' : 'columns'}.`);
  });
}

export function generateCSVLineups(data, fileName) {
  if (!data || (!data.home?.length && !data.away?.length)) {
    console.log("No lineup data to generate CSV file.");
    return;
  }

  let csvContent = 'team,number,name,position\n';

  if (data.home) {
    data.home.forEach((p) => {
      csvContent += `"home","${p.number}","${p.name}","${p.position}"\n`;
    });
  }

  if (data.away) {
    data.away.forEach((p) => {
      csvContent += `"away","${p.number}","${p.name}","${p.position}"\n`;
    });
  }

  ensureDirectoryExists(`${fileName}.csv`);
  fs.writeFile(`${fileName}.csv`, csvContent.trim(), (err) => {
    if (err) throw err;
    console.log(`Lineups CSV exported to ${fileName}.csv`);
    const totalPlayers = (data.home?.length || 0) + (data.away?.length || 0);
    console.log(`📊 The CSV file contains ${totalPlayers} ${totalPlayers === 1 ? 'record' : 'records'}.`);
  });
}
