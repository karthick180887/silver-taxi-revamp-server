import OneWayDistrictPage, { generateOneWayDistrictMetadata } from "@/components/OneWayDistrictPage";

export const metadata = generateOneWayDistrictMetadata("thoothukudi");

export default function Page() {
    return <OneWayDistrictPage slug="thoothukudi" />;
}