import OneWayDistrictPage, { generateOneWayDistrictMetadata } from "@/components/OneWayDistrictPage";

export const metadata = generateOneWayDistrictMetadata("virudhunagar");

export default function Page() {
    return <OneWayDistrictPage slug="virudhunagar" />;
}