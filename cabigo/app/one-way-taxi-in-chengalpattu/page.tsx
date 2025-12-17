import OneWayDistrictPage, { generateOneWayDistrictMetadata } from "@/components/OneWayDistrictPage";

export const metadata = generateOneWayDistrictMetadata("chengalpattu");

export default function Page() {
    return <OneWayDistrictPage slug="chengalpattu" />;
}