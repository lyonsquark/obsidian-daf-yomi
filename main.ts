import { App, ButtonComponent, DropdownComponent, Modal, Notice, Plugin, PluginSettingTab, Setting, TextComponent } from 'obsidian';
import { Moment } from "moment";

// Not in the API - see https://discord.com/channels/686053708261228577/840286264964022302/880329814731546634
declare module "obsidian" {
    interface Vault {
        getConfig(option:"attachmentFolderPath"): string
    }
}

interface DYSettings {
	dyDir: string;      // Daf Yomi directory template in vault
	pageName: string;   // Page file name template
	pageTitle: string;  // Page title template
	sections: boolean;   // Make sections?
	litLinks: boolean;   // Make Literature Note links
	sefaria: boolean;   // Link to Sefaria?
	stpdflink: boolean; // Link to Steinsaltz PDF?
	stpdf: boolean;     // Download Steinsaltz PDF?
	stc: boolean;       // Link to Steinsaltz commentary?
	myjl: boolean;      // Link to My Jewish Learning commentary?
	dydg: boolean;      // Link to Daf Yomi Digest?
	hd: boolean;        // Link to Hadran?
	lgg: boolean;       // Link to Living Greengrass
}

const DEFAULT_SETTINGS: DYSettings = {
	dyDir: "/Home/Judaism/Daf Yomi/{tractate}/{page}",  // Directory template for Daf Yomi notes
	pageName: "Daf Yomi {tractate} {page}",  // Page file name template
	pageTitle: "Daf Yomi {tractate} {page}",  // Page title template
	sections: false,                  // Make sections?
	litLinks: false,                  // Make literature note links
	sefaria: false,                   // Link to Sefaria?
	stpdflink: true,                  // Link to Steinsaltz PDF?
	stpdf: false,                     // Embed Steinsaltz PDF?
	stc: true,                        // Link to Steinsaltz commentary?
	myjl: true,                       // Link to My Jewish Learning commentary?
	dydg: false,			     	  // Link to Daf Yomi Digest?
	hd:false,                         // Link to Hadran?
	lgg:false                         // Link to Living Greengrass
}

// The tractate dates and names
interface Tractate {
	startDate: Moment;  // The start date for the tractate
	disp: string;     // The display name of the tractate
	linkName: string;  /// The name of the tractate for a link (no spaces)
	prakim: number[];  // The chapter (perek) breaks
	stpdf: string;    // URL fragment for Steinsaltz PDF
	stc: string;      // URL fragment for Steinsaltz commentary
	myjl: string;     // URL fragment for My Jewish Learning commentary
	sf: string;       // URL fragment for Sefaria
	dydg: string;     // URL fragment for Daf Yomi Digest
	hd: string;       // URL fragment for Hadran
	lgg: string;      // URL fragment for Living Greengrass
};

interface Daf {
	tractate: Tractate;
	page: number;
};

export default class DafYomi extends Plugin {
	settings: DYSettings;
	tractates: Record<string, Tractate>;

	async onload() {
		await this.loadSettings();

		// The command to add a Daf Yomi page by date
		this.addCommand({
			id: 'dy-add-page-by-date',
			name: 'Add Daf Yomi page by date',
			callback: () => {
				new DYModalByDate(this.app, this).open();
			}
		});

		// The command to add a Daf Yomi page by daf
		this.addCommand({
			id: 'dy-add-page-by-daf',
			name: 'Add Daf Yomi page by tractate/daf',
			callback: () => {
				new DYModalByDaf(this.app, this).open();
			}
		});

		// The settings tab
		this.addSettingTab(new DYSettingTab(this.app, this));

		// Make the tractates table
		// For the Prakim (chapters) look at Sefaria, If the a side is in the new chapter, then that daf is in the new chapter. Otherwise,
		// that daf is in the old chapter and the next daf is in the new chapter.

		this.tractates = {
			"2023-01-25" : {startDate:this.makeDate("2023-01-25"), disp:"Nazir", linkName:"Nazir", prakim:[9, 16, 21, 31, 34, 47, 57, 61], stpdf:"Nazir/Nazir_", stc:"nazir", myjl:"nazir-", sf:"Nazir.", dydg:"Nazir%20", hd:"nazir-", lgg:'nazir-'},
			"2022-10-27" : {startDate:this.makeDate("2022-10-27"), disp:"Nedarim", linkName:"Nedarim", prakim:[14, 21, 33, 46, 49, 54, 60, 67, 79], stpdf:"Nedarim/Nedarim_", stc:"nedarim", myjl:"nedarim-", sf:"Nedarim.", dydg:"Nedarim%20", hd:"nedarim-", lgg:'nedarim-'},
			"2022-07-08" : {startDate:this.makeDate("2022-07-08"), disp:"Ketubot", linkName:"Ketubot", prakim:[16, 29, 42, 55, 66, 70, 78, 83, 90, 96, 102, 105], stpdf:"Ketubot/Ketubot_", stc:"ketubot", myjl:"ketubot-", sf:"Ketubot.", dydg:"Kesuvos%20", hd:"ketubot-", lgg:'ketubot-'},
			"2022-03-09" : {startDate:this.makeDate("2022-03-09"), disp:"Yevamot", linkName:"Yevamot", prakim:[17, 26, 36, 50, 54, 66, 70, 84, 88, 97, 101, 107, 113, 115, 119], stpdf:"Yevamot/Yevamot_", stc:"yevamot", myjl:"yevamot-", sf:"Yevamot.", dydg:"Yevamos%20", hd:"yevamot-", lgg:'yevamot-'},
			"2022-02-11" : {startDate:this.makeDate("2022-02-11"), disp:"Chagigah", linkName:"Chagigah", prakim:[12, 21], stpdf:"Hagiga/Hagiga_", stc:"hagiga", myjl:'chagigah-', sf:'Chagigah.', dydg:'Chagiga%20', hd:'chagigah-', lgg:'chagigah-'},
			"2022-01-14" : {startDate:this.makeDate("2022-01-14"), disp:"Moed Katan", linkName:"MoedKatan", prakim:[12, 14], stpdf:"Moed/Moed_", stc:'moed', myjl:'moed-katan-', sf:'Moed_Katan.', dydg:'MoedKatan%20', hd:'moed-katan-', lgg:'moed-katan-'},
			"2021-12-14" : {startDate:this.makeDate("2021-12-14"), disp:"Megillah", linkName:"Megillah", prakim:[17, 21, 26], stpdf:"megilla/Megilla_", stc:'megilla', myjl:'megillah-', sf:'Megillah.', dydg:'Megilla%20', hd:'megillah-', lgg:'megillah-'},
		};
	}

	// Add a Daf Yomi page by date
	async addPageByDate(dateS: string) {
		let dafDate = this.makeDate(dateS);
		let daf = this.findDafByDate(dafDate);

		if (!daf) {
			new Notice("Date does not match a Daf", 5000);
			return;
		}

		this.addPage(daf);
	}

	// Add the page
	async addPage(daf: any) {
		// Make the URLs

		// Steinsaltz PDF is doing leading zero for page numbers starting at Ta'anis
		let stpdf_leading = ["Ta'anis"];
		let stpdf_page = `${daf.page}`;
		if (stpdf_leading.includes(daf.tractate.disp)) {
			stpdf_page = `${daf.page.toString().padStart(2, "0")}`
		}

		const urls = {
			steinsaltz_pdf:  `https://www.steinsaltz-center.org/vault/DafYomi/${daf.tractate.stpdf}${stpdf_page}.pdf`,
			steinsaltz_c:    `https://steinsaltz.org/daf/${daf.tractate.stc}${daf.page}`,
			myjl:            `https://www.myjewishlearning.com/article/${daf.tractate.myjl}${daf.page}`,
			sf:              `https://www.sefaria.org/${daf.tractate.sf}${daf.page}`,
			dydg:            `https://www.dafdigest.org/masechtos/${daf.tractate.dydg}${daf.page.toString().padStart(3, "0")}.pdf`,
			hd:              `https://hadran.org.il/daf/${daf.tractate.hd}${daf.page}`,
			lgg:             `https://livinggreengrass.home.blog/${this.dateForDafForLGG(daf.tractate, daf.page)}/${daf.tractate.lgg}${daf.page}/`
		};

		// Determine directory and page names
		const dirTemplate = this.settings.dyDir;
		const perek = this.findPerek(daf.page, daf.tractate.prakim)

		// Deal with the directory template - the default
		var directoryName = `${dirTemplate}/${daf.tractate.disp}`;

		// Does the template have tractate?
		if (dirTemplate.search(/{tractate}/i) >= 0) {
			directoryName = this.fillInTemplate(dirTemplate, daf, perek);
		}

		// Deal with the page name
		var pageName = `Daf Yomi ${daf.tractate.disp} ${daf.page}`;
		if (this.settings.pageName.search(/{page}/i) >= 0) {
			pageName = this.fillInTemplate(this.settings.pageName, daf, perek);
		}

		const pageFile = `${directoryName}/${pageName}.md`

		// Deal with page title
		var pageTitle = this.fillInTemplate(this.settings.pageTitle, daf, perek);

		// Don't overwrite an old file
		if (await this.app.vault.adapter.exists(pageFile)) {
			new Notice(`Note ${pageName} already exists`, 5000);
			return;
		};

		// Make directory if necessary
		if ( ! await this.app.vault.adapter.exists(directoryName) ) {
			await this.app.vault.adapter.mkdir(directoryName);
			new Notice(`Created directory ${directoryName}`);
		};

		// Make the page
		let t = `# ${pageTitle}\n\n`  // H1 title

		// Do we want to download the Steinsaltz PDF page?
		if (this.settings.sections && (this.settings.stpdf || this.settings.stpdflink)) {
			t += "## Koren Talmud Bavli\n";
		}

		if (this.settings.stpdf) {
			let url = urls.steinsaltz_pdf;
			let r = new Request(url);
			fetch(r).then( (r) => { return r.blob(); }).then(
				     (b) => { this.writeSteinsaltzPDF(b, directoryName, daf.tractate.disp, daf.page); });

			t += `![[${daf.tractate.disp}_${daf.page}.pdf]]\n`;
		}

		// Do we want a link to the Steinsaltz PDF (not downloaded)?
		if (this.settings.stpdflink) t += `[Steinsaltz PDF](${urls.steinsaltz_pdf})\n`;

		if (this.settings.sections && (this.settings.stpdf || this.settings.stpdflink)) {
			t += "\n";
		}

		// Do we want the Sefaria link?
		if (this.settings.sefaria) {
			if (this.settings.sections) t += "## Sefaria\n";
			t += `[Sefaria](${urls.sf})\n`;
			if (this.settings.sections) t += "\n";
		}

		// Do we want the Steinsaltz commentary?
		if (this.settings.stc) {
			if (this.settings.sections) t += "## Steinsaltz Commentary\n";
			t += `[Steinsaltz Commentary](${urls.steinsaltz_c})\n`;
			if (this.settings.sections) t += "\n";

		}

		// Do we want the My Jewish Learning commentary?
		if (this.settings.myjl) {
			if (this.settings.sections) t += "## My Jewish Learning Commentary\n";
			t += `[My Jewish Learning Commentary](${urls.myjl})\n`;
			if (this.settings.sections && this.settings.litLinks) {
				t += `See [[Notes/Literature/@MJL-${daf.tractate.linkName}${daf.page}]]\n`
			}
			if (this.settings.sections) t += "\n";
		}

		// Do we want Daf Yomi Digest?
		if (this.settings.dydg) {
			if (this.settings.sections) t += "## Daf Yomi Digest\n";
			t += `[Daf Yomi Digest](${urls.dydg})\n`;
			if (this.settings.sections) t += "\n";
		}

		// Do we want Hadran?
		if (this.settings.hd) {
			if (this.settings.sections) t += "## Hadran Commentary\n";
			t += `[Hadran Commentary](${urls.hd})\n`;
			if (this.settings.sections) t += "\n";
		}

		// Do we want Living Greengrass?
		if (this.settings.lgg) {
			if (this.settings.sections) t += "## Living Greengrass\n";
			t += `[Living Greengrass](${urls.lgg})\n`;
			if (this.settings.sections) t += "\n";
		}

		if ( ! this.settings.sections ) t += '\n## Notes\n\n';

		// Write the page
		let dafPage = await this.app.vault.create(pageFile, t);
		new Notice(`Created note ${pageName}`);

		// Add to the Tractate page
		var tractatePage = `Tractate ${daf.tractate.disp}`;
		if (this.settings.dyDir.search(/{perek}/i) >= 0) {
			tractatePage += ` Perek ${perek}`;
		}
		const tractateFile = `${directoryName}/${tractatePage}.md`;
		const toAdd = `[[${pageName}|${daf.page}]]`;

		if ( ! await this.app.vault.adapter.exists(tractateFile) ) {
			const t = `# ${tractatePage}\n\n${toAdd}`;
			await this.app.vault.create(tractateFile, t);
			new Notice(`Created note ${tractatePage}`);
		}
		else {
			let current = await this.app.vault.adapter.read(tractateFile);
			await this.app.vault.adapter.write(tractateFile, current + " " + toAdd);
			new Notice(`Added to note ${tractatePage}`);
		}

		// Open the new page
		let leaf = this.app.workspace.getUnpinnedLeaf();
		await leaf.openFile(dafPage, { active: true });
	}

	onunload() {
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	// Utility functions
	// note the format:  fcn_name(param: type): return_type {}

	// Take a string and turn it into a Moment date with UTC (to avoid time changes)
	makeDate(dateS: string): Moment {
		let theDate = window.moment.utc(`${dateS}T00:00:00.000Z`);  // Kept having nagging date problems - added .utc to fix
		// console.log(`makeDate: ${dateS} ${theDate}`)
		return theDate;
	}

	// Find the Perek (Chapter)
	findPerek(page: number, prakim: number[]): number {
		let perek: number = 1;
		for (var i = 0; i < prakim.length; ++i) {
			if (page < prakim[i]) break;
		}
		perek = i + 1;
		return perek;
	}

	// Find the date for a particular daf
	dateForDafForLGG(daf: Tractate, inPage: number): string {
		// Note that moment.js mutates the original object, use clone(). See https://github.com/moment/moment/issues/955
		let dafDate = daf.startDate.clone().add(inPage-2, 'days');
		return dafDate.format('YYYY/MM/DD');
	}


	// Find the daf for this date
	findDafByDate(dafDate: Moment): Daf | undefined {
		let startDate: Moment | undefined = undefined;
		let tractate:  Tractate | undefined = undefined;
		for (const k in this.tractates ) {
			startDate = this.makeDate(k);
			if ( dafDate >= startDate ) {
				tractate = this.tractates[k];
				break;
			}
		}

		// No tractate?
		if (! tractate ) {
			return undefined;
		}

		// Determine the page number
		let page: number = dafDate.diff(startDate, 'days') + 2;

		return {tractate: tractate, page: page};
	}

	// Find daf by name
	findDafByName(inTractate: string, inPage: number): Daf | undefined {
		let tractate: Tractate | undefined = undefined;
		for (const k in this.tractates) {
			if (inTractate == this.tractates[k].disp) {
				tractate = this.tractates[k];
				break;
			}
		}

		if (!tractate) {
			return undefined;
		}

		return { tractate: tractate, page: inPage };
	}

	fillInTemplate(template: string, daf: Daf, perek: number) : string {
		let name = template.replace(/{tractate}/gi, daf.tractate.disp);
		name = name.replace(/{perek}/gi, `${perek}`);
		name = name.replace(/{page}/gi, `${daf.page}`);
		return name;
	}

	// Write the PDF file we downloaded
	async writeSteinsaltzPDF(body: Blob, directoryName: string, tractate: string, page: number)  {
		let attachDir:string = this.app.vault.getConfig("attachmentFolderPath"); // Get attachment directory from Obsidian
		let pdfDir:string = directoryName

		if (attachDir == "/") {  // Top of the vault
			pdfDir = ""     // Will get leading / from pathName (see below)
		}
		else if (attachDir == "./") {  // Current directory
			pdfDir = directoryName
		}
		else if (attachDir.substring(0, 2) == "./" && attachDir.length > 2) { // Subdirectory of current
			pdfDir = directoryName + "/" + attachDir.substring(2)

			// Make directory?
			if ( ! await this.app.vault.adapter.exists(pdfDir) ) {
				await this.app.vault.adapter.mkdir(pdfDir);
				new Notice(`Created attachments directory ${pdfDir}`);
			};
		}
		else if (attachDir.substring(0, 1) != "/") {   // Absolute name
			pdfDir = "/" + attachDir
		};

		let pathName = `${pdfDir}/${tractate}_${page}.pdf`;
		this.app.vault.createBinary(pathName, await body.arrayBuffer() );
	}
}

// The Modal to ask for the date
class DYModalByDate extends Modal {
	plugin: DafYomi;

	constructor(app: App, plugin: DafYomi) {
		super(app);
		this.plugin = plugin;
	}

	onOpen() {
		const {contentEl} = this;
		const dateField = new TextComponent(contentEl).setValue(window.moment().format("YYYY-MM-DD"));
		dateField.inputEl.id = "dy-date-input";

		const doAddPage = () => {
			const dateS = dateField.getValue();
			this.plugin.addPageByDate(dateS);
			this.close();
		};

		const addPageButton = new ButtonComponent(contentEl)
			.setButtonText("Add page")
			.onClick(doAddPage);
		addPageButton.buttonEl.id = 'dy-add-page-button';
		dateField.inputEl.focus();
		dateField.inputEl.addEventListener("keypress", function (keypressed) {
			if ( keypressed.key === "Enter") {
				doAddPage();
			}
		});
	}

	onClose() {
		let {contentEl} = this;
		contentEl.empty();
	}
}

// The Modal to ask for the tractate/daf
class DYModalByDaf extends Modal {
	plugin: DafYomi;

	constructor(app: App, plugin: DafYomi) {
		super(app);
		this.plugin = plugin;
	}

	onOpen() {
		const { contentEl } = this;

		// What is the daf for today?
		let todayS: string = window.moment().format("YYYY-MM-DD")  // Drop the time
		let today: Moment = this.plugin.makeDate(todayS)
		let daf = this.plugin.findDafByDate(today)

		// Make a dropdown list
		let tractateField = new DropdownComponent(contentEl);
		for (const k in this.plugin.tractates ) {
			const tractateDisp = this.plugin.tractates[k].disp;
			tractateField.addOption( tractateDisp, tractateDisp );
		}
		tractateField.setValue(`${daf.tractate.disp}`)

		const pageField = new TextComponent(contentEl).setValue(`${daf.page}`);
		tractateField.selectEl.id = "dy-tractate-input";
		pageField.inputEl.id = "dy-page-input";

		const doAddPage = () => {
			const inTractate = tractateField.getValue();
			const inPage = pageField.getValue();

			let theDaf = this.plugin.findDafByName(inTractate, parseInt(inPage));

			if (!theDaf) {
				new Notice("Tractate is unknown", 5000);
				return;
			}

			this.plugin.addPage(theDaf);
			this.close();
		};

		const addPageButton = new ButtonComponent(contentEl)
			.setButtonText("Add page")
			.onClick(doAddPage);
		addPageButton.buttonEl.id = 'dy-add-page-button';
		pageField.inputEl.focus();
		pageField.inputEl.addEventListener("keypress", function (keypressed) {
			if ( keypressed.key === "Enter") {
				doAddPage();
			}
		});
	}

	onClose() {
		let {contentEl} = this;
		contentEl.empty();
	}
}

// The settings pane
class DYSettingTab extends PluginSettingTab {
	plugin: DafYomi;

	constructor(app: App, plugin: DafYomi) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		let {containerEl} = this;
		containerEl.empty();
		containerEl.createEl('p', {text: 'Daf Yomi settings'});

		new Setting(containerEl)
			.setName('Daf Yomi directory template')
			.setDesc('Directory in your Vault for Daf Yomi notes in the form of a template. Use {tractate} and {perek} for the tractate name and chapter (perek) number respectively. You must use {tractate} for uniqueness. {perek} is optional.')
			.addText(text => text
				.setPlaceholder('Daf Yomi directory template')
				.setValue(this.plugin.settings.dyDir)
				.onChange(async (value) => {
					if ( value.search(/{page}/i) >= 0) {
						new Notice("You must NOT have {page} in the directory template!", 5000)
						return;
					}
					this.plugin.settings.dyDir = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
		.setName('Page file name template')
		.setDesc('Template to use for the page file name (do NOT end in .md). Use {tractate}, {perek}, {page} for the tractate name, chapter (perek) number, and page number respectively. You must use {page} for uniqueness. {tractate} and {perek} are optional.')
		.addText(text => text
			.setPlaceholder('Daf Yomi page file name template')
			.setValue(this.plugin.settings.pageName)
			.onChange(async (value) => {
				this.plugin.settings.pageName = value;
				await this.plugin.saveSettings();
			}));

		new Setting(containerEl)
		.setName('Page title template')
		.setDesc('Template to use for the H1 title header of the page. Use {tractate}, {perek}, {page} for the tractate name, chapter (perek) number, and page number respectively. You likely should at least use {page}.')
		.addText(text => text
			.setPlaceholder('Daf Yomi directory template')
			.setValue(this.plugin.settings.pageTitle)
			.onChange(async (value) => {
				this.plugin.settings.pageTitle = value;
				await this.plugin.saveSettings();
			}));

		new Setting(containerEl)
		.setName("Make sections")
		.setDesc("Put each link in its own section")
		.addToggle( t => { t
			.setValue(this.plugin.settings.sections)
			.onChange(async (v) => {
				this.plugin.settings.sections = v;
				this.display();
				await this.plugin.saveSettings();
			});
		});

		new Setting(containerEl)
		.setName("Make Literature note links")
		.setDesc("Add a link to a literature note")
		.addToggle( t => { t
			.setValue(this.plugin.settings.litLinks)
			.onChange(async (v) => {
				this.plugin.settings.litLinks = v;
				this.display();
				await this.plugin.saveSettings();
			});
		});


		new Setting(containerEl)
			.setName("Link to Steinsaltz PDF")
			.setDesc("Add link to Steinsaltz PDF")
			.addToggle( t => { t
				.setValue(this.plugin.settings.stpdflink)
				.onChange(async (v) => {
					this.plugin.settings.stpdflink = v;
					this.display();
					await this.plugin.saveSettings();
				});
			});

		new Setting(containerEl)
		.setName("Download Steinsaltz PDF")
		.setDesc("Add Steinsaltz PDF")
		.addToggle( t => { t
			.setValue(this.plugin.settings.stpdf)
			.onChange(async (v) => {
				this.plugin.settings.stpdf = v;
				this.display();
				await this.plugin.saveSettings();
			});
		});

		new Setting(containerEl)
		.setName("Link to Sefaria")
		.setDesc("Add link to Sefaria")
		.addToggle( t => { t
			.setValue(this.plugin.settings.sefaria)
			.onChange(async (v) => {
				this.plugin.settings.sefaria = v;
				this.display();
				await this.plugin.saveSettings();
			});
		});

		new Setting(containerEl)
		.setName("Link to Steinsaltz commentary")
		.setDesc("Add link to Steinsaltz commentary")
		.addToggle( t => { t
			.setValue(this.plugin.settings.stc)
			.onChange(async (v) => {
				this.plugin.settings.stc = v;
				this.display();
				await this.plugin.saveSettings();
			});
		});

		new Setting(containerEl)
		.setName("Link to My Jewish Learning commentary")
		.setDesc("Add link to My Jewish Learning commentary")
		.addToggle( t => { t
			.setValue(this.plugin.settings.myjl)
			.onChange(async (v) => {
				this.plugin.settings.myjl = v;
				this.display();
				await this.plugin.saveSettings();
			});
		});

		new Setting(containerEl)
		.setName("Link to Daf Yomi Digest")
		.setDesc("Add link to Daf Yomi Digest (Chicago Center for Torah & Chesed)")
		.addToggle( t => { t
			.setValue(this.plugin.settings.dydg)
			.onChange(async (v) => {
				this.plugin.settings.dydg = v;
				this.display();
				await this.plugin.saveSettings();
			});
		});

		new Setting(containerEl)
		.setName("Link to Hadran commentary")
		.setDesc("Add link to Hadran commentary")
		.addToggle( t => { t
			.setValue(this.plugin.settings.hd)
			.onChange(async (v) => {
				this.plugin.settings.hd = v;
				this.display();
				await this.plugin.saveSettings();
			});
		});

		new Setting(containerEl)
		.setName("Link to Living Greengrass blog")
		.setDesc("Add link to Living Greengrass blog")
		.addToggle( t => { t
			.setValue(this.plugin.settings.lgg)
			.onChange(async (v) => {
				this.plugin.settings.lgg = v;
				this.display();
				await this.plugin.saveSettings();
			});
		});
	}
}