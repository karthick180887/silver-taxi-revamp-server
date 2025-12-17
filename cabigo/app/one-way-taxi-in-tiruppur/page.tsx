import OneWayDistrictPage, { generateOneWayDistrictMetadata } from "@/components/OneWayDistrictPage";

export const metadata = generateOneWayDistrictMetadata("tiruppur");

export default function Page() {
    return <OneWayDistrictPage slug="tiruppur" />;
}