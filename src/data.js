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
        const response = await fetch('https://api.fifa.com/api/v3/calendar/matches?language=en&count=500&idCompetition=17&idSeason=285023');
        if (!response.ok) throw new Error('FIFA Matches API unreachable');
        const data = await response.json();

        const updatedBracket = {
            roundOf32: [],
            roundOf16: [],
            quarterFinals: [],
            semiFinals: [],
            finals: []
        };

        if (!data.Results || data.Results.length === 0) return initialBracketData;

        // 1. Process all matches dynamically and bucket them by stage description strings
        data.Results.forEach((match) => {
            // Read localized phase stage descriptions safely
            const stageDesc = match.StageName?.[0]?.Description?.toLowerCase() || "";

            // Extract core node info
            const homeName = match.Home?.Name?.[0]?.Description || "TBD";
            const homeCode = match.Home?.Abbreviation || "TBD";
            const homeScore = match.HomeTeamScore ?? 0;

            const awayName = match.Away?.Name?.[0]?.Description || "TBD";
            const awayCode = match.Away?.Abbreviation || "TBD";
            const awayScore = match.AwayTeamScore ?? 0;

            const winnerId = match.Winner;

            const pair = [
                {
                    id: `live-${match.IdMatch}-0`,
                    team: homeName,
                    code: homeCode,
                    score: homeScore,
                    isWinner: winnerId === match.Home?.IdTeam || (match.MatchStatus === 3 && homeScore > awayScore)
                },
                {
                    id: `live-${match.IdMatch}-1`,
                    team: awayName,
                    code: awayCode,
                    score: awayScore,
                    isWinner: winnerId === match.Away?.IdTeam || (match.MatchStatus === 3 && awayScore > homeScore)
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

        // 2. TREE LOGIC FALLBACK: If inner stages haven't generated matches yet,
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

        // 3. Keep counts perfectly proportional for the 3D concentric ring layout
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