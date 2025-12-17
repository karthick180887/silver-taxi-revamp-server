
import OneWayDistrictPage, { generateOneWayDistrictMetadata } from "@/components/OneWayDistrictPage";
import { districts } from "@/lib/data/districts";

export async function generateStaticParams() {
    return districts.map((district) => ({
        city: district.slug,
    }));
}

export async function generateMetadata(props: { params: Promise<{ city: string }> }) {
    const params = await props.params;
    return generateOneWayDistrictMetadata(params.city);
}

export default async function Page(props: { params: Promise<{ city: string }> }) {
    const params = await props.params;
    return <OneWayDistrictPage slug={params.city} />;
}
