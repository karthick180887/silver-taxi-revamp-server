import OneWayDistrictPage, { generateOneWayDistrictMetadata } from "@/components/OneWayDistrictPage";

export const metadata = generateOneWayDistrictMetadata("kallakurichi");

export default function Page() {
    return <OneWayDistrictPage slug="kallakurichi" />;
}