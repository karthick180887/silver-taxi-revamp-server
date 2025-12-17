import DistrictPage, { generateDistrictMetadata } from "@/components/DistrictPage";

export const metadata = generateDistrictMetadata("chengalpattu");

export default function Page() {
    return <DistrictPage slug="chengalpattu" />;
}