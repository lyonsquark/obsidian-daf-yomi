import { App, ButtonComponent, Modal, Notice, Plugin, PluginSettingTab, Setting, TextComponent } from 'obsidian';
import { Moment } from "moment";

interface DYSettings {
	dyDir: string;      // Daf Yomi directory in Vault
	attachDir: string;  // Attachments directory
	sefaria: boolean;   // Link to Sefaria?
	stpdflink: boolean; // Link to Steinsaltz PDF?
	stpdf: boolean;     // Download Steinsaltz PDF?
	stc: boolean;       // Link to Steinsaltz commentary?
	myjl: boolean;      // Link to My Jewish Learning commentary?
}

const DEFAULT_SETTINGS: DYSettings = {
	dyDir: "/Home/Judiasm/Daf Yomi",
	attachDir: "zzattachments",
	sefaria: false,
	stpdflink: true,
	stpdf: false,
	stc: true,
	myjl: true
}

// The tractate dates and names
interface Tractate {
	disp: string;
	stpdf: string;
	stc: string;
	myjl: string;
	sf: string;
};

interface Daf {
	tractate: Tractate;
	page: number;
};

export default class DafYomi extends Plugin {
	settings: DYSettings;
	tractates: Record<string, Tractate>;

	async onload() {
		console.log('loading plugin');

		await this.loadSettings();

		// The command to add a Daf Yomi page
		this.addCommand({
			id: 'dy-add-page',
			name: 'Add Daf Yomi page',
			callback: () => {
				new DYModal(this.app, this).open();
			}
		});

		// The settings tab
		this.addSettingTab(new DYSettingTab(this.app, this));

		// Make the tractates table
		this.tractates = {
			"2022-02-11" : {disp:"Chagigah", stpdf:"Chagigah/Chagigah_", stc:"hagiga", myjl:'hagiga-', sf:'Chagigah.'},
			"2022-01-24" : {disp:"Moed Katan", stpdf:"MoedKatan/MoedKatan_", stc:'moed', myjl:'moed-', sf:'Moed_Katan.'},
			"2021-12-14" : {disp:"Megilah", stpdf:"Megilah/Megilah_", stc:'megila', myjl:'megila-', sf:'Megillah.'},
			"2021-11-14" : {disp:"Ta'anis", stpdf:"Tannis/Tannis_", stc:'taanit', myjl:'taanit-', sf: 'Taanit.' },
			"2021-10-11" : {disp:"Rosh Hashanah", stpdf:"RoshHashanah/RoshHashanah_", stc:'roshhashana', myjl:'roshhashana-', 						sf:'Rosh_Hashanah.'},
			"2021-09-02" : {disp: "Beitzah", stpdf:"Beitzah/Beitzah_", stc:'beitza', myjl:"beitza-", sf:"Beitzah."},
			"2021-07-09" : {disp: "Sukkah", stpdf:"Sukka/Sukkah_", stc:'sukka', myjl:'sukkah-', sf:'Sukkah.'},
		};

		console.log(this.settings);
	}

	// Add a Daf Yomi page (this is the part that does the actual work)
	async addPage(dateS: string) {
		let dafDate = this.makeDate(dateS);
		let daf     = this.findDaf(dafDate);

		if (!daf) {
			new Notice("Date does not match a Daf", 5000);
			return;
		}

		// Make the URLs
		const urls = {
			steinsaltz_pdf:  `https://www.steinsaltz-center.org/vault/DafYomi/${daf.tractate.stpdf}${daf.page}.pdf`,
			steinsaltz_c:    `https://steinsaltz.org/daf/${daf.tractate.stc}${daf.page}`,
			myjl:            `https://www.myjewishlearning.com/article/${daf.tractate.myjl}${daf.page}`,
			sf:              `https://www.sefaria.org/${daf.tractate.sf}${daf.page}`
		};

		// Determine directory and page names
		const baseDir = this.settings.dyDir;
		const directoryName = `${baseDir}/${daf.tractate.disp}`;
		const pageName = `Daf Yomi ${daf.tractate.disp} ${daf.page}`;
		const pageFile = `${directoryName}/${pageName}.md`

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

		// Create the page
		let t = `# ${pageName}\n\n`  // H1 title

		// Do we want the Sefaria link?
		if (this.settings.sefaria) 		t += `[Sefaria](${urls.sf})\n`;

		// Do we want to download the Steinsaltz PDF page?
		if (this.settings.stpdf) {
			let url = urls.steinsaltz_pdf;
			let r = new Request(url);
			fetch(r).then( (r) => { return r.blob(); }).then(
				     (b) => { this.writeSteinsaltzPDF(b, directoryName, daf.tractate.disp, daf.page); });

			t += `![[${daf.tractate.disp}_${daf.page}.pdf]]\n`
		}

		// Do we want a link to the Steinsaltz PDF (not downloaded)
		if (this.settings.stpdflink)	t += `[Steinsaltz PDF](${urls.steinsaltz_pdf})\n`;

		// Do we want the Steinsaltz commentary?
		if (this.settings.stc) 			t += `[Steinsaltz Commentary](${urls.steinsaltz_c})\n`;

		// Do we want the My Jewish Learning commentary?
		if (this.settings.myjl) 		t += `[My Jewish Learning Commentary](${urls.myjl})\n`;

		t += '\n## Notes\n\n';

		// Write the page
		await this.app.vault.create(pageFile, t);
		new Notice(`Created note ${pageName}`);

		// Add to the Tractate page
		const tractatePage = `Tractate ${daf.tractate.disp}`;
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
	}

	onunload() {
		console.log('unloading plugin');
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
		return window.moment(`${dateS}T00:00:00.000Z`);
	}

	// Find the daf for this date
	findDaf(dafDate: Moment): Daf | undefined {
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

	// Write the PDF file we downloaded
	async writeSteinsaltzPDF(body: Blob, directoryName: string, tractate: string, page: number)  {
		let pdfDir = this.settings.attachDir;
		if ( pdfDir.charAt(0) != '/' ) {
			pdfDir = directoryName + '/' + this.settings.attachDir;
		};
		let pathName = `${pdfDir}/${tractate}_${page}.pdf`;
		this.app.vault.adapter.writeBinary(pathName, await body.arrayBuffer() );
	}
}


// The Modal to ask for the date
class DYModal extends Modal {
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
			this.plugin.addPage(dateS);
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
			.setName('Daf Yomi directory')
			.setDesc('Directory in your Vault for Daf Yomi notes')
			.addText(text => text
				.setPlaceholder('Daf Yomi directory')
				.setValue(this.plugin.settings.dyDir)
				.onChange(async (value) => {
					this.plugin.settings.dyDir = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
		.setName('Attachments directory')
		.setDesc('Directory for PDF attachments (if relative, do not start with /)')
		.addText(text => text
			.setPlaceholder('Attachments directory')
			.setValue(this.plugin.settings.attachDir)
			.onChange(async (value) => {
				this.plugin.settings.attachDir = value;
				await this.plugin.saveSettings();
			}));

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
	}
}