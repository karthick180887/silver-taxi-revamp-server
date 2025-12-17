import DistrictPage, { generateDistrictMetadata } from "@/components/DistrictPage";

export const metadata = generateDistrictMetadata("tiruvannamalai");

export default function Page() {
    return <DistrictPage slug="tiruvannamalai" />;
}