import DistrictPage, { generateDistrictMetadata } from "@/components/DistrictPage";

export const metadata = generateDistrictMetadata("tirupati");

export default function Page() {
    return <DistrictPage slug="tirupati" />;
}