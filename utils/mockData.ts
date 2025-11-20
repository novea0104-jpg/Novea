import { Novel, Chapter, CoinPackage, Notification, Genre } from "@/types/models";

const genres: Genre[] = ["Romance", "Fantasy", "Thriller", "Mystery", "Adventure"];

const novelTitles = {
  Romance: ["Love in the Moonlight", "Hearts Entwined", "A Second Chance", "The Perfect Match"],
  Fantasy: ["Realm of Shadows", "The Dragon's Heir", "Mystic Chronicles", "Enchanted Kingdom"],
  Thriller: ["Silent Witness", "The Last Hour", "Dark Corners", "Hidden Truth"],
  Mystery: ["The Lost Manuscript", "Echoes of the Past", "The Secret Society", "Midnight Detective"],
  Adventure: ["Journey to the Unknown", "Quest for Glory", "Island Escape", "The Explorer's Tale"],
};

const authors = ["Sarah Johnson", "Michael Chen", "Emma Williams", "David Kim", "Lisa Anderson"];

export const mockNovels: Novel[] = genres.flatMap((genre, genreIndex) => 
  novelTitles[genre].map((title, titleIndex) => {
    const id = `novel-${genre.toLowerCase()}-${titleIndex + 1}`;
    const authorIndex = (genreIndex + titleIndex) % authors.length;
    
    return {
      id,
      title,
      author: authors[authorIndex],
      authorId: `author-${authorIndex + 1}`,
      coverImage: `novels/${genre.toLowerCase()}`,
      genre,
      status: Math.random() > 0.5 ? "On-Going" : "Completed",
      rating: 3.5 + Math.random() * 1.5,
      ratingCount: Math.floor(Math.random() * 5000) + 100,
      synopsis: `${title} is an captivating ${genre.toLowerCase()} novel that takes readers on an unforgettable journey. With compelling characters and a gripping plot, this story will keep you turning pages late into the night. ${genre === "Romance" ? "Experience the power of love that transcends all boundaries." : genre === "Fantasy" ? "Enter a world where magic and reality intertwine in unexpected ways." : genre === "Thriller" ? "Uncover secrets that were meant to stay buried forever." : genre === "Mystery" ? "Piece together clues to solve the ultimate puzzle." : "Embark on an epic adventure filled with danger and discovery."}`,
      coinPerChapter: 10,
      totalChapters: Math.floor(Math.random() * 100) + 20,
      followers: Math.floor(Math.random() * 50000) + 1000,
      lastUpdated: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
    };
  })
);

export const generateMockChapters = (novelId: string, totalChapters: number): Chapter[] => {
  return Array.from({ length: totalChapters }, (_, index) => ({
    id: `${novelId}-chapter-${index + 1}`,
    novelId,
    chapterNumber: index + 1,
    title: `Chapter ${index + 1}: ${index === 0 ? "The Beginning" : index === totalChapters - 1 ? "The End" : `Part ${index + 1}`}`,
    content: `This is the content of Chapter ${index + 1}.\n\n` + 
      Array.from({ length: 20 }, (_, p) => 
        `Paragraph ${p + 1}: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.`
      ).join("\n\n"),
    isFree: index < 5,
    publishedAt: new Date(Date.now() - (totalChapters - index) * 24 * 60 * 60 * 1000),
    wordCount: 2000 + Math.floor(Math.random() * 1000),
  }));
};

export const coinPackages: CoinPackage[] = [
  { id: "package-1", coins: 50, price: 9900, bonus: 0 },
  { id: "package-2", coins: 150, price: 29900, bonus: 10, isPopular: true },
  { id: "package-3", coins: 300, price: 49900, bonus: 30 },
  { id: "package-4", coins: 600, price: 99900, bonus: 100 },
  { id: "package-5", coins: 1200, price: 199900, bonus: 300 },
];

export const mockNotifications: Notification[] = [
  {
    id: "notif-1",
    title: "New Chapter Released",
    message: "Love in the Moonlight - Chapter 15 is now available!",
    novelId: "novel-romance-1",
    type: "new_chapter",
    isRead: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: "notif-2",
    title: "New Chapter Released",
    message: "Realm of Shadows - Chapter 42 is now available!",
    novelId: "novel-fantasy-1",
    type: "new_chapter",
    isRead: false,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
  },
  {
    id: "notif-3",
    title: "Special Promotion",
    message: "Get 50% bonus coins on all packages this weekend!",
    type: "promotion",
    isRead: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
  {
    id: "notif-4",
    title: "Welcome to Novea",
    message: "Start your reading journey and discover amazing stories!",
    type: "system",
    isRead: true,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  },
];
