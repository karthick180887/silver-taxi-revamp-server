import OneWayDistrictPage, { generateOneWayDistrictMetadata } from "@/components/OneWayDistrictPage";

export const metadata = generateOneWayDistrictMetadata("coimbatore");

export default function Page() {
    return <OneWayDistrictPage slug="coimbatore" />;
}