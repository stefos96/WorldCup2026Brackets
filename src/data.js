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

/**
 * Maps a FIFA Match Number to its structural pair index in your 32-slot array.
 * This ensures that index 0/1 plays index 2/3 in the next round, and matches
 * the official Left-vs-Right bracket flow.
 */
const getRoundOf32SlotIndex = (matchNumber) => {
    const matchToSlotMap = {
        // --- LEFT SIDE OF BRACKET ---
        // Quadrant 1 (Feeds into Semi-Final 1)
        74: 0,  // GER vs PAR -> Winner is R16 Slot 0
        77: 1,  // FRA vs SWE -> Winner is R16 Slot 1 (Faces Slot 0 in M89)
        73: 2,  // RSA vs CAN -> Winner is R16 Slot 2
        75: 3,  // NED vs MAR -> Winner is R16 Slot 3 (Faces Slot 2 in M90)

        // Quadrant 2 (Feeds into Semi-Final 1)
        83: 4,  // POR vs CRO -> Winner is R16 Slot 4
        84: 5,  // ESP vs AUT -> Winner is R16 Slot 5 (Faces Slot 4 in M93)
        81: 6,  // USA vs BIH -> Winner is R16 Slot 6
        82: 7,  // BEL vs SEN -> Winner is R16 Slot 7 (Faces Slot 6 in M94)

        // --- RIGHT SIDE OF BRACKET ---
        // Quadrant 3 (Feeds into Semi-Final 2)
        76: 8,  // BRA vs JPN -> Winner is R16 Slot 8
        78: 9,  // CIV vs NOR -> Winner is R16 Slot 9 (Faces Slot 8 in M91)
        79: 10, // MEX vs ECU -> Winner is R16 Slot 10
        80: 11, // ENG vs COD -> Winner is R16 Slot 11 (Faces Slot 10 in M92)

        // Quadrant 4 (Feeds into Semi-Final 2)
        86: 12, // ARG vs CPV -> Winner is R16 Slot 12
        88: 13, // AUS vs EGY -> Winner is R16 Slot 13 (Faces Slot 12 in M95)
        85: 14, // SUI vs ALG -> Winner is R16 Slot 14
        87: 15  // COL vs GHA -> Winner is R16 Slot 15 (Faces Slot 14 in M96)
    };

    const relativeNum = matchNumber >= 73 ? matchNumber : (matchNumber + 72);
    return matchToSlotMap[relativeNum] !== undefined ? matchToSlotMap[relativeNum] : null;
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

        const now = new Date();
        const upcomingMatches = [];

        matchesData.Results.forEach((match) => {
            const stageDesc = match.StageName?.[0]?.Description?.toLowerCase() || "";
            const matchIdStr = match.IdMatch?.toString() || "";
            const matchNum = match.MatchNumber || parseInt(matchIdStr.slice(-4)) || 0;

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

            const matchDate = match.Date ? new Date(match.Date) : null;

            if (match.MatchStatus === 1 && matchDate && matchDate > now) {
                upcomingMatches.push({
                    id: matchIdStr,
                    home: homeMeta.team,
                    away: awayMeta.team,
                    homeCode: homeMeta.code,
                    awayCode: awayMeta.code,
                    rawDate: matchDate,
                    date: matchDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
                    stage: match.StageName?.[0]?.Description || "World Cup Match"
                });
            }

            // --- FIXED PLACEMENT LOGIC ---
            if (stageDesc.includes('32') || stageDesc.includes('round of 32')) {
                const matchSlotPair = getRoundOf32SlotIndex(matchNum);
                if (matchSlotPair !== null) {
                    const arrayPosition = matchSlotPair * 2;
                    updatedBracket.roundOf32[arrayPosition] = homeTeamObj;
                    updatedBracket.roundOf32[arrayPosition + 1] = awayTeamObj;
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

        const sortedUpcoming = upcomingMatches.sort((a, b) => a.rawDate - b.rawDate);

        const allParsedMatches = matchesData.Results.map(match => {
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
                status: match.MatchStatus,
                date: match.Date ? new Date(match.Date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : "TBD"
            };
        });

        return {
            bracket: updatedBracket,
            upcomingMatches: sortedUpcoming.slice(0, 4),
            allMatches: allParsedMatches
        };
    } catch (error) {
        console.error("Dynamic tree process encountered a problem:", error);
        return { bracket: initialBracketData, upcomingMatches: [] };
    }
};