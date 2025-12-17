import OneWayDistrictPage, { generateOneWayDistrictMetadata } from "@/components/OneWayDistrictPage";

export const metadata = generateOneWayDistrictMetadata("erode");

export default function Page() {
    return <OneWayDistrictPage slug="erode" />;
}