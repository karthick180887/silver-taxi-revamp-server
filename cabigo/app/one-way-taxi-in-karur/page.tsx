import OneWayDistrictPage, { generateOneWayDistrictMetadata } from "@/components/OneWayDistrictPage";

export const metadata = generateOneWayDistrictMetadata("karur");

export default function Page() {
    return <OneWayDistrictPage slug="karur" />;
}