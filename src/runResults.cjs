const { exec } = require('child_process');

const seasons = [
    '2001-2002', '2002-2003', '2003-2004', '2004-2005', '2005-2006', '2006-2007',
    '2007-2008', '2008-2009', '2009-2010', '2010-2011', '2011-2012', '2012-2013',
    '2013-2014', '2014-2015', '2015-2016', '2016-2017', '2017-2018', '2018-2019',
    '2019-2020', '2020-2021', '2021-2022', '2022-2023', '2023-2024'
];

const runCommands = (seasons) => {
    seasons.forEach(season => {
        const command = `npm run results -- spain acb-${season} true false false false`;
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error ejecutando el comando para la temporada ${season}: ${error.message}`);
                return;
            }
            if (stderr) {
                console.error(`stderr para la temporada ${season}: ${stderr}`);
                return;
            }
            console.log(`stdout para la temporada ${season}: ${stdout}`);
        });
    });
};

runCommands(seasons);
