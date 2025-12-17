
import { districts } from "./lib/data/districts";

console.log(`Total districts: ${districts.length}`);

const slugs = districts.map(d => d.slug);
const duplicateSlugs = slugs.filter((item, index) => slugs.indexOf(item) !== index);

if (duplicateSlugs.length > 0) {
    console.error("Found duplicate slugs:", duplicateSlugs);
} else {
    console.log("No duplicate slugs found.");
}

const ids = districts.map(d => d.id);
const duplicateIds = ids.filter((item, index) => ids.indexOf(item) !== index);

if (duplicateIds.length > 0) {
    console.error("Found duplicate IDs:", duplicateIds);
} else {
    console.log("No duplicate IDs found.");
}

districts.forEach(d => {
    if (!d.slug) console.error(`District ${d.name} missing slug`);
    if (!d.id) console.error(`District ${d.name} missing id`);
});
