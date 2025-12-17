import DistrictPage, { generateDistrictMetadata } from "@/components/DistrictPage";

export const metadata = generateDistrictMetadata("bangalore");

export default function Page() {
    return <DistrictPage slug="bangalore" />;
}