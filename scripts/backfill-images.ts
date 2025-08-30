import { PrismaClient } from "@prisma/client";
import { fetchArticleHtml, extractMainImage } from "../src/lib/crawler";

const prisma = new PrismaClient();

(async () => {
  const items = await prisma.article.findMany({
    where: { OR: [{ imageUrl: null }, { imageUrl: "" }] },
  });

  let updated = 0;
  for (const a of items) {
    try {
      const html = await fetchArticleHtml(a.url);
      const img = extractMainImage(html, a.url);
      if (img) {
        await prisma.article.update({
          where: { id: a.id },
          data: { imageUrl: img },
        });
        updated++;
        console.log("✓ Updated", a.title);
      }
    } catch (e: any) {
      console.log("x Failed", a.url, e.message);
    }
  }

  console.log(`Done. Updated ${updated} articles with images.`);
  await prisma.$disconnect();
})();