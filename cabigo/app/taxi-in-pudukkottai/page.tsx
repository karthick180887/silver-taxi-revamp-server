import DistrictPage, { generateDistrictMetadata } from "@/components/DistrictPage";

export const metadata = generateDistrictMetadata("pudukkottai");

export default function Page() {
    return <DistrictPage slug="pudukkottai" />;
}