
import { routes, getEnrichedRouteBySlug } from './lib/data/routes';
import { locations } from './lib/data/locations';

console.log("Locations loaded:", locations.length);
console.log("Routes loaded:", routes.length);

routes.forEach(r => {
    console.log(`Testing route: ${r.slug}`);
    try {
        const enriched = getEnrichedRouteBySlug(r.slug);
        if (!enriched) console.error(`FAILED: Route ${r.slug} returned null`);
        else console.log(`SUCCESS: ${enriched?.origin?.name} to ${enriched?.destination?.name}`);
    } catch (e) {
        console.error(`ERROR on ${r.slug}:`, e);
    }
});
