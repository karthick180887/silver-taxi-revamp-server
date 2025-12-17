import OneWayDistrictPage, { generateOneWayDistrictMetadata } from "@/components/OneWayDistrictPage";

export const metadata = generateOneWayDistrictMetadata("cuddalore");

export default function Page() {
    return <OneWayDistrictPage slug="cuddalore" />;
}