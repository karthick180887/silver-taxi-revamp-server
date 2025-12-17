import DistrictPage, { generateDistrictMetadata } from "@/components/DistrictPage";

export const metadata = generateDistrictMetadata("tiruvarur");

export default function Page() {
    return <DistrictPage slug="tiruvarur" />;
}