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

function App() {
    const [bracketData, setBracketData] = useState(initialBracketData);
    const [upcomingMatches, setUpcomingMatches] = useState([]);
    const [allMatches, setAllMatches] = useState([]); // Raw global matches registry
    const [isDataLoaded, setIsDataLoaded] = useState(false);

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
                                {selectedTeam} Fixtures & Results
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
                                                    <span>{match.stage}</span> • <span className="match-date">{match.date}</span>
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
                <div className="upcoming-matches-panel">
                    <h3>Upcoming Matches</h3>
                    <div className="matches-list">
                        {upcomingMatches.map((match) => (
                            <div key={match.id} className="match-card">
                                <div className="card-header">
                                    <span>{match.stage}</span>
                                    <span className="date-highlight">{match.date}</span>
                                </div>
                                <div className="card-body">
                                    <span className="team-name">{match.homeCode !== 'TBD' ? match.home : 'TBD'}</span>
                                    <span className="vs-divider">vs</span>
                                    <span className="team-name away">{match.awayCode !== 'TBD' ? match.away : 'TBD'}</span>
                                </div>
                            </div>
                        ))}
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
                <Canvas camera={{position: [0, 15, 20], fov: 50}}>
                    <CameraTarget/>
                    <ambientLight intensity={0.6}/>
                    <directionalLight position={[10, 20, 10]} intensity={1.5} castShadow/>
                    <pointLight position={[-10, -10, -10]} intensity={0.5}/>

                    <Suspense fallback={null}>
                        <group>
                            <group position={[0, 0, 0]}><Trophy/></group>
                            {/* Injected setSelectedTeam handler across the round nodes */}
                            <group rotation={[0, 0, 0]}><BracketCircle items={bracketData.roundOf32} radius={10} nextRadius={7.5} sphereSize={0.4} onNodeClick={setSelectedTeam}/></group>
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