import OneWayDistrictPage, { generateOneWayDistrictMetadata } from "@/components/OneWayDistrictPage";

export const metadata = generateOneWayDistrictMetadata("salem");

export default function Page() {
    return <OneWayDistrictPage slug="salem" />;
}