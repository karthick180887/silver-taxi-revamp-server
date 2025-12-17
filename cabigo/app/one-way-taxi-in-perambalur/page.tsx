import OneWayDistrictPage, { generateOneWayDistrictMetadata } from "@/components/OneWayDistrictPage";

export const metadata = generateOneWayDistrictMetadata("perambalur");

export default function Page() {
    return <OneWayDistrictPage slug="perambalur" />;
}