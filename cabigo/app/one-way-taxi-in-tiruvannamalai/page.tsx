import OneWayDistrictPage, { generateOneWayDistrictMetadata } from "@/components/OneWayDistrictPage";

export const metadata = generateOneWayDistrictMetadata("tiruvannamalai");

export default function Page() {
    return <OneWayDistrictPage slug="tiruvannamalai" />;
}