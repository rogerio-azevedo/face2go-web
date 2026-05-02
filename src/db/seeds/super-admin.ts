import "dotenv/config";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { users } from "@/db/schema";

import { seedFeaturesIfNeeded } from "./features";

async function seedSuperAdmin() {
    const email =
        process.env.SUPER_ADMIN_EMAIL ?? "admin@faciem.local";
    const password =
        process.env.SUPER_ADMIN_PASSWORD ?? "altere-esta-senha";

    if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL) {
        throw new Error("DATABASE_URL ou POSTGRES_URL é obrigatório para o seed.");
    }

    const [existing] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

    if (existing) {
        console.info(`Super admin já existe: ${email}`);
        await seedFeaturesIfNeeded();
        console.info("Catálogo de features verificado.");
        return;
    }

    const hash = await bcrypt.hash(password, 12);

    await db.insert(users).values({
        email,
        name: "Super Admin",
        password: hash,
        role: "super_admin",
        isActive: true,
    });

    console.info(`Super admin criado: ${email}`);

    await seedFeaturesIfNeeded();
    console.info("Catálogo de features verificado.");
}

seedSuperAdmin()
    .then(() => {
        process.exit(0);
    })
    .catch((err: unknown) => {
        console.error(err);
        process.exit(1);
    });
