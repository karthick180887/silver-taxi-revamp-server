import OneWayDistrictPage, { generateOneWayDistrictMetadata } from "@/components/OneWayDistrictPage";

export const metadata = generateOneWayDistrictMetadata("sivaganga");

export default function Page() {
    return <OneWayDistrictPage slug="sivaganga" />;
}