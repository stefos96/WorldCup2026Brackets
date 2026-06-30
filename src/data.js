// src/data.js

const createTbdRound = (prefix, length) =>
    Array.from({ length }, (_, i) => ({
        id: `${prefix}-tbd-${i}`,
        team: 'TBD',
        code: 'TBD',
        score: 0,
        isWinner: false
    }));

export const initialBracketData = {
    roundOf32: createTbdRound('r32', 32),
    roundOf16: createTbdRound('r16', 16),
    quarterFinals: createTbdRound('qf', 8),
    semiFinals: createTbdRound('sf', 4),
    finals: createTbdRound('f', 2),
};

export const fetchRealTimeBracket = async () => {
    try {
        const [standingsRes, matchesRes] = await Promise.all([
            fetch('https://api.fifa.com/api/v3/calendar/17/285023/289273/standing?language=en&count=200'),
            fetch('https://api.fifa.com/api/v3/calendar/matches?language=en&count=500&idCompetition=17&idSeason=285023')
        ]);

        if (!standingsRes.ok || !matchesRes.ok) throw new Error('FIFA APIs unreachable');

        const standingsData = await standingsRes.json();
        const matchesData = await matchesRes.json();

        // 1. Initialize fixed structural slots
        const updatedBracket = {
            roundOf32: createTbdRound('r32', 32),
            roundOf16: createTbdRound('r16', 16),
            quarterFinals: createTbdRound('qf', 8),
            semiFinals: createTbdRound('sf', 4),
            finals: createTbdRound('f', 2)
        };

        if (!matchesData.Results || matchesData.Results.length === 0) return initialBracketData;

        // 2. Build global team metadata registry
        const globalTeamMetadata = new Map();
        if (standingsData.Results && Array.isArray(standingsData.Results)) {
            standingsData.Results.forEach((row) => {
                const teamId = row.IdTeam;
                if (teamId && row.Team?.Abbreviation) {
                    globalTeamMetadata.set(teamId, {
                        team: row.Team.ShortClubName || row.Team.Name?.[0]?.Description || "TBD",
                        code: row.Team.Abbreviation || "TBD"
                    });
                }
            });
        }

        // 3. Sort matches chronologically/by match number so they sit correctly side-by-side
        const sortedMatches = matchesData.Results.sort((a, b) => {
            const numA = a.MatchNumber || parseInt(a.IdMatch?.toString().slice(-4)) || 0;
            const numB = b.MatchNumber || parseInt(b.IdMatch?.toString().slice(-4)) || 0;
            return numA - numB;
        });

        // Track sequential entry counters only for the initial seeding round (Round of 32)
        let r32Count = 0;

        // 4. Populate the base initial round directly from API
        sortedMatches.forEach((match) => {
            const stageDesc = match.StageName?.[0]?.Description?.toLowerCase() || "";
            const matchIdStr = match.IdMatch?.toString() || "";

            const homeId = match.Home?.IdTeam || match.HomeTeamId;
            const awayId = match.Away?.IdTeam || match.AwayTeamId;

            const homeMeta = globalTeamMetadata.get(homeId) || {
                team: match.Home?.ShortClubName || match.Home?.Name?.[0]?.Description || "TBD",
                code: match.Home?.Abbreviation || "TBD"
            };
            const awayMeta = globalTeamMetadata.get(awayId) || {
                team: match.Away?.ShortClubName || match.Away?.Name?.[0]?.Description || "TBD",
                code: match.Away?.Abbreviation || "TBD"
            };

            const homeScore = match.HomeTeamScore ?? 0;
            const awayScore = match.AwayTeamScore ?? 0;
            const winnerId = match.Winner;

            const homeTeamObj = {
                id: `live-${matchIdStr}-0`,
                team: homeMeta.team,
                code: homeMeta.code,
                score: homeScore,
                isWinner: winnerId === homeId || (match.MatchStatus === 3 && homeScore > awayScore)
            };

            const awayTeamObj = {
                id: `live-${matchIdStr}-1`,
                team: awayMeta.team,
                code: awayMeta.code,
                score: awayScore,
                isWinner: winnerId === awayId || (match.MatchStatus === 3 && awayScore > homeScore)
            };

            if (stageDesc.includes('32') || stageDesc.includes('round of 32')) {
                if (r32Count < 32) {
                    updatedBracket.roundOf32[r32Count] = homeTeamObj;
                    updatedBracket.roundOf32[r32Count + 1] = awayTeamObj;
                    r32Count += 2;
                }
            }
            // Real-time scores for higher rounds get overridden dynamically by tree arithmetic below
        });

        // 5. PURE MATHEMATICAL DYNAMIC PROGRESSION
        // Calculates exactly where winners land next round based entirely on layout geometry
        const propagateTree = (sourceRound, targetRound, targetPrefix) => {
            // Step through source array 4 items at a time (representing 2 matches feeding into 1 next match)
            for (let i = 0; i < sourceRound.length; i += 4) {
                const match1_home = sourceRound[i];
                const match1_away = sourceRound[i + 1];
                const match2_home = sourceRound[i + 2];
                const match2_away = sourceRound[i + 3];

                // Target index in next array layout: every block of 4 maps to a block of 2
                const targetIndex = (i / 4) * 2;

                // Determine Match 1 Winner (Top slot in next match)
                if (match1_home?.isWinner) {
                    targetRound[targetIndex] = { ...match1_home, isWinner: false, score: 0 };
                } else if (match1_away?.isWinner) {
                    targetRound[targetIndex] = { ...match1_away, isWinner: false, score: 0 };
                } else {
                    targetRound[targetIndex] = { id: `${targetPrefix}-tbd-${targetIndex}`, team: 'TBD', code: 'TBD', score: 0, isWinner: false };
                }

                // Determine Match 2 Winner (Bottom slot in next match)
                if (match2_home?.isWinner) {
                    targetRound[targetIndex + 1] = { ...match2_home, isWinner: false, score: 0 };
                } else if (match2_away?.isWinner) {
                    targetRound[targetIndex + 1] = { ...match2_away, isWinner: false, score: 0 };
                } else {
                    targetRound[targetIndex + 1] = { id: `${targetPrefix}-tbd-${targetIndex + 1}`, team: 'TBD', code: 'TBD', score: 0, isWinner: false };
                }
            }
        };

        // Cascade calculations upwards through rounds mathematically
        propagateTree(updatedBracket.roundOf32, updatedBracket.roundOf16, 'r16');
        propagateTree(updatedBracket.roundOf16, updatedBracket.quarterFinals, 'qf');
        propagateTree(updatedBracket.quarterFinals, updatedBracket.semiFinals, 'sf');
        propagateTree(updatedBracket.semiFinals, updatedBracket.finals, 'f');

        return updatedBracket;

    } catch (error) {
        console.error("Dynamic tree process encountered a problem:", error);
        return initialBracketData;
    }
};