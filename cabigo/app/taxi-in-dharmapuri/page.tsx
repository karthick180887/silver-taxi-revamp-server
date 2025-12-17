import DistrictPage, { generateDistrictMetadata } from "@/components/DistrictPage";

export const metadata = generateDistrictMetadata("dharmapuri");

export default function Page() {
    return <DistrictPage slug="dharmapuri" />;
}