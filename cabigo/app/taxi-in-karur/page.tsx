import DistrictPage, { generateDistrictMetadata } from "@/components/DistrictPage";

export const metadata = generateDistrictMetadata("karur");

export default function Page() {
    return <DistrictPage slug="karur" />;
}