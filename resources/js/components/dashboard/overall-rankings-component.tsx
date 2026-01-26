import { Link } from '@inertiajs/react';
import { ArrowUpDown } from 'lucide-react';
import { useState } from 'react';
import { formatNumber, formatXP, SKILL_ORDER } from '@/lib/runescape-utils';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface Skill {
    rank: number;
    level: number;
    experience: number;
}

interface Player {
    id: number;
    name: string;
    skills: Record<string, Skill>;
}

interface OverallRankingsComponentProps {
    players: Player[];
}

type SortField = 'rank' | 'name' | 'level' | 'experience';
type SortDirection = 'asc' | 'desc';

interface SortableHeaderProps {
    field: SortField;
    children: React.ReactNode;
    onSort: (field: SortField) => void;
}

function SortableHeader({ field, children, onSort }: SortableHeaderProps) {
    return (
        <th
            className="cursor-pointer select-none border-b border-sidebar-border/70 px-4 py-3 text-left text-sm font-semibold hover:bg-neutral-50 dark:border-sidebar-border dark:hover:bg-neutral-800"
            onClick={() => onSort(field)}
        >
            <div className="flex items-center gap-2">
                {children}
                <ArrowUpDown className="h-3 w-3 opacity-50" />
            </div>
        </th>
    );
}

export function OverallRankingsComponent({
    players,
}: OverallRankingsComponentProps) {
    const [sortField, setSortField] = useState<SortField>('level');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [selectedSkill, setSelectedSkill] = useState<string>('Overall');

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    const sortedPlayers = [...players]
        .filter((player) => player.skills?.[selectedSkill])
        .sort((a, b) => {
            const aSkill = a.skills?.[selectedSkill];
            const bSkill = b.skills?.[selectedSkill];
            
            // Safety check - if skill data is missing, skip sorting
            if (!aSkill || !bSkill) {
                return 0;
            }

            let primaryComparison = 0;
            let secondaryComparison = 0;
            
            switch (sortField) {
                case 'rank':
                    primaryComparison = (aSkill.rank || Infinity) - (bSkill.rank || Infinity);
                    // If ranks are equal, use secondary sort: Level > Exp > Username
                    if (primaryComparison === 0) {
                        secondaryComparison = bSkill.level - aSkill.level; // Higher level first (desc)
                        if (secondaryComparison === 0) {
                            secondaryComparison = bSkill.experience - aSkill.experience; // Higher exp first (desc)
                            if (secondaryComparison === 0) {
                                secondaryComparison = a.name.localeCompare(b.name); // Alphabetical username (asc)
                            }
                        }
                    }
                    break;
                case 'name':
                    primaryComparison = a.name.localeCompare(b.name);
                    // If names are equal (unlikely but possible), use secondary sort: Level > Exp > Rank
                    if (primaryComparison === 0) {
                        secondaryComparison = bSkill.level - aSkill.level; // Higher level first (desc)
                        if (secondaryComparison === 0) {
                            secondaryComparison = bSkill.experience - aSkill.experience; // Higher exp first (desc)
                            if (secondaryComparison === 0) {
                                secondaryComparison = (aSkill.rank || Infinity) - (bSkill.rank || Infinity); // Lower rank first (asc)
                            }
                        }
                    }
                    break;
                case 'level':
                    primaryComparison = aSkill.level - bSkill.level;
                    // If levels are equal, use secondary sort: Exp > Rank > Username
                    if (primaryComparison === 0) {
                        secondaryComparison = bSkill.experience - aSkill.experience; // Higher exp first (desc)
                        if (secondaryComparison === 0) {
                            secondaryComparison = (aSkill.rank || Infinity) - (bSkill.rank || Infinity); // Lower rank first (asc)
                            if (secondaryComparison === 0) {
                                secondaryComparison = a.name.localeCompare(b.name); // Alphabetical username (asc)
                            }
                        }
                    }
                    break;
                case 'experience':
                    primaryComparison = aSkill.experience - bSkill.experience;
                    // If exp is equal, use secondary sort: Level > Rank > Username
                    if (primaryComparison === 0) {
                        secondaryComparison = bSkill.level - aSkill.level; // Higher level first (desc)
                        if (secondaryComparison === 0) {
                            secondaryComparison = (aSkill.rank || Infinity) - (bSkill.rank || Infinity); // Lower rank first (asc)
                            if (secondaryComparison === 0) {
                                secondaryComparison = a.name.localeCompare(b.name); // Alphabetical username (asc)
                            }
                        }
                    }
                    break;
            }

            // Apply sort direction only to primary comparison, secondary comparison always uses fixed order
            const adjustedPrimary = sortDirection === 'asc' ? primaryComparison : -primaryComparison;
            // If primary comparison is 0 (equal), use secondary comparison (which has its own fixed order)
            return adjustedPrimary !== 0 ? adjustedPrimary : secondaryComparison;
        });

    return (
        <div className="h-full flex flex-col">
            <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Rankings</h3>
                <Select value={selectedSkill} onValueChange={setSelectedSkill}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {SKILL_ORDER.map((skill) => (
                            <SelectItem key={skill} value={skill}>
                                {skill}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="flex-1 overflow-auto overflow-x-auto">
                <table className="w-full text-sm min-w-[500px]">
                    <thead>
                        <tr>
                            <SortableHeader field="rank" onSort={handleSort}>Rank</SortableHeader>
                            <SortableHeader field="name" onSort={handleSort}>Player</SortableHeader>
                            <SortableHeader field="level" onSort={handleSort}>Level</SortableHeader>
                            <SortableHeader field="experience" onSort={handleSort}>EXP</SortableHeader>
                            <SortableHeader field="rank" onSort={handleSort}>Global Rank</SortableHeader>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedPlayers.map((player, index) => {
                            const skill = player.skills[selectedSkill];
                            return (
                                <tr
                                    key={player.id}
                                    className="border-b border-sidebar-border/30 hover:bg-neutral-50 dark:border-sidebar-border dark:hover:bg-neutral-800"
                                >
                                    <td className="px-4 py-2 text-neutral-500 dark:text-neutral-400">
                                        {index + 1}
                                    </td>
                                    <td className="px-4 py-2">
                                        <Link
                                            href={`/players/${player.name}`}
                                            className="font-medium text-primary hover:underline"
                                        >
                                            {player.name}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-2 font-semibold">
                                        {skill.level}
                                    </td>
                                    <td className="px-4 py-2 text-neutral-600 dark:text-neutral-300">
                                        {formatXP(skill.experience)}
                                    </td>
                                    <td className="px-4 py-2 text-neutral-500 dark:text-neutral-400">
                                        {skill.rank ? formatNumber(skill.rank) : 'N/A'}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

