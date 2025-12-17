import OneWayDistrictPage, { generateOneWayDistrictMetadata } from "@/components/OneWayDistrictPage";

export const metadata = generateOneWayDistrictMetadata("mayiladuthurai");

export default function Page() {
    return <OneWayDistrictPage slug="mayiladuthurai" />;
}