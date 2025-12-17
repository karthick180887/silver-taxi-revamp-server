import OneWayDistrictPage, { generateOneWayDistrictMetadata } from "@/components/OneWayDistrictPage";

export const metadata = generateOneWayDistrictMetadata("madurai");

export default function Page() {
    return <OneWayDistrictPage slug="madurai" />;
}