import DistrictPage, { generateDistrictMetadata } from "@/components/DistrictPage";

export const metadata = generateDistrictMetadata("thoothukudi");

export default function Page() {
    return <DistrictPage slug="thoothukudi" />;
}