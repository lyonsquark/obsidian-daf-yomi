# Obsidian Daf Yomi

The purpose of this [Obsidian](https://obsidian.md) plugin is to prepare a note page for the day's *Daf Yomi* (Hebrew for "page of the day").

[Daf Yomi](https://en.wikipedia.org/wiki/Daf_Yomi), [called](https://www.wsj.com/articles/the-worlds-largest-book-club-1505861966) "The World's Largest Book Club", is the practice of learning a page of the [Talmud](https://en.wikipedia.org/wiki/Talmud) every day on a set schedule. It takes 7.5 years (a "cycle") to read all 2,711 pages. The first cycle started in 1923. We're now in the 14th cycle which began on January 5, 2020. The community of Daf Yomi participants is estimated to be over 350,000 people from religious to non-religious Jews and non-Jews.

Compiled from 200-500 CE, the Talmud is the base of Rabbinic Judaism and Jewish religious law and contains not just the laws, but exhaustive arguments surrounding them. With Daf Yomi, one learns more about these laws, about this "talmudic" way of thinking, and what life was like a long time ago (hint: be happy that toilet paper has much improved!).

There are a lot of resources to help with Daf Yomi including podcasts and commentaries. This plugin prepares a note page in Obsidian for the day's Daf with links to and text from some of those resources (see below). It introduces two commands to the Command Palette: `Daf Yomi: Add Daf Yomi page by date` and `Daf Yomi: Add Daf Yomi page by tractate/daf`.

- By date: Enter the date and the plugin will determine the tractate and page (see Limitations below)
- By tractate/daf: Choose the tractate name from the drop down list and enter the page number (daf). The values for the current date are already filled in. If the tractate you want is not in the drop down list, please open an issue. 

Currently, the plugin will make a note page with the following (you can chose what you want from the plugin settings)...

- Link to the day's PDF of the Koren Talmud Bavli by Steinsaltz from the [Steinsaltz Center](https://www.steinsaltz-center.org/home/doc.aspx?mCatID=68446).
- Download the above PDF and insert it into the Obsidian note
- Link to the Daf page in [Sefaria](https://www.sefaria.org/daf-yomi)
- Link to the Steinsaltz commentary from the Steinsaltz Center
- Link to the [My Jewish Learning](https://www.myjewishlearning.com/category/study/jewish-texts/talmud/) commentary
- Link to the [Daf Yomi Digest](https://www.dafdigest.org)
- Link to the [Hadran](https://hadran.org.il) commentary
- Link to the [Living Greengrass](https://livinggreengrass.home.blog) blog

Note that the plugin does not check if the links actually work. You may need to check back later in the day if a commentary or post is not yet available. 

If you use any of the resources here, I'm sure the offering organization (e.g. Steinsaltz Center, Sefaria, My Jewish Learning) would appreciate a donation!

The plugin also makes a "summary" page for the tractate with links to each Daf page (see Settings below).

If you would like some other resource added, please open an issue or, even better, a pull request with the necessary changes to the code.

## Settings

**IMPORTANT:** The settings have changed in important ways at version 1.5. Please re-read this section.

You can configure this plugin with several settings:

- `Daf Yomi directory template` - This must contain the directory in your vault where Daf Yomi pages are to be stored. You can also specify `{tractate}` and `{perek}` for the tractate name and chapter (perek) number respectively. `{tractate}` is mandatory for uniqueness, and if you don't include it in the setting, then the template will not be filled in and you'll get `{tractate}` tacked on to the end silently. The plugin will create this directory as needed. Here are some examples:
  - If you want the directory to be like */Judaism/Daf Yomi/Sukkah* then enter `/Judaism/Daf Yomi/{tractate}` or `/Judaism/Daf Yomi` (it will add the tractate automatically)
  - If you want the directory to be like */Judaism/Daf Yomi/Tractate Sukkah* then enter `/Judaism/Daf Yomi/Tractate {tractate}`
  - If you want the directory to be like */Judaism/Daf Yomi/Sukkah/Perek 3* (organize by Chapter) then enter `/Judaism/Daf Yomi/{tractate}/Perek {perek}`
  - If you do the following: `/Judaism/Daf Yomi/{perek}` you'll get directories like */Judaism/Daf Yomi/{perek}/Sukkah* (`{perek}` will not be filled in). That's probably not what you want. Be sure to include `{tractate}` in the template to avoid this problem.

- `Page file name template` - This is the template to use for the file name of the note for a Daf. You can specify `{tracate}`, `{perek}`, and `{page}` for the tractate name, perek (chapter) number, and page number respectively. `{page}` is mandatory for uniqueness, and if you don't include it in this setting, then the template will be ignored and you'll get `Daf Yomi {tractate} {page}`. Do **NOT** put `.md` in the setting. Here are some examples:
  - If you want pages like `Sukkah 5.md` then enter `{tractate} {page}`
  - If you want pages like `Daf Yomi Sukkah 5.md` then enter anything without `{page}`.
  - If you want pages like `Sukkah_1_5.md` (1 is the chapter number) then enter `{tractate}_{perek}_{page}`

- `Page title template` - This is a template to use for the H1 title heading of the page. It can be anything you want. You can specify `{tracate}`, `{perek}`, and `{page}` for the tractate name, perek (chapter) number, and page number respectively. Do **NOT** put `#` in the setting (the plugin will add that for you).
  - If you want something like `# Sukkah, Perek 1, Daf 5` then enter `{tractate}, Perek {perek}, Daf {page}`
  - If you want something like `# The awesome page 5 of Sukkah` then enter `The awesome page {page} of {tractate}`

- `Make sections` (default not set) - If this is not set, then the resources will be listed in the note page, one line each. If this is set, then each resource will be in its own H2 subsection.

- `Resources` - The subsequent settings are for choosing which resource links to add.

As mentioned above, the plugin will also make a page like `/Judiasm/Daf/Sukkah/Tractate Sukkah` (perek is added if necessary) with links to each Daf. You can add more info to this page, but keep in mind that the Daf links will be added to the end.

## Limitations
Some resources are only available for today's Daf and a few weeks in the past. **The plugin doesn't check if a link is actually available**, so it's best to pick a date that is the current day or up to a couple of weeks in the past. Future dates likely won't work.

I also expect things to go wrong on the first day of a new Tractate, as it's not clear how some sites will name their links until that day comes. I will try to make fixes and a new release on such days.

The resources here are what I use. Again, open an issue or a pull request if you would like something to be added. If you want me to code it up, it may take me a few days to get to it.

## The code
This is my first Obsidian plugin. I'm happy for people to look at my code and tell me how to do things better. I mostly followed [obsidian-pluck](https://github.com/kevboh/obsidian-pluck) as a nice example. The code to download and write PDFs was somewhat challenging to figure out. Everything happens in the `main.ts` file.

## Let me know how it goes!
If you find any problems, please open an issue. And if you find this plugin to be useful, please open an issue too and let me know! I would love to know if this is interesting to more than just me :-)
