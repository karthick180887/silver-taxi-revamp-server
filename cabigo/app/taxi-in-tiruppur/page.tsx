import DistrictPage, { generateDistrictMetadata } from "@/components/DistrictPage";

export const metadata = generateDistrictMetadata("tiruppur");

export default function Page() {
    return <DistrictPage slug="tiruppur" />;
}