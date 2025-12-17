import DistrictPage, { generateDistrictMetadata } from "@/components/DistrictPage";

export const metadata = generateDistrictMetadata("mayiladuthurai");

export default function Page() {
    return <DistrictPage slug="mayiladuthurai" />;
}