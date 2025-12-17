import DistrictPage, { generateDistrictMetadata } from "@/components/DistrictPage";

export const metadata = generateDistrictMetadata("madurai");

export default function Page() {
    return <DistrictPage slug="madurai" />;
}