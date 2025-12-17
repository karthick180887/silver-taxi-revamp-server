import OneWayDistrictPage, { generateOneWayDistrictMetadata } from "@/components/OneWayDistrictPage";

export const metadata = generateOneWayDistrictMetadata("ranipet");

export default function Page() {
    return <OneWayDistrictPage slug="ranipet" />;
}