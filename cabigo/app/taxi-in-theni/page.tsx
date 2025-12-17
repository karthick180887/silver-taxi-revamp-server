import DistrictPage, { generateDistrictMetadata } from "@/components/DistrictPage";

export const metadata = generateDistrictMetadata("theni");

export default function Page() {
    return <DistrictPage slug="theni" />;
}