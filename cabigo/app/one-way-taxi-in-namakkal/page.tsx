import OneWayDistrictPage, { generateOneWayDistrictMetadata } from "@/components/OneWayDistrictPage";

export const metadata = generateOneWayDistrictMetadata("namakkal");

export default function Page() {
    return <OneWayDistrictPage slug="namakkal" />;
}