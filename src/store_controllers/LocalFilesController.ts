import { StoreController } from 'src/types/StoreController';
import { Playlist } from 'src/types/Playlist';
import { LOCAL_FILES_SETTINGS } from 'src/constants';
import { IPodNotes } from 'src/types/IPodNotes';
import { Writable } from 'svelte/store';

export class LocalFilesController extends StoreController<Playlist> {
	private plugin: IPodNotes;

	constructor(store: Writable<Playlist>, plugin: IPodNotes) {
		super(store)
		this.plugin = plugin;
	}

	protected onChange(value: Playlist) {
		this.plugin.settings.localFiles = {
			...value,
			// To ensure we always keep the correct playlist name
			...LOCAL_FILES_SETTINGS
		};

		this.plugin.saveSettings();
	}
}
