import DistrictPage, { generateDistrictMetadata } from "@/components/DistrictPage";

export const metadata = generateDistrictMetadata("kallakurichi");

export default function Page() {
    return <DistrictPage slug="kallakurichi" />;
}