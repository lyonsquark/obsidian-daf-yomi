# Obsidian Daf Yomi

The purpose of this [Obsidian](https://obsidian.md) plugin is to prepare a note page for the day's *Daf Yomi* (Hebrew for "page of the day").

[Daf Yomi](https://en.wikipedia.org/wiki/Daf_Yomi), [called](https://www.wsj.com/articles/the-worlds-largest-book-club-1505861966) "The World's Largest Book Club", is the practice of learning a page of the [Talmud](https://en.wikipedia.org/wiki/Talmud) every day on a set schedule. It takes 7.5 years (a "cycle") to read all 2,711 pages. The first cycle started in 1923. We're now in the 14th cycle which began on January 5, 2020. The community of Daf Yomi participants is estimated to be over 350,000 people from religious to non-religious Jews and non-Jews.

Compiled from 200-500 CE, the Talmud is the base of Rabbinic Judaism and Jewish religious law and contains not just the laws, but exhaustive arguments surrounding them. With Daf Yomi, one learns more about these laws, about this "talmudic" way of thinking, and what life was like a long time ago (hint: be happy that toilet paper has much improved!).

There are a lot of resources to help with Daf Yomi including podcasts and commentaries. This plugin prepares a note page in Obsidian for the day's Daf with links to and text from some of those resources (see below). It introduces two commands to the Command Palette: `Daf Yomi: Add Daf Yomi page by date` and `Daf Yomi: Add Daf Yomi page by tractate/daf`.

- By date: Enter the date and the plugin will determine the tractate and page (see Limitations below)
- By tractate/daf: Enter the tractate name and the page number (daf). The values for the current date are already filled in. It's best to stick with the filled-in tractate as guessing the spelling of the name is difficult.

Currently, the plugin will make a note page with the following (you can chose what you want from the plugin settings)...

- Link to the day's PDF of the Koren Talmud Bavli by Steinsaltz from the [Steinsaltz Center](https://www.steinsaltz-center.org/home/doc.aspx?mCatID=68446).
- Download the above PDF and insert it into the Obsidian note
- Link to the Daf page in [Sefaria](https://www.sefaria.org/daf-yomi)
- Link to the Steinsaltz commentary from the Steinsaltz Center
- Link to the [My Jewish Learning](https://www.myjewishlearning.com/category/study/jewish-texts/talmud/) commentary
- Link to the [Daf Yomi Digest](https://www.dafdigest.org)
- Link to the [Hadran](https://hadran.org.il) commentary

If you use any of the resources here, I'm sure the offering organization (e.g. Steinsaltz Center, Sefaria, My Jewish Learning) would appreciate a donation!

The plugin also makes a "summary" page for the tractate with links to each Daf page (see Settings below).

If you would like some other resource added, please open an issue or, even better, a pull request with the necessary changes to the code.

## Settings

Along with choosing which resources you want to include in your note, you also need to tell the plugin the directory of the Daf Yomi pages (and this directory must exist). The plugin will separate pages by tractate (e.g., if you specify `/Judaism/Daf` as your directory, then the file for *Sukkah 18* will be `/Judaism/Daf/Sukkah/Daf Yomi Sukkah 18.md`). The plugin will create the tractate directory as necessary.

As mentioned above, the plugin will also make a `/Judiasm/Daf/Sukkah/Tractate Sukkah` page with links to each Daf. You can add more info to this page, but keep in mind that the Daf links will be added to the end.

## Limitations
Some resources are only available for today's Daf and a few weeks in the past. The plugin doesn't check if a link is actually available, so it's best to pick a date that is the current day or up to a couple of weeks in the past. Future dates likely won't work.

I also expect things to go wrong on the first day of a new Tractate, as it's not clear how some sites will name their links until that day comes. I will try to make fixes and a new release on such days.

The resources here are what I use. Again, open an issue or a pull request if you would like something to be added. If you want me to code it up, it may take me a few days to get to it.

## The code
This is my first Obsidian plugin. I'm happy for people to look at my code and tell me how to do things better. I mostly followed [obsidian-pluck](https://github.com/kevboh/obsidian-pluck) as a nice example. The code to download and write PDFs was somewhat challenging to figure out. Everything happens in the `main.ts` file.

## Let me know how it goes!
If you find any problems, please open an issue. And if you find this plugin to be useful, please open an issue too and let me know! I would love to know if this is interesting to more than just me :-)
