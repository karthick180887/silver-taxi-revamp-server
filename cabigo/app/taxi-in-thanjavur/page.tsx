import DistrictPage, { generateDistrictMetadata } from "@/components/DistrictPage";

export const metadata = generateDistrictMetadata("thanjavur");

export default function Page() {
    return <DistrictPage slug="thanjavur" />;
}