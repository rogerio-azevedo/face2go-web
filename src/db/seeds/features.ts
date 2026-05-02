import { eq } from "drizzle-orm";

import { db } from "@/db";
import { features } from "@/db/schema";
import { ALL_FEATURES } from "@/lib/features";

export async function seedFeaturesIfNeeded() {
    for (const f of ALL_FEATURES) {
        const existing = await db
            .select({ id: features.id })
            .from(features)
            .where(eq(features.slug, f.slug))
            .limit(1);

        if (existing.length > 0) continue;

        await db.insert(features).values({
            slug: f.slug,
            name: f.name,
            description: f.description,
        });
    }
}
