import OneWayDistrictPage, { generateOneWayDistrictMetadata } from "@/components/OneWayDistrictPage";

export const metadata = generateOneWayDistrictMetadata("pondicherry");

export default function Page() {
    return <OneWayDistrictPage slug="pondicherry" />;
}