import DistrictPage, { generateDistrictMetadata } from "@/components/DistrictPage";

export const metadata = generateDistrictMetadata("chennai");

export default function Page() {
    return <DistrictPage slug="chennai" />;
}