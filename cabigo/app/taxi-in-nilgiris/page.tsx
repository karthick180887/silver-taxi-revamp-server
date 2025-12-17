import DistrictPage, { generateDistrictMetadata } from "@/components/DistrictPage";

export const metadata = generateDistrictMetadata("nilgiris");

export default function Page() {
    return <DistrictPage slug="nilgiris" />;
}