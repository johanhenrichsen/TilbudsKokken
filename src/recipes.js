export const recipeBank = [
  // ── PASTA ──────────────────────────────────────────────────────────
  {
    id: 1, title: "Spaghetti Bolognese", emoji: "🍝", time: "45 min",
    servings_count: 4, category: "Pasta",
    dealItems: [
      { name: "Spaghetti 500g", store: "Rema 1000" },
      { name: "Hakket oksekød 500g", store: "Rema 1000" },
      { name: "Dåsetomater 400g", store: "Netto" },
    ],
    ingredients: [
      { text: "500g hakket oksekød", dealItem: "Hakket oksekød 500g" },
      { text: "300g spaghetti", dealItem: "Spaghetti 500g" },
      { text: "400g dåsetomater", dealItem: "Dåsetomater 400g" },
      { text: "1 løg", dealItem: null },
      { text: "2 fed hvidløg", dealItem: null },
      { text: "1 tsk oregano", dealItem: null },
      { text: "salt og peber", dealItem: null },
    ],
    steps: [
      "Kog spaghetti i rigeligt saltet vand til al dente.",
      "Brun hakket oksekød i lidt olie på panden.",
      "Tilsæt hakket løg og hvidløg, svits 2-3 min.",
      "Tilsæt dåsetomater og oregano, simmer 20 min.",
      "Server kødsauce over spaghetti.",
    ],
    tip: "Tilsæt en teskefuld sukker hvis tomaterne smager syre."
  },
  {
    id: 2, title: "Pasta Carbonara", emoji: "🍳", time: "25 min",
    servings_count: 4, category: "Pasta",
    dealItems: [
      { name: "Spaghetti 500g", store: "Rema 1000" },
      { name: "Æg 10 stk.", store: "Rema 1000" },
      { name: "Parmesan revet 80g", store: "Coop 365" },
    ],
    ingredients: [
      { text: "300g spaghetti", dealItem: "Spaghetti 500g" },
      { text: "4 æg", dealItem: "Æg 10 stk." },
      { text: "80g parmesan, revet", dealItem: "Parmesan revet 80g" },
      { text: "2 fed hvidløg", dealItem: null },
      { text: "2 spsk olie", dealItem: null },
      { text: "sort peber", dealItem: null },
      { text: "salt", dealItem: null },
    ],
    steps: [
      "Kog spaghetti al dente, gem 1 dl pastavand.",
      "Svits hakket hvidløg i olie til gyldent.",
      "Pisk æg og parmesan sammen med rigeligt sort peber.",
      "Tag panden fra varmen, tilsæt kogt pasta.",
      "Hæld æggeblanding over og rør hurtigt – brug pastavand for cremekonsistens.",
    ],
    tip: "Varm fra panden er nok – æggene må ikke stivne."
  },
  {
    id: 3, title: "Penne Arrabbiata", emoji: "🌶️", time: "25 min",
    servings_count: 4, category: "Pasta",
    dealItems: [
      { name: "Pasta penne 500g", store: "Coop 365" },
      { name: "Dåsetomater 400g", store: "Netto" },
      { name: "Basilikum", store: "Netto" },
    ],
    ingredients: [
      { text: "400g pasta penne", dealItem: "Pasta penne 500g" },
      { text: "400g dåsetomater", dealItem: "Dåsetomater 400g" },
      { text: "frisk basilikum", dealItem: "Basilikum" },
      { text: "4 fed hvidløg", dealItem: null },
      { text: "1 tsk chiliflager", dealItem: null },
      { text: "3 spsk olie", dealItem: null },
      { text: "salt", dealItem: null },
    ],
    steps: [
      "Kog pasta i saltet vand til al dente.",
      "Svits hakket hvidløg og chiliflager i olie 1-2 min.",
      "Tilsæt dåsetomater, simmer 12 min.",
      "Bland pasta med sauce og server med frisk basilikum.",
    ],
    tip: "Jo længere saucen simrer, jo kraftigere smag."
  },
  {
    id: 4, title: "Pasta med Kylling og Fløde", emoji: "🍗", time: "35 min",
    servings_count: 4, category: "Pasta",
    dealItems: [
      { name: "Kyllingefilet 600g", store: "Netto" },
      { name: "Pasta penne 500g", store: "Coop 365" },
      { name: "Fløde 38% 0.5L", store: "Coop 365" },
    ],
    ingredients: [
      { text: "600g kyllingefilet", dealItem: "Kyllingefilet 600g" },
      { text: "400g pasta penne", dealItem: "Pasta penne 500g" },
      { text: "2 dl fløde", dealItem: "Fløde 38% 0.5L" },
      { text: "2 fed hvidløg", dealItem: null },
      { text: "1 tsk paprika", dealItem: null },
      { text: "salt og peber", dealItem: null },
      { text: "olie", dealItem: null },
    ],
    steps: [
      "Kog pasta al dente.",
      "Skær kylling i tern, krydr med paprika, salt og peber.",
      "Steg kylling gyldent på panden, tag fra.",
      "Svits hvidløg i samme pande, tilsæt fløde og simmer 3 min.",
      "Tilsæt kylling og pasta, rør godt.",
    ],
    tip: "Tilsæt frisk spinat de sidste 2 min for ekstra grønt."
  },
  {
    id: 5, title: "Pasta Bake med Oksekød", emoji: "🫙", time: "50 min",
    servings_count: 6, category: "Pasta",
    dealItems: [
      { name: "Hakket oksekød 500g", store: "Rema 1000" },
      { name: "Pasta penne 500g", store: "Coop 365" },
      { name: "Dåsetomater 400g", store: "Netto" },
      { name: "Mozzarella 125g", store: "Netto" },
    ],
    ingredients: [
      { text: "500g hakket oksekød", dealItem: "Hakket oksekød 500g" },
      { text: "400g pasta penne", dealItem: "Pasta penne 500g" },
      { text: "400g dåsetomater", dealItem: "Dåsetomater 400g" },
      { text: "125g mozzarella", dealItem: "Mozzarella 125g" },
      { text: "1 løg", dealItem: null },
      { text: "1 tsk oregano", dealItem: null },
      { text: "salt og peber", dealItem: null },
    ],
    steps: [
      "Forvarm ovn til 200°C. Kog pasta halvvejs.",
      "Brun oksekød med hakket løg. Tilsæt tomater, oregano og simmer 10 min.",
      "Bland pasta og kødsauce i ovnfad.",
      "Riv mozzarella over og bag 25 min til gylden.",
    ],
    tip: "Dæk med folie de første 15 min så pastaen ikke tørrer."
  },
  {
    id: 6, title: "Pasta med Spinat og Parmesan", emoji: "🌿", time: "20 min",
    servings_count: 4, category: "Pasta",
    dealItems: [
      { name: "Pasta penne 500g", store: "Coop 365" },
      { name: "Spinat frisk 200g", store: "Coop 365" },
      { name: "Parmesan revet 80g", store: "Coop 365" },
    ],
    ingredients: [
      { text: "400g pasta penne", dealItem: "Pasta penne 500g" },
      { text: "200g frisk spinat", dealItem: "Spinat frisk 200g" },
      { text: "80g parmesan, revet", dealItem: "Parmesan revet 80g" },
      { text: "3 fed hvidløg", dealItem: null },
      { text: "2 spsk smør", dealItem: null },
      { text: "salt og peber", dealItem: null },
    ],
    steps: [
      "Kog pasta, gem 1 dl pastavand.",
      "Smelt smør i stor pande, svits hakket hvidløg.",
      "Tilsæt spinat og rør til visnet, ca. 2 min.",
      "Bland pasta og spinat, rør parmesan og pastavand i til cremet sauce.",
    ],
    tip: "En klemme frisk citron giver friskhed."
  },
  {
    id: 7, title: "Spaghetti med Mozzarella og Basilikum", emoji: "🍅", time: "20 min",
    servings_count: 4, category: "Pasta",
    dealItems: [
      { name: "Spaghetti 500g", store: "Rema 1000" },
      { name: "Dåsetomater 400g", store: "Netto" },
      { name: "Mozzarella 125g", store: "Netto" },
      { name: "Basilikum", store: "Netto" },
    ],
    ingredients: [
      { text: "300g spaghetti", dealItem: "Spaghetti 500g" },
      { text: "400g dåsetomater", dealItem: "Dåsetomater 400g" },
      { text: "125g mozzarella", dealItem: "Mozzarella 125g" },
      { text: "frisk basilikum", dealItem: "Basilikum" },
      { text: "2 fed hvidløg", dealItem: null },
      { text: "2 spsk olie", dealItem: null },
      { text: "salt", dealItem: null },
    ],
    steps: [
      "Kog spaghetti al dente.",
      "Svits hvidløg i olie, tilsæt tomater og simmer 10 min.",
      "Anret pasta med sauce, riv mozzarella over.",
      "Drys frisk basilikum og et skvæt god olie.",
    ],
    tip: "Serveres straks mens mozzarellaen stadig er blød og cremet."
  },
  {
    id: 8, title: "Pasta Primavera med Gulerødder og Spinat", emoji: "🥕", time: "25 min",
    servings_count: 4, category: "Pasta",
    dealItems: [
      { name: "Spaghetti 500g", store: "Rema 1000" },
      { name: "Gulerødder 1kg", store: "Rema 1000" },
      { name: "Spinat frisk 200g", store: "Coop 365" },
      { name: "Parmesan revet 80g", store: "Coop 365" },
    ],
    ingredients: [
      { text: "300g spaghetti", dealItem: "Spaghetti 500g" },
      { text: "2 gulerødder, i tern", dealItem: "Gulerødder 1kg" },
      { text: "100g frisk spinat", dealItem: "Spinat frisk 200g" },
      { text: "60g parmesan, revet", dealItem: "Parmesan revet 80g" },
      { text: "3 fed hvidløg", dealItem: null },
      { text: "2 spsk olie", dealItem: null },
      { text: "salt og peber", dealItem: null },
    ],
    steps: [
      "Kog spaghetti al dente, gem lidt pastavand.",
      "Steg gulerødstern i olie 5 min til let bløde.",
      "Tilsæt hvidløg og spinat, rør 2 min.",
      "Bland pasta i panden, tilsæt pastavand og parmesan.",
    ],
    tip: "Tilsæt et skvæt citron for syre og friskhed."
  },
  {
    id: 9, title: "Pasta med Laks og Fløde", emoji: "🐟", time: "30 min",
    servings_count: 4, category: "Pasta",
    dealItems: [
      { name: "Laks filet 400g", store: "Coop 365" },
      { name: "Pasta penne 500g", store: "Coop 365" },
      { name: "Fløde 38% 0.5L", store: "Coop 365" },
      { name: "Spinat frisk 200g", store: "Coop 365" },
    ],
    ingredients: [
      { text: "400g laks filet", dealItem: "Laks filet 400g" },
      { text: "400g pasta penne", dealItem: "Pasta penne 500g" },
      { text: "2 dl fløde", dealItem: "Fløde 38% 0.5L" },
      { text: "100g frisk spinat", dealItem: "Spinat frisk 200g" },
      { text: "2 fed hvidløg", dealItem: null },
      { text: "citronsaft", dealItem: null },
      { text: "salt og peber", dealItem: null },
    ],
    steps: [
      "Kog pasta al dente.",
      "Skær laks i tern, steg 2-3 min på panden.",
      "Svits hvidløg, tilsæt fløde og simmer 3 min.",
      "Rør spinat i saucen til visnet, tilsæt pasta og laks.",
      "Krydr med citronsaft, salt og peber.",
    ],
    tip: "Brug det vand pastaen er kogt i for en lettere sauce."
  },
  {
    id: 10, title: "Spaghetti Aglio e Olio med Parmesan", emoji: "🧄", time: "15 min",
    servings_count: 4, category: "Pasta",
    dealItems: [
      { name: "Spaghetti 500g", store: "Rema 1000" },
      { name: "Parmesan revet 80g", store: "Coop 365" },
    ],
    ingredients: [
      { text: "350g spaghetti", dealItem: "Spaghetti 500g" },
      { text: "60g parmesan, revet", dealItem: "Parmesan revet 80g" },
      { text: "6 fed hvidløg", dealItem: null },
      { text: "1 tsk chiliflager", dealItem: null },
      { text: "5 spsk olie", dealItem: null },
      { text: "salt og peber", dealItem: null },
    ],
    steps: [
      "Kog spaghetti al dente, gem 2 dl pastavand.",
      "Svits tyndt skåret hvidløg og chili i olie til gyldent.",
      "Tilsæt kogt pasta og pastavand, ryst til cremet.",
      "Server med revet parmesan og sort peber.",
    ],
    tip: "Enkel klassiker – kvalitetsolie gør hele forskellen."
  },
  {
    id: 11, title: "Hurtig Lasagne", emoji: "🫕", time: "55 min",
    servings_count: 6, category: "Pasta",
    dealItems: [
      { name: "Hakket oksekød 500g", store: "Rema 1000" },
      { name: "Pasta penne 500g", store: "Coop 365" },
      { name: "Fløde 38% 0.5L", store: "Coop 365" },
      { name: "Parmesan revet 80g", store: "Coop 365" },
      { name: "Dåsetomater 400g", store: "Netto" },
    ],
    ingredients: [
      { text: "500g hakket oksekød", dealItem: "Hakket oksekød 500g" },
      { text: "400g pasta penne (istedet for lasagneplader)", dealItem: "Pasta penne 500g" },
      { text: "400g dåsetomater", dealItem: "Dåsetomater 400g" },
      { text: "2 dl fløde", dealItem: "Fløde 38% 0.5L" },
      { text: "60g parmesan, revet", dealItem: "Parmesan revet 80g" },
      { text: "1 løg", dealItem: null },
      { text: "1 tsk oregano", dealItem: null },
      { text: "salt og peber", dealItem: null },
    ],
    steps: [
      "Forvarm ovn til 190°C. Kog pasta halvvejs.",
      "Brun oksekød med løg. Tilsæt tomater og oregano, simmer 10 min.",
      "Bland pasta med kødsauce og hæld i ovnfad.",
      "Hæld fløde over, drys parmesan og bag 25 min.",
    ],
    tip: "Lad stå 5 min inden servering så det sætter sig."
  },
  {
    id: 12, title: "Pasta Frittata", emoji: "🥚", time: "25 min",
    servings_count: 3, category: "Pasta",
    dealItems: [
      { name: "Spaghetti 500g", store: "Rema 1000" },
      { name: "Æg 10 stk.", store: "Rema 1000" },
      { name: "Parmesan revet 80g", store: "Coop 365" },
    ],
    ingredients: [
      { text: "200g kogt spaghetti (rester)", dealItem: "Spaghetti 500g" },
      { text: "5 æg", dealItem: "Æg 10 stk." },
      { text: "60g parmesan, revet", dealItem: "Parmesan revet 80g" },
      { text: "2 fed hvidløg", dealItem: null },
      { text: "salt og peber", dealItem: null },
      { text: "olie", dealItem: null },
    ],
    steps: [
      "Kog spaghetti al dente, lad afkøle lidt.",
      "Pisk æg med parmesan, salt og peber.",
      "Bland spaghetti og æggeblandingen.",
      "Steg i oliesmurt pande 4-5 min på hver side til gylden.",
    ],
    tip: "Perfekt til resteopskrift – brug gerne grøntsagsrester."
  },
  // ── KYLLING ───────────────────────────────────────────────────────
  {
    id: 13, title: "Kylling i Ovn med Kartofler", emoji: "🍗", time: "55 min",
    servings_count: 4, category: "Kylling",
    dealItems: [
      { name: "Kyllingefilet 600g", store: "Netto" },
      { name: "Kartofler 2kg", store: "Coop 365" },
    ],
    ingredients: [
      { text: "600g kyllingefilet", dealItem: "Kyllingefilet 600g" },
      { text: "800g kartofler", dealItem: "Kartofler 2kg" },
      { text: "4 fed hvidløg", dealItem: null },
      { text: "1 tsk paprika", dealItem: null },
      { text: "1 tsk timian", dealItem: null },
      { text: "3 spsk olie", dealItem: null },
      { text: "salt og peber", dealItem: null },
    ],
    steps: [
      "Forvarm ovn til 200°C.",
      "Skær kartofler i både og bland med olie, paprika og salt.",
      "Krydr kylling med timian, hvidløg, salt og peber.",
      "Læg kartofler og kylling i ovnfad, bag 40-45 min.",
    ],
    tip: "Vend kartoflerne halvvejs for jævn bruning."
  },
  {
    id: 14, title: "Hakkebøffer med Kartofler", emoji: "🥩", time: "35 min",
    servings_count: 4, category: "Oksekød",
    dealItems: [
      { name: "Hakket oksekød 500g", store: "Rema 1000" },
      { name: "Kartofler 2kg", store: "Coop 365" },
    ],
    ingredients: [
      { text: "500g hakket oksekød", dealItem: "Hakket oksekød 500g" },
      { text: "600g kartofler", dealItem: "Kartofler 2kg" },
      { text: "1 løg, hakket", dealItem: null },
      { text: "1 æg", dealItem: null },
      { text: "1 tsk paprika", dealItem: null },
      { text: "smør til stegning", dealItem: null },
      { text: "salt og peber", dealItem: null },
    ],
    steps: [
      "Kog kartofler til bløde, mos eller server som de er.",
      "Bland oksekød med hakket løg, paprika, salt og peber.",
      "Form til 4 bøffer og steg i smør 4-5 min på hver side.",
      "Server bøffer med kartofler.",
    ],
    tip: "Lad bøfferne hvile 2 min inden servering."
  },
  {
    id: 15, title: "Kylling Wok med Ris og Gulerødder", emoji: "🥢", time: "30 min",
    servings_count: 4, category: "Kylling",
    dealItems: [
      { name: "Kyllingefilet 600g", store: "Netto" },
      { name: "Ris 1kg", store: "Netto" },
      { name: "Gulerødder 1kg", store: "Rema 1000" },
    ],
    ingredients: [
      { text: "600g kyllingefilet, i strimler", dealItem: "Kyllingefilet 600g" },
      { text: "300g ris", dealItem: "Ris 1kg" },
      { text: "3 gulerødder, i strimler", dealItem: "Gulerødder 1kg" },
      { text: "3 fed hvidløg", dealItem: null },
      { text: "2 spsk soja sauce", dealItem: null },
      { text: "1 spsk olie", dealItem: null },
      { text: "salt og peber", dealItem: null },
    ],
    steps: [
      "Kog ris efter pakkens anvisning.",
      "Wok kyllingestrimler i varm olie 5-6 min.",
      "Tilsæt gulerødsstrimmler og hvidløg, wok 3 min.",
      "Hæld soja over og rør godt. Server med ris.",
    ],
    tip: "Tilsæt lidt ingefær for ekstra asiatisk smag."
  },
  {
    id: 16, title: "Oksekødsgryde med Gulerødder og Kartofler", emoji: "🫕", time: "60 min",
    servings_count: 4, category: "Oksekød",
    dealItems: [
      { name: "Hakket oksekød 500g", store: "Rema 1000" },
      { name: "Gulerødder 1kg", store: "Rema 1000" },
      { name: "Kartofler 2kg", store: "Coop 365" },
    ],
    ingredients: [
      { text: "500g hakket oksekød", dealItem: "Hakket oksekød 500g" },
      { text: "4 gulerødder, i tern", dealItem: "Gulerødder 1kg" },
      { text: "600g kartofler, i tern", dealItem: "Kartofler 2kg" },
      { text: "1 løg", dealItem: null },
      { text: "1 bouillonterning", dealItem: null },
      { text: "1 tsk paprika", dealItem: null },
      { text: "salt og peber", dealItem: null },
    ],
    steps: [
      "Brun oksekød med hakket løg i gryde.",
      "Tilsæt gulerødder, kartofler og paprika, rør.",
      "Hæld 6 dl vand over med bouillonterning.",
      "Simmer tildækket 35-40 min til kartofler er møre.",
    ],
    tip: "Tilsæt hakket persille ved servering for friskhed."
  },
  {
    id: 17, title: "Kylling i Flødesauce med Spinat", emoji: "🍲", time: "30 min",
    servings_count: 4, category: "Kylling",
    dealItems: [
      { name: "Kyllingefilet 600g", store: "Netto" },
      { name: "Fløde 38% 0.5L", store: "Coop 365" },
      { name: "Spinat frisk 200g", store: "Coop 365" },
    ],
    ingredients: [
      { text: "600g kyllingefilet", dealItem: "Kyllingefilet 600g" },
      { text: "2 dl fløde", dealItem: "Fløde 38% 0.5L" },
      { text: "150g frisk spinat", dealItem: "Spinat frisk 200g" },
      { text: "3 fed hvidløg", dealItem: null },
      { text: "1 tsk paprika", dealItem: null },
      { text: "smør", dealItem: null },
      { text: "salt og peber", dealItem: null },
    ],
    steps: [
      "Krydr kylling med paprika, salt og peber.",
      "Steg kylling i smør 5-6 min pr. side, tag fra panden.",
      "Svits hvidløg i panden, tilsæt fløde og simmer 3 min.",
      "Rør spinat i saucen til visnet, anret kylling over.",
    ],
    tip: "Server med ris eller brød til at suge saucen op."
  },
  {
    id: 18, title: "Kyllingesuppe med Gulerødder og Kartofler", emoji: "🍜", time: "45 min",
    servings_count: 4, category: "Kylling",
    dealItems: [
      { name: "Kyllingefilet 600g", store: "Netto" },
      { name: "Gulerødder 1kg", store: "Rema 1000" },
      { name: "Kartofler 2kg", store: "Coop 365" },
    ],
    ingredients: [
      { text: "600g kyllingefilet", dealItem: "Kyllingefilet 600g" },
      { text: "3 gulerødder, i skiver", dealItem: "Gulerødder 1kg" },
      { text: "500g kartofler, i tern", dealItem: "Kartofler 2kg" },
      { text: "1 løg", dealItem: null },
      { text: "2 bouillonterninger", dealItem: null },
      { text: "timian og persille", dealItem: null },
      { text: "salt og peber", dealItem: null },
    ],
    steps: [
      "Kog kylling i 1,2 liter vand med bouillon og løg 20 min.",
      "Tag kylling op og riv i strimler.",
      "Tilsæt gulerødder og kartofler i bouillonen, kog 15 min.",
      "Kom kyllingestrimlerne tilbage, krydr og server.",
    ],
    tip: "Tilsæt lidt eddike for frisk smag."
  },
  {
    id: 19, title: "Kylling med Tomatsauce", emoji: "🍅", time: "35 min",
    servings_count: 4, category: "Kylling",
    dealItems: [
      { name: "Kyllingefilet 600g", store: "Netto" },
      { name: "Dåsetomater 400g", store: "Netto" },
    ],
    ingredients: [
      { text: "600g kyllingefilet", dealItem: "Kyllingefilet 600g" },
      { text: "400g dåsetomater", dealItem: "Dåsetomater 400g" },
      { text: "1 løg", dealItem: null },
      { text: "3 fed hvidløg", dealItem: null },
      { text: "1 tsk paprika", dealItem: null },
      { text: "1 tsk oregano", dealItem: null },
      { text: "olie, salt og peber", dealItem: null },
    ],
    steps: [
      "Steg kyllingefileter gyldent på begge sider, tag fra panden.",
      "Svits løg og hvidløg i olie 3 min.",
      "Tilsæt tomater, paprika og oregano, simmer 10 min.",
      "Læg kylling tilbage i saucen og simmer videre 10 min.",
    ],
    tip: "Server med ris, pasta eller brød."
  },
  {
    id: 20, title: "Oksekød Stir-fry med Ris", emoji: "🍚", time: "30 min",
    servings_count: 4, category: "Oksekød",
    dealItems: [
      { name: "Hakket oksekød 500g", store: "Rema 1000" },
      { name: "Ris 1kg", store: "Netto" },
    ],
    ingredients: [
      { text: "500g hakket oksekød", dealItem: "Hakket oksekød 500g" },
      { text: "300g ris", dealItem: "Ris 1kg" },
      { text: "3 fed hvidløg", dealItem: null },
      { text: "2 spsk soja sauce", dealItem: null },
      { text: "1 løg", dealItem: null },
      { text: "1 tsk spidskommen", dealItem: null },
      { text: "olie", dealItem: null },
    ],
    steps: [
      "Kog ris efter anvisning.",
      "Brun oksekød med løg og hvidløg i olie.",
      "Krydr med spidskommen og soja sauce.",
      "Server oksekød over ris.",
    ],
    tip: "Tilsæt gulerødder eller spinat for grønt."
  },
  {
    id: 21, title: "Kylling Tikka Masala", emoji: "🍛", time: "40 min",
    servings_count: 4, category: "Kylling",
    dealItems: [
      { name: "Kyllingefilet 600g", store: "Netto" },
      { name: "Dåsetomater 400g", store: "Netto" },
      { name: "Fløde 38% 0.5L", store: "Coop 365" },
    ],
    ingredients: [
      { text: "600g kyllingefilet, i tern", dealItem: "Kyllingefilet 600g" },
      { text: "400g dåsetomater", dealItem: "Dåsetomater 400g" },
      { text: "1,5 dl fløde", dealItem: "Fløde 38% 0.5L" },
      { text: "1 løg", dealItem: null },
      { text: "3 fed hvidløg", dealItem: null },
      { text: "2 tsk karry", dealItem: null },
      { text: "1 tsk spidskommen", dealItem: null },
      { text: "olie, salt", dealItem: null },
    ],
    steps: [
      "Steg kyllingtern i olie 5 min, tag fra panden.",
      "Svits løg og hvidløg, tilsæt karry og spidskommen, steg 1 min.",
      "Tilsæt tomater og simmer 10 min.",
      "Rør fløde og kylling i, simmer yderligere 10 min.",
    ],
    tip: "Server med ris og frisk persille."
  },
  {
    id: 22, title: "Fyldt Paprika med Oksekød og Ris", emoji: "🫑", time: "55 min",
    servings_count: 4, category: "Oksekød",
    dealItems: [
      { name: "Hakket oksekød 500g", store: "Rema 1000" },
      { name: "Dåsetomater 400g", store: "Netto" },
      { name: "Ris 1kg", store: "Netto" },
    ],
    ingredients: [
      { text: "500g hakket oksekød", dealItem: "Hakket oksekød 500g" },
      { text: "400g dåsetomater", dealItem: "Dåsetomater 400g" },
      { text: "150g ris", dealItem: "Ris 1kg" },
      { text: "4 store paprika", dealItem: null },
      { text: "1 løg", dealItem: null },
      { text: "2 fed hvidløg", dealItem: null },
      { text: "salt og peber", dealItem: null },
    ],
    steps: [
      "Forvarm ovn til 190°C. Skær toppen af paprikaerne og fjern kerner.",
      "Steg oksekød med løg. Tilsæt halvkogt ris og dåsetomater.",
      "Fyld paprikaerne og stil i ovnfad med lidt vand i bunden.",
      "Bag 35 min til paprikaen er blød.",
    ],
    tip: "Drys revet ost over de sidste 5 min."
  },
  {
    id: 23, title: "Kylling Rice Bowl med Spinat", emoji: "🥗", time: "30 min",
    servings_count: 4, category: "Kylling",
    dealItems: [
      { name: "Kyllingefilet 600g", store: "Netto" },
      { name: "Ris 1kg", store: "Netto" },
      { name: "Spinat frisk 200g", store: "Coop 365" },
    ],
    ingredients: [
      { text: "600g kyllingefilet", dealItem: "Kyllingefilet 600g" },
      { text: "300g ris", dealItem: "Ris 1kg" },
      { text: "150g frisk spinat", dealItem: "Spinat frisk 200g" },
      { text: "3 fed hvidløg", dealItem: null },
      { text: "2 spsk soja sauce", dealItem: null },
      { text: "1 tsk paprika", dealItem: null },
      { text: "olie", dealItem: null },
    ],
    steps: [
      "Kog ris.",
      "Steg kylling med paprika i olie til gennemstegt.",
      "Svits hvidløg, tilsæt spinat til visnet, krydr med soja.",
      "Anret ris i bowl med kylling og spinat over.",
    ],
    tip: "Et kogt æg på toppen giver ekstra protein."
  },
  // ── LAKS ──────────────────────────────────────────────────────────
  {
    id: 24, title: "Bagt Laks med Kartofler", emoji: "🐟", time: "40 min",
    servings_count: 4, category: "Fisk",
    dealItems: [
      { name: "Laks filet 400g", store: "Coop 365" },
      { name: "Kartofler 2kg", store: "Coop 365" },
    ],
    ingredients: [
      { text: "400g laks filet", dealItem: "Laks filet 400g" },
      { text: "800g kartofler", dealItem: "Kartofler 2kg" },
      { text: "4 fed hvidløg", dealItem: null },
      { text: "citronsaft", dealItem: null },
      { text: "2 spsk smør", dealItem: null },
      { text: "timian", dealItem: null },
      { text: "salt og peber", dealItem: null },
    ],
    steps: [
      "Forvarm ovn til 200°C. Kog kartofler halvvejs.",
      "Læg kartofler i ovnfad med smør, hvidløg og timian, bag 15 min.",
      "Læg laks oven på kartofler, hæld citronsaft over.",
      "Bag yderligere 15-18 min til laksen er gennemstegt.",
    ],
    tip: "Laksen er klar når den flager ved let tryk."
  },
  {
    id: 25, title: "Laks i Flødesauce med Spinat", emoji: "🐠", time: "25 min",
    servings_count: 4, category: "Fisk",
    dealItems: [
      { name: "Laks filet 400g", store: "Coop 365" },
      { name: "Fløde 38% 0.5L", store: "Coop 365" },
      { name: "Spinat frisk 200g", store: "Coop 365" },
    ],
    ingredients: [
      { text: "400g laks filet, i tern", dealItem: "Laks filet 400g" },
      { text: "2 dl fløde", dealItem: "Fløde 38% 0.5L" },
      { text: "150g frisk spinat", dealItem: "Spinat frisk 200g" },
      { text: "3 fed hvidløg", dealItem: null },
      { text: "citronsaft", dealItem: null },
      { text: "smør", dealItem: null },
      { text: "salt og peber", dealItem: null },
    ],
    steps: [
      "Steg lakstern i smør 3-4 min, tag fra panden.",
      "Svits hvidløg, tilsæt fløde og simmer 3 min.",
      "Rør spinat i saucen til visnet.",
      "Tilsæt laks og citronsaft, server med ris.",
    ],
    tip: "Undgå at koge laks for længe – den må gerne være rosa i midten."
  },
  {
    id: 26, title: "Laks Risotto", emoji: "🍚", time: "40 min",
    servings_count: 4, category: "Fisk",
    dealItems: [
      { name: "Laks filet 400g", store: "Coop 365" },
      { name: "Ris 1kg", store: "Netto" },
      { name: "Parmesan revet 80g", store: "Coop 365" },
    ],
    ingredients: [
      { text: "400g laks filet, i tern", dealItem: "Laks filet 400g" },
      { text: "300g ris", dealItem: "Ris 1kg" },
      { text: "60g parmesan, revet", dealItem: "Parmesan revet 80g" },
      { text: "1 løg", dealItem: null },
      { text: "2 bouillonterninger", dealItem: null },
      { text: "2 spsk smør", dealItem: null },
      { text: "citronsaft, salt og peber", dealItem: null },
    ],
    steps: [
      "Varm 1 liter bouillon i gryde.",
      "Svits hakket løg i smør, tilsæt ris og rør 1 min.",
      "Tilsæt bouillon lidt ad gangen under konstant omrøring.",
      "Steg laks ved siden af, rør i risotto til cremet.",
      "Rør parmesan og smør i, læg laks over og krydr.",
    ],
    tip: "Risotto kræver opmærksomhed – rør jævnligt."
  },
  {
    id: 27, title: "Ovnbagt Laks med Gulerødder", emoji: "🥕", time: "35 min",
    servings_count: 4, category: "Fisk",
    dealItems: [
      { name: "Laks filet 400g", store: "Coop 365" },
      { name: "Gulerødder 1kg", store: "Rema 1000" },
    ],
    ingredients: [
      { text: "400g laks filet", dealItem: "Laks filet 400g" },
      { text: "4 gulerødder, i stave", dealItem: "Gulerødder 1kg" },
      { text: "4 fed hvidløg", dealItem: null },
      { text: "2 spsk olie", dealItem: null },
      { text: "timian", dealItem: null },
      { text: "citronsaft", dealItem: null },
      { text: "salt og peber", dealItem: null },
    ],
    steps: [
      "Forvarm ovn til 200°C.",
      "Bland gulerødsstavene med olie, hvidløg og timian, læg i fad.",
      "Bag gulerødder 15 min, læg derefter laks ved siden af.",
      "Bag yderligere 15 min. Klem citron over ved servering.",
    ],
    tip: "Tilsæt lidt honning til gulerødderne for sødme."
  },
  {
    id: 28, title: "Laks med Spinat og Parmesan", emoji: "🐟", time: "25 min",
    servings_count: 4, category: "Fisk",
    dealItems: [
      { name: "Laks filet 400g", store: "Coop 365" },
      { name: "Spinat frisk 200g", store: "Coop 365" },
      { name: "Parmesan revet 80g", store: "Coop 365" },
    ],
    ingredients: [
      { text: "400g laks filet", dealItem: "Laks filet 400g" },
      { text: "200g frisk spinat", dealItem: "Spinat frisk 200g" },
      { text: "60g parmesan, revet", dealItem: "Parmesan revet 80g" },
      { text: "3 fed hvidløg", dealItem: null },
      { text: "smør", dealItem: null },
      { text: "citronsaft", dealItem: null },
      { text: "salt og peber", dealItem: null },
    ],
    steps: [
      "Steg laks i smør 4 min pr. side, tag fra panden.",
      "Svits hvidløg i samme pande, tilsæt spinat til visnet.",
      "Krydr spinat med citronsaft og salt.",
      "Anret laks på spinat og drys parmesan over.",
    ],
    tip: "Server med kartofler eller ris til."
  },
  {
    id: 29, title: "Laks Bowl med Ris og Gulerødder", emoji: "🥗", time: "30 min",
    servings_count: 4, category: "Fisk",
    dealItems: [
      { name: "Laks filet 400g", store: "Coop 365" },
      { name: "Ris 1kg", store: "Netto" },
      { name: "Gulerødder 1kg", store: "Rema 1000" },
    ],
    ingredients: [
      { text: "400g laks filet", dealItem: "Laks filet 400g" },
      { text: "300g ris", dealItem: "Ris 1kg" },
      { text: "2 gulerødder, i tynde skiver", dealItem: "Gulerødder 1kg" },
      { text: "3 fed hvidløg", dealItem: null },
      { text: "2 spsk soja sauce", dealItem: null },
      { text: "citronsaft", dealItem: null },
      { text: "olie, salt", dealItem: null },
    ],
    steps: [
      "Kog ris.",
      "Steg laks i olie 3-4 min pr. side, bræk i stykker.",
      "Svits hvidløg og gulerødder 4 min.",
      "Anret ris i bowl med laks, gulerødder, soja og citron.",
    ],
    tip: "Tilsæt frisk spinat direkte i bowlen for grønt."
  },
  {
    id: 30, title: "Røræg med Laks og Gulerødder", emoji: "🥚", time: "20 min",
    servings_count: 3, category: "Æg",
    dealItems: [
      { name: "Laks filet 400g", store: "Coop 365" },
      { name: "Æg 10 stk.", store: "Rema 1000" },
      { name: "Gulerødder 1kg", store: "Rema 1000" },
    ],
    ingredients: [
      { text: "200g laks, i små stykker", dealItem: "Laks filet 400g" },
      { text: "6 æg", dealItem: "Æg 10 stk." },
      { text: "1 gulerod, i tern", dealItem: "Gulerødder 1kg" },
      { text: "smør", dealItem: null },
      { text: "2 fed hvidløg", dealItem: null },
      { text: "frisk persille", dealItem: null },
      { text: "salt og peber", dealItem: null },
    ],
    steps: [
      "Steg gulerødstern bløde i smør, tilsæt hvidløg.",
      "Tilsæt laks og steg let 2-3 min.",
      "Pisk æg, hæld over og rør til cremet røræg.",
      "Krydr med salt, peber og frisk persille.",
    ],
    tip: "Tag panden af varmen lidt inden æggene er helt stivnede."
  },
  {
    id: 31, title: "Fiskesuppe med Laks og Kartofler", emoji: "🐠", time: "40 min",
    servings_count: 4, category: "Fisk",
    dealItems: [
      { name: "Laks filet 400g", store: "Coop 365" },
      { name: "Kartofler 2kg", store: "Coop 365" },
      { name: "Fløde 38% 0.5L", store: "Coop 365" },
    ],
    ingredients: [
      { text: "400g laks filet, i tern", dealItem: "Laks filet 400g" },
      { text: "600g kartofler, i tern", dealItem: "Kartofler 2kg" },
      { text: "1,5 dl fløde", dealItem: "Fløde 38% 0.5L" },
      { text: "1 løg", dealItem: null },
      { text: "2 bouillonterninger", dealItem: null },
      { text: "persille", dealItem: null },
      { text: "salt og peber", dealItem: null },
    ],
    steps: [
      "Kog kartofler og løg i 1 liter vand med bouillon 15 min.",
      "Tilsæt fløde og simmer 5 min.",
      "Tilsæt laks og simmer 5-8 min til gennemstegt.",
      "Krydr og server med frisk persille.",
    ],
    tip: "Tilsæt gulerødder for ekstra grønt."
  },
  // ── ÆG ────────────────────────────────────────────────────────────
  {
    id: 32, title: "Spinat Frittata med Parmesan", emoji: "🥚", time: "25 min",
    servings_count: 4, category: "Æg",
    dealItems: [
      { name: "Æg 10 stk.", store: "Rema 1000" },
      { name: "Spinat frisk 200g", store: "Coop 365" },
      { name: "Parmesan revet 80g", store: "Coop 365" },
    ],
    ingredients: [
      { text: "6 æg", dealItem: "Æg 10 stk." },
      { text: "200g frisk spinat", dealItem: "Spinat frisk 200g" },
      { text: "80g parmesan, revet", dealItem: "Parmesan revet 80g" },
      { text: "2 fed hvidløg", dealItem: null },
      { text: "olie", dealItem: null },
      { text: "salt og peber", dealItem: null },
    ],
    steps: [
      "Forvarm ovn til 190°C.",
      "Svits hvidløg i ovnfast pande, tilsæt spinat til visnet.",
      "Pisk æg med parmesan, salt og peber.",
      "Hæld æggeblanding over spinat og bag 15 min til fast.",
    ],
    tip: "Frittataen er god både varm og kold."
  },
  {
    id: 33, title: "Æggekage med Gulerødder og Spinat", emoji: "🍳", time: "20 min",
    servings_count: 3, category: "Æg",
    dealItems: [
      { name: "Æg 10 stk.", store: "Rema 1000" },
      { name: "Gulerødder 1kg", store: "Rema 1000" },
      { name: "Spinat frisk 200g", store: "Coop 365" },
    ],
    ingredients: [
      { text: "6 æg", dealItem: "Æg 10 stk." },
      { text: "2 gulerødder, revet", dealItem: "Gulerødder 1kg" },
      { text: "100g frisk spinat", dealItem: "Spinat frisk 200g" },
      { text: "1 løg, hakket", dealItem: null },
      { text: "smør", dealItem: null },
      { text: "salt og peber", dealItem: null },
    ],
    steps: [
      "Svits løg og revede gulerødder i smør 3 min.",
      "Tilsæt spinat og rør til visnet.",
      "Pisk æg, hæld over grøntsagerne.",
      "Steg tildækket 5-6 min til æggene er stivnede.",
    ],
    tip: "Server med rugbrød som let frokost."
  },
  {
    id: 34, title: "Kartoffelgratin med Fløde og Parmesan", emoji: "🥔", time: "60 min",
    servings_count: 4, category: "Vegetar",
    dealItems: [
      { name: "Kartofler 2kg", store: "Coop 365" },
      { name: "Fløde 38% 0.5L", store: "Coop 365" },
      { name: "Parmesan revet 80g", store: "Coop 365" },
    ],
    ingredients: [
      { text: "900g kartofler, i tynde skiver", dealItem: "Kartofler 2kg" },
      { text: "2 dl fløde", dealItem: "Fløde 38% 0.5L" },
      { text: "80g parmesan, revet", dealItem: "Parmesan revet 80g" },
      { text: "3 fed hvidløg", dealItem: null },
      { text: "smør", dealItem: null },
      { text: "timian", dealItem: null },
      { text: "salt og peber", dealItem: null },
    ],
    steps: [
      "Forvarm ovn til 190°C. Smør ovnfad med smør.",
      "Lag kartoffelskiver med hvidløg, timian, salt og peber.",
      "Hæld fløde over og drys halvdelen af parmesanen.",
      "Dæk med folie og bag 40 min, fjern folie og drys resten af parmesanen.",
      "Bag yderligere 15 min til gylden og gennemstegt.",
    ],
    tip: "Tjek med kniv – kartoflen skal glide igennem uden modstand."
  },
  {
    id: 35, title: "Risotto med Spinat og Parmesan", emoji: "🍚", time: "40 min",
    servings_count: 4, category: "Vegetar",
    dealItems: [
      { name: "Ris 1kg", store: "Netto" },
      { name: "Spinat frisk 200g", store: "Coop 365" },
      { name: "Parmesan revet 80g", store: "Coop 365" },
    ],
    ingredients: [
      { text: "300g ris", dealItem: "Ris 1kg" },
      { text: "150g frisk spinat", dealItem: "Spinat frisk 200g" },
      { text: "80g parmesan, revet", dealItem: "Parmesan revet 80g" },
      { text: "1 løg", dealItem: null },
      { text: "2 bouillonterninger", dealItem: null },
      { text: "2 spsk smør", dealItem: null },
      { text: "salt og peber", dealItem: null },
    ],
    steps: [
      "Varm 1 liter bouillon.",
      "Svits hakket løg i smør, tilsæt ris og rør 1 min.",
      "Tilsæt bouillon lidt ad gangen under omrøring.",
      "Rør spinat i mod slutningen til visnet.",
      "Afslut med parmesan og en klat smør.",
    ],
    tip: "Risotto skal have konsistens som løbende havregrød."
  },
  {
    id: 36, title: "Caprese Salat med Basilikum", emoji: "🍅", time: "10 min",
    servings_count: 4, category: "Vegetar",
    dealItems: [
      { name: "Mozzarella 125g", store: "Netto" },
      { name: "Basilikum", store: "Netto" },
      { name: "Dåsetomater 400g", store: "Netto" },
    ],
    ingredients: [
      { text: "125g mozzarella", dealItem: "Mozzarella 125g" },
      { text: "frisk basilikum", dealItem: "Basilikum" },
      { text: "400g dåsetomater (eller friske)", dealItem: "Dåsetomater 400g" },
      { text: "3 spsk god olie", dealItem: null },
      { text: "salt og peber", dealItem: null },
    ],
    steps: [
      "Dræn evt. dåsetomater godt.",
      "Arranger tomater og skåret mozzarella på tallerken.",
      "Drys basilikum blade over.",
      "Hæld god olie over og krydr med salt og peber.",
    ],
    tip: "Brug friske tomater hvis sæsonen tillader det."
  },
  {
    id: 37, title: "Cremet Tomatsuppe", emoji: "🍲", time: "25 min",
    servings_count: 4, category: "Suppe",
    dealItems: [
      { name: "Dåsetomater 400g", store: "Netto" },
      { name: "Fløde 38% 0.5L", store: "Coop 365" },
    ],
    ingredients: [
      { text: "2 dåser (800g) dåsetomater", dealItem: "Dåsetomater 400g" },
      { text: "1,5 dl fløde", dealItem: "Fløde 38% 0.5L" },
      { text: "1 løg", dealItem: null },
      { text: "3 fed hvidløg", dealItem: null },
      { text: "1 bouillonterning", dealItem: null },
      { text: "1 tsk sukker", dealItem: null },
      { text: "olie, salt og peber", dealItem: null },
    ],
    steps: [
      "Svits løg og hvidløg i olie til bløde.",
      "Tilsæt tomater, bouillon og sukker, simmer 15 min.",
      "Blend suppen glat.",
      "Rør fløde i og varm igennem. Krydr og server.",
    ],
    tip: "Server med en skive godt brød og basilikum på toppen."
  },
  {
    id: 38, title: "Spinat og Mozzarella Omelet", emoji: "🍳", time: "15 min",
    servings_count: 2, category: "Æg",
    dealItems: [
      { name: "Æg 10 stk.", store: "Rema 1000" },
      { name: "Spinat frisk 200g", store: "Coop 365" },
      { name: "Mozzarella 125g", store: "Netto" },
    ],
    ingredients: [
      { text: "4 æg", dealItem: "Æg 10 stk." },
      { text: "100g frisk spinat", dealItem: "Spinat frisk 200g" },
      { text: "60g mozzarella", dealItem: "Mozzarella 125g" },
      { text: "2 fed hvidløg", dealItem: null },
      { text: "smør", dealItem: null },
      { text: "salt og peber", dealItem: null },
    ],
    steps: [
      "Svits hvidløg og spinat i smør til visnet.",
      "Pisk æg med salt og peber, hæld i panden.",
      "Når æggemassen er næsten stivnet, læg spinat og revet mozzarella på den ene halvdel.",
      "Fold omeletten og server straks.",
    ],
    tip: "Lav to omeletter enkeltvis for bedste resultat."
  },
  {
    id: 39, title: "Bagte Kartofler med Parmesan", emoji: "🥔", time: "50 min",
    servings_count: 4, category: "Vegetar",
    dealItems: [
      { name: "Kartofler 2kg", store: "Coop 365" },
      { name: "Parmesan revet 80g", store: "Coop 365" },
    ],
    ingredients: [
      { text: "800g kartofler", dealItem: "Kartofler 2kg" },
      { text: "80g parmesan, revet", dealItem: "Parmesan revet 80g" },
      { text: "4 fed hvidløg", dealItem: null },
      { text: "3 spsk olie", dealItem: null },
      { text: "timian og oregano", dealItem: null },
      { text: "salt og peber", dealItem: null },
    ],
    steps: [
      "Forvarm ovn til 210°C.",
      "Skær kartofler i både, bland med olie, hvidløg og krydderurter.",
      "Bag 30 min, vend halvvejs.",
      "Drys parmesan over og bag 10 min mere til gylden.",
    ],
    tip: "Tilsæt lidt citronsaft ved servering for friskhed."
  },
  {
    id: 40, title: "Fried Rice med Æg og Gulerødder", emoji: "🍳", time: "20 min",
    servings_count: 4, category: "Æg",
    dealItems: [
      { name: "Ris 1kg", store: "Netto" },
      { name: "Æg 10 stk.", store: "Rema 1000" },
      { name: "Gulerødder 1kg", store: "Rema 1000" },
    ],
    ingredients: [
      { text: "300g kogt ris (afkølet)", dealItem: "Ris 1kg" },
      { text: "3 æg", dealItem: "Æg 10 stk." },
      { text: "2 gulerødder, i tern", dealItem: "Gulerødder 1kg" },
      { text: "2 fed hvidløg", dealItem: null },
      { text: "2 spsk soja sauce", dealItem: null },
      { text: "olie", dealItem: null },
      { text: "salt", dealItem: null },
    ],
    steps: [
      "Wok gulerødstern og hvidløg i varm olie 3-4 min.",
      "Skub til siden, scramble æg i midten.",
      "Tilsæt koldt ris og rør alt sammen.",
      "Hæld soja sauce over og wok 2-3 min.",
    ],
    tip: "Koldt ris fra dagen før giver bedst resultat."
  },
  {
    id: 41, title: "Mozzarella Toast med Tomatsauce", emoji: "🍞", time: "20 min",
    servings_count: 4, category: "Vegetar",
    dealItems: [
      { name: "Mozzarella 125g", store: "Netto" },
      { name: "Dåsetomater 400g", store: "Netto" },
      { name: "Basilikum", store: "Netto" },
    ],
    ingredients: [
      { text: "125g mozzarella", dealItem: "Mozzarella 125g" },
      { text: "200g dåsetomater", dealItem: "Dåsetomater 400g" },
      { text: "frisk basilikum", dealItem: "Basilikum" },
      { text: "4 skiver brød", dealItem: null },
      { text: "2 fed hvidløg", dealItem: null },
      { text: "olie, salt og peber", dealItem: null },
    ],
    steps: [
      "Simmer dåsetomater med hvidløg og olie 10 min til tyk sauce.",
      "Rist brød i ovn eller brødrister.",
      "Smør tomatsauce på brødet, riv mozzarella over.",
      "Gratiner kort under ovnens grill til osten bobler.",
      "Drys frisk basilikum og server straks.",
    ],
    tip: "Tilsæt chiliflager for et pift."
  },
  // ── SUPPER ────────────────────────────────────────────────────────
  {
    id: 42, title: "Gulerodssuppe med Fløde", emoji: "🥕", time: "30 min",
    servings_count: 4, category: "Suppe",
    dealItems: [
      { name: "Gulerødder 1kg", store: "Rema 1000" },
      { name: "Fløde 38% 0.5L", store: "Coop 365" },
    ],
    ingredients: [
      { text: "6 gulerødder, i tern", dealItem: "Gulerødder 1kg" },
      { text: "1,5 dl fløde", dealItem: "Fløde 38% 0.5L" },
      { text: "1 løg", dealItem: null },
      { text: "2 fed hvidløg", dealItem: null },
      { text: "1 bouillonterning", dealItem: null },
      { text: "1 tsk spidskommen", dealItem: null },
      { text: "olie, salt og peber", dealItem: null },
    ],
    steps: [
      "Svits løg og hvidløg i olie.",
      "Tilsæt gulerødder, bouillon og spidskommen, kog 20 min.",
      "Blend suppen glat.",
      "Rør fløde i og varm igennem. Krydr.",
    ],
    tip: "Pynt med lidt fløde i et svirp og frisk persille."
  },
  {
    id: 43, title: "Kartoffelsuppe med Fløde", emoji: "🥔", time: "35 min",
    servings_count: 4, category: "Suppe",
    dealItems: [
      { name: "Kartofler 2kg", store: "Coop 365" },
      { name: "Fløde 38% 0.5L", store: "Coop 365" },
    ],
    ingredients: [
      { text: "800g kartofler, i tern", dealItem: "Kartofler 2kg" },
      { text: "1,5 dl fløde", dealItem: "Fløde 38% 0.5L" },
      { text: "1 løg", dealItem: null },
      { text: "3 fed hvidløg", dealItem: null },
      { text: "1 bouillonterning", dealItem: null },
      { text: "timian", dealItem: null },
      { text: "olie, salt og peber", dealItem: null },
    ],
    steps: [
      "Svits løg og hvidløg i olie til bløde.",
      "Tilsæt kartofler, bouillon og timian, kog 20 min.",
      "Blend halvt eller helt glat.",
      "Rør fløde i og smag til med salt og peber.",
    ],
    tip: "Tilsæt sprøde bacon-tern som topping."
  },
  {
    id: 44, title: "Tomatsuppe med Fløde og Basilikum", emoji: "🍅", time: "25 min",
    servings_count: 4, category: "Suppe",
    dealItems: [
      { name: "Dåsetomater 400g", store: "Netto" },
      { name: "Fløde 38% 0.5L", store: "Coop 365" },
      { name: "Basilikum", store: "Netto" },
    ],
    ingredients: [
      { text: "2 dåser (800g) dåsetomater", dealItem: "Dåsetomater 400g" },
      { text: "1,5 dl fløde", dealItem: "Fløde 38% 0.5L" },
      { text: "frisk basilikum", dealItem: "Basilikum" },
      { text: "1 løg", dealItem: null },
      { text: "2 fed hvidløg", dealItem: null },
      { text: "1 tsk sukker", dealItem: null },
      { text: "olie, salt og peber", dealItem: null },
    ],
    steps: [
      "Svits løg og hvidløg i olie til bløde.",
      "Tilsæt tomater og sukker, simmer 15 min.",
      "Blend glat. Rør fløde i og varm igennem.",
      "Krydr og server med frisk basilikum.",
    ],
    tip: "Et skvæt balsamicoeddike tilfører dybde."
  },
  {
    id: 45, title: "Kyllingesuppe med Spinat og Fløde", emoji: "🍵", time: "40 min",
    servings_count: 4, category: "Suppe",
    dealItems: [
      { name: "Kyllingefilet 600g", store: "Netto" },
      { name: "Spinat frisk 200g", store: "Coop 365" },
      { name: "Fløde 38% 0.5L", store: "Coop 365" },
    ],
    ingredients: [
      { text: "600g kyllingefilet", dealItem: "Kyllingefilet 600g" },
      { text: "150g frisk spinat", dealItem: "Spinat frisk 200g" },
      { text: "1,5 dl fløde", dealItem: "Fløde 38% 0.5L" },
      { text: "1 løg", dealItem: null },
      { text: "2 bouillonterninger", dealItem: null },
      { text: "hvidløg, timian", dealItem: null },
      { text: "salt og peber", dealItem: null },
    ],
    steps: [
      "Kog kylling i 1 liter vand med bouillon og løg 20 min.",
      "Tag kylling op og riv i stykker, sæt bouillon på simmer.",
      "Rør fløde og spinat i bouillonen, simmer 3 min.",
      "Tilsæt kyllingestrimmler tilbage, krydr og server.",
    ],
    tip: "Tilsæt lidt citron for friskhed."
  },
  {
    id: 46, title: "Spinatsuppe med Fløde og Parmesan", emoji: "🥬", time: "20 min",
    servings_count: 4, category: "Suppe",
    dealItems: [
      { name: "Spinat frisk 200g", store: "Coop 365" },
      { name: "Fløde 38% 0.5L", store: "Coop 365" },
      { name: "Parmesan revet 80g", store: "Coop 365" },
    ],
    ingredients: [
      { text: "200g frisk spinat", dealItem: "Spinat frisk 200g" },
      { text: "2 dl fløde", dealItem: "Fløde 38% 0.5L" },
      { text: "40g parmesan, revet", dealItem: "Parmesan revet 80g" },
      { text: "1 løg", dealItem: null },
      { text: "2 fed hvidløg", dealItem: null },
      { text: "1 bouillonterning", dealItem: null },
      { text: "olie, salt og peber", dealItem: null },
    ],
    steps: [
      "Svits løg og hvidløg i olie.",
      "Tilsæt spinat og bouillon i 5 dl vand, kog 5 min.",
      "Blend glat. Rør fløde i og varm igennem.",
      "Server med parmesan og sort peber.",
    ],
    tip: "Tilsæt lidt muskatnød for varm, cremet smag."
  },
  // ── DIVERSE ───────────────────────────────────────────────────────
  {
    id: 47, title: "Kødboller i Tomatsauce", emoji: "🍝", time: "40 min",
    servings_count: 4, category: "Oksekød",
    dealItems: [
      { name: "Hakket oksekød 500g", store: "Rema 1000" },
      { name: "Dåsetomater 400g", store: "Netto" },
    ],
    ingredients: [
      { text: "500g hakket oksekød", dealItem: "Hakket oksekød 500g" },
      { text: "400g dåsetomater", dealItem: "Dåsetomater 400g" },
      { text: "1 løg, hakket", dealItem: null },
      { text: "2 fed hvidløg", dealItem: null },
      { text: "1 æg", dealItem: null },
      { text: "1 tsk oregano", dealItem: null },
      { text: "olie, salt og peber", dealItem: null },
    ],
    steps: [
      "Bland oksekød med hakket løg, æg, salt og peber.",
      "Form til kødboller på størrelse med valnødder.",
      "Brun kødbollerne i olie, tag fra panden.",
      "Svits hvidløg, tilsæt tomater og oregano, simmer 10 min.",
      "Tilsæt kødbollerne og simmer 10 min mere.",
    ],
    tip: "Server med spaghetti eller godt brød."
  },
  {
    id: 48, title: "Gulerods-Wok med Ris og Æg", emoji: "🥢", time: "25 min",
    servings_count: 4, category: "Vegetar",
    dealItems: [
      { name: "Gulerødder 1kg", store: "Rema 1000" },
      { name: "Ris 1kg", store: "Netto" },
      { name: "Æg 10 stk.", store: "Rema 1000" },
    ],
    ingredients: [
      { text: "4 gulerødder, i strimler", dealItem: "Gulerødder 1kg" },
      { text: "300g ris", dealItem: "Ris 1kg" },
      { text: "3 æg", dealItem: "Æg 10 stk." },
      { text: "3 fed hvidløg", dealItem: null },
      { text: "2 spsk soja sauce", dealItem: null },
      { text: "1 tsk spidskommen", dealItem: null },
      { text: "olie", dealItem: null },
    ],
    steps: [
      "Kog ris.",
      "Wok gulerødsstrimmler med hvidløg i varm olie 4-5 min.",
      "Skub til siden, scramble æg i midten.",
      "Bland alt og tilsæt soja og spidskommen. Server med ris.",
    ],
    tip: "Tilsæt spinat de sidste 2 min for mere grønt."
  },
  {
    id: 49, title: "Parmesan Risotto med Spinat", emoji: "🍚", time: "40 min",
    servings_count: 4, category: "Vegetar",
    dealItems: [
      { name: "Ris 1kg", store: "Netto" },
      { name: "Parmesan revet 80g", store: "Coop 365" },
      { name: "Spinat frisk 200g", store: "Coop 365" },
    ],
    ingredients: [
      { text: "300g ris", dealItem: "Ris 1kg" },
      { text: "80g parmesan, revet", dealItem: "Parmesan revet 80g" },
      { text: "150g frisk spinat", dealItem: "Spinat frisk 200g" },
      { text: "1 løg", dealItem: null },
      { text: "2 bouillonterninger", dealItem: null },
      { text: "3 spsk smør", dealItem: null },
      { text: "salt og peber", dealItem: null },
    ],
    steps: [
      "Varm 1 liter bouillon i gryde.",
      "Svits hakket løg i smør, tilsæt ris og rør 1 min.",
      "Øs bouillon i lidt ad gangen og rør konstant.",
      "Rør spinat i de sidste 3 min.",
      "Tag fra varmen, rør parmesan og en klat smør i.",
    ],
    tip: "Konsistensen skal være cremet – tilsæt lidt ekstra bouillon om nødvendigt."
  },
  {
    id: 50, title: "Spaghetti Aglio e Olio", emoji: "🧄", time: "15 min",
    servings_count: 4, category: "Pasta",
    dealItems: [
      { name: "Spaghetti 500g", store: "Rema 1000" },
    ],
    ingredients: [
      { text: "400g spaghetti", dealItem: "Spaghetti 500g" },
      { text: "6 fed hvidløg, i tynde skiver", dealItem: null },
      { text: "1 tsk chiliflager", dealItem: null },
      { text: "6 spsk god olie", dealItem: null },
      { text: "frisk persille", dealItem: null },
      { text: "salt", dealItem: null },
    ],
    steps: [
      "Kog spaghetti i rigeligt saltet vand, gem 2 dl pastavand.",
      "Svits hvidløgsskiver og chiliflager i olie ved lav varme til hvidløg er gyldent.",
      "Tilsæt kogt pasta og pastavand, ryst panden til cremet emulsion.",
      "Server straks med hakket persille.",
    ],
    tip: "Den enkleste pasta – men resultatet afhænger 100% af god olie og timing på hvidløget."
  },
];
