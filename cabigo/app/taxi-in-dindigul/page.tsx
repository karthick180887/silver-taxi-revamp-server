import DistrictPage, { generateDistrictMetadata } from "@/components/DistrictPage";

export const metadata = generateDistrictMetadata("dindigul");

export default function Page() {
    return <DistrictPage slug="dindigul" />;
}