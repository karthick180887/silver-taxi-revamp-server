import OneWayDistrictPage, { generateOneWayDistrictMetadata } from "@/components/OneWayDistrictPage";

export const metadata = generateOneWayDistrictMetadata("tirupati");

export default function Page() {
    return <OneWayDistrictPage slug="tirupati" />;
}