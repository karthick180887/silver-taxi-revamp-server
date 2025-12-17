import DistrictPage, { generateDistrictMetadata } from "@/components/DistrictPage";

export const metadata = generateDistrictMetadata("nagapattinam");

export default function Page() {
    return <DistrictPage slug="nagapattinam" />;
}