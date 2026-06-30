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

        if (!matchesData.Results || matchesData.Results.length === 0) {
            return { bracket: initialBracketData, upcomingMatches: [] };
        }

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

        // 3. Sort base matches for bracket generation
        const sortedMatches = matchesData.Results.sort((a, b) => {
            const numA = a.MatchNumber || parseInt(a.IdMatch?.toString().slice(-4)) || 0;
            const numB = b.MatchNumber || parseInt(b.IdMatch?.toString().slice(-4)) || 0;
            return numA - numB;
        });

        // Setup time filtering boundary (End of today)
        const now = new Date();

        const upcomingMatches = [];
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

            // Parse raw match date to ensure it occurs strictly after today
            const matchDate = match.Date ? new Date(match.Date) : null;

            if (match.MatchStatus === 1 && matchDate && matchDate > now) {
                upcomingMatches.push({
                    id: matchIdStr,
                    home: homeMeta.team,
                    away: awayMeta.team,
                    homeCode: homeMeta.code,
                    awayCode: awayMeta.code,
                    rawDate: matchDate, // Keep date reference for chronological sorting
                    date: matchDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
                    stage: match.StageName?.[0]?.Description || "World Cup Match"
                });
            }

            if (stageDesc.includes('32') || stageDesc.includes('round of 32')) {
                if (r32Count < 32) {
                    updatedBracket.roundOf32[r32Count] = homeTeamObj;
                    updatedBracket.roundOf32[r32Count + 1] = awayTeamObj;
                    r32Count += 2;
                }
            }
        });

        // 5. PURE MATHEMATICAL DYNAMIC PROGRESSION
        const propagateTree = (sourceRound, targetRound, targetPrefix) => {
            for (let i = 0; i < sourceRound.length; i += 4) {
                const match1_home = sourceRound[i];
                const match1_away = sourceRound[i + 1];
                const match2_home = sourceRound[i + 2];
                const match2_away = sourceRound[i + 3];

                const targetIndex = (i / 4) * 2;

                if (match1_home?.isWinner) {
                    targetRound[targetIndex] = { ...match1_home, isWinner: false, score: 0 };
                } else if (match1_away?.isWinner) {
                    targetRound[targetIndex] = { ...match1_away, isWinner: false, score: 0 };
                } else {
                    targetRound[targetIndex] = { id: `${targetPrefix}-tbd-${targetIndex}`, team: 'TBD', code: 'TBD', score: 0, isWinner: false };
                }

                if (match2_home?.isWinner) {
                    targetRound[targetIndex + 1] = { ...match2_home, isWinner: false, score: 0 };
                } else if (match2_away?.isWinner) {
                    targetRound[targetIndex + 1] = { ...match2_away, isWinner: false, score: 0 };
                } else {
                    targetRound[targetIndex + 1] = { id: `${targetPrefix}-tbd-${targetIndex + 1}`, team: 'TBD', code: 'TBD', score: 0, isWinner: false };
                }
            }
        };

        propagateTree(updatedBracket.roundOf32, updatedBracket.roundOf16, 'r16');
        propagateTree(updatedBracket.roundOf16, updatedBracket.quarterFinals, 'qf');
        propagateTree(updatedBracket.quarterFinals, updatedBracket.semiFinals, 'sf');
        propagateTree(updatedBracket.semiFinals, updatedBracket.finals, 'f');

        // Chronologically sort upcoming fixtures by date and hours
        const sortedUpcoming = upcomingMatches.sort((a, b) => a.rawDate - b.rawDate);

        // NEW: Also map ALL sorted matches from the API so we can filter by team later
        const allParsedMatches = sortedMatches.map(match => {
            const homeId = match.Home?.IdTeam || match.HomeTeamId;
            const awayId = match.Away?.IdTeam || match.AwayTeamId;
            const homeMeta = globalTeamMetadata.get(homeId) || { team: match.Home?.ShortClubName || "TBD", code: match.Home?.Abbreviation || "TBD" };
            const awayMeta = globalTeamMetadata.get(awayId) || { team: match.Away?.ShortClubName || "TBD", code: match.Away?.Abbreviation || "TBD" };

            return {
                id: match.IdMatch?.toString(),
                stage: match.StageName?.[0]?.Description || "World Cup Match",
                home: homeMeta.team,
                away: awayMeta.team,
                homeCode: homeMeta.code,
                awayCode: awayMeta.code,
                homeScore: match.HomeTeamScore,
                awayScore: match.AwayTeamScore,
                status: match.MatchStatus, // 3 usually means completed
                date: match.Date ? new Date(match.Date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : "TBD"
            };
        });

        return {
            bracket: updatedBracket,
            upcomingMatches: sortedUpcoming.slice(0, 4),
            allMatches: allParsedMatches // <-- Expose this to our React App
        };
    } catch (error) {
        console.error("Dynamic tree process encountered a problem:", error);
        return { bracket: initialBracketData, upcomingMatches: [] };
    }
};