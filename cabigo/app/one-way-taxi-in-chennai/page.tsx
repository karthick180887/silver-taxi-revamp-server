import OneWayDistrictPage, { generateOneWayDistrictMetadata } from "@/components/OneWayDistrictPage";

export const metadata = generateOneWayDistrictMetadata("chennai");

export default function Page() {
    return <OneWayDistrictPage slug="chennai" />;
}