import dayjs from "../../../utils/dayjs";

export function toIST(date: string | Date): Date {
    const d = new Date(date);
    return new Date(d.getTime() + (5 * 60 + 30) * 60 * 1000);
}
export function toLocalTime(date: string | Date): Date {
    const d = new Date(date);
    return new Date(d.getTime() - (5 * 60 + 30) * 60 * 1000);
}

export function formatDuration(seconds: number) {
    const dur = dayjs.duration(seconds, "seconds");

    const days = dur.days();
    const hours = dur.hours();
    const minutes = dur.minutes();

    if (days > 0) {
        return `${days} day${days > 1 ? "s" : ""}`;
    } else if (hours > 0) {
        return `${hours.toString().padStart(2, "0")} hours ${minutes.toString().padStart(2, "0")} min`;
    } else if (minutes > 0) {
        return `${minutes} min`;
    } else {
        return `0 min`;
    }
}