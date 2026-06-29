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
    Array.from({ length }, (_, i) => ({ id: `${prefix}-${i}`, team: 'TBD', code: 'TBD', score: 0, isWinner: false }));

export const initialBracketData = {
    roundOf32: roundOf32Matches.flatMap((match, matchIndex) =>
        match.map(([team, code], teamIndex) => ({
            id: `r32-${matchIndex}-${teamIndex}`,
            matchId: matchIndex + 1,
            team,
            code,
            score: 0,
            isWinner: false
        })),
    ),
    roundOf16: createTbdRound('r16', 16),
    quarterFinals: createTbdRound('qf', 8),
    semiFinals: createTbdRound('sf', 4),
    finals: createTbdRound('f', 2),
};

export const fetchRealTimeBracket = async () => {
    try {
        const response = await fetch('https://api.fifa.com/api/v3/calendar/17/285023/289273/standing?language=en&count=200');
        if (!response.ok) throw new Error('FIFA API unreachable');
        const data = await response.json();

        const updatedBracket = {
            roundOf32: [], roundOf16: [], quarterFinals: [], semiFinals: [], finals: []
        };

        // If the API structure has no results yet, fallback gracefully
        if (!data.Results || data.Results.length === 0) return initialBracketData;

        // Loop through FIFA's standings list and allocate entries
        data.Results.forEach((item, index) => {
            const stageId = item.IdStage || "";
            const teamName = item.Team?.Name[0]?.Description || "TBD";
            const teamCode = item.Team?.Abbreviation || "TBD";

            const node = {
                id: `fifa-${item.IdTeam || index}`,
                matchId: Math.floor(index / 2) + 1,
                team: teamName,
                code: teamCode,
                score: item.Played || 0, // Using games played or status markers as baseline indicators
                isWinner: item.Position === 1 // If they hold the top rank slot in knockout groupings
            };

            // Map standard FIFA tournament phase configurations to concentric rings
            if (stageId.includes("32")) {
                updatedBracket.roundOf32.push(node);
            } else if (stageId.includes("16")) {
                updatedBracket.roundOf16.push(node);
            } else if (stageId.includes("quarter")) {
                updatedBracket.quarterFinals.push(node);
            } else if (stageId.includes("semi")) {
                updatedBracket.semiFinals.push(node);
            } else if (stageId.includes("final")) {
                updatedBracket.finals.push(node);
            }
        });

        // Smart Promotion: If Round of 32 has winners but next stages are empty, push them inward automatically
        if (updatedBracket.roundOf16.length === 0 && updatedBracket.roundOf32.length > 0) {
            for (let i = 0; i < updatedBracket.roundOf32.length; i += 2) {
                const teamA = updatedBracket.roundOf32[i];
                const teamB = updatedBracket.roundOf32[i + 1];

                if (teamA?.isWinner) {
                    updatedBracket.roundOf16.push({ ...teamA, isWinner: false });
                } else if (teamB?.isWinner) {
                    updatedBracket.roundOf16.push({ ...teamB, isWinner: false });
                } else {
                    updatedBracket.roundOf16.push({ id: `r16-tbd-${i}`, team: 'TBD', code: 'TBD', score: 0, isWinner: false });
                }
            }
        }

        // Structural Fillers: Keep your rings matching the required shapes perfectly
        if (updatedBracket.roundOf32.length === 0) updatedBracket.roundOf32 = initialBracketData.roundOf32;
        if (updatedBracket.roundOf16.length === 0) updatedBracket.roundOf16 = createTbdRound('r16', 16);
        if (updatedBracket.quarterFinals.length === 0) updatedBracket.quarterFinals = createTbdRound('qf', 8);
        if (updatedBracket.semiFinals.length === 0) updatedBracket.semiFinals = createTbdRound('sf', 4);
        if (updatedBracket.finals.length === 0) updatedBracket.finals = createTbdRound('f', 2);

        return updatedBracket;

    } catch (error) {
        console.error("FIFA parsing error, retaining fallback profile:", error);
        return initialBracketData;
    }
};