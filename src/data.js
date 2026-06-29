// src/data.js
const roundOf32Matches = [
    [['South Africa', 'RSA'], ['Canada', 'CAN']],
    [['Netherlands', 'NED'], ['Morocco', 'MAR']],
    [['Germany', 'GER'], ['Paraguay', 'PAR']],
    [['France', 'FRA'], ['Sweden', 'SWE']],
    [['Brazil', 'BRA'], ['Japan', 'JPN']],
    [['Ivory Coast', 'CIV'], ['Norway', 'NOR']],
    [['Mexico', 'MEX'], ['Ecuador', 'ECU']],
    [['England', 'ENG'], ['DR Congo', 'COD']],
    [['Portugal', 'POR'], ['Croatia', 'CRO']],
    [['Spain', 'ESP'], ['Austria', 'AUT']],
    [['United States', 'USA'], ['Bosnia-Herzegovina', 'BIH']],
    [['Belgium', 'BEL'], ['Senegal', 'SEN']],
    [['Argentina', 'ARG'], ['Cape Verde', 'CPV']],
    [['Australia', 'AUS'], ['Egypt', 'EGY']],
    [['Switzerland', 'SUI'], ['Algeria', 'ALG']],
    [['Colombia', 'COL'], ['Ghana', 'GHA']],
];

const createTbdRound = (prefix, length) =>
    Array.from({ length }, (_, i) => ({ id: `${prefix}-${i}`, team: 'TBD', code: 'TBD' }));

export const initialBracketData = {
    roundOf32: roundOf32Matches.flatMap((match, matchIndex) =>
        match.map(([team, code], teamIndex) => ({
            id: `r32-${matchIndex}-${teamIndex}`,
            matchId: matchIndex + 1,
            team,
            code,
        })),
    ),
    roundOf16: createTbdRound('r16', 16),
    quarterFinals: createTbdRound('qf', 8),
    semiFinals: createTbdRound('sf', 4),
    finals: createTbdRound('f', 2),
};
