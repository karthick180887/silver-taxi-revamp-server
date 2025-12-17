import OneWayDistrictPage, { generateOneWayDistrictMetadata } from "@/components/OneWayDistrictPage";

export const metadata = generateOneWayDistrictMetadata("tiruvallur");

export default function Page() {
    return <OneWayDistrictPage slug="tiruvallur" />;
}