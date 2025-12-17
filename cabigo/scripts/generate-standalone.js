const fs = require('fs');
const path = require('path');

const districtsPath = path.join(__dirname, '../lib/data/districts.ts');

try {
    const fileContent = fs.readFileSync(districtsPath, 'utf-8');

    // Regex to find slug: "value",
    // Matches both 'slug: "value"' and 'slug: "value",'
    const slugRegex = /slug:\s*"([^"]+)"/g;
    let match;
    const slugs = [];

    while ((match = slugRegex.exec(fileContent)) !== null) {
        if (!slugs.includes(match[1])) {
            slugs.push(match[1]);
        }
    }

    console.log(`Found ${slugs.length} slugs:`, slugs.join(', '));

    const appDir = path.join(__dirname, '../app');

    slugs.forEach(slug => {
        // 1. Standard Taxi Pages (taxi-in-[city])
        const dirName = `taxi-in-${slug}`;
        const dirPath = path.join(appDir, dirName);
        if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });

        const content = `
import DistrictPage, { generateDistrictMetadata } from "@/components/DistrictPage";

export const metadata = generateDistrictMetadata("${slug}");

export default function Page() {
    return <DistrictPage slug="${slug}" />;
}
`;
        fs.writeFileSync(path.join(dirPath, 'page.tsx'), content.trim());

        // 2. One Way Taxi Pages (one-way-taxi-in-[city])
        const oneWayDirName = `one-way-taxi-in-${slug}`;
        const oneWayDirPath = path.join(appDir, oneWayDirName);
        if (!fs.existsSync(oneWayDirPath)) fs.mkdirSync(oneWayDirPath, { recursive: true });

        const oneWayContent = `
import OneWayDistrictPage, { generateOneWayDistrictMetadata } from "@/components/OneWayDistrictPage";

export const metadata = generateOneWayDistrictMetadata("${slug}");

export default function Page() {
    return <OneWayDistrictPage slug="${slug}" />;
}
`;
        fs.writeFileSync(path.join(oneWayDirPath, 'page.tsx'), oneWayContent.trim());
    });

    console.log("Generation Complete.");

} catch (err) {
    console.error("Error reading districts file:", err);
}
