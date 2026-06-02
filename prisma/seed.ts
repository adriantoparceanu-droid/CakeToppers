import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

// Fonturi disponibile pe macOS (copiiate în uploads pentru demo)
const DEMO_FONTS = [
  {
    name: "Arial",
    src: "/System/Library/Fonts/Supplemental/Arial.ttf",
  },
  {
    name: "Brush Script",
    src: "/System/Library/Fonts/Supplemental/Brush Script.ttf",
  },
];

async function seedFont(name: string, srcPath: string) {
  if (!fs.existsSync(srcPath)) {
    console.warn(`⚠️  Font "${name}" nu există la ${srcPath} — omis.`);
    return;
  }

  const uploadsDir = path.resolve("./uploads/fonts");
  fs.mkdirSync(uploadsDir, { recursive: true });

  const ext = path.extname(srcPath);
  const destFile = `${name.replace(/\s+/g, "_").toLowerCase()}${ext}`;
  const destPath = path.join(uploadsDir, destFile);
  const storePath = `fonts/${destFile}`;

  fs.copyFileSync(srcPath, destPath);

  const existing = await prisma.font.findFirst({ where: { name } });
  if (!existing) {
    await prisma.font.create({ data: { name, storePath, active: true } });
    console.log(`✅ Font adăugat: ${name}`);
  } else {
    console.log(`ℹ️  Font deja există: ${name}`);
  }
}

async function main() {
  console.log("🌱 Seeding database...");

  // ─── Admin user ───────────────────────────────────────────────────────────
  const email = process.env.ADMIN_EMAIL ?? "admin@caketopper.ro";
  const password = process.env.ADMIN_PASSWORD ?? "admin1234";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) {
    await prisma.user.create({
      data: {
        email,
        passwordHash: await bcrypt.hash(password, 12),
        name: "Admin",
      },
    });
    console.log(`✅ Admin creat: ${email} / ${password}`);
  } else {
    console.log(`ℹ️  Admin deja există: ${email}`);
  }

  // ─── Settings singleton ───────────────────────────────────────────────────
  await prisma.settings.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      maxWidthMm: 300,
      maxHeightMm: 200,
      cutStrokeWidthMm: 0.1,
      brandName: "CakeTopper Studio",
    },
  });
  console.log("✅ Settings create");

  // ─── Forme built-in ───────────────────────────────────────────────────────
  const shapes = [
    { slug: "stick",  name: "Tijă",   sortOrder: 0 },
    { slug: "heart",  name: "Inimă",  sortOrder: 1 },
    { slug: "circle", name: "Cerc",   sortOrder: 2 },
    { slug: "star",   name: "Stea",   sortOrder: 3 },
  ];
  for (const s of shapes) {
    await prisma.shape.upsert({
      where: { slug: s.slug },
      update: { name: s.name, sortOrder: s.sortOrder },
      create: { ...s, active: true },
    });
  }
  console.log("✅ Forme create: tijă, inimă, cerc, stea");

  // ─── Demo fonturi (copiiate din macOS system fonts) ───────────────────────
  for (const { name, src } of DEMO_FONTS) {
    await seedFont(name, src);
  }

  console.log("\n🎉 Seed complet!");
  console.log(`   Admin: ${email} / ${password}`);
  console.log("   Schimbă parola din Settings după primul login.\n");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
