import OneWayDistrictPage, { generateOneWayDistrictMetadata } from "@/components/OneWayDistrictPage";

export const metadata = generateOneWayDistrictMetadata("vellore");

export default function Page() {
    return <OneWayDistrictPage slug="vellore" />;
}