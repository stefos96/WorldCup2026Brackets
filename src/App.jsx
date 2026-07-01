import {Suspense, useEffect, useState, useRef} from 'react';
import {Canvas, useThree} from '@react-three/fiber';
import {OrbitControls, Center, Environment} from '@react-three/drei';
import {BracketCircle} from './BracketCircle';
import {fetchRealTimeBracket, initialBracketData} from './data';
import {Trophy} from "./Trophy.jsx";
import gsap from 'gsap';
import './scss/app.scss';
import {Logo} from "./Logo.jsx";
import {AnimatedBall} from "./AnimatedBall.jsx";
import {PointsParticles} from "./PointsParticles.jsx";

function CameraTarget() {
    const {camera} = useThree();
    useEffect(() => { camera.lookAt(0, 0, 0); }, [camera]);
    return null;
}

const fifaToIso2 = {
    // 2026 World Cup Qualified Teams & Common Knockout Competitors
    ALG: 'dz', // Algeria (al -> Albania)
    ANG: 'ao', // Angola
    ARG: 'ar', // Argentina
    AUS: 'au', // Australia
    AUT: 'at', // Austria (au -> Australia)
    BEL: 'be', // Belgium
    BIH: 'ba', // Bosnia and Herzegovina
    BRA: 'br', // Brazil
    CAN: 'ca', // Canada
    CHI: 'cl', // Chile
    CIV: 'ci', // Ivory Coast / Côte d'Ivoire (ci vs ci)
    CMR: 'cm', // Cameroon
    COD: 'cd', // DR Congo (co -> Colombia)
    COL: 'co', // Colombia
    CPV: 'cv', // Cabo Verde / Cape Verde
    CRC: 'cr', // Costa Rica
    CRO: 'hr', // Croatia (cr -> Costa Rica)
    CUW: 'cw', // Curaçao
    CZE: 'cz', // Czechia
    DEN: 'dk', // Denmark (de -> Germany)
    EGY: 'eg', // Egypt
    ENG: 'gb-eng', // England (FlagCDN syntax)
    ESP: 'es', // Spain (es vs es)
    FRA: 'fr', // France
    GEO: 'ge', // Georgia
    GER: 'de', // Germany (ge -> Georgia)
    GHA: 'gh', // Ghana
    GRE: 'gr', // Greece
    HAI: 'ht', // Haiti
    IRN: 'ir', // Iran
    IRQ: 'iq', // Iraq
    ISL: 'is', // Iceland
    ITA: 'it', // Italy
    JOR: 'jo', // Jordan
    JPN: 'jp', // Japan
    KOR: 'kr', // South Korea
    KSA: 'sa', // Saudi Arabia (ks -> Kosovo)
    MAR: 'ma', // Morocco (ma vs ma)
    MEX: 'mx', // Mexico
    NED: 'nl', // Netherlands (ne -> Niger)
    NGA: 'ng', // Nigeria
    NOR: 'no', // Norway
    NZL: 'nz', // New Zealand
    PAN: 'pa', // Panama
    PAR: 'py', // Paraguay (pa -> Panama)
    POR: 'pt', // Portugal
    QAT: 'qa', // Qatar
    RSA: 'za', // South Africa
    SCO: 'gb-sct', // Scotland
    SEN: 'sn', // Senegal (se -> Sweden)
    SUI: 'ch', // Switzerland (su -> Soviet Union / non-existent)
    SWE: 'se', // Sweden
    TUN: 'tn', // Tunisia
    TUR: 'tr', // Turkey
    URU: 'uy', // Uruguay
    USA: 'us', // United States
    UZB: 'uz', // Uzbekistan
    WAL: 'gb-wls', // Wales
};

// Helper function to safely parse and check relative dates (Today/Tomorrow)
function getRelativeDateLabel(dateString) {
    const matchDate = new Date(dateString);
    if (isNaN(matchDate)) return dateString;

    let isToday = sameDay(matchDate, new Date());

    // Using setDate + getDate to safely bypass any Daylight Saving Time anomalies
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    let isTomorrow = sameDay(matchDate, tomorrow);

    if (isToday) {
        // Pad the hours and minutes to always ensure 2 digits
        const hours = String(matchDate.getHours()).padStart(2, '0');
        const minutes = String(matchDate.getMinutes()).padStart(2, '0');
        return `Today ${hours}:${minutes}`;
    }
    if (isTomorrow) {
        // Pad the hours and minutes to always ensure 2 digits
        const hours = String(matchDate.getHours()).padStart(2, '0');
        const minutes = String(matchDate.getMinutes()).padStart(2, '0');
        return `Tomorrow ${hours}:${minutes}`;
    }

    return dateString;
}

function sameDay(d1, d2) {
    return d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();
}

function App() {
    const [bracketData, setBracketData] = useState(initialBracketData);
    const [upcomingMatches, setUpcomingMatches] = useState([]);
    const [allMatches, setAllMatches] = useState([]); // Raw global matches registry
    const [isDataLoaded, setIsDataLoaded] = useState(false);

    const [showMobileUpcoming, setShowMobileUpcoming] = useState(false);

    // UI Modal Popup State
    const [selectedTeam, setSelectedTeam] = useState(null);

    const loaderRef = useRef();

    useEffect(() => {
        const getData = async () => {
            const { bracket, upcomingMatches, allMatches } = await fetchRealTimeBracket();
            setBracketData(bracket);
            setUpcomingMatches(upcomingMatches);
            setAllMatches(allMatches || []);
            setIsDataLoaded(true);
        };
        getData();
    }, []);

    const handleLaunchStarted = () => {
        if (loaderRef.current) {
            gsap.to(loaderRef.current, {
                opacity: 0,
                duration: 0.7,
                ease: 'power2.inOut',
                onComplete: () => {
                    if (loaderRef.current) loaderRef.current.style.display = 'none';
                }
            });
        }
    };

    // Filter matches involving the selected country
    const teamFixtures = allMatches.filter(
        (m) => m.home === selectedTeam || m.away === selectedTeam
    );

    // NEW: Dynamically find the abbreviation code for the selected team to draw the flag
    const selectedTeamCode = teamFixtures.length > 0
        ? (teamFixtures[0].home === selectedTeam ? teamFixtures[0].homeCode : teamFixtures[0].awayCode)
        : 'TBD';

    return (
        <div className="app-container">
            <Logo />

            {/* MOBILE TOGGLE BUTTON */}
            {isDataLoaded && upcomingMatches.length > 0 && (
                <button
                    className="mobile-upcoming-toggle-btn"
                    onClick={() => setShowMobileUpcoming(!showMobileUpcoming)}
                >
                    {showMobileUpcoming ? "Hide Upcoming Matches" : `Upcoming Matches`}
                </button>
            )}

            {/* POPUP MODAL COMPONENT */}
            {selectedTeam && (
                <div className="team-popup-backdrop" onClick={() => setSelectedTeam(null)}>
                    <div className="team-popup-card" onClick={(e) => e.stopPropagation()}>
                        <div className="popup-header">
                            <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                {/* Dynamic Flag element */}
                                {selectedTeamCode !== 'TBD' && (
                                    <img
                                        src={`https://flagcdn.com/w40/${
                                            fifaToIso2[selectedTeamCode.toUpperCase()] ||
                                            selectedTeamCode.toLowerCase().substring(0, 2)
                                        }.png`}
                                        alt={`${selectedTeam} Flag`}
                                        style={{
                                            width: '28px',
                                            height: 'auto',
                                            borderRadius: '4px',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                                            objectFit: 'cover'
                                        }}
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                        }}
                                    />
                                )}
                                {selectedTeam} Matches
                            </h2>
                            <button className="close-btn" onClick={() => setSelectedTeam(null)}>×</button>
                        </div>
                        <div className="popup-body">
                            {teamFixtures.length === 0 ? (
                                <p className="no-matches">No active fixture data loaded for this team.</p>
                            ) : (
                                <div className="popup-matches-list">
                                    {teamFixtures.map((match) => {
                                        const isCompleted = match.status === 3 || match.homeScore !== null;

                                        let outcomeClass = '';
                                        let penaltyInfo = ''; // Optional UI text helper

                                        if (isCompleted) {
                                            const selectedIsHome = match.home === selectedTeam;
                                            const selectedScore = selectedIsHome ? match.homeScore : match.awayScore;
                                            const opponentScore = selectedIsHome ? match.awayScore : match.homeScore;

                                            if (selectedScore === opponentScore) {
                                                // It's a tie! Find out which bracket key represents the NEXT stage
                                                const stageDesc = match.stage.toLowerCase();
                                                let nextRoundKey = null;

                                                if (stageDesc.includes('32') || stageDesc.includes('round of 32')) {
                                                    nextRoundKey = 'roundOf16';
                                                } else if (stageDesc.includes('16') || stageDesc.includes('round of 16')) {
                                                    nextRoundKey = 'quarterFinals';
                                                } else if (stageDesc.includes('quarter')) {
                                                    nextRoundKey = 'semiFinals';
                                                } else if (stageDesc.includes('semi')) {
                                                    nextRoundKey = 'finals';
                                                }

                                                // Check if the selected team successfully advanced to the next round slots
                                                if (nextRoundKey && bracketData[nextRoundKey]) {
                                                    const advanced = bracketData[nextRoundKey].some(node => node.team === selectedTeam);
                                                    outcomeClass = advanced ? 'won' : 'lost';
                                                    penaltyInfo = advanced ? ' (Won on pens)' : ' (Lost on pens)';
                                                } else {
                                                    // Fallback for the Final itself (no next round key)
                                                    // Look at the API match object or fallback to a tie classification
                                                    outcomeClass = 'tied';
                                                }
                                            } else {
                                                // Standard clear-cut score win/loss outcome
                                                outcomeClass = selectedScore < opponentScore ? 'lost' : 'won';
                                            }
                                        }

                                        return (
                                            <div key={match.id} className={`popup-match-item ${isCompleted ? 'completed' : 'upcoming'} ${outcomeClass}`}>
                                                <div className="match-meta">
                                                    <span>{match.stage}</span> • <span className="match-date">{getRelativeDateLabel(match.date)}</span>
                                                </div>
                                                <div className="match-teams-row">
                                                    <span className={`team-lbl ${match.home === selectedTeam ? 'highlight' : ''}`}>{match.home}</span>
                                                    <span className="match-score">
                    {isCompleted ? `${match.homeScore} - ${match.awayScore}` : 'vs'}
                                                        {/* Optional indicator next to the score if it went to penalties */}
                                                        {penaltyInfo && <small style={{ display: 'block', fontSize: '0.65rem', color: '#94a3b8' }}>{penaltyInfo}</small>}
                </span>
                                                    <span className={`team-lbl ${match.away === selectedTeam ? 'highlight' : ''}`}>{match.away}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* UPCOMING MATCHES SIDE PANEL */}
            {isDataLoaded && upcomingMatches.length > 0 && (
                <div className={`upcoming-matches-panel ${showMobileUpcoming ? 'mobile-visible' : ''}`}>
                    <div className="panel-header-row">
                        <h3>Upcoming Matches</h3>
                        {/* Optional close button for mobile convenience */}
                        <button className="panel-close-btn" onClick={() => setShowMobileUpcoming(false)}>×</button>
                    </div>

                    <div className="matches-list">
                        {upcomingMatches.map((match) => {
                            // Get ISO-2 codes for home and away flags
                            const homeIso = match.homeCode !== 'TBD' ? (fifaToIso2[match.homeCode.toUpperCase()] || match.homeCode.toLowerCase().substring(0, 2)) : null;
                            const awayIso = match.awayCode !== 'TBD' ? (fifaToIso2[match.awayCode.toUpperCase()] || match.awayCode.toLowerCase().substring(0, 2)) : null;

                            // Determine relative label (Today, Tomorrow, or raw fallback string)
                            const dateLabel = getRelativeDateLabel(match.date);

                            return (
                                <div key={match.id} className="match-card">
                                    <div className="card-header">
                                        <span>{match.stage}</span>
                                        <span className={`date-highlight ${dateLabel.toLowerCase()}`}>{dateLabel}</span>
                                    </div>
                                    <div className="card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>

                                        {/* Home Team Row Layout */}
                                        <div className="team-row side-panel-team" style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
                                            {homeIso && (
                                                <img
                                                    src={`https://flagcdn.com/w40/${homeIso}.png`}
                                                    alt=""
                                                    style={{ width: '20px', height: 'auto', borderRadius: '2px', boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }}
                                                    onError={(e) => e.target.style.display = 'none'}
                                                />
                                            )}
                                            <span className="team-name">
                                    {match.homeCode !== 'TBD' ? match.home : 'TBD'}
                                </span>
                                        </div>

                                        <span className="vs-divider" style={{ color: '#64748b', fontSize: '0.85rem' }}>vs</span>

                                        {/* Away Team Row Layout */}
                                        <div className="team-row side-panel-team" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', flex: 1, textAlign: 'right' }}>
                                <span className="team-name away">
                                    {match.awayCode !== 'TBD' ? match.away : 'TBD'}
                                </span>
                                            {awayIso && (
                                                <img
                                                    src={`https://flagcdn.com/w40/${awayIso}.png`}
                                                    alt=""
                                                    style={{ width: '20px', height: 'auto', borderRadius: '2px', boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }}
                                                    onError={(e) => e.target.style.display = 'none'}
                                                />
                                            )}
                                        </div>

                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* MAIN BRACKET SCENE */}
            <div
                className="bracket-scene-wrapper"
                style={{
                    visibility: isDataLoaded ? 'visible' : 'hidden',
                    opacity: isDataLoaded ? 1 : 0
                }}
            >
                <Canvas camera={{position: [0, 15, 20], fov: 50}}
                        gl={{ antialias: true, alpha: false }}>
                    <CameraTarget/>


                    {/* 1. Dramatic Dark Atmosphere Background & Fog */}
                    {/* Deep navy bleeding into deep slate matching world cup broadcast aesthetics */}
                    <color attach="background" args={['#070a13']} />
                    <fogExp2 attach="fog" args={['#070a13', 0.025]} />

                    {/* 2. Layered Studio Lighting to create volumetric shadows */}
                    <ambientLight intensity={0.2}/>
                    {/* Main rim highlight light */}
                    <directionalLight position={[10, 20, 10]} intensity={1.8} castShadow shadow-mapSize={[2048, 2048]}/>
                    {/* Subtle cyan counter-light from bottom-left for depth contrast */}
                    <pointLight position={[-15, -5, -10]} intensity={0.8} color="#1d4ed8"/>
                    {/* Golden spotlight focusing down on the central Trophy */}
                    <spotLight position={[0, 12, 0]} intensity={2.5} angle={0.6} penumbra={1} color="#f59e0b" castShadow />

                    {/* 3. Volumetric Floating Dust Particles (Adds immediate massive visual depth) */}
                    <PointsParticles count={250} />

                    <Suspense fallback={null}>
                        <group>
                            <group position={[0, 0, 0]}><Trophy/></group>
                            {/* Injected setSelectedTeam handler across the round nodes */}
                            <group rotation={[0, 0, 0]}>
                                <BracketCircle items={bracketData.roundOf32} radius={10} nextRadius={7.5} sphereSize={0.4} onNodeClick={setSelectedTeam} allMatches={allMatches}/></group>
                            <group rotation={[0, Math.PI / .5077, 0]}><BracketCircle items={bracketData.roundOf16} radius={7.5} nextRadius={5} sphereSize={0.45} onNodeClick={setSelectedTeam}/></group>
                            <group rotation={[0, Math.PI / 1.52, 0]}><BracketCircle items={bracketData.quarterFinals} radius={5} nextRadius={3} sphereSize={0.5} onNodeClick={setSelectedTeam}/></group>
                            <group rotation={[0, Math.PI / 1.88, 0]}><BracketCircle items={bracketData.semiFinals} radius={3} nextRadius={1.2} sphereSize={0.55} onNodeClick={setSelectedTeam}/></group>
                            <group rotation={[0, Math.PI / 1.3, 0]}><BracketCircle items={bracketData.finals} radius={1.2} nextRadius={0} sphereSize={0.6} onNodeClick={setSelectedTeam}/></group>
                        </group>
                    </Suspense>

                    <OrbitControls enableDamping maxPolarAngle={Math.PI / 2 - 0.05}/>
                </Canvas>
            </div>

            {/* PHASE 2: 3D Ball Loader Overlay */}
            <div ref={loaderRef} className="loader-overlay">
                <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
                    <ambientLight intensity={0.7} />
                    <directionalLight position={[5, 5, 5]} intensity={1.5} />
                    <Center>
                        <AnimatedBall onLaunchStarted={handleLaunchStarted} />
                    </Center>
                    <Environment preset="city" />
                </Canvas>
            </div>

        </div>
    );
}

export default App;