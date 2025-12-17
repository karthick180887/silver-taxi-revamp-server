import OneWayDistrictPage, { generateOneWayDistrictMetadata } from "@/components/OneWayDistrictPage";

export const metadata = generateOneWayDistrictMetadata("trichy");

export default function Page() {
    return <OneWayDistrictPage slug="trichy" />;
}