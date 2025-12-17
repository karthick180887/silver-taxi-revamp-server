import DistrictPage, { generateDistrictMetadata } from "@/components/DistrictPage";

export const metadata = generateDistrictMetadata("virudhunagar");

export default function Page() {
    return <DistrictPage slug="virudhunagar" />;
}