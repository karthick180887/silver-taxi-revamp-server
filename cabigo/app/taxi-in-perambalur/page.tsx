import DistrictPage, { generateDistrictMetadata } from "@/components/DistrictPage";

export const metadata = generateDistrictMetadata("perambalur");

export default function Page() {
    return <DistrictPage slug="perambalur" />;
}