import DistrictPage, { generateDistrictMetadata } from "@/components/DistrictPage";

export const metadata = generateDistrictMetadata("tirunelveli");

export default function Page() {
    return <DistrictPage slug="tirunelveli" />;
}