import OneWayDistrictPage, { generateOneWayDistrictMetadata } from "@/components/OneWayDistrictPage";

export const metadata = generateOneWayDistrictMetadata("tirunelveli");

export default function Page() {
    return <OneWayDistrictPage slug="tirunelveli" />;
}