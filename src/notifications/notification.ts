import Game from '../game.js';
import type { BlockNode, InlineNode, RootNode } from '../markup/ast.js';
import { bold, doc, link, paragraph, text } from '../markup/build.js';
import renderPlain from '../markup/renderers/plain.js';
import type Comparable from '../util/comparable.js';
import NotificationElement from './notification_element.js';

/** Options for {@link Notification.toDocument}. */
export type NotificationDocumentOptions = {
  /** The URL to put on the title, if not the title's own link.
   *
   * Telegram's Instant View wraps the post URL, so the link on the title is not
   * always the link the notification carries.
   */
  titleUrl?: string;
  /** Whether to include the title. Off for a Discord embed, which has its own. */
  includeTitle?: boolean;
  /** Whether to include the body of the post. */
  includeContent?: boolean;
};

const DEFAULTS = {
  includeTitle: true,
  includeContent: true,
};

/** A representation of a bot notification. */
export default class Notification implements Comparable<Notification> {
  /**
   * Creates a new Notification.
   * @param timestamp The timestamp of the notification.
   * @param game The game the notification is for.
   * @param title The title of the notification.
   * @param content The content of the notification.
   * @param author The author of the notification.
   * @param color The color of the notification.
   * @param thumbnail The (small) thumbnail of the notification.
   * @param image The (big) image of the notification.
   * @param footer The footer of the notification.
   * @param version The gameplay version of the update.
   */
  constructor(
    public timestamp: Date,
    public game: Game,
    public title: NotificationElement,
    public content?: RootNode,
    public author?: NotificationElement,
    public color?: string,
    public thumbnail?: string,
    public image?: string,
    public footer?: NotificationElement,
    public version?: string,
  ) {}

  public compareTo(other: Notification): -1 | 0 | 1 {
    if (this.timestamp < other.timestamp) {
      return -1;
    }
    if (this.timestamp > other.timestamp) {
      return 1;
    }
    return 0;
  }

  /** Builds the whole notification as one markup tree.
   *
   * Each bot renders this single tree rather than splicing its own markup
   * around the content, which is what keeps the two of them consistent and
   * lets either one make its own formatting decisions throughout.
   *
   * @param options - What to include, and where the title points.
   */
  public toDocument(options: NotificationDocumentOptions = {}): RootNode {
    const { titleUrl, includeTitle, includeContent } = { ...DEFAULTS, ...options };
    const blocks: BlockNode[] = [paragraph(...this.introduction())];

    if (includeTitle) {
      blocks.push(paragraph(this.titleNode(titleUrl ?? this.title.link)));
    }
    if (includeContent && this.content) {
      blocks.push(...this.content.children);
    }
    return doc(...blocks);
  }

  /** The `New <game> update - <author>:` line that opens a notification. */
  private introduction(): InlineNode[] {
    const nodes: InlineNode[] = [text('New '), bold(this.game.label), text(' update')];

    if (this.author?.text) {
      nodes.push(text(' - '));
      nodes.push(
        this.author.link ? link(this.author.link, this.author.text) : text(this.author.text),
      );
    }
    nodes.push(text(':'));

    return nodes;
  }

  private titleNode(url?: string): InlineNode {
    const label = bold(this.title.text);

    return url ? link(url, label) : label;
  }

  /**
   *  Debug method that makes Notification objects printable inside templated strings
   */
  public toString(): string {
    const content = this.content ? renderPlain(this.content) : '';

    return `${this.title.text} -  ${content}`;
  }
}
