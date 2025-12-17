import DistrictPage, { generateDistrictMetadata } from "@/components/DistrictPage";

export const metadata = generateDistrictMetadata("vellore");

export default function Page() {
    return <DistrictPage slug="vellore" />;
}