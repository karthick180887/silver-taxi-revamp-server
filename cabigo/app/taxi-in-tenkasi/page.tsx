import DistrictPage, { generateDistrictMetadata } from "@/components/DistrictPage";

export const metadata = generateDistrictMetadata("tenkasi");

export default function Page() {
    return <DistrictPage slug="tenkasi" />;
}