import DistrictPage, { generateDistrictMetadata } from "@/components/DistrictPage";

export const metadata = generateDistrictMetadata("sivaganga");

export default function Page() {
    return <DistrictPage slug="sivaganga" />;
}