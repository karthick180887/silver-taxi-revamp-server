import DistrictPage, { generateDistrictMetadata } from "@/components/DistrictPage";

export const metadata = generateDistrictMetadata("ariyalur");

export default function Page() {
    return <DistrictPage slug="ariyalur" />;
}