import { db } from "./storage";
import { novels, chapters } from "../shared/schema";

const genres = ["Romance", "Fantasy", "Thriller", "Mystery", "Sci-Fi"];

const sampleNovels = [
  {
    title: "The Last Kingdom",
    author: "Bernard Cornwell",
    genre: "Fantasy",
    description: "An epic tale of war, loyalty, and destiny in medieval England.",
    status: "completed",
    rating: 92,
    totalChapters: 45,
    freeChapters: 5,
    chapterPrice: 10,
  },
  {
    title: "Midnight Mystery",
    author: "Agatha Christie",
    genre: "Mystery",
    description: "A detective's quest to solve the most puzzling murder case of the century.",
    status: "ongoing",
    rating: 88,
    totalChapters: 30,
    freeChapters: 5,
    chapterPrice: 10,
  },
  {
    title: "Hearts Entwined",
    author: "Nicholas Sparks",
    genre: "Romance",
    description: "A love story that transcends time and space.",
    status: "ongoing",
    rating: 85,
    totalChapters: 25,
    freeChapters: 5,
    chapterPrice: 10,
  },
  {
    title: "Cyber Horizon",
    author: "William Gibson",
    genre: "Sci-Fi",
    description: "In a dystopian future, humanity's last hope lies in virtual reality.",
    status: "ongoing",
    rating: 90,
    totalChapters: 35,
    freeChapters: 5,
    chapterPrice: 10,
  },
  {
    title: "The Silent Killer",
    author: "James Patterson",
    genre: "Thriller",
    description: "A serial killer stalks the streets of New York. Only one detective can stop them.",
    status: "ongoing",
    rating: 87,
    totalChapters: 28,
    freeChapters: 5,
    chapterPrice: 10,
  },
];

async function seed() {
  console.log("🌱 Starting database seed...");

  try {
    // Insert novels
    console.log("📚 Seeding novels...");
    for (const novel of sampleNovels) {
      const [insertedNovel] = await db.insert(novels).values(novel).returning();
      console.log(`✓ Created novel: ${insertedNovel.title}`);

      // Insert chapters for each novel
      console.log(`  📖 Creating chapters for ${insertedNovel.title}...`);
      for (let i = 1; i <= insertedNovel.totalChapters; i++) {
        await db.insert(chapters).values({
          novelId: insertedNovel.id,
          chapterNumber: i,
          title: `Chapter ${i}: ${i <= 5 ? 'Introduction' : 'The Journey Continues'}`,
          content: `This is the content of chapter ${i}. ${
            i <= insertedNovel.freeChapters
              ? 'This chapter is free to read!'
              : 'This is a premium chapter. Unlock with coins to continue reading.'
          }\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`,
          wordCount: 500 + Math.floor(Math.random() * 1000),
          isFree: i <= insertedNovel.freeChapters,
          price: i <= insertedNovel.freeChapters ? 0 : insertedNovel.chapterPrice,
        });
      }
      console.log(`  ✓ Created ${insertedNovel.totalChapters} chapters`);
    }

    console.log("\n✅ Database seeded successfully!");
    console.log(`📊 Summary:`);
    console.log(`   - Novels: ${sampleNovels.length}`);
    console.log(`   - Total Chapters: ${sampleNovels.reduce((sum, n) => sum + n.totalChapters, 0)}`);
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Seed error:", error);
    process.exit(1);
  }
}

seed();
