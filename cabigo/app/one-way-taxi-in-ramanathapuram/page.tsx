import OneWayDistrictPage, { generateOneWayDistrictMetadata } from "@/components/OneWayDistrictPage";

export const metadata = generateOneWayDistrictMetadata("ramanathapuram");

export default function Page() {
    return <OneWayDistrictPage slug="ramanathapuram" />;
}