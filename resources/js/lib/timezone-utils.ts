/**
 * Get the start of today in Sydney, Australia timezone
 * @returns Date object representing the start of today (00:00:00) in Sydney timezone
 */
export function getStartOfTodaySydney(): Date {
    const now = new Date();
    
    // Get current date in Sydney timezone (YYYY-MM-DD format)
    const sydneyDateStr = now.toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' });
    const [year, month, day] = sydneyDateStr.split('-').map(Number);
    
    // Create a date string for midnight in Sydney
    const sydneyMidnightStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T00:00:00`;
    
    // Use Intl.DateTimeFormat to get the timezone offset
    // Create a formatter for Sydney timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Australia/Sydney',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
    
    // Get what "now" is in Sydney
    const sydneyNowParts = formatter.formatToParts(now);
    const sydneyHour = parseInt(sydneyNowParts.find(p => p.type === 'hour')?.value || '0');
    const sydneyMinute = parseInt(sydneyNowParts.find(p => p.type === 'minute')?.value || '0');
    const sydneySecond = parseInt(sydneyNowParts.find(p => p.type === 'second')?.value || '0');
    
    // Calculate milliseconds since midnight in Sydney
    const msSinceMidnight = (sydneyHour * 3600 + sydneyMinute * 60 + sydneySecond) * 1000;
    
    // Get the UTC timestamp that corresponds to midnight in Sydney
    // We'll create a date object and adjust it
    const tempDate = new Date(sydneyMidnightStr);
    
    // Calculate the offset: what time is it in Sydney vs what time is it locally
    // Get a reference point: what is "now" in Sydney vs "now" locally
    const localNow = now.getTime();
    const sydneyNowTime = new Date(
        parseInt(sydneyNowParts.find(p => p.type === 'year')?.value || '0'),
        parseInt(sydneyNowParts.find(p => p.type === 'month')?.value || '0') - 1,
        parseInt(sydneyNowParts.find(p => p.type === 'day')?.value || '0'),
        sydneyHour,
        sydneyMinute,
        sydneySecond
    ).getTime();
    
    // The difference between local time and Sydney time representation
    const offset = localNow - sydneyNowTime;
    
    // Start of day in Sydney is "now" minus the time since midnight, adjusted for offset
    return new Date(now.getTime() - msSinceMidnight - offset);
}
