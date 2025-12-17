import DistrictPage, { generateDistrictMetadata } from "@/components/DistrictPage";

export const metadata = generateDistrictMetadata("kanyakumari");

export default function Page() {
    return <DistrictPage slug="kanyakumari" />;
}