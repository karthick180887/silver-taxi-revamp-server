import OneWayDistrictPage, { generateOneWayDistrictMetadata } from "@/components/OneWayDistrictPage";

export const metadata = generateOneWayDistrictMetadata("tirupathur");

export default function Page() {
    return <OneWayDistrictPage slug="tirupathur" />;
}