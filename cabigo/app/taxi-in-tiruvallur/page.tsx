import DistrictPage, { generateDistrictMetadata } from "@/components/DistrictPage";

export const metadata = generateDistrictMetadata("tiruvallur");

export default function Page() {
    return <DistrictPage slug="tiruvallur" />;
}