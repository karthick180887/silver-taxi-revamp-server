import dayjs from "../../../utils/dayjs";

/* -------------------------------------------------------
 * Helper: Generate SQL Filter Date Range + Labels
 * ----------------------------------------------------- */
export const getBarChartMeta = (filter: string) => {
    const now = dayjs();
    let startDate: dayjs.Dayjs;
    let categories: string[] = [];
    let datePart: "HOUR" | "DOW" | "DAY" | "MONTH";

    switch (filter) {
        case "day":
            startDate = now.startOf("day");
            categories = Array.from({ length: 24 }, (_, i) => i.toString());
            datePart = "HOUR";
            break;

        case "week":
            startDate = now.startOf("week");
            categories = Array.from({ length: 7 }, (_, i) =>
                startDate.add(i, "day").format("ddd")
            );
            datePart = "DOW";
            break;

        case "month":
            startDate = now.startOf("month");
            const days = now.daysInMonth();
            categories = Array.from({ length: days }, (_, i) => (i + 1).toString());
            datePart = "DAY";
            break;

        case "year":
            startDate = now.startOf("year");
            categories = Array.from({ length: 12 }, (_, i) =>
                now.month(i).format("MMM")
            );
            datePart = "MONTH";
            break;

        case "lastYear":
            startDate = now.subtract(1, "year").startOf("year");
            categories = Array.from({ length: 12 }, (_, i) =>
                startDate.add(i, "month").format("MMM")
            );
            datePart = "MONTH";
            break;

        default:
            throw new Error("Invalid bar chart filter");
    }

    return { startDate: startDate.toDate(), categories, datePart };
};