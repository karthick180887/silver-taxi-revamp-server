import OneWayDistrictPage, { generateOneWayDistrictMetadata } from "@/components/OneWayDistrictPage";

export const metadata = generateOneWayDistrictMetadata("villupuram");

export default function Page() {
    return <OneWayDistrictPage slug="villupuram" />;
}