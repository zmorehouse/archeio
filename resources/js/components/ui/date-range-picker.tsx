import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./dialog"
import { Button } from "./button"
import { Input } from "./input"
import { Label } from "./label"

interface DateRangePickerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    startDate: Date | null;
    endDate: Date | null;
    onDateChange: (startDate: Date | null, endDate: Date | null) => void;
}

export function DateRangePicker({
    open,
    onOpenChange,
    startDate,
    endDate,
    onDateChange,
}: DateRangePickerProps) {
    const [localStartDate, setLocalStartDate] = React.useState<string>(
        startDate ? startDate.toISOString().split('T')[0] : ''
    );
    const [localEndDate, setLocalEndDate] = React.useState<string>(
        endDate ? endDate.toISOString().split('T')[0] : ''
    );

    React.useEffect(() => {
        setLocalStartDate(startDate ? startDate.toISOString().split('T')[0] : '');
        setLocalEndDate(endDate ? endDate.toISOString().split('T')[0] : '');
    }, [startDate, endDate, open]);

    const handleApply = () => {
        const start = localStartDate ? new Date(localStartDate) : null;
        const end = localEndDate ? new Date(localEndDate) : null;
        
        if (start && end && start > end) {
            // Swap if start is after end
            onDateChange(end, start);
        } else {
            onDateChange(start, end);
        }
        onOpenChange(false);
    };

    const handleClear = () => {
        setLocalStartDate('');
        setLocalEndDate('');
        onDateChange(null, null);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Select Date Range</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="start-date">Start Date</Label>
                        <Input
                            id="start-date"
                            type="date"
                            value={localStartDate}
                            onChange={(e) => setLocalStartDate(e.target.value)}
                            max={localEndDate || undefined}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="end-date">End Date</Label>
                        <Input
                            id="end-date"
                            type="date"
                            value={localEndDate}
                            onChange={(e) => setLocalEndDate(e.target.value)}
                            min={localStartDate || undefined}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={handleClear}>
                        Clear
                    </Button>
                    <Button onClick={handleApply}>
                        Apply
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

