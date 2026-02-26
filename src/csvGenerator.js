import fs from "fs";

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

  fs.writeFile(`${nombreArchivo}.csv`, csvData, (err) => {
    if (err) throw err;
    console.log(`Data has been successfully exported to ${nombreArchivo}.csv`);
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
  fs.writeFileSync(`${fileName}.csv`, csvContent);
}

export function generateCSVStatsMatch(data, fileName) {
  const columnTitles = 'Home Score,Category,Away Score\n';
  const csvData = columnTitles + data;
  fs.writeFile(`${fileName}.csv`, csvData, (err) => {
    if (err) {
      console.error('Error writing CSV file:', err);
    } else {
      console.log('CSV file successfully generated:', `${fileName}.csv`);
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
  fs.writeFile(`${nombreArchivo}.csv`, csvData, (err) => {
    if (err) throw err;
    console.log(`Data has been successfully exported to ${nombreArchivo}.csv`);
  });
}

export function generateCSVPointByPoint(data, fileName, ids) {
  console.log("generateCSVPointByPoint", ids);
  
  const csvData = data.map((item) => `${ids},${item.score}`).join('\n');
  console.log('ID:', ids);
  
  fs.writeFile(`${fileName}.csv`, csvData, (err) => {
    if (err) {
      console.error('Error writing CSV file:', err);
    } else {
      console.log('CSV file successfully generated:', `${fileName}.csv`);
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
  fs.writeFileSync(`${filePath}.csv`, csvContent, 'utf8');
  console.log(`CSV file created at ${filePath}.csv`);
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
  fs.writeFile(`${fileName}.csv`, csvData, (err) => {
    if (err) throw err;
    console.log(`Odds CSV exported to ${fileName}.csv`);
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

  fs.writeFile(`${fileName}.csv`, csvContent.trim(), (err) => {
    if (err) throw err;
    console.log(`H2H CSV exported to ${fileName}.csv`);
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
  fs.writeFile(`${fileName}.csv`, csvData, (err) => {
    if (err) throw err;
    console.log(`Standings CSV exported to ${fileName}.csv`);
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

  fs.writeFile(`${fileName}.csv`, csvContent.trim(), (err) => {
    if (err) throw err;
    console.log(`Lineups CSV exported to ${fileName}.csv`);
  });
}
