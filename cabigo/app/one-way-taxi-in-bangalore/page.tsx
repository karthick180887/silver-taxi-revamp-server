import OneWayDistrictPage, { generateOneWayDistrictMetadata } from "@/components/OneWayDistrictPage";

export const metadata = generateOneWayDistrictMetadata("bangalore");

export default function Page() {
    return <OneWayDistrictPage slug="bangalore" />;
}