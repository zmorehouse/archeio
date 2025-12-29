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
            const aSkill = a.skills[selectedSkill];
            const bSkill = b.skills[selectedSkill];

            let comparison = 0;
            switch (sortField) {
                case 'rank':
                    comparison = (aSkill.rank || Infinity) - (bSkill.rank || Infinity);
                    break;
                case 'name':
                    comparison = a.name.localeCompare(b.name);
                    break;
                case 'level':
                    comparison = aSkill.level - bSkill.level;
                    break;
                case 'experience':
                    comparison = aSkill.experience - bSkill.experience;
                    break;
            }

            return sortDirection === 'asc' ? comparison : -comparison;
        });

    const SortableHeader = ({
        field,
        children,
    }: {
        field: SortField;
        children: React.ReactNode;
    }) => (
        <th
            className="cursor-pointer select-none border-b border-sidebar-border/70 px-4 py-3 text-left text-sm font-semibold hover:bg-neutral-50 dark:border-sidebar-border dark:hover:bg-neutral-800"
            onClick={() => handleSort(field)}
        >
            <div className="flex items-center gap-2">
                {children}
                <ArrowUpDown className="h-3 w-3 opacity-50" />
            </div>
        </th>
    );

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
                            <SortableHeader field="rank">Rank</SortableHeader>
                            <SortableHeader field="name">Player</SortableHeader>
                            <SortableHeader field="level">Level</SortableHeader>
                            <SortableHeader field="experience">EXP</SortableHeader>
                            <SortableHeader field="rank">Global Rank</SortableHeader>
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
                                        {formatNumber(skill.rank)}
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

