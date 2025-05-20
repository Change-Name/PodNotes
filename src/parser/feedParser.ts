import type { PodcastFeed } from "src/types/PodcastFeed";
import { requestUrl } from "obsidian";
import type { Episode } from "src/types/Episode";

export default class FeedParser {
	private feed: PodcastFeed | undefined;

	constructor(feed?: PodcastFeed) {
		this.feed = feed;
	}

	public async findItemByTitle(title: string, url: string): Promise<Episode> {
		const body = await this.parseFeed(url);
		const items = body.querySelectorAll("item");

		const item = Array.from(items).find((item) => {
			const parsed = this.parseItem(item);
			const isMatch = parsed && parsed.title === title;

			return isMatch;
		});

		if (!item) {
			throw new Error("Could not find episode");
		}

		const episode = this.parseItem(item);
		const feed = await this.getFeed(url);

		if (!episode) {
			throw new Error("Episode is invalid.");
		}

		if (!episode.artworkUrl) {
			episode.artworkUrl = feed.artworkUrl;
		}

		if (!episode.podcastName) {
			episode.podcastName = feed.title;
		}

		if (!episode.feedUrl) {
			episode.feedUrl = feed.url;
		}

		return episode;
	}

	public async getEpisodes(url: string): Promise<Episode[]> {
		const body = await this.parseFeed(url);

		return this.parsePage(body);
	}

	public async getFeed(url: string): Promise<PodcastFeed> {
		const body = await this.parseFeed(url);

		const titleEl = body.querySelector("title");
		const linkEl = body.querySelector("link");
		const itunesImageEl = body.querySelector("image");

        let response: Response;
        try {
            response = await fetch(url, { mode: "no-cors" });
        } catch (err) {
            throw new Error("Failed to fetch podcast feed. " + (err instanceof Error ? err.message : String(err)));
        }

        // When mode: 'no-cors' is used, response.ok is false and body is opaque.
        // We have to handle this gracefully. If response cannot be read, fallback to previous behavior.
        let xmlString = "";
        try {
            xmlString = await response.text();
        } catch (err) {
            // Fallback: try XMLHttpRequest as a last resort (works in some desktop environments)
            xmlString = await legacyFetchXml(url);
        }

        const parser = new DOMParser();
        const doc = parser.parseFromString(xmlString, "application/xml");

		if (!titleEl || !linkEl) {
			throw new Error("Invalid RSS feed");
		}

		const title = titleEl.textContent || "";
		const artworkUrl =
			itunesImageEl?.getAttribute("href") ||
			itunesImageEl?.querySelector("url")?.textContent ||
			"";

        const categoryElements = Array.from(doc.getElementsByTagName("podcast:category"));
        const tags = categoryElements.map((el) => el.textContent ?? "").filter(Boolean);

		return {
			title,
			url,
			artworkUrl,
			tags,
		};
	}

	protected parsePage(page: Document): Episode[] {
		const items = page.querySelectorAll("item");

		function isEpisode(ep: Episode | null): ep is Episode {
			return !!ep;
		}

		return Array.from(items).map(this.parseItem.bind(this)).filter(isEpisode);
	}

	protected parseItem(item: Element): Episode | null {
		const titleEl = item.querySelector("title");
		const streamUrlEl = item.querySelector("enclosure");
		const linkEl = item.querySelector("link");
		const descriptionEl = item.querySelector("description");
		const contentEl = item.querySelector("*|encoded");
		const pubDateEl = item.querySelector("pubDate");
		const itunesImageEl = item.querySelector("image");
		const itunesTitleEl = item.getElementsByTagName("itunes:title")[0];

		if (!titleEl || !streamUrlEl || !pubDateEl) {
			return null;
		}

		const title = titleEl.textContent || "";
		const streamUrl = streamUrlEl.getAttribute("url") || "";
		const url = linkEl?.textContent || "";
		const description = descriptionEl?.textContent || "";
		const content = contentEl?.textContent || "";
		const pubDate = new Date(pubDateEl.textContent as string);
		const artworkUrl =
			itunesImageEl?.getAttribute("href") || this.feed?.artworkUrl;
		const itunesTitle = itunesTitleEl?.textContent;

		return {
			title,
			streamUrl,
			url: url || this.feed?.url || "",
			description,
			content,
			podcastName: this.feed?.title || "",
			artworkUrl,
			episodeDate: pubDate,
			feedUrl: this.feed?.url || "",
			itunesTitle: itunesTitle || "",
		};
	}

	private async parseFeed(feedUrl: string): Promise<Document> {
		const req = await requestUrl({ url: feedUrl });
		const dp = new DOMParser();

		const body = dp.parseFromString(req.text, "text/xml");

		return body;
	}
}

// Helper for environments where fetch fails completely (Obsidian desktop, local files etc.)
async function legacyFetchXml(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
        try {
            const xhr = new XMLHttpRequest();
            xhr.open("GET", url, true);
            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200 || xhr.status === 0) {
                        resolve(xhr.responseText);
                    } else {
                        reject(new Error(`Failed to fetch XML via XHR: ${xhr.status}`));
                    }
                }
            };
            xhr.onerror = function () {
                reject(new Error("XMLHttpRequest error"));
            };
            xhr.send();
        } catch (err) {
            reject(err);
        }
    });
}