import DistrictPage, { generateDistrictMetadata } from "@/components/DistrictPage";

export const metadata = generateDistrictMetadata("ranipet");

export default function Page() {
    return <DistrictPage slug="ranipet" />;
}