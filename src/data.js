// src/data.js

// Dynamic helper to create placeholder shapes for empty slots
const createTbdRound = (prefix, length) =>
    Array.from({ length }, (_, i) => ({
        id: `${prefix}-tbd-${i}`,
        team: 'TBD',
        code: 'TBD',
        score: 0,
        isWinner: false
    }));

// Geometrically complete base structure used as an instant fallback
export const initialBracketData = {
    roundOf32: createTbdRound('r32', 32),
    roundOf16: createTbdRound('r16', 16),
    quarterFinals: createTbdRound('qf', 8),
    semiFinals: createTbdRound('sf', 4),
    finals: createTbdRound('f', 2),
};

export const fetchRealTimeBracket = async () => {
    try {
        // 1. Fetch both endpoints concurrently to optimize performance
        const [standingsRes, matchesRes] = await Promise.all([
            fetch('https://api.fifa.com/api/v3/calendar/17/285023/289273/standing?language=en&count=200'),
            fetch('https://api.fifa.com/api/v3/calendar/matches?language=en&count=500&idCompetition=17&idSeason=285023')
        ]);

        if (!standingsRes.ok || !matchesRes.ok) throw new Error('FIFA APIs unreachable');

        const standingsData = await standingsRes.json();
        const matchesData = await matchesRes.json();

        const updatedBracket = {
            roundOf32: [],
            roundOf16: [],
            quarterFinals: [],
            semiFinals: [],
            finals: []
        };

        if (!matchesData.Results || matchesData.Results.length === 0) return initialBracketData;

        // 2. Build a dynamic, runtime registry map connecting IdTeam to Name/Abbreviation using standings
        const globalTeamMetadata = new Map();
        if (standingsData.Results && Array.isArray(standingsData.Results)) {
            standingsData.Results.forEach((row) => {
                const teamId = row.IdTeam;
                if (teamId && row.Team && row.Team.Abbreviation) {
                    globalTeamMetadata.set(teamId, {
                        team: row.Team.ShortClubName || row.Team.Name?.[0]?.Description || "TBD",
                        code: row.Team.Abbreviation || "TBD"
                    });
                }
            });
        }

        // 3. Process all matches dynamically, querying our globalTeamMetadata fallback registry when properties missing
        matchesData.Results.forEach((match) => {
            const stageDesc = match.StageName?.[0]?.Description?.toLowerCase() || "";

            const homeId = match.Home?.IdTeam || match.HomeTeamId;
            const awayId = match.Away?.IdTeam || match.AwayTeamId;

            // Extract metadata from match objects with an explicit fallback to our dynamic map
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

            const pair = [
                {
                    id: `live-${match.IdMatch}-0`,
                    team: homeMeta.team,
                    code: homeMeta.code,
                    score: homeScore,
                    isWinner: winnerId === homeId || (match.MatchStatus === 3 && homeScore > awayScore)
                },
                {
                    id: `live-${match.IdMatch}-1`,
                    team: awayMeta.team,
                    code: awayMeta.code,
                    score: awayScore,
                    isWinner: winnerId === awayId || (match.MatchStatus === 3 && awayScore > homeScore)
                }
            ];

            // Filter into target concentric structural tracks dynamically
            if (stageDesc.includes('32') || stageDesc.includes('round of 32')) {
                updatedBracket.roundOf32.push(...pair);
            } else if (stageDesc.includes('16') || stageDesc.includes('round of 16')) {
                updatedBracket.roundOf16.push(...pair);
            } else if (stageDesc.includes('quarter')) {
                updatedBracket.quarterFinals.push(...pair);
            } else if (stageDesc.includes('semi')) {
                updatedBracket.semiFinals.push(...pair);
            } else if (stageDesc.includes('final') && !stageDesc.includes('third')) {
                updatedBracket.finals.push(...pair);
            }
        });

        // 4. TREE LOGIC FALLBACK: If inner stages haven't generated matches yet,
        // programmatically advance winners from previous tiers to keep the visual flow active
        const promoteWinners = (currentRound, idealCount, prefix) => {
            if (currentRound.length > 0) return currentRound; // Already populated by API data

            const dynamicPool = [];
            const sourceRound = prefix === 'r16' ? updatedBracket.roundOf32 :
                prefix === 'qf'  ? updatedBracket.roundOf16 :
                    prefix === 'sf'  ? updatedBracket.quarterFinals : updatedBracket.semiFinals;

            if (sourceRound && sourceRound.length > 0) {
                for (let i = 0; i < sourceRound.length; i += 4) {
                    if (dynamicPool.length >= idealCount) break;

                    const m1_t1 = sourceRound[i];
                    const m1_t2 = sourceRound[i + 1];
                    const m2_t1 = sourceRound[i + 2];
                    const m2_t2 = sourceRound[i + 3];

                    let slot1 = { id: `${prefix}-tbd-${i}`, team: 'TBD', code: 'TBD', score: 0, isWinner: false };
                    if (m1_t1?.isWinner) slot1 = { ...m1_t1, isWinner: false, score: 0 };
                    else if (m1_t2?.isWinner) slot1 = { ...m1_t2, isWinner: false, score: 0 };

                    let slot2 = { id: `${prefix}-tbd-${i+2}`, team: 'TBD', code: 'TBD', score: 0, isWinner: false };
                    if (m2_t1?.isWinner) slot2 = { ...m2_t1, isWinner: false, score: 0 };
                    else if (m2_t2?.isWinner) slot2 = { ...m2_t2, isWinner: false, score: 0 };

                    dynamicPool.push(slot1, slot2);
                }
            }

            // Fill remainder with empty placeholders to avoid rendering layout errors
            while (dynamicPool.length < idealCount) {
                dynamicPool.push({
                    id: `${prefix}-empty-${dynamicPool.length}`,
                    team: 'TBD',
                    code: 'TBD',
                    score: 0,
                    isWinner: false
                });
            }
            return dynamicPool;
        };

        // 5. Keep counts perfectly proportional for the 3D concentric ring layout
        updatedBracket.roundOf32 = updatedBracket.roundOf32.length === 32 ? updatedBracket.roundOf32 : initialBracketData.roundOf32;
        updatedBracket.roundOf16 = promoteWinners(updatedBracket.roundOf16, 16, 'r16');
        updatedBracket.quarterFinals = promoteWinners(updatedBracket.quarterFinals, 8, 'qf');
        updatedBracket.semiFinals = promoteWinners(updatedBracket.semiFinals, 4, 'sf');
        updatedBracket.finals = promoteWinners(updatedBracket.finals, 2, 'f');

        return updatedBracket;

    } catch (error) {
        console.error("Dynamic schedule fetch process encountered a problem:", error);
        return initialBracketData;
    }
};