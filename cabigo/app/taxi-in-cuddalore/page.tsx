import DistrictPage, { generateDistrictMetadata } from "@/components/DistrictPage";

export const metadata = generateDistrictMetadata("cuddalore");

export default function Page() {
    return <DistrictPage slug="cuddalore" />;
}