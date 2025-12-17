import OneWayDistrictPage, { generateOneWayDistrictMetadata } from "@/components/OneWayDistrictPage";

export const metadata = generateOneWayDistrictMetadata("dindigul");

export default function Page() {
    return <OneWayDistrictPage slug="dindigul" />;
}