import OneWayDistrictPage, { generateOneWayDistrictMetadata } from "@/components/OneWayDistrictPage";

export const metadata = generateOneWayDistrictMetadata("kanyakumari");

export default function Page() {
    return <OneWayDistrictPage slug="kanyakumari" />;
}