import DistrictPage, { generateDistrictMetadata } from "@/components/DistrictPage";

export const metadata = generateDistrictMetadata("erode");

export default function Page() {
    return <DistrictPage slug="erode" />;
}