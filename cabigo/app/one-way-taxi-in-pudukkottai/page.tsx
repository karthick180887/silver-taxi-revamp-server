import OneWayDistrictPage, { generateOneWayDistrictMetadata } from "@/components/OneWayDistrictPage";

export const metadata = generateOneWayDistrictMetadata("pudukkottai");

export default function Page() {
    return <OneWayDistrictPage slug="pudukkottai" />;
}