import DistrictPage, { generateDistrictMetadata } from "@/components/DistrictPage";

export const metadata = generateDistrictMetadata("kanchipuram");

export default function Page() {
    return <DistrictPage slug="kanchipuram" />;
}