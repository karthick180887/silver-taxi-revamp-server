
import fs from 'fs';
import path from 'path';
import { districts } from '../lib/data/districts';

const appDir = path.join(process.cwd(), 'app');

console.log(`Generating pages for ${districts.length} districts...`);

districts.forEach(district => {
    const dirName = `taxi-in-${district.slug}`;
    const dirPath = path.join(appDir, dirName);

    // Create directory for standard taxi page
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }

    // Create standard page.tsx
    const content = `
import DistrictPage, { generateDistrictMetadata } from "@/components/DistrictPage";

export const metadata = generateDistrictMetadata("${district.slug}");

export default function Page() {
    return <DistrictPage slug="${district.slug}" />;
}
`;

    fs.writeFileSync(path.join(dirPath, 'page.tsx'), content.trim());
    console.log(`Generated: ${dirName}`);

    // One Way Pages
    const oneWayDirName = `one-way-taxi-in-${district.slug}`;
    const oneWayDirPath = path.join(appDir, oneWayDirName);

    // Create directory for one way page
    if (!fs.existsSync(oneWayDirPath)) {
        fs.mkdirSync(oneWayDirPath, { recursive: true });
    }

    const oneWayContent = `
import OneWayDistrictPage, { generateOneWayDistrictMetadata } from "@/components/OneWayDistrictPage";

export const metadata = generateOneWayDistrictMetadata("${district.slug}");

export default function Page() {
    return <OneWayDistrictPage slug="${district.slug}" />;
}
`;
    fs.writeFileSync(path.join(oneWayDirPath, 'page.tsx'), oneWayContent.trim());
    console.log(`Generated: ${oneWayDirName}`);
});

console.log("Done!");
