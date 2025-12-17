import DistrictPage, { generateDistrictMetadata } from "@/components/DistrictPage";

export const metadata = generateDistrictMetadata("namakkal");

export default function Page() {
    return <DistrictPage slug="namakkal" />;
}