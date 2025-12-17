import OneWayDistrictPage, { generateOneWayDistrictMetadata } from "@/components/OneWayDistrictPage";

export const metadata = generateOneWayDistrictMetadata("ariyalur");

export default function Page() {
    return <OneWayDistrictPage slug="ariyalur" />;
}