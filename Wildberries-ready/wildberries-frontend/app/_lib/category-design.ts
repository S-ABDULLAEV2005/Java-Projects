export function categoryDesign(name: string, slug = "") {
    const text = `${name} ${slug}`.normalize("NFKC").toLowerCase();
    const rules = [
        [/headphone|audio|науш|аудио|гӯшмонак/, "headphones", "peach"],
        [/smartphone|smartfon|phone|telefon|смартф|телефон|мобил/, "smartphones", "peach"],
        [/parfum|perfume|парф|духи|атриёт/, "perfume", "lavender"],
        [/book|knig|книг|китоб/, "books", "yellow"],
        [/laptop|computer|nout|kompy|ноут|компьют/, "laptops", "mint"],
        [/appliance|bytov|бытов|стирал|холодил|техника|маишӣ/, "appliances", "mint"],
        [/beauty|cosmetic|skincare|космет|красот|зебоӣ/, "beauty", "lavender"],
        [/sport|fitness|спорт|варзиш/, "sports", "yellow"],
    ] as const;
    const match = rules.find(([pattern]) => pattern.test(text));
    return { asset: match?.[1] ?? "hero", tone: match?.[2] ?? "mint" };
}
