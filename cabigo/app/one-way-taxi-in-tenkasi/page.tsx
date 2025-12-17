import OneWayDistrictPage, { generateOneWayDistrictMetadata } from "@/components/OneWayDistrictPage";

export const metadata = generateOneWayDistrictMetadata("tenkasi");

export default function Page() {
    return <OneWayDistrictPage slug="tenkasi" />;
}