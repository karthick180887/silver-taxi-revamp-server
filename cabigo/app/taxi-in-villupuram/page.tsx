import DistrictPage, { generateDistrictMetadata } from "@/components/DistrictPage";

export const metadata = generateDistrictMetadata("villupuram");

export default function Page() {
    return <DistrictPage slug="villupuram" />;
}