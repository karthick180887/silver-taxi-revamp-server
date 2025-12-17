import DistrictPage, { generateDistrictMetadata } from "@/components/DistrictPage";

export const metadata = generateDistrictMetadata("pondicherry");

export default function Page() {
    return <DistrictPage slug="pondicherry" />;
}