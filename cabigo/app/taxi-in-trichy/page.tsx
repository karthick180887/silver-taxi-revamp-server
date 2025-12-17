import DistrictPage, { generateDistrictMetadata } from "@/components/DistrictPage";

export const metadata = generateDistrictMetadata("trichy");

export default function Page() {
    return <DistrictPage slug="trichy" />;
}