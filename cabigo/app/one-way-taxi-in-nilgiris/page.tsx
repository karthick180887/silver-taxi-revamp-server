import OneWayDistrictPage, { generateOneWayDistrictMetadata } from "@/components/OneWayDistrictPage";

export const metadata = generateOneWayDistrictMetadata("nilgiris");

export default function Page() {
    return <OneWayDistrictPage slug="nilgiris" />;
}