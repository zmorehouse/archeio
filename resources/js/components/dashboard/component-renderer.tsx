import { OverallRankingsComponent } from './overall-rankings-component';
import { NinetyNinesComponent } from './ninety-nines-component';
import { NextLevelComponent } from './next-level-component';
import { GeneralStatsComponent } from './general-stats-component';
import { CombinedTotalsComponent } from './combined-totals-component';
import { XpGainedComponent } from './xp-gained-component';
import { LevelsGainedComponent } from './levels-gained-component';
import { SkillTrainingPieComponent } from './skill-training-pie-component';
import { RecentActivityComponent } from './recent-activity-component';
import { XpOverTimeComponent } from './xp-over-time-component';
import { PlayerLevelsComponent } from './player-levels-component';
import { PlayerXpOverTimeComponent } from './player-xp-over-time-component';
import { PlayerSkillTrainingComponent } from './player-skill-training-component';
import { PlayerGeneralStatsComponent } from './player-general-stats-component';
import { PlayerActivityLedgerComponent } from './player-activity-ledger-component';
import { AllActivityLedgerComponent } from './all-activity-ledger-component';

interface ComponentRendererProps {
    componentId: string;
    props?: Record<string, unknown>;
}

export function ComponentRenderer({
    componentId,
    props = {},
}: ComponentRendererProps) {
    switch (componentId) {
        case 'recent-activity':
            return <RecentActivityComponent players={props.players || []} historicalStats={props.historicalStats || {}} />;
        case 'overall-rankings':
            return <OverallRankingsComponent players={props.players || []} />;
        case 'ninety-nines':
            return <NinetyNinesComponent players={props.players || []} />;
        case 'next-level':
            return <NextLevelComponent players={props.players || []} />;
        case 'general-stats':
            return <GeneralStatsComponent players={props.players || []} />;
        case 'combined-totals':
            return <CombinedTotalsComponent players={props.players || []} />;
        case 'xp-gained':
            return <XpGainedComponent players={props.players || []} historicalStats={props.historicalStats || {}} />;
        case 'levels-gained':
            return <LevelsGainedComponent players={props.players || []} historicalStats={props.historicalStats || {}} />;
        case 'skill-training-pie':
            return <SkillTrainingPieComponent players={props.players || []} historicalStats={props.historicalStats || {}} />;
        case 'xp-over-time':
            return <XpOverTimeComponent players={props.players || []} historicalStats={props.historicalStats || {}} />;
        case 'all-activity-ledger':
            return <AllActivityLedgerComponent players={props.players || []} historicalStats={props.historicalStats || {}} />;
        case 'player-levels':
            return <PlayerLevelsComponent skills={props.skills || {}} />;
        case 'player-xp-over-time':
            return <PlayerXpOverTimeComponent 
                playerId={props.playerId} 
                playerName={props.playerName} 
                historicalStats={props.historicalStats || []} 
            />;
        case 'player-skill-training':
            return <PlayerSkillTrainingComponent 
                playerId={props.playerId} 
                historicalStats={props.historicalStats || []} 
            />;
        case 'player-general-stats':
            return <PlayerGeneralStatsComponent 
                skills={props.skills || {}} 
                activities={props.activities || {}}
                historicalStats={props.historicalStats || []}
            />;
        case 'player-activity-ledger':
            return <PlayerActivityLedgerComponent 
                playerId={props.playerId} 
                playerName={props.playerName} 
                historicalStats={props.historicalStats || []} 
            />;
        default:
            return (
                <div className="text-center text-neutral-500">
                    Component not found: {componentId}
                </div>
            );
    }
}

