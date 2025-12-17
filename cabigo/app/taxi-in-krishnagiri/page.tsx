import DistrictPage, { generateDistrictMetadata } from "@/components/DistrictPage";

export const metadata = generateDistrictMetadata("krishnagiri");

export default function Page() {
    return <DistrictPage slug="krishnagiri" />;
}