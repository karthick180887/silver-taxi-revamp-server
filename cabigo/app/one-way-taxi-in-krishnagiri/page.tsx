import OneWayDistrictPage, { generateOneWayDistrictMetadata } from "@/components/OneWayDistrictPage";

export const metadata = generateOneWayDistrictMetadata("krishnagiri");

export default function Page() {
    return <OneWayDistrictPage slug="krishnagiri" />;
}