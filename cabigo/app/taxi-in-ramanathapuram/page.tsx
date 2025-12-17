import DistrictPage, { generateDistrictMetadata } from "@/components/DistrictPage";

export const metadata = generateDistrictMetadata("ramanathapuram");

export default function Page() {
    return <DistrictPage slug="ramanathapuram" />;
}